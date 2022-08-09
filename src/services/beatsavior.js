import { PRIORITY } from '../network/queues/http-queue';
import createPlayerService from './beatleader/player'
import createScoresService from './beatleader/scores'
import beatSaviorApiClient from '../network/clients/beatsavior/api';
import beatSaviorRepository from '../db/repository/beat-savior'
import beatSaviorPlayersRepository from '../db/repository/beat-savior-players'
import { addToDate, DAY, formatDate, HOUR, MINUTE, SECOND, truncateDate } from '../utils/date'
import log from '../utils/logger'
import { opt, capitalize } from '../utils/js'
import makePendingPromisePool from '../utils/pending-promises'
import { PLAYER_SCORES_PER_PAGE } from '../utils/beatleader/consts'
import { roundToPrecision } from '../utils/format'
import { serviceFilterFunc } from './utils'

const MAIN_PLAYER_REFRESH_INTERVAL = MINUTE * 15;
const OTHER_PLAYER_REFRESH_INTERVAL = HOUR * 3;

const HISTOGRAM_ACC_THRESHOLD = 60;
const HISTOGRAM_MISTAKES_THRESHOLD = 200;

let service = null;
let serviceCreationCount = 0;
export default () => {
  serviceCreationCount++;
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const playerService = createPlayerService();
  const scoresService = createScoresService();

  const getPlayerScores = async playerId => resolvePromiseOrWaitForPending(`getPlayerScores/${playerId}`, () => beatSaviorRepository().getAllFromIndex('beat-savior-playerId', playerId));

  const getPlayerScoresWithScoreSaber = async playerId => {
    const [beatSaviorData, playerScores] = await Promise.all([
      getPlayerScores(playerId),
      null,
    ]);

    return beatSaviorData.map(bsData => {
      if (!bsData?.hash || !playerScores?.[bsData?.hash?.toLowerCase()]) return bsData;

      const ssScore = playerScores[bsData.hash.toLowerCase()].find(ssScore => isScoreMatchingBsData(ssScore, bsData, true)) ?? null;

      return {
        ...bsData,
        ssScore
      }
    });
  }

  const isScoreMatchingBsData = (score, bsData, exact = true) => {
    if (!bsData.hash || !bsData.score || !bsData.timeSet || !opt(bsData, 'stats.won')) return false;

    const diff = opt(score, 'leaderboard.diffInfo.diff');
    const scoreValue = opt(score, 'score.score');
    const timeSet = opt(score, 'score.timeSet')
    let hash = opt(score, 'leaderboard.song.hash');
    let duration = opt(score, 'leaderboard.song.duration');

    if (!diff || !score || !timeSet || !hash || !duration) return false;

    hash = hash.toLowerCase();

    if (bsData.hash === hash && capitalize(bsData.diff) === diff) {
      return !exact || (bsData.score === scoreValue && Math.abs(timeSet.getTime() - bsData.timeSet.getTime()) < (duration * 1000 + MINUTE));
    }

    return false;
  }

  const getScoresHistogramDefinition = (serviceParams = { sort: 'date', order: 'desc' }) => {
    const sort = serviceParams?.sort ?? 'date';
    const order = serviceParams?.order ?? 'desc';

    let round = 2;
    let bucketSize = 1;
    let minBucketSize = null;
    let maxBucketSize = null;
    let bucketSizeStep = null;
    let bucketSizeValues = null;
    let type = 'linear';
    let valFunc = s => s;
    let filterFunc = serviceFilterFunc(serviceParams);
    let histogramFilterFunc = s => s;
    let roundedValFunc = (s, type = type, precision = bucketSize) => type === 'linear'
      ? roundToPrecision(valFunc(s), precision)
      : truncateDate(valFunc(s), precision);
    let prefix = '';
    let prefixLong = '';
    let suffix = '';
    let suffixLong = '';

    switch (sort) {
      case 'date':
        valFunc = s => s?.timeSet;
        type = 'time';
        bucketSize = 'day'
        break;

      case 'acc':
        valFunc = s => (s?.trackers?.scoreTracker?.rawRatio ?? 0) * 100;
        histogramFilterFunc = h => h?.x >= HISTOGRAM_ACC_THRESHOLD;
        type = 'linear';
        bucketSize = 0.25;
        minBucketSize = 0.05;
        maxBucketSize = 10;
        bucketSizeStep = 0.05;
        round = 2;
        suffix = '%';
        suffixLong = '%';
        break;

      case 'mistakes':
        valFunc = s => (s?.stats?.miss ?? 0) + (s?.stats?.wallHit ?? 0) + (s?.stats?.bombHit ?? 0);
        histogramFilterFunc = h => h?.x <= HISTOGRAM_MISTAKES_THRESHOLD;
        type = 'linear';
        bucketSize = 1;
        minBucketSize = 1;
        maxBucketSize = 50;
        bucketSizeStep = 1;
        round = 0;
        suffixLong = ' mistake(s)';
        break;
    }

    return {
      getValue: valFunc,
      getRoundedValue: (bucketSize = bucketSize) => s => roundedValFunc(s, type, bucketSize),
      filter: filterFunc,
      histogramFilter: histogramFilterFunc,
      sort: (a, b) => order === 'asc' ? valFunc(a) - valFunc(b) : valFunc(b) - valFunc(a),
      type,
      bucketSize,
      minBucketSize,
      maxBucketSize,
      bucketSizeStep,
      bucketSizeValues,
      round,
      prefix,
      prefixLong,
      suffix,
      suffixLong,
      order
    }
  }

  const getPlayerScoresPage = async (playerId, serviceParams = { sort: 'date', order: 'desc', page: 1 }) => {
    let page = serviceParams?.page ?? 1;
    if (page < 1) page = 1;

    const NO_SCORES = { metadata: { total: 0 }, data: [] };

    let playerScores = await getPlayerScores(playerId);

    if (!playerScores || !playerScores.length) return NO_SCORES;

    const { sort: sortFunc, filter: filterFunc } = getScoresHistogramDefinition(serviceParams);

    playerScores = playerScores.filter(filterFunc).sort(sortFunc)

    const startIdx = (page - 1) * PLAYER_SCORES_PER_PAGE;

    if (playerScores.length < startIdx + 1) return NO_SCORES;

    return {
      metadata: {
        total: playerScores.length,
        itemsPerPage: PLAYER_SCORES_PER_PAGE,
        page
      },
      data: playerScores
        .slice(startIdx, startIdx + PLAYER_SCORES_PER_PAGE)
        .map(bs => {
          const leaderboard = bs.leaderboard;
          if (!leaderboard.leaderboardId) leaderboard.leaderboardId = bs.beatSaviorId;
          leaderboard.leaderboardId += Math.random(); // ScoresSvelte needs different keys for each scores row

          const rawScore = opt(bs, 'trackers.scoreTracker.rawScore', 0);
          const rawRatio = opt(bs, 'trackers.scoreTracker.rawRatio', 0);
          const maxScore = rawRatio & rawScore ? rawScore / rawRatio : 0;

          return {
            beatSavior: bs,
            id: bs.beatSaviorId,
            leaderboard,
            leaderboardId: leaderboard.leaderboardId,
            songJumpDistance: bs.songJumpDistance,
            playerId: bs.playerId,
            pp: 0,
            score: {
              acc: rawRatio * 100,
              maxScore,
              mods: opt(bs, 'trackers.scoreTracker.modifiers', null),
              percentage: opt(bs, 'trackers.scoreTracker.rawRatio', 0) * 100,
              pp: 0,
              ppWeighted: 0,
              rank: null,
              score: opt(bs, 'trackers.scoreTracker.score', 0),
              scoreId: bs.beatSaviorId,
              timeSet: bs.timeSet,
              unmodifiedScore: rawScore,
              weight: 0,
            },
            timeSet: bs.timeSet,
          }
        })
    };
  }

  const updateData = async (playerId, data) => {
    log.debug(`Updating Beat Savior data for player "${playerId}"...`, 'BeatSaviorService')

    await Promise.all(data.map(async d => beatSaviorRepository().set(d)));

    log.debug(`Update player "${playerId}" Beat Savior last refresh date...`, 'BeatSaviorService')

    await beatSaviorPlayersRepository().set({ playerId, lastRefresh: new Date() })

    log.debug(`Beat Savior data for player "${playerId}" updated.`, 'BeatSaviorService')

    return data;
  }

  const fetchPlayer = async (playerId, priority = PRIORITY.BG_NORMAL) => {
    try {
      log.debug(`Fetching Beat Savior data for player "${playerId}"...`, 'BeatSaviorService');

      const data = await beatSaviorApiClient.getProcessed({ playerId, priority });
      if (!data) {
        log.debug(`No Beat Savior data for player "${playerId}"`, 'BeatSaviorService')

        return null;
      }

      // TODO: check if data already exists in DB

      log.trace(`Beat Savior data for player "${playerId}" fetched`, 'BeatSaviorService', data);

      return updateData(playerId, data);
    } catch (err) {
      log.warn(`Error fetching Beat Savior data for player "${playerId}"`);

      return null;
    }
  }

  const refresh = async (playerId, force = false, priority = PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.trace(`Starting refreshing BeatSavior for player "${playerId}" ${force ? ' (forced)' : ''}...`, 'BeatSaviorService')

    try {
      const REFRESH_INTERVAL = playerService.isMainPlayer(playerId) ? MAIN_PLAYER_REFRESH_INTERVAL : OTHER_PLAYER_REFRESH_INTERVAL;

      const bsPlayerInfo = await beatSaviorPlayersRepository().get(playerId);
      const nextUpdate = bsPlayerInfo && bsPlayerInfo.lastRefresh ? addToDate(REFRESH_INTERVAL, bsPlayerInfo.lastRefresh) : addToDate(-SECOND);
      if (!force && bsPlayerInfo && nextUpdate > new Date()) {
        log.debug(`Beat Savior data is still fresh, skipping. Next refresh on ${formatDate(nextUpdate)}`, 'BeatSaviorService')

        return null;
      }

      return resolvePromiseOrWaitForPending(`refresh/${playerId}`, () => fetchPlayer(playerId, priority));
    } catch (e) {
      if (throwErrors) throw e;

      log.debug(`Beat Savior data refreshing error${e.toString ? `: ${e.toString()}` : ''}`, 'BeatSaviorService', e)

      return null;
    }
  }

  const refreshAll = async (force = false, priority = PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.trace(`Starting refreshing Beat Savior data for all players${force ? ' (forced)' : ''}...`, 'BeatSaviorService');

    const allPlayers = await playerService.getAll();
    if (!allPlayers || !allPlayers.length) {
      log.trace(`No players in DB, skipping.`, 'BeatSaviorService');
      return null;
    }

    const allRefreshed = await Promise.all(allPlayers.map(async player => ({
      playerId: player.playerId,
      beatSavior: await refresh(player.playerId, force, priority, throwErrors),
    })));

    log.trace(`Beat Savior data for all players refreshed.`, 'BeatSaviorService', allRefreshed);

    return allRefreshed;
  }

  const get = async (playerId, score) => {
    if (score && score.beatSavior) return score.beatSavior;

    const playerBsData = await getPlayerScores(playerId);
    if (!playerBsData || !playerBsData.length) return null;

    const bsData = playerBsData.find(bsData => isScoreMatchingBsData(score, bsData, true));

    return bsData ? bsData : null;
  }

  const isDataForPlayerAvailable = async playerId => await beatSaviorRepository().getFromIndex('beat-savior-playerId', playerId) !== undefined;

  const destroyService = () => {
    serviceCreationCount--;

    if (serviceCreationCount === 0) {
      scoresService.destroyService();
      playerService.destroyService();

      service = null;
    }
  }

  service = {
    fetchPlayer,
    refresh,
    refreshAll,
    get,
    getPlayerScoresPage,
    getPlayerScores,
    getPlayerScoresWithScoreSaber,
    isDataForPlayerAvailable,
    getScoresHistogramDefinition,
    destroyService,
  }

  return service;
}