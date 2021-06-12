import eventBus from '../../utils/broadcast-channel-pubsub'
import createConfigStore from '../../stores/config'
import apiPlayerProvider from '../../network/scoresaber/player/api-info'
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

  const addPlayer = async playerId => {
    log.trace(`Starting to add a player "${playerId}"...`, 'PlayerService');

    const player = await refresh(playerId, true);
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

  const getProfileFreshnessDate = player => {
    const lastUpdated = player && player.profileLastUpdated ? player.profileLastUpdated : null;
    if (!lastUpdated) return addToDate(-SECOND);

    const REFRESH_INTERVAL = isPlayerMain(player.playerId) ? MAIN_PLAYER_REFRESH_INTERVAL : PLAYER_REFRESH_INTERVAL;

    return addToDate(REFRESH_INTERVAL, lastUpdated);
  }

  const refresh = async (playerId, force = false, throwErrors = false) => {
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

      const fetchedPlayer = await apiPlayerProvider.getProcessed({playerId});

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

  const refreshAll = async (force = false, throwErrors = false) => {
    log.trace(`Starting refreshing all active players${force ? ' (forced)' : ''}...`, 'PlayerService');

    const allActivePlayers = await getAllActive();
    if (!allActivePlayers.length) {
      log.trace(`No active players, skipping.`, 'PlayerService');
      return null;
    }

    const allActiveRefreshed = await Promise.all(allActivePlayers.map(player => refresh(player.playerId, force, throwErrors)));

    log.trace(`Active players refreshed.`, 'PlayerService', allActiveRefreshed);

    return allActiveRefreshed;
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
    refresh,
    refreshAll,
    destroyService,
  }

  return service;
}