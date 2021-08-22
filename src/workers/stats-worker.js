import {expose} from 'comlink'
import initDb from '../db/db'
import scoresRepository from '../db/repository/scores'
import eventBus from '../utils/broadcast-channel-pubsub'
import {opt} from '../utils/js'
import {diffColors} from '../utils/scoresaber/format'
import {getAccFromScore} from '../utils/scoresaber/song'
import {getTotalPpFromSortedPps, WEIGHT_COEFFICIENT} from '../utils/scoresaber/pp'

let db = null;

const getPlayerScores = async playerId => scoresRepository().getAllFromIndex('scores-playerId', playerId, true);

async function init() {
  if (db) return;

  db = await initDb();
}

const getRankedScores = async playerId => {
  const scores = await getPlayerScores(playerId)

  if (!scores || !scores.length) return null;

  return scores.filter(score => opt(score, 'score.pp'));
}

const calcPlayerStats = async playerId => {
  await init();

  const rankedScores = await getRankedScores(playerId);
  if (!rankedScores) return null;

  const stats = rankedScores
    .filter(score => (opt(score, 'score.score') && opt(score, 'score.maxScore')) || opt(score, 'score.acc'))
    .reduce((cum, s) => {
      const leaderboardId = opt(s, 'leaderboard.leaderboardId')
      const pp = opt(s, 'score.pp');
      const score = opt(s, 'score.unmodifiedScore', opt(s, 'score.score', 0))
      const accFromScore = getAccFromScore({...s.score, leaderboardId});
      const scoreAcc = opt(s, 'score.acc');

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
      return calcRawPpAtIdx(rankedScorePps.slice(idx + 1), idx + 1, expectedPp);
    }

    idx--;
  }

  return calcRawPpAtIdx(rankedScorePps, 0, expectedPp);
}

const worker = {
  init,
  calcPlayerStats,
  calcPpBoundary,
}

expose(worker);