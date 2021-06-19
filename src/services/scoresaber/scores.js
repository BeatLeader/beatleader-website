import {db} from '../../db/db'
import eventBus from '../../utils/broadcast-channel-pubsub'
import createConfigStore from '../../stores/config'
import createPlayerService from './player';
import createRankedsService from './rankeds';
import {PRIORITY} from '../../network/http-queue'
import apiRecentScoresProvider from '../../network/scoresaber/scores/api-recent'
import playersRepository from '../../db/repository/players'
import scoresRepository from '../../db/repository/scores'
import log from '../../utils/logger'
import {addToDate, formatDate, MINUTE, SECOND} from '../../utils/date'
import {opt} from '../../utils/js'
import scores from '../../db/repository/scores'
import {SS_API_SCORES_PER_PAGE} from '../../network/scoresaber/api-queue'
import {SsrHttpNotFoundError} from '../../network/errors'

const MAIN_PLAYER_REFRESH_INTERVAL = MINUTE * 3;
const PLAYER_REFRESH_INTERVAL = MINUTE * 30;

let service = null;
let serviceCreationCount = 0;
export default () => {
  serviceCreationCount++;
  if (service) return service;

  let playerService = createPlayerService();
  let rankedsService = createRankedsService();

  let mainPlayerId = null;
  let updateInProgress = [];

  let configStoreUnsubscribe = null;
  createConfigStore().then(configStore => {
    configStoreUnsubscribe = configStore.subscribe(config => {
      const newMainPlayerId = opt(config, 'users.main')
      if (mainPlayerId !== newMainPlayerId) {
        mainPlayerId = newMainPlayerId;

        log.debug(`Main player changed to ${mainPlayerId}`, 'ScoresService')
      }
    })
  })

  const getAllScores = async () => scoresRepository().getAll();
  const getPlayerScores = async playerId => scoresRepository().getAllFromIndex('scores-playerId', playerId);
  const getPlayerSongScore = async (playerId, leaderboardId) => scoresRepository().get(playerId + '_' + leaderboardId);
  const getPlayerRankedScores = async playerId => {
    const [scores, rankeds] = await Promise.all([getPlayerScores(), rankedsService.get()]);
    if (!scores) return [];

    return scores.filter(s => s.leaderboardId && rankeds[s.leaderboardId]);
  }
  const getPlayerRankedsToUpdate = async (playerId, prevUpdate = null) => {
    // TODO:
  }
  const updateScore = async score => scoresRepository().set(score);

  const reduceScoresArr = scores => scores.reduce((allScores, scorePage) => [...allScores, ...scorePage], []);
  const isAnyScoreOlderThan = (scores, olderThan) => scores.some(s => s.score && s.score.timeSet && s.score.timeSet <= olderThan);
  const createFetchUntilLastUpdated = olderThan => scores => isAnyScoreOlderThan(scores, olderThan);

  const convertScoresToObject = (scores, idFunc = score => opt(score, 'leaderboard.leaderboardId')) => scores.reduce((scoresObj, score) => {
    const id = idFunc(score);
    if (!id) return scoresObj;

    scoresObj[id] = {...score, id};

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

        const pageData = await apiRecentScoresProvider.getProcessed({playerId, page, signal, priority});
        log.trace(`Scores page #${page} fetched`, 'ScoresService', pageData);

        if (!pageData) {
          log.trace(`Scores page #${page} is empty`, 'ScoresService');

          break;
        }

        if (!Array.isArray(pageData)) break;

        if (
          pageData.length < SS_API_SCORES_PER_PAGE ||
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

    let data = await Promise.all(pages.map(page => apiRecentScoresProvider.getProcessed({playerId, page, signal, priority})));

    if (!data || !data.length) return [];

    if (data[data.length - 1].length === SS_API_SCORES_PER_PAGE) {
      data = [
        ...data,
        ...(await fetchScoresUntil(playerId, data.length + 1, priority, signal, null, true)),
      ];
    }

    return reduceScoresArr(data);
  }

  const updatePlayerScores = async (player, priority = PRIORITY.BG_NORMAL) => {
    if (!player || !player.playerId) {
      log.warn(`Can not refresh scores, empty playerId`, 'ScoresService', player);

      return null;
    }

    const numOfScores = opt(player, 'scoreStats.totalPlayCount', null);
    const numOfPages = numOfScores ? Math.ceil(numOfScores / SS_API_SCORES_PER_PAGE) : null;

    const newLastUpdated = new Date();

    try {
      let newScores;
      const abortController = new AbortController();

      if (numOfPages && !player.scoresLastUpdated) newScores = await fetchAllScores(player.playerId, numOfPages, priority, abortController.signal);
      else newScores = await fetchScoresUntil(player.playerId, 1, priority, abortController.signal, createFetchUntilLastUpdated(player.recentPlay ? player.recentPlay : player.scoresLastUpdated))

      if (!newScores || !newScores.length) {
        // no new scores - just update player profile
        await playersRepository().set({...player, scoresLastUpdated: newLastUpdated});
        return [];

      }

      const currentScoresById = convertScoresById(player.playerId, await getPlayerScores(player.playerId));

      const recentPlay = newScores.reduce((recentPlay, s) => opt(s, 'score.timeSet') && s.score.timeSet > recentPlay ? s.score.timeSet : recentPlay, null);

      // TODO: calculate pp contribution of score

      let playersCacheToUpdate = [];
      let scoresCacheToUpdate = [];
      await db.runInTransaction(['scores', 'players'], async tx => {
        const playersStore = tx.objectStore('players')
        player = await playersStore.get(player.playerId);
        player.scoresLastUpdated = newLastUpdated;

        if (recentPlay) player.recentPlay = recentPlay;
        await playersStore.put(player);

        playersCacheToUpdate.push(player);

        scoresCacheToUpdate = newScores.map(score => {
          const id = getScoreKey(player.playerId, score);
          const leaderboardId = opt(score, 'leaderboard.leaderboardId');
          const scoreValue = opt(score, 'score.score');
          const scoreTimeSet = opt(score, 'score.timeSet');
          const scorePp = opt(score, 'score.pp');

          if (!id || !leaderboardId || !scoreTimeSet || scoreValue === undefined || scorePp === undefined) {
            return null;
          }

          const prevScore = currentScoresById && currentScoresById[id] && currentScoresById[id].score
            ? currentScoresById[id]
            : null;

          if (prevScore) {
            const prevScoreScorePart = prevScore.score;
            if (prevScoreScorePart && prevScoreScorePart.timeSet && prevScoreScorePart.score !== undefined && prevScoreScorePart.score < scoreValue) {
              const prevHistory = opt(prevScore, 'history.length') ? prevScore.history.filter(h => h.timeSet) : [];
              score.history = [prevScoreScorePart].concat(prevHistory).slice(0,3);
            }
          }

          // needed by DB indexes
          score.id = id;
          score.playerId = player.playerId;
          score.leaderboardId = leaderboardId;
          score.timeSet = scoreTimeSet;
          score.pp = scorePp;

          return score;
        }).filter(s => s);

        const scoresStore = tx.objectStore('scores');
        await Promise.all(scoresCacheToUpdate.map(score => scoresStore.put(score)));
      });

      // update cache
      playersRepository().addToCache(playersCacheToUpdate);
      scoresRepository().addToCache(scoresCacheToUpdate);

      return newScores;
    } catch (err) {
      if (![opt(err, 'name'), opt(err, 'message')].includes('AbortError')) throw err;

      return null;
    }
  }

  const isPlayerMain = playerId => playerId === mainPlayerId;

  const getScoresFreshnessDate = player => {
    const lastUpdated = player && player.scoresLastUpdated ? player.scoresLastUpdated : null;
    if (!lastUpdated) return addToDate(-SECOND);

    const REFRESH_INTERVAL = isPlayerMain(player.playerId) ? MAIN_PLAYER_REFRESH_INTERVAL : PLAYER_REFRESH_INTERVAL;

    return addToDate(REFRESH_INTERVAL, lastUpdated);
  }

  const refresh = async (playerId, forceUpdate = false, priority = PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.trace(`Starting player "${playerId}" scores refreshing${forceUpdate ? ' (forced)' : ''}...`, 'ScoresService')

    if (!playerId) {
      log.warn(`Can not refresh player scores if an empty playerId is given`, 'ScoresService');

      return null;
    }

    if (updateInProgress.includes(playerId)) {
      log.warn(`Player "${playerId}" scores are being fetched, skipping.`, 'ScoresService');

      return null;
    }

    try {
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

          return null;
        }
      }

      log.trace(`Fetching player "${playerId}" scores from ScoreSaber...`, 'ScoresService')

      const newScores = await updatePlayerScores(player, priority);

      if (!newScores) {
        log.warn(`Can not refresh player "${playerId}" scores`, 'ScoresService')

        return null;
      }

      log.trace(`Player "${playerId}" scores updated`, 'ScoresService', newScores);

      if (newScores.length) {
        // TODO: update country ranks

        eventBus.publish('player-scores-updated', {player, newScores});
      }

      log.debug(`Player "${playerId}" refreshing complete.`, 'ScoresService');

      return newScores;
    } catch (e) {
      if (throwErrors) throw e;

      log.debug(`Player "${playerId}" scores refreshing error${e.toString ? `: ${e.toString()}` : ''}`, 'ScoresService', e)

      return null;
    }
    finally {
      updateInProgress = updateInProgress.filter(pId => pId !== playerId);
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
    const allPlayersWithNewScores = allActivePlayers.map((player, idx) => ({player, newScores: allNewScores[idx]}))

    log.trace(`All players scores refreshed.`, 'ScoresService', allPlayersWithNewScores);

    return allPlayersWithNewScores;
  }

  const destroyService = () => {
    serviceCreationCount--;
    if (serviceCreationCount === 0 && configStoreUnsubscribe) configStoreUnsubscribe();
  }

  service = {
    getAll: getAllScores,
    getPlayerScores,
    getPlayerSongScore,
    getPlayerRankedScores,
    update: updateScore,
    refresh,
    refreshAll,
    destroyService,
    convertScoresToObject
  }

  return service;
}