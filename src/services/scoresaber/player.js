import eventBus from '../../utils/broadcast-channel-pubsub'
import createConfigStore from '../../stores/config'
import apiPlayerProvider from '../../network/scoresaber/player/api-info'
import playersRepository from '../../db/repository/players'
import log from '../../utils/logger'
import {addToDate, formatDate, MINUTE} from '../../utils/date'
import {opt} from '../../utils/js'

const MAIN_PLAYER_REFRESH_INTERVAL = MINUTE * 3;
const PLAYER_REFRESH_INTERVAL = MINUTE * 30 ;

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

  const getPlayer = async playerId => {
    const player = await playersRepository().get(playerId);
    
    return player ? player : null;
  }
  const setPlayer = async (player, profileLastUpdated = new Date()) => {
    const playerData = {...player, profileLastUpdated}

    await playersRepository().set(playerData);

    eventBus.publish('player-changed', playerData);

    return playerData;
  }
  const updatePlayer = async (player, profileLastUpdated = new Date()) => {
    if (!player || !player.playerId) {
      log.warn(`Can not update player, empty playerId`, 'PlayerService', player)
    }

    const dbPlayer = await getPlayer(player.playerId);
    return await setPlayer({...dbPlayer, ...player}, profileLastUpdated);
  }
  
  const isPlayerMain = playerId => playerId === mainPlayerId;

  const refresh = async (playerId, forceUpdate = false, throwErrors = false) => {
    log.trace(`Starting player "${playerId}" info refreshing${forceUpdate ? ' (forced)' : ''}...`, 'PlayerService')

    if (!playerId) {
      log.warn(`Can not refresh player if an empty playerId is given`, 'PlayerService');

      return;
    }

    try {
      let player = await getPlayer(playerId);

      log.trace(`Player fetched from DB`, 'PlayerService', player);
      
      if (!forceUpdate) {
        const lastUpdated = player && player.profileLastUpdated ? player.profileLastUpdated : null;
        const REFRESH_INTERVAL = isPlayerMain(playerId) ? MAIN_PLAYER_REFRESH_INTERVAL : PLAYER_REFRESH_INTERVAL;
        if (lastUpdated && lastUpdated > new Date() - REFRESH_INTERVAL) {
          log.debug(`Refresh interval not yet expired, skipping. Next refresh on ${formatDate(addToDate(REFRESH_INTERVAL, lastUpdated))}`, 'PlayerService')

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

      player = await updatePlayer(fetchedPlayer);

      log.debug(`Player refreshing complete.`, 'PlayerService', player);

      return player;
    } catch (e) {
      if (throwErrors) throw e;

      log.debug(`Player refreshing error${e.toString ? `: ${e.toString()}` : ''}`, 'PlayerService', e)

      return null;
    }
  }

  const destroyService = () => {
    serviceCreationCount--;
    if (serviceCreationCount === 0 && configStoreUnsubscribe) configStoreUnsubscribe();
  }

  service = {
    get: getPlayer,
    set: setPlayer,
    update: updatePlayer,
    refresh,
    destroyService
  }

  return service;
}