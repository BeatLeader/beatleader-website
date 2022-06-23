import {db} from '../../db/db'
import eventBus from '../../utils/broadcast-channel-pubsub'
import {configStore} from '../../stores/config'
import createPlayerService from './player';
import {PRIORITY} from '../../network/queues/http-queue'
import scoresApiClient from '../../network/clients/beatleader/scores/api'
import scoreStatsApiClient from '../../network/clients/beatleader/scores/api-stats'
import playersRepository from '../../db/repository/players'
import scoresRepository from '../../db/repository/scores'
import log from '../../utils/logger'
import {addToDate, formatDate, HOUR, MINUTE, SECOND, truncateDate} from '../../utils/date'
import {opt} from '../../utils/js'
import scores from '../../db/repository/scores'
import {SsrHttpNotFoundError} from '../../network/errors'
import {PLAYER_SCORES_PER_PAGE} from '../../utils/beatleader/consts'
import makePendingPromisePool from '../../utils/pending-promises'
import {roundToPrecision} from '../../utils/format'
import {serviceFilterFunc} from '../utils'

const MAIN_PLAYER_REFRESH_INTERVAL = MINUTE * 3;
const PLAYER_REFRESH_INTERVAL = MINUTE * 30;
const RANK_AND_PP_REFRESH_INTERVAL = HOUR;

const HISTOGRAM_PP_PRECISION = 5;
const HISTOGRAM_RANK_PRECISION = 5;
const HISTOGRAM_ACC_PRECISION = 0.25;
const HISTOGRAM_STARS_PRECISION = 0.1;

