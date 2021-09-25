import {db} from '../../db/db'
import eventBus from '../../utils/broadcast-channel-pubsub'
import {configStore} from '../../stores/config'
import createPlayerService from './player';
import createAccSaberService from '../accsaber'
import createRankedsStore from '../../stores/scoresaber/rankeds'
import {PRIORITY} from '../../network/queues/http-queue'
import recentScoresApiClient from '../../network/clients/scoresaber/scores/api-recent'
import topScoresApiClient from '../../network/clients/scoresaber/scores/api-top'
import playersRepository from '../../db/repository/players'
import scoresRepository from '../../db/repository/scores'
import beatSaviorRepository from '../../db/repository/beat-savior';
import scoresUpdateQueueRepository from '../../db/repository/scores-update-queue'
import log from '../../utils/logger'
import {addToDate, formatDate, HOUR, MINUTE, SECOND} from '../../utils/date'
import {opt} from '../../utils/js'
import scores from '../../db/repository/scores'
import {SsrHttpNotFoundError} from '../../network/errors'
import {PLAYER_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'
import {PLAYER_SCORES_PER_PAGE as ACCSABER_PLAYER_SCORES_PER_PAGE} from '../../utils/accsaber/consts'

const MAIN_PLAYER_REFRESH_INTERVAL = MINUTE * 3;
const PLAYER_REFRESH_INTERVAL = MINUTE * 30;
const RANK_AND_PP_REFRESH_INTERVAL = HOUR;

let service = null;
let serviceCreationCount = 0;
export default () => {
  serviceCreationCount++;
  if (service) return service;

  let playerService = createPlayerService();
  const accSaberService = createAccSaberService();

  let allRankeds = {};
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

  let rankedStoreUnsubscribe = null;
  createRankedsStore().then(rankedStore => {
    rankedStoreUnsubscribe = rankedStore.subscribe(rankeds => {
      allRankeds = rankeds

      log.debug(`Ranked songs updated`, 'ScoresService', allRankeds)
    })
  })

  const getAllScores = async () => scoresRepository().getAll();
  const getLeaderboardScores = async leaderboardId => scoresRepository().getAllFromIndex('scores-leaderboardId', leaderboardId);
  const getPlayerScores = async playerId => scoresRepository().getAllFromIndex('scores-playerId', playerId);
  const getPlayerScoresAsObject = async (playerId, idFunc = score => opt(score, 'leaderboard.leaderboardId'), asArray = false) => convertScoresToObject(await getPlayerScores(playerId), idFunc, asArray)
  const getPlayerSongScore = async (playerId, leaderboardId) => scoresRepository().get(playerId + '_' + leaderboardId);
  const getPlayerRankedScores = async playerId => {
    const [scores, rankeds] = await Promise.all([getPlayerScores(playerId), allRankeds]);
    if (!scores) return [];

    return scores.filter(s => s.leaderboardId && rankeds[s.leaderboardId]);
  }
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

        const pageData = await recentScoresApiClient.getProcessed({playerId, page, signal, priority});
        log.trace(`Scores page #${page} fetched`, 'ScoresService', pageData);

        if (!pageData) {
          log.trace(`Scores page #${page} is empty`, 'ScoresService');

          break;
        }

        if (!Array.isArray(pageData)) break;

        if (
          pageData.length < PLAYER_SCORES_PER_PAGE ||
          (untilFunc && untilFunc(pageData))
        ) {
          // push only relevant scores and return
          data.push(pageData.filter(score => !untilFunc || !untilFunc([score])));

          break;
        }

        // push full page and continue
        data.push(pageData);
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

    let data = await Promise.all(pages.map(page => recentScoresApiClient.getProcessed({playerId, page, signal, priority})));

    if (!data || !data.length) return [];

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

  const updateRankAndPpFromTheQueue = async () => {
    log.debug('Processing rank and pp update queue', 'ScoresService');

    try {
      log.debug('Rank and pp update queue, waiting for the scores to finish refreshing.', 'ScoresService');
      await refreshingFinished();
      log.debug('Rank and pp update queue, scores refreshed, start queue processing.', 'ScoresService');

      await db.runInTransaction(['scores-update-queue', 'scores'], async tx => {
        // get all scores updates at least one minute old (some time to download new scores)
        let cursor = await tx.objectStore('scores-update-queue').index('scores-update-queue-fetchedAt').openCursor(IDBKeyRange.upperBound(addToDate(-1 * MINUTE)));
        const scoresStore = tx.objectStore('scores');

        while (cursor) {
          try {
            const scoreUpdate = {...cursor.value};

            await cursor.delete();

            if (!scoreUpdate.id) {
              cursor = await cursor.continue();
              continue;
            }

            const dbScore = await scoresStore.get(scoreUpdate.id)
            if (!dbScore) {
              cursor = await cursor.continue();
              continue;
            }

            const scoreLastUpdated = dbScore.lastUpdated;

            if (
              (!scoreLastUpdated || scoreLastUpdated < scoreUpdate.fetchedAt) &&
              (
                opt(dbScore, 'score.scoreId') === opt(scoreUpdate, 'score.scoreId') ||
                (opt(dbScore, 'score.unmodifiedScore') <= opt(scoreUpdate, 'score.unmodifiedScore'))
              ) &&
              opt(scoreUpdate, 'score.scoreId') && !!opt(scoreUpdate, 'score.timeSet')
            ) {
              dbScore.score = scoreUpdate.score;

              dbScore.pp = scoreUpdate.score.pp;
              dbScore.timeSet = scoreUpdate.score.timeSet;
              dbScore.lastUpdated = new Date();

              await scoresStore.put(dbScore);
              scoresRepository().addToCache([dbScore])
            }

            cursor = await cursor.continue();
          } catch (err) {
            // swallow error
            if (cursor) cursor = await cursor.continue();
          }
        }
      })

      log.debug('Rank and pp update queue processed.', 'ScoresService');
    }
    catch(err) {
      log.debug('Rank and pp update queue has NOT been processed.', 'ScoresService');
    }
  }

  const addRankAndPpToUpdateQueue = async scoresToUpdate => {
    if (!scoresToUpdate || !scoresToUpdate.length) return;

    log.debug('Queueing rank and pp update for bunch of scores', 'ScoresService', scoresToUpdate);

    try {
      await Promise.all(scoresToUpdate.map(async s => scoresUpdateQueueRepository().set(s)))
    }
    catch(err) {
      // swallow error
    }

    log.debug('Scores rank & pp queued for update.', 'ScoresService', scoresToUpdate)
  }

  const updatePlayerScores = async (player, priority = PRIORITY.BG_NORMAL) => {
    if (!player || !player.playerId) {
      log.warn(`Can not refresh scores, empty playerId`, 'ScoresService', player);

      return null;
    }

    const numOfScores = opt(player, 'scoreStats.totalPlayCount', null);
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

      return {recentPlay, newScores, scores: {...currentScoresById, ...convertScoresToObject(updatedScores, score => opt(score, 'id'))}};
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

  const getPlayerScoresPage = async (playerId, type = 'recent', page = 1) => {
    if (page < 1) return null;

    const key = type === 'top' ? 'pp' : 'timeSet';
    const playerScores = (await getPlayerScores(playerId));

    if (!playerScores || !playerScores.length) return null;

    playerScores.sort((a,b) => b[key] - a[key]);

    const startIdx = (page - 1) * PLAYER_SCORES_PER_PAGE;

    if (playerScores.length < startIdx + 1) return null;

    return playerScores.slice(startIdx, startIdx + PLAYER_SCORES_PER_PAGE);
  }

  const fetchScoresPage = async (playerId, type = 'recent', page = 1, priority = PRIORITY.FG_LOW, {...options} = {}) =>
    (type === 'top' ? topScoresApiClient : recentScoresApiClient)
      .getProcessed({...options, playerId, page, priority});

  const fetchScoresPageAndUpdateIfNeeded = async (playerId, type = 'recent', page = 1, priority = PRIORITY.FG_LOW, signal = null, canUseBrowserCache = false, refreshInterval = MINUTE) => {
    const fetchedScoresResponse = await fetchScoresPage(playerId, type, page, priority, {signal, cacheTtl: MINUTE, maxAge: canUseBrowserCache ? 0 : refreshInterval, fullResponse: true});
    if (topScoresApiClient.isResponseCached(fetchedScoresResponse)) return topScoresApiClient.getDataFromResponse(fetchedScoresResponse);

    const fetchedScores = topScoresApiClient.getDataFromResponse(fetchedScoresResponse);

    const playerScores = await getPlayerScores(playerId);
    if (fetchedScores && playerScores && playerScores.length) {
      const playerScoresObj = convertScoresToObject(playerScores)

      // update rank and pp in DB
      const scoresToUpdate = fetchedScores
        .map(score => {
          try {
            score = addScoreIndexFields(playerId, score);

            const leaderboardId = opt(score, 'leaderboard.leaderboardId')
            if (!leaderboardId || !score.id) return null;

            const scoreObj = opt(score, 'score')
            if (!scoreObj || !Object.keys(scoreObj).length) return null;

            const cachedScore = playerScoresObj[leaderboardId];
            if (!cachedScore) return null;

            const id = score.id;
            const lastUpdated = cachedScore.lastUpdated;

            if (lastUpdated && lastUpdated > addToDate(-RANK_AND_PP_REFRESH_INTERVAL)) return null;

            if (
              (!lastUpdated || lastUpdated < score.fetchedAt) &&
              (
                opt(cachedScore, 'score.scoreId') === opt(score, 'score.scoreId') ||
                (opt(cachedScore, 'score.unmodifiedScore') <= opt(score, 'score.unmodifiedScore'))
              )
            ) {
              scoresRepository().addToCache([{...cachedScore, score: {...scoreObj}}]);
            }

            return {id, leaderboardId, fetchedAt: score.fetchedAt, score: {...scoreObj}}
          } catch {
            return null;
          }
        })
        .filter(score => score)

      if (scoresToUpdate.length) addRankAndPpToUpdateQueue(scoresToUpdate).then(_ => {});
    }

    return fetchedScores;
  }

  const getPlayerBeatSaviorScoresPage = async (playerId, page = 1) => {
    if (page < 1) page = 1;

    const playerScores = await beatSaviorRepository().getAllFromIndex('beat-savior-playerId', playerId);

    if (!playerScores || !playerScores.length) return {total: 0, scores: []};

    playerScores.sort((a,b) => b.timeSet - a.timeSet);

    const startIdx = (page - 1) * PLAYER_SCORES_PER_PAGE;

    if (playerScores.length < startIdx + 1) return {total: 0, scores: []};

    return {
      total: playerScores.length,
      scores: playerScores
        .slice(startIdx, startIdx + PLAYER_SCORES_PER_PAGE)
        .map(bs => {
          const leaderboard = bs.leaderboard;
          if (!leaderboard.leaderboardId) leaderboard.leaderboardId = bs.beatSaviorId;

          const rawScore = opt(bs, 'trackers.scoreTracker.rawScore', 0);
          const rawRatio = opt(bs, 'trackers.scoreTracker.rawRatio', 0);
          const maxScore = rawRatio & rawScore ? rawScore / rawRatio : 0;

          return {
            beatSavior: bs,
            id: bs.beatSaviorId,
            leaderboard,
            leaderboardId: leaderboard.leaderboardId,
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

  const getPlayerAccSaberScoresPage = async (playerId, page = 1) => {
    if (page < 1) page = 1;

    let playerScores;
    try {
      playerScores = await accSaberService.fetchScoresPage(playerId, page);
    }
    catch (err) {
      return {total: 0, scores: []};
    }

    if (!playerScores || !playerScores.length) return {total: 0, scores: []};

    const startIdx = (page - 1) * ACCSABER_PLAYER_SCORES_PER_PAGE;
    if (playerScores.length < startIdx + 1) return {total: 0, scores: []};

    return {
      total: playerScores.length,
      itemsPerPage: ACCSABER_PLAYER_SCORES_PER_PAGE,
      scores: playerScores
        .slice(startIdx, startIdx + ACCSABER_PLAYER_SCORES_PER_PAGE)
    }
  }

  const fetchScoresPageOrGetFromCache = async (player, type = 'recent', page = 1, refreshInterval = MINUTE, priority = PRIORITY.FG_LOW, signal = null, force = false) => {
    if (!player || !player.playerId) return null;

    if ('beatsavior' === type) return getPlayerBeatSaviorScoresPage(player.playerId, page)
    else if ('accsaber' === type) return getPlayerAccSaberScoresPage(player.playerId, page)

    const canUseBrowserCache = !force && isScoreDateFresh(player, refreshInterval, 'recentPlayLastUpdated')

    const scoresPage = await getPlayerScoresPage(player.playerId, type, page);

    // force fetch from time to time even when in cache (in order to update rank/pp) OR if cached score is ranked and pp === 0
    const shouldPageBeRefetched = scoresPage && scoresPage.reduce((shouldRefresh, score) => {
      if (!score.pp && allRankeds[score.leaderboard]) return true;

      if (!score.lastUpdated || score.lastUpdated < addToDate(-RANK_AND_PP_REFRESH_INTERVAL)) return true;

      return shouldRefresh
    }, false)

    if (
      force ||
      !scoresPage ||
      shouldPageBeRefetched ||
      !isScoreDateFresh(player, refreshInterval, 'recentPlayLastUpdated') ||
      !player.recentPlay || !player.scoresLastUpdated || player.recentPlay > player.scoresLastUpdated
    )
      return fetchScoresPageAndUpdateIfNeeded(player.playerId, type, page, priority, signal, canUseBrowserCache && !shouldPageBeRefetched, refreshInterval);

    return scoresPage;
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

      log.trace(`Fetching player "${playerId}" scores from ScoreSaber...`, 'ScoresService')

      const scoresInfo = await updatePlayerScores(player, priority);

      if (!scoresInfo) {
        log.warn(`Can not refresh player "${playerId}" scores`, 'ScoresService')

        return null;
      }

      log.trace(`Player "${playerId}" scores updated`, 'ScoresService', scoresInfo.newScores);

      if (scoresInfo.newScores && scoresInfo.newScores.length) {
        // TODO: update country ranks

        eventBus.publish('player-scores-updated', {player, ...scoresInfo});
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
      if (rankedStoreUnsubscribe) rankedStoreUnsubscribe();

      playerService.destroyService();

      service = null;
    }
  }

  service = {
    getAll: getAllScores,
    getLeaderboardScores,
    getPlayerScores,
    getPlayerScoresAsObject,
    getPlayerScoresPage,
    getPlayerBeatSaviorScoresPage,
    getPlayerSongScore,
    getPlayerRankedScores,
    update: updateScore,
    getScoresFreshnessDate,
    areScoresFresh: isScoreDateFresh,
    fetchScoresPage,
    fetchScoresPageOrGetFromCache,
    refresh,
    refreshAll,
    updateRankAndPpFromTheQueue,
    destroyService,
    convertScoresToObject
  }

  return service;
}