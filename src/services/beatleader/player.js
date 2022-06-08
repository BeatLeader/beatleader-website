import eventBus from '../../utils/broadcast-channel-pubsub'
import {configStore} from '../../stores/config'
import playerApiClient from '../../network/clients/beatleader/player/api'
import playerFindApiClient from '../../network/clients/beatleader/players/api-player-find'
import playerPageClient from '../../network/clients/beatleader/player/page'
import playerAccGraphApiClient from '../../network/clients/beatleader/accgraph/api'
import {PRIORITY} from '../../network/queues/http-queue'
import playersRepository from '../../db/repository/players'
import playersHistoryRepository from '../../db/repository/players-history'
import log from '../../utils/logger'
import {
  addToDate,
  formatDate,
  MINUTE,
  SECOND,
  toBlMidnight,
  truncateDate,
} from '../../utils/date'
import {opt} from '../../utils/js'
import {db} from '../../db/db'
import makePendingPromisePool from '../../utils/pending-promises'
import {worker} from '../../utils/worker-wrappers'
import {getServicePlayerGain} from '../utils'

const MAIN_PLAYER_REFRESH_INTERVAL = MINUTE * 3;
const PLAYER_REFRESH_INTERVAL = MINUTE * 20;

let service = null;
let serviceCreationCount = 0;
export default () => {
  serviceCreationCount++;
  if (service) return service;

  let mainPlayerId = null;

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const configStoreUnsubscribe = configStore.subscribe(config => {
    const newMainPlayerId = opt(config, 'users.main')
    if (mainPlayerId !== newMainPlayerId) {
      mainPlayerId = newMainPlayerId;

      log.debug(`Main player changed to ${mainPlayerId}`, 'PlayerService')
    }
  })

  const isMainPlayer = playerId => mainPlayerId && playerId === mainPlayerId;

  const getAll = async (force = false) => playersRepository().getAll(force);

  // TODO: just for now
  const getFriends = async () => (await getAll()).filter(player => player && player.playerId && !isPlayerMain(player.playerId)).map(p => p.playerId);

  const getAllActive = async () => {
    const players = await getAll();
    if (!players) return [];

    return players.filter(player => player && player.playerInfo && !player.playerInfo.inactive && !player.playerInfo.banned);
  }

  const getPlayer = async playerId => await playersRepository().get(playerId);

  const removePlayer = async (playerId, purgeScores = false) => {
    await playersRepository().delete(playerId);

    // TODO: purge scores if requested

    eventBus.publish('player-profile-removed', playerId);
  }

  const addPlayer = async (playerId, priority = PRIORITY.FG_LOW) => {
    log.trace(`Starting to add a player "${playerId}"...`, 'PlayerService');

    const player = await refresh(playerId, true, priority, false, true);
    if (!player) {
      log.warn(`Can not add player "${playerId}"`, 'PlayerService');

      return null;
    }

    eventBus.publish('player-profile-added', player);
    eventBus.publish('player-profile-changed', player);

    log.trace(`Player "${playerId}" added.`, 'PlayerService')

    return player;
  }

  const setPlayer = async (player, postEvent=true) => {
    await playersRepository().set(player);

    if (postEvent) {
      eventBus.publish('player-profile-changed', player);
    }

    return player;
  }

  const updatePlayer = async (player, waitForSaving = true, forceAdd = false) => {
    if (!player || !player.playerId) {
      log.warn(`Can not update player, empty playerId`, 'PlayerService', player)
    }

    const dbPlayer = await getPlayer(player.playerId);
    if (!dbPlayer && !forceAdd) return player;

    const finalPlayer = {...dbPlayer, ...player}

    if (!waitForSaving) {
      setPlayer(finalPlayer, false).then(_ => _)

      return finalPlayer;
    }

    return await setPlayer(finalPlayer);
  }

  const getPlayerHistory = async playerId => resolvePromiseOrWaitForPending(`playerHistory/${playerId}`, () => playersHistoryRepository().getAllFromIndex('players-history-playerId', playerId))

  const getPlayerGain = (playerHistory, daysAgo = 1, maxDaysAgo = 7) => getServicePlayerGain(playerHistory, toBlMidnight, 'ssDate', daysAgo, maxDaysAgo);

  const updatePlayerHistory = async player => {
    if (!player) return null;
    const {playerId, profileLastUpdated, playerInfo: {banned, countries, inactive, pp, rank}, scoreStats} = player;

    if (!playerId) return null;

    const updateDate = profileLastUpdated ? profileLastUpdated : new Date();

    const localDate = truncateDate(updateDate);
    const blDate = toBlMidnight(updateDate);

    const playerIdLocalTimestamp = `${playerId}_${localDate.getTime()}`;
    const playerIdSsTimestamp = `${playerId}_${blDate.getTime()}`;

    return playersHistoryRepository().getFromIndex('players-history-playerIdSsTimestamp', playerIdSsTimestamp)
      .then(async ph => {
        if (ph && ph._idbId) {
          await playersHistoryRepository().delete(ph._idbId);

          const {_idbId, ...previous} = ph;

          return previous;
        }

        return null;
      })
      .then(async previous => {
        let accStats = {};

        if (worker) {
          const stats = await worker.calcPlayerStats(playerId);

          const ppBoundary = await worker.calcPpBoundary(playerId) ?? null;

          const {badges, totalScore, playCount, ...playerStats} = stats ?? {};

          accStats = {...playerStats}

          if (ppBoundary) accStats.ppBoundary = ppBoundary;
          if (badges?.length) accStats.accBadges = badges.reduce((cum, b) => ({...cum, [b.label]: b.value}), {});
        }

        return playersHistoryRepository().set({
          ...previous,
          ...accStats,
          playerId, banned, countries, inactive, pp, rank, ...scoreStats,
          localDate, ssDate: blDate,
          playerIdLocalTimestamp,
          playerIdSsTimestamp,
        })
      })
      .catch(err => {}) // swallow error
  }

  const isPlayerMain = playerId => playerId === mainPlayerId;

  const getProfileFreshnessDate = (player, refreshInterval = null) => {
    const lastUpdated = player && player.profileLastUpdated ? player.profileLastUpdated : null;
    if (!lastUpdated) return addToDate(-SECOND);

    const REFRESH_INTERVAL = refreshInterval ? refreshInterval : (isPlayerMain(player.playerId) ? MAIN_PLAYER_REFRESH_INTERVAL : PLAYER_REFRESH_INTERVAL);

    return addToDate(REFRESH_INTERVAL, lastUpdated);
  }

  const isProfileFresh = (player, refreshInterval = null) => getProfileFreshnessDate(player, refreshInterval) > new Date();

  const updatePlayerRecentPlay = async (playerId, recentPlay, recentPlayLastUpdated = new Date()) => {
    let player;

    try {
      await db.runInTransaction(['players'], async tx => {
        const playersStore = tx.objectStore('players')
        player = await playersStore.get(playerId);
        if (player) {
          player.recentPlayLastUpdated = recentPlayLastUpdated;
          player.recentPlay = recentPlay;

          await playersStore.put(player);
        }
      });

      if (player) {
        playersRepository().addToCache([player]);
        eventBus.publish('player-profile-changed', player);

        eventBus.publish('player-recent-play-updated', {playerId, player, recentPlay, recentPlayLastUpdated});
      }
    }
    catch(err) {
      // swallow error
    }
  }

  const fetchPlayerAndUpdateRecentPlay = async playerId => {
    try {
      const player = await resolvePromiseOrWaitForPending(`pageClient/${playerId}`, () =>playerPageClient.getProcessed({playerId}));
      const recentPlay = opt(player, 'playerInfo.recentPlay');
      const recentPlayLastUpdated = opt(player, 'playerInfo.recentPlayLastUpdated');
      if (!recentPlay || !recentPlayLastUpdated) return null;

      return updatePlayerRecentPlay(playerId, recentPlay, recentPlayLastUpdated);
    } catch (err) {
      // swallow error
    }
  }

  const isResponseCached = response => playerApiClient.isResponseCached(response);
  const getDataFromResponse = response => playerApiClient.getDataFromResponse(response);

  const fetchPlayer = async (playerId, priority = PRIORITY.FG_LOW, {fullResponse = false, ...options} = {}) => resolvePromiseOrWaitForPending(`apiClient/${playerId}/${fullResponse}`, () => playerApiClient.getProcessed({...options, playerId, priority, fullResponse}));

  const findPlayer = async (query, priority = PRIORITY.FG_LOW, {fullResponse = false, ...options} = {}) => resolvePromiseOrWaitForPending(`apiClient/find/${query}/${fullResponse}`, () => playerFindApiClient.getProcessed({...options, query, priority, fullResponse}));

  const fetchPlayerOrGetFromCache = async (playerId, refreshInterval = MINUTE, priority = PRIORITY.FG_LOW, signal = null, force = false) => {
    const player = await getPlayer(playerId);

    if (!player || !isProfileFresh(player, refreshInterval) || force) {
      const fetchedPlayerResponse = await fetchPlayer(playerId, priority, {signal, cacheTtl: MINUTE, maxAge: force ? 0 : refreshInterval, fullResponse: true});
      if (isResponseCached(fetchedPlayerResponse)) return getDataFromResponse(fetchedPlayerResponse);

      return updatePlayer({...player, ...getDataFromResponse(fetchedPlayerResponse), profileLastUpdated: new Date()}, false)
        .then(player => {
          fetchPlayerAndUpdateRecentPlay(player.playerId);

          updatePlayerHistory(player);

          return player;
        })
    }

    return player;
  }

  const refresh = async (playerId, force = false, priority = PRIORITY.BG_NORMAL, throwErrors = false, addIfNotExists = false) => {
    log.trace(`Starting refreshing player "${playerId}" ${force ? ' (forced)' : ''}...`, 'PlayerService')

    if (!playerId) {
      log.warn(`Can not refresh player if an empty playerId is given`, 'PlayerService');

      return null;
    }

    try {
      let player = await getPlayer(playerId);
      if (!player && !addIfNotExists) {
        log.debug(`Profile is not added to DB, skipping.`, 'PlayerService')

        return null;
      }

      log.trace(`Player fetched from DB`, 'PlayerService', player);

      if (!force) {
        const profileFreshnessDate = getProfileFreshnessDate(player);
        if (profileFreshnessDate > new Date()) {

          log.debug(`Profile is still fresh, skipping. Next refresh on ${formatDate(profileFreshnessDate)}`, 'PlayerService')

          return player;
        }
      }

      log.trace(`Fetching player ${playerId} from server...`, 'PlayerService')

      const fetchedPlayer = await fetchPlayer(playerId, priority);

      if (!fetchedPlayer || !fetchedPlayer.playerId || !fetchedPlayer.name || !fetchedPlayer.playerInfo || !fetchedPlayer.scoreStats) {
        log.warn(`Server returned empty info for player ${playerId}`, 'PlayerService')

        return null;
      }

      log.trace(`Player fetched`, 'PlayerService', fetchedPlayer);

      player = await updatePlayer({...fetchedPlayer, profileLastUpdated: new Date()}, true, addIfNotExists);

      updatePlayerHistory(player).then(_ => _);

      log.debug(`Player refreshed.`, 'PlayerService', player);

      return player;
    } catch (e) {
      if (throwErrors) throw e;

      log.debug(`Player refreshing error${e.toString ? `: ${e.toString()}` : ''}`, 'PlayerService', e)

      return null;
    }
  }

  const refreshAll = async (force = false, priority = PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.trace(`Starting refreshing all players${force ? ' (forced)' : ''}...`, 'PlayerService');

    const allPlayers = await getAll();
    if (!allPlayers || !allPlayers.length) {
      log.trace(`No players in DB, skipping.`, 'PlayerService');
      return null;
    }

    const allRefreshed = await Promise.all(allPlayers.map(player => refresh(player.playerId, force, priority, throwErrors)));

    log.trace(`All players refreshed.`, 'PlayerService', allRefreshed);

    return allRefreshed;
  }

  const fetchAccGraph = async (playerId, priority = PRIORITY.BG_NORMAL, throwErrors = false) => {
    try {
      log.trace(`Starting fetching player "${playerId}" acc graph...`, 'PlayerService')

      if (!playerId) {
        log.warn(`Can not fetch player acc graph if an empty playerId is given`, 'PlayerService');

        return null;
      }

      const accGraph = resolvePromiseOrWaitForPending(`apiClient/accgraph/${playerId}`, () => playerAccGraphApiClient.getProcessed({playerId, priority}));

      log.debug(`Player acc graph fetched.`, 'PlayerService', accGraph);

      return accGraph;
    }
    catch(e) {
      if (throwErrors) throw e;

      log.debug(`Fetching player acc graph error${e.toString ? `: ${e.toString()}` : ''}`, 'PlayerService', e)

      return null;
    }
  }

  const destroyService = () => {
    serviceCreationCount--;

    if (serviceCreationCount === 0) {
      if (configStoreUnsubscribe) configStoreUnsubscribe();

      service = null;
    }
  }

  service = {
    isMainPlayer,
    getAll,
    getAllActive,
    getFriends,
    get: getPlayer,
    add: addPlayer,
    remove: removePlayer,
    update: updatePlayer,
    getPlayerHistory,
    getPlayerGain,
    getProfileFreshnessDate,
    isProfileFresh,
    fetchPlayer,
    fetchPlayerOrGetFromCache,
    fetchPlayerAndUpdateRecentPlay,
    updatePlayerRecentPlay,
    findPlayer,
    fetchAccGraph,
    refresh,
    refreshAll,
    destroyService,
    isResponseCached,
    getDataFromResponse,
  }

  return service;
}