let service = null;
let serviceCreationCount = 0;
export default () => {
  serviceCreationCount++;
  if (service) return service;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  let playerService = createPlayerService();

  let mainPlayerId = null;
  let updateInProgress = [];

  let refreshCallCounter = 0;

  const refreshingFinished = async (samplingTime = 100, timeout = 30000) => new Promise((resolve, reject) => {
    let callCounter = 0;
    const maxCallCount = samplingTime ? timeout / samplingTime : timeout;

    const sampler = () => {
      if (refreshCallCounter === 0) {
        resolve(true);
        return;
      }

      callCounter++;
      if (callCounter > maxCallCount) {
        reject(timeout);
        return;
      }

      setTimeout(sampler, samplingTime);
    }

    sampler();
  })

  const configStoreUnsubscribe = configStore.subscribe(config => {
    const newMainPlayerId = opt(config, 'users.main')
    if (mainPlayerId !== newMainPlayerId) {
      mainPlayerId = newMainPlayerId;

      log.debug(`Main player changed to ${mainPlayerId}`, 'ScoresService')
    }
  })

  const isDataForPlayerAvailable = async playerId => (await Promise.all([
    scoresRepository().getFromIndex('scores-playerId', playerId),
    playersRepository().get(playerId),
  ]))
    .every(p => p !== undefined);

  const getAllScores = async () => scoresRepository().getAll();
  const getLeaderboardScores = async leaderboardId => scoresRepository().getAllFromIndex('scores-leaderboardId', leaderboardId);
  const getPlayerScores = async playerId => resolvePromiseOrWaitForPending(`getPlayerScores/${playerId}`, async () => scoresRepository().getAllFromIndex('scores-playerId', playerId));
  const getPlayerScoresAsObject = async (playerId, idFunc = score => opt(score, 'leaderboard.leaderboardId'), asArray = false) => convertScoresToObject(await getPlayerScores(playerId), idFunc, asArray)
  const getPlayerSongScore = async (playerId, leaderboardId) => scoresRepository().get(playerId + '_' + leaderboardId);
  const updateScore = async score => scoresRepository().set(score);

  const reduceScoresArr = scores => scores.reduce((allScores, scorePage) => [...allScores, ...scorePage], []);
  const isAnyScoreOlderThan = (scores, olderThan) => scores.some(s => s.score && s.score.timeSet && s.score.timeSet <= olderThan);
  const createFetchUntilLastUpdated = olderThan => scores => isAnyScoreOlderThan(scores, olderThan);

  const convertScoresToObject = (scores, idFunc = score => opt(score, 'leaderboard.leaderboardId'), asArray = false) => scores.reduce((scoresObj, score) => {
    const _id = idFunc(score);
    if (!_id) return scoresObj;

    if (asArray) {
      if (!scoresObj[_id]) scoresObj[_id] = [];

      scoresObj[_id].push({...score})
    } else {
      scoresObj[_id] = {...score};
    }

    return scoresObj;
  }, {})
  const getScoreKey = (playerId, score) => {
    const leaderboardId = opt(score, 'leaderboard.leaderboardId');
    if (!leaderboardId) return null;

    return `${playerId}_${leaderboardId}`;
  }
  const convertScoresById = (playerId, scores) => convertScoresToObject(scores, score => getScoreKey(playerId, score));

  const fetchScoresUntil = async (playerId, startPage = 1, priority = PRIORITY.BG_NORMAL, signal = null, untilFunc = null, dontReduce = false) => {
    log.debug(`Fetching scores of player "${playerId}" starting from page #${startPage}`, 'ScoresService');

    let data = [];

    let page = startPage;
    while (page) {
      try {
        log.trace(`Fetching scores page #${page}`, 'ScoresService');

        const pageData = await scoresApiClient.getProcessed({playerId, page, signal, priority});
        log.trace(`Scores page #${page} fetched`, 'ScoresService', pageData);

        const scoresData = pageData?.data ?? [];

        if (!scoresData) {
          log.trace(`Scores page #${page} is empty`, 'ScoresService');

          break;
        }

        if (!Array.isArray(scoresData)) break;

        if (
          scoresData.length < PLAYER_SCORES_PER_PAGE ||
          (untilFunc && untilFunc(scoresData))
        ) {
          // push only relevant scores and return
          data.push(scoresData.filter(score => !untilFunc || !untilFunc([score])));

          break;
        }

        // push full page and continue
        data.push(scoresData);
      } catch (err) {
        if (!(err instanceof SsrHttpNotFoundError)) throw err;

        // stop fetching at 404
        log.trace(`Received 404 Not Found, abort download`, 'ScoresService');
        break;
      }

      page++;
    }

    return dontReduce ? data : reduceScoresArr(data);
  }

  const fetchAllScores = async (playerId, numOfPages, priority = PRIORITY.BG_NORMAL, signal = null) => {
    log.debug(`Fetching all scores of player "${playerId}, number of pages: ${numOfPages}`, 'ScoresService');

    const pages = Array(numOfPages).fill(0).map((_, idx) => idx + 1);

    let data = await Promise.all(pages.map(page => scoresApiClient.getProcessed({playerId, page, signal, priority})));

    if (!data || !data.length) return [];

    data = data.map(d => d?.data ?? []);

    if (data[data.length - 1].length === PLAYER_SCORES_PER_PAGE) {
      data = [
        ...data,
        ...(await fetchScoresUntil(playerId, data.length + 1, priority, signal, null, true)),
      ];
    }

    return reduceScoresArr(data);
  }

  const getRecentPlayFromScores = (scores, defaultRecentPlay = null) => scores.reduce((recentPlay, s) => opt(s, 'score.timeSet') && s.score.timeSet > recentPlay ? s.score.timeSet : recentPlay, defaultRecentPlay);

  const addScoreIndexFields = (playerId, score) => {
    const id = getScoreKey(playerId, score);
    const leaderboardId = opt(score, 'leaderboard.leaderboardId');
    const timeSet = opt(score, 'score.timeSet');
    const pp = opt(score, 'score.pp');

    return {
      ...score,
      id,
      playerId,
      leaderboardId,
      timeSet,
      pp
    }
  }

  const updatePlayerScores = async (player, priority = PRIORITY.BG_NORMAL) => {
    if (!player || !player.playerId) {
      log.warn(`Can not refresh scores, empty playerId`, 'ScoresService', player);

      return null;
    }

    const numOfScores = player?.scoreStats?.totalPlayCount;
    const numOfPages = numOfScores ? Math.ceil(numOfScores / PLAYER_SCORES_PER_PAGE) : null;

    const newLastUpdated = new Date();

    try {
      let newScores;
      const abortController = new AbortController();

      const playerScores = await getPlayerScores(player.playerId)
      const currentScoresById = convertScoresById(player.playerId, playerScores);

      let mostRecentPlayFromScores = null;
      if (!player.recentPlay) {
        mostRecentPlayFromScores = getRecentPlayFromScores(playerScores, null);
        player.recentPlay = mostRecentPlayFromScores;
      }

      const startUpdatingDate = !player.scoresLastUpdated || (mostRecentPlayFromScores && mostRecentPlayFromScores < player.scoresLastUpdated)
        ? mostRecentPlayFromScores
        : player.scoresLastUpdated;

      if (numOfPages && !startUpdatingDate) newScores = await fetchAllScores(player.playerId, numOfPages, priority, abortController.signal);
      else newScores = await fetchScoresUntil(player.playerId, 1, priority, abortController.signal, createFetchUntilLastUpdated(startUpdatingDate))

      if (!newScores || !newScores.length) {
        // no new scores - just update player profile
        const playerData = {...player, scoresLastUpdated: newLastUpdated, recentPlayLastUpdated: newLastUpdated}

        await playersRepository().set(playerData);

        return {recentPlay: player.recentPlay, newScores: null, scores: currentScoresById};
      }

      const recentPlay = getRecentPlayFromScores(newScores, player.recentPlay);

      // TODO: calculate pp contribution of score

      let updatedScores = [];
      await db.runInTransaction(['scores', 'players'], async tx => {
        const playersStore = tx.objectStore('players')
        player = await playersStore.get(player.playerId);
        player.scoresLastUpdated = newLastUpdated;
        player.recentPlayLastUpdated = newLastUpdated;
        player.recentPlay = recentPlay;

        await playersStore.put(player);
        playersRepository().addToCache([player]);

        const scoresStore = tx.objectStore('scores');

        for(let score of newScores) {
          const id = getScoreKey(player.playerId, score);
          const leaderboardId = opt(score, 'leaderboard.leaderboardId');
          const scoreValue = opt(score, 'score.score');
          const unmodifiedScore = opt(score, 'score.unmodifiedScore')
          const scoreTimeSet = opt(score, 'score.timeSet');
          const scorePp = opt(score, 'score.pp');

          if (!id || !leaderboardId || !scoreTimeSet || scoreValue === undefined || scorePp === undefined) {
            return null;
          }

          const dbScore = await scoresStore.get(id)
          if (dbScore) {
            const prevScoreScorePart = {...dbScore.score};
            if (prevScoreScorePart && prevScoreScorePart.timeSet && prevScoreScorePart.score !== undefined && prevScoreScorePart.unmodifiedScore < unmodifiedScore) {
              const prevHistory = opt(dbScore, 'history.length') ? dbScore.history.filter(h => h.timeSet) : [];
              score.history = [prevScoreScorePart].concat(prevHistory).slice(0,3);
            }
          }

          // needed by DB indexes
          score = addScoreIndexFields(player.playerId, score);

          await scoresStore.put(score);
          scoresRepository().addToCache([score]);

          updatedScores.push(score);
        }
      });

      return {player, recentPlay, newScores, scores: {...currentScoresById, ...convertScoresToObject(updatedScores, score => opt(score, 'id'))}};
    } catch (err) {
      if (![opt(err, 'name'), opt(err, 'message')].includes('AbortError')) throw err;

      return null;
    }
  }

  const isPlayerMain = playerId => playerId === mainPlayerId;

  const getScoresFreshnessDate = (player, refreshInterval = null, key = 'scoresLastUpdated') => {
    const lastUpdated = player && player[key] ? player[key] : null;
    if (!lastUpdated) return addToDate(-SECOND);

    const REFRESH_INTERVAL = refreshInterval ? refreshInterval : (isPlayerMain(player.playerId) ? MAIN_PLAYER_REFRESH_INTERVAL : PLAYER_REFRESH_INTERVAL);

    return addToDate(REFRESH_INTERVAL, lastUpdated);
  }

  const isScoreDateFresh = (player, refreshInterval = null, key = 'scoresLastUpdated') => getScoresFreshnessDate(player, refreshInterval, key) > new Date();

  const getPlayerScoresPage = async (playerId, serviceParams = {sort: 'date', order: 'desc', page: 1}) => {
    let page = serviceParams?.page ?? 1;
    if (page < 1) page = 1;

    let playerScores = (await getPlayerScores(playerId));

    if (!playerScores || !playerScores.length) return null;

    const {sort: sortFunc, filter: filterFunc} = getScoresHistogramDefinition(serviceParams);

    playerScores = playerScores
      .filter(filterFunc)
      .sort(sortFunc);

    const startIdx = (page - 1) * PLAYER_SCORES_PER_PAGE;

    if (playerScores.length < startIdx + 1) return null;

    return {
      metadata: {
        total: playerScores.length,
        itemsPerPage: 8,
      },
      data: playerScores.slice(startIdx, startIdx + PLAYER_SCORES_PER_PAGE)
    };
  }

  const getScoresHistogramDefinition = (serviceParams = {sort: 'date', order: 'desc'}) => {
    const sort = serviceParams?.sort ?? 'date';
    const order = serviceParams?.order ?? 'desc';

    const commonFilterFunc = serviceFilterFunc(serviceParams);

    let round = 2;
    let bucketSize = HISTOGRAM_PP_PRECISION;
    let minBucketSize = null;
    let maxBucketSize = null;
    let bucketSizeStep = null;
    let bucketSizeValues = null;
    let type = 'linear';
    let valFunc = s => s;
    let filterFunc = commonFilterFunc;
    let histogramFilterFunc = h => h;
    let roundedValFunc = (s, type = type, precision = bucketSize) => type === 'linear'
      ? roundToPrecision(valFunc(s), precision)
      : truncateDate(valFunc(s), precision);
    let prefix = '';
    let prefixLong = '';
    let suffix = '';
    let suffixLong = '';

    switch(sort) {
      case 'date':
        valFunc = s => s?.timeSet;
        type = 'time';
        bucketSize = 'day'
        break;

      case 'pp':
        valFunc = s => s?.pp ?? 0;
        filterFunc = s => (s?.pp ?? 0) > 0 && commonFilterFunc(s)
        type = 'linear';
        bucketSize = HISTOGRAM_PP_PRECISION;
        minBucketSize = 1;
        maxBucketSize = 100;
        bucketSizeStep = 1;
        round = 0;
        suffix = 'pp';
        suffixLong = 'pp';
        break;

      case 'rank':
        valFunc = s => s?.score?.rank ?? 1000000;
        type = 'linear';
        bucketSize = HISTOGRAM_RANK_PRECISION;
        minBucketSize = 1;
        maxBucketSize = 100;
        bucketSizeStep = 1;
        round = 0;
        prefixLong = '#';
        break;

      case 'acc':
        valFunc = s => s?.score?.maxScore && s?.score?.unmodifiedScore ? s.score.unmodifiedScore / s.score.maxScore * 100 : (s?.score?.acc && s?.score?.acc != Infinity ? s.score.acc : null)
        filterFunc = s => (valFunc(s) ?? 0) > 0 && commonFilterFunc(s)
        type = 'linear';
        bucketSize = HISTOGRAM_ACC_PRECISION;
        minBucketSize = 0.05;
        maxBucketSize = 10;
        bucketSizeStep = 0.05;
        round = 2;
        suffix = '%';
        suffixLong = '%';
        break;

      case 'stars':
        valFunc = s => s?.leaderboard?.stars ?? null;
        filterFunc = s => (s?.leaderboard?.stars ?? 0) > 0 && commonFilterFunc(s)
        type = 'linear';
        bucketSize = HISTOGRAM_STARS_PRECISION;
        minBucketSize = 0.1;
        maxBucketSize = 10;
        bucketSizeStep = 0.1;
        round = 2;
        suffix = '★';
        suffixLong = '★';
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

  const fetchScoresPage = async (playerId, serviceParams = {sort: 'date', order: 'desc', page: 1}, priority = PRIORITY.FG_LOW, {...options} = {}) =>
     scoresApiClient.getProcessed({...options, playerId, page: serviceParams?.page ?? 1, priority, params: serviceParams});

  const fetchScoreStats = async (scoreId, priority = PRIORITY.FG_LOW, {...options} = {cacheTtl: HOUR, maxAge: HOUR}) =>
    scoreStatsApiClient.getProcessed({...options, scoreId, priority});

  const fetchScoresPageAndUpdateIfNeeded = async (playerId, serviceParams = {sort: 'date', order: 'desc', page: 1, filters: {}}, priority = PRIORITY.FG_LOW, signal = null, canUseBrowserCache = false, refreshInterval = MINUTE) => {
    const fetchedScoresResponse = await fetchScoresPage(playerId, serviceParams, priority, {signal, cacheTtl: MINUTE, maxAge: canUseBrowserCache ? 0 : refreshInterval, fullResponse: true});
    if (scoresApiClient.isResponseCached(fetchedScoresResponse)) return scoresApiClient.getDataFromResponse(fetchedScoresResponse);

    const fetchedScores = scoresApiClient.getDataFromResponse(fetchedScoresResponse);

    const playerScores = await getPlayerScores(playerId);

    return fetchedScores;
  }

  const fetchScoresPageOrGetFromCache = async (player, serviceParams = {sort: 'date', order: 'desc', page: 1}, refreshInterval = MINUTE, priority = PRIORITY.FG_LOW, signal = null) => {
    if (!player || !player.playerId) return null;

    return fetchScoresPageAndUpdateIfNeeded(player.playerId, serviceParams, priority, signal, false, refreshInterval);
  }

  const refresh = async (playerId, forceUpdate = false, priority = PRIORITY.BG_NORMAL, throwErrors = false) => {
    refreshCallCounter++;

    try {
      log.trace(`Starting player "${playerId}" scores refreshing${forceUpdate ? ' (forced)' : ''}...`, 'ScoresService')

      if (!playerId) {
        log.warn(`Can not refresh player scores if an empty playerId is given`, 'ScoresService');

        return null;
      }

      if (updateInProgress.includes(playerId)) {
        log.warn(`Player "${playerId}" scores are being fetched, skipping.`, 'ScoresService');

        return null;
      }

      updateInProgress.push(playerId);

      let player;

      player = await playerService.refresh(playerId, false, priority);
      if (!player) player = await playerService.refresh(playerId, true, priority);

      if (!player) {
        log.debug(`Can not refresh the scores of player "${playerId}" because it has not been added to the DB`);
        return null;
      }

      if (!forceUpdate) {
        const scoresFreshnessDate = getScoresFreshnessDate(player);
        if (scoresFreshnessDate > new Date()) {

          log.debug(`Player "${playerId}" scores are still fresh, skipping. Next refresh on ${formatDate(scoresFreshnessDate)}`, 'ScoresService')

          return {recentPlay: player.recentPlay, newScores: null, scores: convertScoresById(player.playerId, await getPlayerScores(player.playerId))};
        }
      }

      log.trace(`Fetching player "${playerId}" scores from server...`, 'ScoresService')

      const updatedPlayerScores = await resolvePromiseOrWaitForPending(`service/updatePlayerScores/${playerId}`, () => updatePlayerScores(player, priority));

      if (!updatedPlayerScores) {
        log.warn(`Can not refresh player "${playerId}" scores`, 'ScoresService')

        return null;
      }

      const {player: updatedPlayer, ...scoresInfo} = updatedPlayerScores;

      log.trace(`Player "${playerId}" scores updated`, 'ScoresService', scoresInfo.newScores);

      if (scoresInfo.newScores && scoresInfo.newScores.length) {
        // TODO: update country ranks

        eventBus.publish('player-scores-updated', {player: updatedPlayer, ...scoresInfo});
      }

      log.debug(`Player "${playerId}" refreshing complete.`, 'ScoresService');

      return scoresInfo;
    } catch (e) {
      if (throwErrors) throw e;

      log.debug(`Player "${playerId}" scores refreshing error${e.toString ? `: ${e.toString()}` : ''}`, 'ScoresService', e)

      return null;
    }
    finally {
      updateInProgress = updateInProgress.filter(pId => pId !== playerId);

      refreshCallCounter--;
    }
  }

  const refreshAll = async (force = false, priority = PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.trace(`Starting refreshing all players scores${force ? ' (forced)' : ''}...`, 'ScoresService');

    const allActivePlayers = await playerService.getAllActive();
    if (!allActivePlayers || !allActivePlayers.length) {
      log.trace(`No active players in DB, skipping.`, 'ScoresService');
      return null;
    }

    const allNewScores = await Promise.all(allActivePlayers.map(player => refresh(player.playerId, force, priority, throwErrors)));
    const allPlayersWithNewScores = allActivePlayers.map((player, idx) => allNewScores[idx] ? {player, ...allNewScores[idx]} : {player, newScores: null, scores: null, recentPlay: null})

    log.trace(`All players scores refreshed.`, 'ScoresService', allPlayersWithNewScores);

    return allPlayersWithNewScores;
  }

  const destroyService = () => {
    serviceCreationCount--;
    if (serviceCreationCount === 0) {
      if(configStoreUnsubscribe) configStoreUnsubscribe();

      playerService.destroyService();

      service = null;
    }
  }

  service = {
    isDataForPlayerAvailable,
    getAll: getAllScores,
    getLeaderboardScores,
    getPlayerScores,
    getPlayerScoresAsObject,
    getPlayerScoresPage,
    getPlayerSongScore,
    update: updateScore,
    getScoresFreshnessDate,
    areScoresFresh: isScoreDateFresh,
    fetchScoresPage,
    fetchScoresPageOrGetFromCache,
    fetchScoreStats,
    getScoresHistogramDefinition,
    refresh,
    refreshAll,
    destroyService,
    convertScoresToObject
  }

  return service;
}