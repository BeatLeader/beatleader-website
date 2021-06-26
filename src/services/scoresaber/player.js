import eventBus from '../../utils/broadcast-channel-pubsub'
import createConfigStore from '../../stores/config'
import playerApiClient from '../../network/scoresaber/player/api'
import playerPageClient from '../../network/scoresaber/player/page'
import {PRIORITY} from '../../network/http-queue'
import playersRepository from '../../db/repository/players'
import log from '../../utils/logger'
import {addToDate, formatDate, MINUTE, SECOND} from '../../utils/date'
import {opt} from '../../utils/js'
import {db} from '../../db/db'
import createFetchCache from '../../db/cache'

const MAIN_PLAYER_REFRESH_INTERVAL = MINUTE * 3;
const PLAYER_REFRESH_INTERVAL = MINUTE * 20;

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

  const fetchCache = createFetchCache('playerServiceBrowserCache', player => opt(player, 'playerInfo.playerId'));

  const getAll = async () => playersRepository().getAll();

  const getAllActive = async () => {
    const players = await getAll();
    if (!players) return [];

    return players.filter(player => player && player.playerInfo && !player.playerInfo.inactive && !player.playerInfo.banned);
  }

  const getPlayer = async playerId => await playersRepository().get(playerId);

  const addPlayer = async (playerId, priority = PRIORITY.FG_LOW) => {
    log.trace(`Starting to add a player "${playerId}"...`, 'PlayerService');

    const player = await refresh(playerId, true, priority, false, true);
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

  const updatePlayer = async (player, waitForSaving = true) => {
    if (!player || !player.playerId) {
      log.warn(`Can not update player, empty playerId`, 'PlayerService', player)
    }

    const dbPlayer = await getPlayer(player.playerId);
    if (!dbPlayer) return player;

    const finalPlayer = {...dbPlayer, ...player}

    if (!waitForSaving) {
      setPlayer(finalPlayer).then(_ => _)

      return finalPlayer;
    }

    return await setPlayer(finalPlayer);
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
      fetchCache.set(playerId, {...player})
      eventBus.publish('player-profile-changed', player);
    } else {
      // update browser cache
      const tempCachedPlayer = await fetchCache.get(playerId, () => Promise.resolve(null));
      if (tempCachedPlayer) {
        tempCachedPlayer.recentPlay = recentPlay;
        tempCachedPlayer.recentPlayLastUpdated = recentPlayLastUpdated;
        fetchCache.set(playerId, tempCachedPlayer)
      }
    }
  }

  const fetchPlayerAndUpdateRecentPlay = async playerId => {
    try {
      const player = await playerPageClient.getProcessed({playerId});
      const recentPlay = opt(player, 'playerInfo.recentPlay');
      const recentPlayLastUpdated = opt(player, 'playerInfo.recentPlayLastUpdated');
      if (!recentPlay || !recentPlayLastUpdated) return null;

      return updatePlayerRecentPlay(playerId, recentPlay, recentPlayLastUpdated);
    } catch (err) {
      // swallow error
    }
  }

  const fetchPlayer = async (playerId, priority = PRIORITY.FG_LOW, signal = null) => playerApiClient.getProcessed({playerId, priority, signal});

  const fetchPlayerOrGetFromCache = async (playerId, refreshInterval = MINUTE, priority = PRIORITY.FG_LOW, signal = null) => {
    const player = await getPlayer(playerId);

    if (!player) {
      // return player from browser cache if possible
      const tempCachedPlayer = await fetchCache.get(playerId, () => Promise.resolve(null));
      if (tempCachedPlayer && isProfileFresh(tempCachedPlayer, refreshInterval))
        return tempCachedPlayer;
    }

    if (!player || !isProfileFresh(player, refreshInterval)) {
      const fetchedPlayer = await fetchPlayer(playerId, priority, signal);

      return updatePlayer({...player, ...fetchedPlayer, profileLastUpdated: new Date()}, false)
        .then(player => {
          fetchCache.set(player.playerId, {...player});

          fetchPlayerAndUpdateRecentPlay(player.playerId);

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
    fetchPlayerAndUpdateRecentPlay,
    updatePlayerRecentPlay,
    refresh,
    refreshAll,
    destroyService,
  }

  return service;
}