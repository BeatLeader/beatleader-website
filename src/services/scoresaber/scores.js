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
import {addToDate, dateFromString, formatDate, HOUR, MINUTE, SECOND} from '../../utils/date'
import {opt} from '../../utils/js'
import scores from '../../db/repository/scores'
import {SsrHttpNotFoundError} from '../../network/errors'
import {PLAYER_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'

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
      // playerScores = await accSaberService.fetchScoresPage(playerId, page);
      // TODO: test only
      playerScores =
        [
          {"id":"2092178757563532-249291","playerId":"2092178757563532","leaderboardId":249291,"timeSet":"2021-09-13T04:45:45.000Z","ap":796.1521858196799,"acc":99.3560691,"leaderboard":{"leaderboardId":249291,"song":{"hash":"12ffb213e09e866172aaba442843bb3116c07316","name":"Midnight Moon","subName":"","authorName":"Oh Wonder","levelAuthorName":"jafdy","beatsaverKey":"a804"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":0.2,"categoryDisplayName":"True Acc"},"score":{"rank":39,"timeSet":"2021-09-13T04:45:45.000Z","ap":796.1521858196799,"unmodifiedScore":153679,"score":153679,"mods":null,"acc":99.3560691,"percentage":99.3560691,"weightedAp":796.1521858196799},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-364509","playerId":"2092178757563532","leaderboardId":364509,"timeSet":"2021-09-11T20:21:47.000Z","ap":789.8840644626422,"acc":99.046588,"leaderboard":{"leaderboardId":364509,"song":{"hash":"1db37e58609ad297650581c7d8b456fcf82da119","name":"All We Got","subName":"","authorName":"Robin Schulz","levelAuthorName":"Artjoms & Fatalution","beatsaverKey":"198bc"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":3.1,"categoryDisplayName":"True Acc"},"score":{"rank":25,"timeSet":"2021-09-11T20:21:47.000Z","ap":789.8840644626422,"unmodifiedScore":251613,"score":251613,"mods":null,"acc":99.046588,"percentage":99.046588,"weightedAp":781.2904412643899},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-289510","playerId":"2092178757563532","leaderboardId":289510,"timeSet":"2021-09-23T00:51:09.000Z","ap":758.0227215459294,"acc":99.0646001,"leaderboard":{"leaderboardId":289510,"song":{"hash":"bbabe0da40ce8f54c666db99f58f8d03d5f7cec7","name":"Song #3","subName":"","authorName":"Stone Sour","levelAuthorName":"jafdy","beatsaverKey":"de3f"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":1.9,"categoryDisplayName":"True Acc"},"score":{"rank":7,"timeSet":"2021-09-23T00:51:09.000Z","ap":758.0227215459294,"unmodifiedScore":180570,"score":180570,"mods":null,"acc":99.0646001,"percentage":99.0646001,"weightedAp":737.8008914059039},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-346708","playerId":"2092178757563532","leaderboardId":346708,"timeSet":"2021-09-22T04:19:02.000Z","ap":757.9492255151164,"acc":99.0243589,"leaderboard":{"leaderboardId":346708,"song":{"hash":"548cc2f2666d123cd9103e62523b6c37c4cb04f5","name":"Finesse (Remix)","subName":"","authorName":"Bruno Mars","levelAuthorName":"ETAN","beatsaverKey":"16729"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":2.3,"categoryDisplayName":"True Acc"},"score":{"rank":24,"timeSet":"2021-09-22T04:19:02.000Z","ap":757.9492255151164,"unmodifiedScore":231514,"score":231514,"mods":null,"acc":99.0243589,"percentage":99.0243589,"weightedAp":720.5610627323155},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-253841","playerId":"2092178757563532","leaderboardId":253841,"timeSet":"2021-09-13T04:49:47.000Z","ap":756.2099543230267,"acc":99.1386427,"leaderboard":{"leaderboardId":253841,"song":{"hash":"1b9278797fa6d85d0201d1a261101f8cb9ac7dde","name":"Level of Concern","subName":"","authorName":"twenty one pilots","levelAuthorName":"Pyrowarfare","beatsaverKey":"aa73"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":1.1,"categoryDisplayName":"True Acc"},"score":{"rank":23,"timeSet":"2021-09-13T04:49:47.000Z","ap":756.2099543230267,"unmodifiedScore":205331,"score":205331,"mods":null,"acc":99.1386427,"percentage":99.1386427,"weightedAp":694.7863734094842},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-296766","playerId":"2092178757563532","leaderboardId":296766,"timeSet":"2021-09-22T04:13:21.000Z","ap":749.3323652178742,"acc":99.0258829,"leaderboard":{"leaderboardId":296766,"song":{"hash":"22a793a03fb7d6e0f7291082896d595a016af39f","name":"Who's Laughing Now?","subName":"","authorName":"Ava Max","levelAuthorName":"NovaShaft","beatsaverKey":"f2fa"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":2,"categoryDisplayName":"True Acc"},"score":{"rank":27,"timeSet":"2021-09-22T04:13:21.000Z","ap":749.3323652178742,"unmodifiedScore":194165,"score":194165,"mods":null,"acc":99.0258829,"percentage":99.0258829,"weightedAp":655.6491727546513},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-346784","playerId":"2092178757563532","leaderboardId":346784,"timeSet":"2021-09-13T04:57:24.000Z","ap":748.4756314517917,"acc":99.03303009999999,"leaderboard":{"leaderboardId":346784,"song":{"hash":"561e0971470069a49aa925df7484282019e59c40","name":"24K Magic","subName":"","authorName":"Bruno Mars","levelAuthorName":"ETAN","beatsaverKey":"16726"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":1.9,"categoryDisplayName":"True Acc"},"score":{"rank":24,"timeSet":"2021-09-13T04:57:24.000Z","ap":748.4756314517917,"unmodifiedScore":237912,"score":237912,"mods":null,"acc":99.03303009999999,"percentage":99.03303009999999,"weightedAp":611.4195897239118},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-380944","playerId":"2092178757563532","leaderboardId":380944,"timeSet":"2021-09-23T00:38:03.000Z","ap":745.9608073172288,"acc":98.9346333,"leaderboard":{"leaderboardId":380944,"song":{"hash":"6ae7603f5bcf19d216df10925c5cb603fa60efff","name":"Dandelions","subName":"","authorName":"Ruth B.","levelAuthorName":"Sync","beatsaverKey":"1911b"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":2.8,"categoryDisplayName":"Standard Acc"},"score":{"rank":3,"timeSet":"2021-09-23T00:38:03.000Z","ap":745.9608073172288,"unmodifiedScore":248598,"score":248598,"mods":null,"acc":98.9346333,"percentage":98.9346333,"weightedAp":745.9608073172288},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-287323","playerId":"2092178757563532","leaderboardId":287323,"timeSet":"2021-09-22T04:01:13.000Z","ap":745.5244913582168,"acc":98.723173,"leaderboard":{"leaderboardId":287323,"song":{"hash":"5c870272e2159096d453f9420a8120980a5d4d29","name":"LIKEY","subName":"","authorName":"TWICE","levelAuthorName":"simplymarvellous","beatsaverKey":"d771"},"diffInfo":{"type":"Standard","diff":"normal"},"complexity":4.9,"categoryDisplayName":"Standard Acc"},"score":{"rank":19,"timeSet":"2021-09-22T04:01:13.000Z","ap":745.5244913582168,"unmodifiedScore":417910,"score":417910,"mods":null,"acc":98.723173,"percentage":98.723173,"weightedAp":737.4134826013054},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-137234","playerId":"2092178757563532","leaderboardId":137234,"timeSet":"2021-05-23T18:43:01.000Z","ap":743.7462652037149,"acc":99.1172108,"leaderboard":{"leaderboardId":137234,"song":{"hash":"b70aeef2ee915ced48593422931e8ba2a1f4e973","name":"Crying for Rain","subName":"","authorName":"squeaksies","levelAuthorName":"squeaksies","beatsaverKey":"4a2a"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":0.9,"categoryDisplayName":"True Acc"},"score":{"rank":54,"timeSet":"2021-05-23T18:43:01.000Z","ap":743.7462652037149,"unmodifiedScore":277325,"score":277325,"mods":null,"acc":99.1172108,"percentage":99.1172108,"weightedAp":552.8038204568741},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-379307","playerId":"2092178757563532","leaderboardId":379307,"timeSet":"2021-09-23T01:08:19.000Z","ap":743.4227083379604,"acc":98.77612409999999,"leaderboard":{"leaderboardId":379307,"song":{"hash":"64600295ca712bfa1e2cd9f005a9935717ed4a02","name":"dnd","subName":"","authorName":"glaive","levelAuthorName":"cladiotto","beatsaverKey":"1c28d"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":4.3,"categoryDisplayName":"Standard Acc"},"score":{"rank":5,"timeSet":"2021-09-23T01:08:19.000Z","ap":743.4227083379604,"unmodifiedScore":338165,"score":338165,"mods":null,"acc":98.77612409999999,"percentage":98.77612409999999,"weightedAp":723.5903638673508},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-329893","playerId":"2092178757563532","leaderboardId":329893,"timeSet":"2021-09-23T00:44:01.000Z","ap":741.0576095723779,"acc":98.9881633,"leaderboard":{"leaderboardId":329893,"song":{"hash":"7205386fae254c424b4f6c48da411052ca0964f5","name":"Step!","subName":"","authorName":"Mio Honda","levelAuthorName":"ETAN","beatsaverKey":"13d5a"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":2.1,"categoryDisplayName":"True Acc"},"score":{"rank":9,"timeSet":"2021-09-23T00:44:01.000Z","ap":741.0576095723779,"unmodifiedScore":341623,"score":341623,"mods":null,"acc":98.9881633,"percentage":98.9881633,"weightedAp":485.5298748739344},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-362922","playerId":"2092178757563532","leaderboardId":362922,"timeSet":"2021-09-23T01:11:33.000Z","ap":740.5113614315125,"acc":98.5363203,"leaderboard":{"leaderboardId":362922,"song":{"hash":"7ace8eee8e217a00a895aa7d12977cbc9ac0cdc5","name":"Viyella's Scream","subName":"","authorName":"Laur","levelAuthorName":"Timbo","beatsaverKey":"1949e"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":6.6,"categoryDisplayName":"Standard Acc"},"score":{"rank":11,"timeSet":"2021-09-23T01:11:33.000Z","ap":740.5113614315125,"unmodifiedScore":389923,"score":389923,"mods":null,"acc":98.5363203,"percentage":98.5363203,"weightedAp":703.9833746064073},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-364424","playerId":"2092178757563532","leaderboardId":364424,"timeSet":"2021-09-12T17:08:39.000Z","ap":739.1011910210808,"acc":99.0115549,"leaderboard":{"leaderboardId":364424,"song":{"hash":"aafc6e82a5e39838d3ecb0897f2b9a4d37428b7b","name":"Perfume!","subName":"","authorName":"fusq","levelAuthorName":"Sphur & ETAN","beatsaverKey":"1984e"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":1.8,"categoryDisplayName":"True Acc"},"score":{"rank":34,"timeSet":"2021-09-12T17:08:39.000Z","ap":739.1011910210808,"unmodifiedScore":193226,"score":193226,"mods":null,"acc":99.0115549,"percentage":99.0115549,"weightedAp":411.49735863491685},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-368913","playerId":"2092178757563532","leaderboardId":368913,"timeSet":"2021-09-22T04:43:50.000Z","ap":737.6313599551454,"acc":98.7565762,"leaderboard":{"leaderboardId":368913,"song":{"hash":"348c61bcf3fe2644298780d4186aae5ab5a29d56","name":"Golden","subName":"","authorName":"Harry Styles","levelAuthorName":"RFCaps","beatsaverKey":"1a55d"},"diffInfo":{"type":"Standard","diff":"normal"},"complexity":4.3,"categoryDisplayName":"Standard Acc"},"score":{"rank":21,"timeSet":"2021-09-22T04:43:50.000Z","ap":737.6313599551454,"unmodifiedScore":344458,"score":344458,"mods":null,"acc":98.7565762,"percentage":98.7565762,"weightedAp":677.7168358688659},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-376027","playerId":"2092178757563532","leaderboardId":376027,"timeSet":"2021-09-22T04:09:52.000Z","ap":736.3484034095071,"acc":99.0122207,"leaderboard":{"leaderboardId":376027,"song":{"hash":"0c613e9ee92bfab6d055594178cadb80fbc9a254","name":"Cinderella","subName":"","authorName":"DECO*27","levelAuthorName":"TOFU","beatsaverKey":"1b890"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":1.7,"categoryDisplayName":"True Acc"},"score":{"rank":26,"timeSet":"2021-09-22T04:09:52.000Z","ap":736.3484034095071,"unmodifiedScore":185940,"score":185940,"mods":null,"acc":99.0122207,"percentage":99.0122207,"weightedAp":334.90476103182147},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-298489","playerId":"2092178757563532","leaderboardId":298489,"timeSet":"2021-09-13T04:41:47.000Z","ap":735.6327048771219,"acc":99.119787,"leaderboard":{"leaderboardId":298489,"song":{"hash":"4e5712d5c2c2aa2a1fdde9ed6df1616f1aaaafd6","name":"Lose It","subName":"","authorName":"Oh Wonder","levelAuthorName":"jafdy","beatsaverKey":"f870"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":0.6,"categoryDisplayName":"True Acc"},"score":{"rank":51,"timeSet":"2021-09-13T04:41:47.000Z","ap":735.6327048771219,"unmodifiedScore":139635,"score":139635,"mods":null,"acc":99.119787,"percentage":99.119787,"weightedAp":262.7992013941694},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-378377","playerId":"2092178757563532","leaderboardId":378377,"timeSet":"2021-09-22T04:31:19.000Z","ap":734.3225299119499,"acc":98.7253244,"leaderboard":{"leaderboardId":378377,"song":{"hash":"ae9ca369573c058cf6a6dca70ea94f14f3bfaca1","name":"Big Daddy","subName":"","authorName":"USAO","levelAuthorName":"Timbo","beatsaverKey":"194b4"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":4.5,"categoryDisplayName":"Standard Acc"},"score":{"rank":18,"timeSet":"2021-09-22T04:31:19.000Z","ap":734.3225299119499,"unmodifiedScore":680410,"score":680410,"mods":null,"acc":98.7253244,"percentage":98.7253244,"weightedAp":642.5159003133209},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-363335","playerId":"2092178757563532","leaderboardId":363335,"timeSet":"2021-09-23T00:27:29.000Z","ap":727.9775678762078,"acc":98.233576,"leaderboard":{"leaderboardId":363335,"song":{"hash":"25fe339505cf979d0b462ea764391edf30a2f67b","name":"Matasaburo","subName":"","authorName":"Yorushika","levelAuthorName":"Emir","beatsaverKey":"19595"},"diffInfo":{"type":"Standard","diff":"hard"},"complexity":9.2,"categoryDisplayName":"Tech Acc"},"score":{"rank":5,"timeSet":"2021-09-23T00:27:29.000Z","ap":727.9775678762078,"unmodifiedScore":795412,"score":795412,"mods":null,"acc":98.233576,"percentage":98.233576,"weightedAp":727.9775678762078},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-330340","playerId":"2092178757563532","leaderboardId":330340,"timeSet":"2021-08-29T23:05:11.000Z","ap":723.5101811331713,"acc":98.13812560000001,"leaderboard":{"leaderboardId":330340,"song":{"hash":"3a7fca27ae95ab1dc14103900a07324502f53d0d","name":"Kakurenbocchi","subName":"","authorName":"TUYU","levelAuthorName":"Emir","beatsaverKey":"13e59"},"diffInfo":{"type":"Standard","diff":"hard"},"complexity":10,"categoryDisplayName":"Tech Acc"},"score":{"rank":27,"timeSet":"2021-08-29T23:05:11.000Z","ap":723.5101811331713,"unmodifiedScore":634831,"score":634831,"mods":null,"acc":98.13812560000001,"percentage":98.13812560000001,"weightedAp":715.6386792805702},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-350910","playerId":"2092178757563532","leaderboardId":350910,"timeSet":"2021-09-23T00:57:05.000Z","ap":718.9359200066599,"acc":98.9421858,"leaderboard":{"leaderboardId":350910,"song":{"hash":"0d191cd2dfe9404e4f58b5520bbc9b7b9cafa8c7","name":"KING","subName":"","authorName":"Ayunda Risu","levelAuthorName":"ETAN","beatsaverKey":"17195"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":1.8,"categoryDisplayName":"True Acc"},"score":{"rank":8,"timeSet":"2021-09-23T00:57:05.000Z","ap":718.9359200066599,"unmodifiedScore":136654,"score":136654,"mods":null,"acc":98.9421858,"percentage":98.9421858,"weightedAp":194.56363634896678},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-286360","playerId":"2092178757563532","leaderboardId":286360,"timeSet":"2021-09-23T00:54:00.000Z","ap":716.1110279835035,"acc":99.0022807,"leaderboard":{"leaderboardId":286360,"song":{"hash":"c6b7136536ef5647374198769b3211b2b2e4ee17","name":"SUPER RISER!","subName":"","authorName":"Nanidato","levelAuthorName":"ETAN","beatsaverKey":"d411"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":1.1,"categoryDisplayName":"True Acc"},"score":{"rank":21,"timeSet":"2021-09-23T00:54:00.000Z","ap":716.1110279835035,"unmodifiedScore":136737,"score":136737,"mods":null,"acc":99.0022807,"percentage":99.0022807,"weightedAp":142.32144301726498},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-287074","playerId":"2092178757563532","leaderboardId":287074,"timeSet":"2021-09-23T00:33:51.000Z","ap":716.0937010577162,"acc":98.7322198,"leaderboard":{"leaderboardId":287074,"song":{"hash":"e935e19a32ef28c1540af596b7846d19ba66bf9b","name":"Fuji Opener (Virtual Riot & Xomega Remix)","subName":"","authorName":"Skrillex","levelAuthorName":"pkdan","beatsaverKey":"d6a6"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":3.8,"categoryDisplayName":"Standard Acc"},"score":{"rank":5,"timeSet":"2021-09-23T00:33:51.000Z","ap":716.0937010577162,"unmodifiedScore":330748,"score":330748,"mods":null,"acc":98.7322198,"percentage":98.7322198,"weightedAp":584.9672300691151},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-340274","playerId":"2092178757563532","leaderboardId":340274,"timeSet":"2021-09-23T00:07:59.000Z","ap":711.3949974618076,"acc":98.34563899999999,"leaderboard":{"leaderboardId":340274,"song":{"hash":"92acd063023beab160c32c303fd3a743fe4501b6","name":"Swim","subName":"","authorName":"At Face Value","levelAuthorName":"RFCaps & SSnowy & Olaf","beatsaverKey":"157c4"},"diffInfo":{"type":"Standard","diff":"expert"},"complexity":7.5,"categoryDisplayName":"Standard Acc"},"score":{"rank":13,"timeSet":"2021-09-23T00:07:59.000Z","ap":711.3949974618076,"unmodifiedScore":580077,"score":580077,"mods":null,"acc":98.34563899999999,"percentage":98.34563899999999,"weightedAp":528.7581139558121},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-239561","playerId":"2092178757563532","leaderboardId":239561,"timeSet":"2021-09-20T20:21:26.000Z","ap":706.8484357383784,"acc":98.65946869999999,"leaderboard":{"leaderboardId":239561,"song":{"hash":"76aba4dbdca6c8be81f71cc57c221f41fece705a","name":"Nobody To Love","subName":"","authorName":"Sigma","levelAuthorName":"pkdan","beatsaverKey":"a598"},"diffInfo":{"type":"Standard","diff":"hard"},"complexity":4.2,"categoryDisplayName":"Standard Acc"},"score":{"rank":34,"timeSet":"2021-09-20T20:21:26.000Z","ap":706.8484357383784,"unmodifiedScore":423994,"score":423994,"mods":null,"acc":98.65946869999999,"percentage":98.65946869999999,"weightedAp":463.1165352406677},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-372250","playerId":"2092178757563532","leaderboardId":372250,"timeSet":"2021-09-23T01:04:02.000Z","ap":704.2441201977574,"acc":97.67014950000001,"leaderboard":{"leaderboardId":372250,"song":{"hash":"2ac7cb39558700fa31b203d617e94f4c7340ee7f","name":"Something Just Like This","subName":"","authorName":"The Chainsmokers & Coldplay","levelAuthorName":"Nolanimations","beatsaverKey":"1ae03"},"diffInfo":{"type":"Standard","diff":"expertPlus"},"complexity":14,"categoryDisplayName":"Tech Acc"},"score":{"rank":12,"timeSet":"2021-09-23T01:04:02.000Z","ap":704.2441201977574,"unmodifiedScore":895982,"score":895982,"mods":null,"acc":97.67014950000001,"percentage":97.67014950000001,"weightedAp":685.4569459205708},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-332538","playerId":"2092178757563532","leaderboardId":332538,"timeSet":"2021-09-23T00:23:07.000Z","ap":704.0637700272912,"acc":98.1795026,"leaderboard":{"leaderboardId":332538,"song":{"hash":"b38151b3b6579b121d00e7616204899b544de831","name":"Robber And Bouquet","subName":"","authorName":"Yorushika","levelAuthorName":"Emir","beatsaverKey":"143a6"},"diffInfo":{"type":"Standard","diff":"hard"},"complexity":8.9,"categoryDisplayName":"Tech Acc"},"score":{"rank":10,"timeSet":"2021-09-23T00:23:07.000Z","ap":704.0637700272912,"unmodifiedScore":693810,"score":693810,"mods":null,"acc":98.1795026,"percentage":98.1795026,"weightedAp":669.3336720773094},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-328853","playerId":"2092178757563532","leaderboardId":328853,"timeSet":"2021-09-20T20:08:54.000Z","ap":703.4176274828033,"acc":98.2971833,"leaderboard":{"leaderboardId":328853,"song":{"hash":"a30818f752cce3c87664570826bbf7b12b848a30","name":"Pika Girl","subName":"","authorName":"S3RL","levelAuthorName":"MeezoNugget","beatsaverKey":"13b20"},"diffInfo":{"type":"Standard","diff":"hard"},"complexity":7.7,"categoryDisplayName":"Standard Acc"},"score":{"rank":27,"timeSet":"2021-09-20T20:08:54.000Z","ap":703.4176274828033,"unmodifiedScore":749806,"score":749806,"mods":null,"acc":98.2971833,"percentage":98.2971833,"weightedAp":391.63040087450963},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-326488","playerId":"2092178757563532","leaderboardId":326488,"timeSet":"2021-09-22T04:35:46.000Z","ap":699.3562240466691,"acc":98.3525459,"leaderboard":{"leaderboardId":326488,"song":{"hash":"8fd628b4f4a04b66bef3cce9bf7ba4f8a30984fc","name":"Face Down","subName":"","authorName":"The Red Jumpsuit Apparatus","levelAuthorName":"Bytrius","beatsaverKey":"135ae"},"diffInfo":{"type":"Standard","diff":"hard"},"complexity":7,"categoryDisplayName":"Standard Acc"},"score":{"rank":24,"timeSet":"2021-09-22T04:35:46.000Z","ap":699.3562240466691,"unmodifiedScore":723083,"score":723083,"mods":null,"acc":98.3525459,"percentage":98.3525459,"weightedAp":318.08003929385944},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-365911","playerId":"2092178757563532","leaderboardId":365911,"timeSet":"2021-09-18T02:02:42.000Z","ap":691.4349826995227,"acc":98.1936998,"leaderboard":{"leaderboardId":365911,"song":{"hash":"83b3ccedafe29d6fd9bab6f77edd01a8af920e14","name":"Bad","subName":"","authorName":"Oski","levelAuthorName":"Timbo","beatsaverKey":"19cf3"},"diffInfo":{"type":"Standard","diff":"expertPlus"},"complexity":8.3,"categoryDisplayName":"Tech Acc"},"score":{"rank":31,"timeSet":"2021-09-18T02:02:42.000Z","ap":691.4349826995227,"unmodifiedScore":539432,"score":539432,"mods":null,"acc":98.1936998,"percentage":98.1936998,"weightedAp":635.2727854638115},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-359083","playerId":"2092178757563532","leaderboardId":359083,"timeSet":"2021-09-12T17:02:15.000Z","ap":683.8647355341885,"acc":98.3057562,"leaderboard":{"leaderboardId":359083,"song":{"hash":"02b85d98cf71aa913723503466fa3dedabd15ef0","name":"Heartbreak","subName":"","authorName":"Fvrwvrd","levelAuthorName":"Fvwrvrd & Timbo","beatsaverKey":"1871a"},"diffInfo":{"type":"Standard","diff":"easy"},"complexity":6.9,"categoryDisplayName":"Standard Acc"},"score":{"rank":25,"timeSet":"2021-09-12T17:02:15.000Z","ap":683.8647355341885,"unmodifiedScore":540952,"score":540952,"mods":null,"acc":98.3057562,"percentage":98.3057562,"weightedAp":244.30548719287756},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-355067","playerId":"2092178757563532","leaderboardId":355067,"timeSet":"2021-09-11T20:02:48.000Z","ap":677.3986013110143,"acc":98.2215904,"leaderboard":{"leaderboardId":355067,"song":{"hash":"6c017f69bd1ffde6a69d6a1bc093e3c4aff83e3b","name":"Saramandora no Odoriko","subName":"","authorName":"Hatsuki Yura","levelAuthorName":"EOP Glacier","beatsaverKey":"17c66"},"diffInfo":{"type":"Standard","diff":"hard"},"complexity":7.5,"categoryDisplayName":"Tech Acc"},"score":{"rank":25,"timeSet":"2021-09-11T20:02:48.000Z","ap":677.3986013110143,"unmodifiedScore":525127,"score":525127,"mods":null,"acc":98.2215904,"percentage":98.2215904,"weightedAp":592.7087273823925},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-357373","playerId":"2092178757563532","leaderboardId":357373,"timeSet":"2021-09-18T02:05:38.000Z","ap":674.3297716029266,"acc":98.3900235,"leaderboard":{"leaderboardId":357373,"song":{"hash":"68c7d6431af538f4fce04709bfb3400bf270c2e0","name":"Gate One","subName":"","authorName":"aran","levelAuthorName":"Team BeerSaber","beatsaverKey":"181f9"},"diffInfo":{"type":"Standard","diff":"normal"},"complexity":5.7,"categoryDisplayName":"Standard Acc"},"score":{"rank":38,"timeSet":"2021-09-18T02:05:38.000Z","ap":674.3297716029266,"unmodifiedScore":364904,"score":364904,"mods":null,"acc":98.3900235,"percentage":98.3900235,"weightedAp":182.4919979797619},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-317783","playerId":"2092178757563532","leaderboardId":317783,"timeSet":"2021-09-11T19:49:11.000Z","ap":665.9642913101411,"acc":98.1881666,"leaderboard":{"leaderboardId":317783,"song":{"hash":"2c01774fdb9c4bcc53df1707ade85cea6f043477","name":"Pastel Rain","subName":"","authorName":"Sangatsu no Phantasia","levelAuthorName":"ETAN","beatsaverKey":"12377"},"diffInfo":{"type":"Standard","diff":"hard"},"complexity":7.4,"categoryDisplayName":"Tech Acc"},"score":{"rank":27,"timeSet":"2021-09-11T19:49:11.000Z","ap":665.9642913101411,"unmodifiedScore":513205,"score":513205,"mods":null,"acc":98.1881666,"percentage":98.1881666,"weightedAp":544.0171952877378},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-343907","playerId":"2092178757563532","leaderboardId":343907,"timeSet":"2021-09-13T21:20:42.000Z","ap":664.4071625781601,"acc":97.7921834,"leaderboard":{"leaderboardId":343907,"song":{"hash":"3654e2ed8a930cbe726c82ed5e0117f754e1bf30","name":"RGB","subName":"","authorName":"YOASOBI","levelAuthorName":"Dack","beatsaverKey":"160f3"},"diffInfo":{"type":"Standard","diff":"expert"},"complexity":11.3,"categoryDisplayName":"Tech Acc"},"score":{"rank":61,"timeSet":"2021-09-13T21:20:42.000Z","ap":664.4071625781601,"unmodifiedScore":442759,"score":442759,"mods":null,"acc":97.7921834,"percentage":97.7921834,"weightedAp":493.8334953675594},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-302433","playerId":"2092178757563532","leaderboardId":302433,"timeSet":"2021-09-16T02:50:07.000Z","ap":657.4026308093081,"acc":97.52505740000001,"leaderboard":{"leaderboardId":302433,"song":{"hash":"4e37c7070b9049ebbbf11ceab644d4ec4a01ca13","name":"Hocus Pocus","subName":"","authorName":"Marnik","levelAuthorName":"ETAN","beatsaverKey":"10377"},"diffInfo":{"type":"Standard","diff":"expert"},"complexity":13.7,"categoryDisplayName":"Tech Acc"},"score":{"rank":44,"timeSet":"2021-09-16T02:50:07.000Z","ap":657.4026308093081,"unmodifiedScore":859659,"score":859659,"mods":null,"acc":97.52505740000001,"percentage":97.52505740000001,"weightedAp":430.7203825392525},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-287314","playerId":"2092178757563532","leaderboardId":287314,"timeSet":"2021-09-22T04:05:28.000Z","ap":653.3669560715626,"acc":97.9492694,"leaderboard":{"leaderboardId":287314,"song":{"hash":"5c870272e2159096d453f9420a8120980a5d4d29","name":"LIKEY","subName":"","authorName":"TWICE","levelAuthorName":"simplymarvellous","beatsaverKey":"d771"},"diffInfo":{"type":"Standard","diff":"expert"},"complexity":9.3,"categoryDisplayName":"Tech Acc"},"score":{"rank":39,"timeSet":"2021-09-22T04:05:28.000Z","ap":653.3669560715626,"unmodifiedScore":692183,"score":692183,"mods":null,"acc":97.9492694,"percentage":97.9492694,"weightedAp":363.76450195047147},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-364669","playerId":"2092178757563532","leaderboardId":364669,"timeSet":"2021-09-20T20:17:26.000Z","ap":648.0205097359767,"acc":97.6681708,"leaderboard":{"leaderboardId":364669,"song":{"hash":"1ce20e57ccea2637b152982d16b173b6664cf9a7","name":"STYX HELIX","subName":"","authorName":"MYTH & ROID","levelAuthorName":"Bytrius & Joshabi","beatsaverKey":"19923"},"diffInfo":{"type":"Standard","diff":"expert"},"complexity":11.9,"categoryDisplayName":"Tech Acc"},"score":{"rank":35,"timeSet":"2021-09-20T20:17:26.000Z","ap":648.0205097359767,"unmodifiedScore":1070282,"score":1070282,"mods":null,"acc":97.6681708,"percentage":97.6681708,"weightedAp":294.73161475187135},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-371236","playerId":"2092178757563532","leaderboardId":371236,"timeSet":"2021-09-12T17:20:08.000Z","ap":647.5677730053802,"acc":97.6563745,"leaderboard":{"leaderboardId":371236,"song":{"hash":"e738b38b594861745bfb0473c66ca5cca15072ff","name":"Cinco","subName":"","authorName":"Ofelia K","levelAuthorName":"Timbo","beatsaverKey":"1ac0b"},"diffInfo":{"type":"Standard","diff":"expertPlus"},"complexity":12,"categoryDisplayName":"Tech Acc"},"score":{"rank":41,"timeSet":"2021-09-12T17:20:08.000Z","ap":647.5677730053802,"unmodifiedScore":839254,"score":839254,"mods":null,"acc":97.6563745,"percentage":97.6563745,"weightedAp":231.338672772632},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-348283","playerId":"2092178757563532","leaderboardId":348283,"timeSet":"2021-09-20T20:12:13.000Z","ap":635.6093021412603,"acc":98.0283694,"leaderboard":{"leaderboardId":348283,"song":{"hash":"45f9480a43ddea9ff338bf449ad9ead62f73eb52","name":"The Nights","subName":"","authorName":"Avicii","levelAuthorName":"Nolanimations","beatsaverKey":"16abf"},"diffInfo":{"type":"Standard","diff":"hard"},"complexity":7.8,"categoryDisplayName":"Standard Acc"},"score":{"rank":51,"timeSet":"2021-09-20T20:12:13.000Z","ap":635.6093021412603,"unmodifiedScore":530407,"score":530407,"mods":null,"acc":98.0283694,"percentage":98.0283694,"weightedAp":126.32235720579465},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-372534","playerId":"2092178757563532","leaderboardId":372534,"timeSet":"2021-09-11T20:15:48.000Z","ap":632.4007495436753,"acc":98.0053029,"leaderboard":{"leaderboardId":372534,"song":{"hash":"2dc048e407309b8d7813bf294b2f5657f27e4831","name":"Trapped in the Past","subName":"","authorName":"TUYU","levelAuthorName":"muffn","beatsaverKey":"17707"},"diffInfo":{"type":"Standard","diff":"hard"},"complexity":7.9,"categoryDisplayName":"Standard Acc"},"score":{"rank":46,"timeSet":"2021-09-11T20:15:48.000Z","ap":632.4007495436753,"unmodifiedScore":859384,"score":859384,"mods":null,"acc":98.0053029,"percentage":98.0053029,"weightedAp":90.01495763269082},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"},{"id":"2092178757563532-360878","playerId":"2092178757563532","leaderboardId":360878,"timeSet":"2021-09-18T01:55:22.000Z","ap":627.8953893996293,"acc":97.7768191,"leaderboard":{"leaderboardId":360878,"song":{"hash":"f0c9f2f4e3b85d2dc755576047489ea67e510803","name":"Unclear","subName":"","authorName":"M2U","levelAuthorName":"Timbo","beatsaverKey":"18e9e"},"diffInfo":{"type":"Standard","diff":"expertPlus"},"complexity":10,"categoryDisplayName":"Tech Acc"},"score":{"rank":53,"timeSet":"2021-09-18T01:55:22.000Z","ap":627.8953893996293,"unmodifiedScore":645987,"score":645987,"mods":null,"acc":97.7768191,"percentage":97.7768191,"weightedAp":169.92558976217333},"fetchedAt":"2021-09-23T08:50:56.758Z","lastUpdated":"2021-09-23T08:50:56.758Z"}]
          .map(s => {
            const timeSet = dateFromString(s.timeSet);
            const score = {...s.score, timeSet}
            return {...s, timeSet, score}
          })
    }
    catch (err) {
      return {total: 0, scores: []};
    }

    if (!playerScores || !playerScores.length) return {total: 0, scores: []};

    const startIdx = (page - 1) * PLAYER_SCORES_PER_PAGE;
    if (playerScores.length < startIdx + 1) return {total: 0, scores: []};

    return {
      total: playerScores.length,
      scores: playerScores
        .slice(startIdx, startIdx + PLAYER_SCORES_PER_PAGE)
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