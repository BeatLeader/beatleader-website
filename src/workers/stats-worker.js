import {expose} from 'comlink'
import initDb from '../db/db'
import scoresRepository from '../db/repository/scores'
import rankedsRepository from '../db/repository/rankeds'
import eventBus from '../utils/broadcast-channel-pubsub'
import {convertArrayToObjectByKey} from '../utils/js'
import {diffColors} from '../utils/beatleader/format'
import {getAccFromScore} from '../utils/beatleader/song'
import {getTotalPpFromSortedPps, WEIGHT_COEFFICIENT} from '../utils/beatleader/pp'
import makePendingPromisePool from '../utils/pending-promises'
import produce, {setAutoFreeze} from 'immer'
import beatmapsEnhancer from '../stores/http/enhancers/common/beatmaps'

let db = null;

let rankeds = null;

const resolvePromiseOrWaitForPending = makePendingPromisePool();

const getPlayerScores = async playerId => scoresRepository().getAllFromIndex('scores-playerId', playerId, true);
const getRankedsFromDb = async (refreshCache = false) => {
  const dbRankeds = await rankedsRepository().getAll(refreshCache)

  return dbRankeds ? convertArrayToObjectByKey(dbRankeds, 'leaderboardId') : {}
}

const getRankeds = async (refreshCache = false) => resolvePromiseOrWaitForPending(`rankeds/${refreshCache}`, () => getRankedsFromDb())

async function init() {
  if (db) return;

  db = await initDb();

  // setup immer.js
  // WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)
  self.process = {env: {NODE_ENV: "production"}};
  setAutoFreeze(false);

  rankeds = getRankeds();

  eventBus.on('rankeds-changed', () => rankeds = getRankeds(true));
}

const getRankedScores = async (playerId, withStars = false) => {
  const scores = await getPlayerScores(playerId)

  if (!scores || !scores.length) return null;

  let allRankeds = null;
  if (withStars) {
    allRankeds = await rankeds;
  }

  return withStars
    ? (await Promise.all(scores
        .filter(score => score?.score?.pp)
        .map(async score => {
          score = await produce(score, draft => beatmapsEnhancer(draft, true))

          return {
            ...score,
            stars: allRankeds[score?.leaderboardId]?.stars ?? null,
          }
        }))
    )
      .filter(s => s.stars)
    : scores.filter(score => score?.score?.pp);
}

const calcPlayerStats = async playerId => {
  await init();

  const rankedScores = await getRankedScores(playerId);
  if (!rankedScores) return null;

  const stats = rankedScores
    .filter(score => (score?.score?.score && score?.score?.maxScore) || score?.score?.acc)
    .reduce((cum, s) => {
      const leaderboardId = s?.leaderboard?.leaderboardId;
      const pp = s?.score?.pp;
      const score = s?.score?.unmodifiedScore ?? s?.score?.score ?? 0;
      const accFromScore = getAccFromScore({...s.score, leaderboardId});
      const scoreAcc = s?.score?.acc;

      if (!accFromScore && !scoreAcc) return cum;

      let acc = accFromScore ? accFromScore : scoreAcc;
      if (!acc || isNaN(acc)) return cum;

      s.score.acc = acc;
      cum.totalScore += score;
      cum.totalAcc += acc;

      if (cum.topAcc < acc) cum.topAcc = acc;
      if (cum.topPp < pp) cum.topPp = pp;

      cum.badges.forEach(badge => {
        if ((!badge.min || badge.min <= acc) && (!badge.max || badge.max > acc)) badge.value++;
      })

      return cum;
    }, {
    playerId,
    badges: [
      {label: 'SS+', min: 95, max: null, value: 0, bgColor: diffColors.expertPlus},
      {label: 'SS', min: 90, max: 95, value: 0, bgColor: diffColors.expert},
      {label: 'S+', min: 85, max: 90, value: 0, bgColor: diffColors.hard},
      {label: 'S', min: 80, max: 85, value: 0, bgColor: diffColors.normal},
      {label: 'A', min: null, max: 80, value: 0, bgColor: diffColors.easy},
    ],
    topAcc: 0,
    topPp: 0,
    totalAcc: 0,
    totalScore: 0,
    avgAcc: 0,
    playCount: rankedScores.length,
    medianAcc: 0,
    stdDeviation: 0,
  })

  stats.medianAcc = rankedScores.length > 1
    ? (rankedScores.sort((a, b) => a.score.acc - b.score.acc))[Math.ceil(rankedScores.length / 2)].score.acc
    : stats.totalAcc;
  stats.avgAcc = stats.totalAcc / rankedScores.length;
  stats.stdDeviation = Math.sqrt(rankedScores.reduce((sum, s) => sum + Math.pow(stats.avgAcc - s.score.acc, 2), 0) / rankedScores.length);

  delete stats.totalAcc;

  eventBus.publish('player-stats-calculated', stats);

  return stats;
}

const calcPpBoundary = async (playerId, expectedPp = 1) => {
  const rankedScores = await getRankedScores(playerId);
  if (!rankedScores) return null;

  const calcRawPpAtIdx = (bottomScores, idx, expected) => {
    const oldBottomPp = getTotalPpFromSortedPps(bottomScores, idx);
    const newBottomPp = getTotalPpFromSortedPps(bottomScores, idx + 1);

    // 0.965^idx * rawPpToFind = expected + oldBottomPp - newBottomPp;
    // rawPpToFind = (expected + oldBottomPp - newBottomPp) / 0.965^idx;
    return (expected + oldBottomPp - newBottomPp) / Math.pow(WEIGHT_COEFFICIENT, idx);
  }

  const rankedScorePps = rankedScores.map(s => s.pp).sort((a, b) => b - a);

  let idx = rankedScorePps.length - 1;

  while (idx >= 0) {
    const bottomSlice = rankedScorePps.slice(idx);
    const bottomPp = getTotalPpFromSortedPps(bottomSlice, idx);

    bottomSlice.unshift(rankedScorePps[idx]);
    const modifiedBottomPp = getTotalPpFromSortedPps(bottomSlice, idx);
    const diff = modifiedBottomPp - bottomPp;

    if (diff > expectedPp) {
      const ppBoundary = calcRawPpAtIdx(rankedScorePps.slice(idx + 1), idx + 1, expectedPp);

      eventBus.publish('player-pp-boundary-calculated', {playerId, expectedPp, ppBoundary});

      return ppBoundary;
    }

    idx--;
  }

  const ppBoundary = calcRawPpAtIdx(rankedScorePps, 0, expectedPp);

  eventBus.publish('player-pp-boundary-calculated', {playerId, expectedPp, ppBoundary});

  return ppBoundary;
}

const worker = {
  init,
  calcPlayerStats,
  calcPpBoundary,
}

expose(worker);