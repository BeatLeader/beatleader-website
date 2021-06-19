import eventBus from '../../utils/broadcast-channel-pubsub'
import createConfigStore from '../../stores/config'
import apiPlayerProvider from '../../network/scoresaber/player/api-info'
import {PRIORITY} from '../../network/http-queue'
import playersRepository from '../../db/repository/players'
import log from '../../utils/logger'
import {addToDate, formatDate, MINUTE, SECOND} from '../../utils/date'
import {opt} from '../../utils/js'

const MAIN_PLAYER_REFRESH_INTERVAL = MINUTE * 3;
const PLAYER_REFRESH_INTERVAL = MINUTE * 30;

let service = null;
let serviceCreationCount = 0;
export default () => {
  serviceCreationCount++;
  if (service) return service;

  let mainPlayerId = null;

  let configStoreUnsubscribe = null;
  createConfigStore().then(configStore => {
    configStoreUnsubscribe = configStore.subscribe(config => {
      const newMainPlayerId = opt(config, 'users.main')
      if (mainPlayerId !== newMainPlayerId) {
        mainPlayerId = newMainPlayerId;

        log.debug(`Main player changed to ${mainPlayerId}`, 'PlayerService')
      }
    })
  })

  const getAll = async () => playersRepository().getAll();

  const getAllActive = async () => {
    const players = await getAll();
    if (!players) return [];

    return players.filter(player => player && player.playerInfo && !player.playerInfo.inactive && !player.playerInfo.banned);
  }

  const getPlayer = async playerId => await playersRepository().get(playerId);

  const addPlayer = async (playerId, priority = PRIORITY.FG_LOW) => {
    log.trace(`Starting to add a player "${playerId}"...`, 'PlayerService');

    const player = await refresh(playerId, true, priority);
    if (!player) {
      log.warn(`Can not add player "${playerId}"`, 'PlayerService');

      return null;
    }

    eventBus.publish('player-profile-added', player);

    log.trace(`Player "${playerId}" added.`, 'PlayerService')

    return player;
  }

  const setPlayer = async (player) => {
    await playersRepository().set(player);

    eventBus.publish('player-profile-changed', player);

    return player;
  }

  const updatePlayer = async (player) => {
    if (!player || !player.playerId) {
      log.warn(`Can not update player, empty playerId`, 'PlayerService', player)
    }

    const dbPlayer = await getPlayer(player.playerId);

    return await setPlayer({...dbPlayer, ...player});
  }

  const isPlayerMain = playerId => playerId === mainPlayerId;

  const getProfileFreshnessDate = (player, refreshInterval = null) => {
    const lastUpdated = player && player.profileLastUpdated ? player.profileLastUpdated : null;
    if (!lastUpdated) return addToDate(-SECOND);

    const REFRESH_INTERVAL = refreshInterval ? refreshInterval : (isPlayerMain(player.playerId) ? MAIN_PLAYER_REFRESH_INTERVAL : PLAYER_REFRESH_INTERVAL);

    return addToDate(REFRESH_INTERVAL, lastUpdated);
  }

  const isProfileFresh = (player, refreshInterval = null) => getProfileFreshnessDate(player, refreshInterval) > new Date();

  const fetchPlayer = async (playerId, priority = PRIORITY.FG_LOW, signal = null) => apiPlayerProvider.getProcessed({playerId, priority, signal});

  const fetchPlayerOrGetFromCache = async (playerId, refreshInterval = null, priority = PRIORITY.FG_LOW, signal = null) => {
    const player = await getPlayer(playerId);

    if (!player || !isProfileFresh(player, refreshInterval)) {
      const fetchedPlayer = await fetchPlayer(playerId, priority, signal);

      if (player) return updatePlayer({...fetchedPlayer, profileLastUpdated: new Date()});

      return fetchedPlayer;
    }

    return player;
  }

  const refresh = async (playerId, force = false, priority = PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.trace(`Starting refreshing player "${playerId}" ${force ? ' (forced)' : ''}...`, 'PlayerService')

    if (!playerId) {
      log.warn(`Can not refresh player if an empty playerId is given`, 'PlayerService');

      return null;
    }

    try {
      let player = await getPlayer(playerId);
      if (!player && !force) {
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

      log.trace(`Fetching player ${playerId} from ScoreSaber...`, 'PlayerService')

      const fetchedPlayer = await fetchPlayer(playerId, priority);

      if (!fetchedPlayer || !fetchedPlayer.playerId || !fetchedPlayer.name || !fetchedPlayer.playerInfo || !fetchedPlayer.scoreStats) {
        log.warn(`ScoreSaber returned empty info for player ${playerId}`, 'PlayerService')

        return null;
      }

      log.trace(`Player fetched`, 'PlayerService', fetchedPlayer);

      player = await updatePlayer({...fetchedPlayer, profileLastUpdated: new Date()});

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

  const destroyService = () => {
    serviceCreationCount--;
    if (serviceCreationCount === 0 && configStoreUnsubscribe) configStoreUnsubscribe();
  }

  service = {
    getAll,
    getAllActive,
    get: getPlayer,
    add: addPlayer,
    update: updatePlayer,
    getProfileFreshnessDate,
    isProfileFresh,
    fetchPlayer,
    fetchPlayerOrGetFromCache,
    refresh,
    refreshAll,
    destroyService,
  }

  return service;
}