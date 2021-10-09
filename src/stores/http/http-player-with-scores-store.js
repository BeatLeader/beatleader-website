import eventBus from '../../utils/broadcast-channel-pubsub'
import createHttpStore from './http-store';
import createApiPlayerWithScoresProvider from './providers/api-player-with-scores'
import {opt} from '../../utils/js'
import createPlayerService from '../../services/scoresaber/player'
import {addToDate, MINUTE} from '../../utils/date'
import {writable} from 'svelte/store'

export default (playerId = null, scoresType = 'recent', scoresPage = 1, initialState = null, initialStateType = 'initial') => {
  let currentPlayerId = playerId;
  let currentScoresType = scoresType;
  let currentScoresPage = scoresPage;

  const {subscribe: subscribeParams, set: setParams} = writable(null);

  let playerService = createPlayerService();

  let lastRecentPlay = null;
  let playerForLastRecentPlay = null;

  const onNewData = ({fetchParams}) => {
    currentPlayerId = opt(fetchParams, 'playerId', null);
    currentScoresType = opt(fetchParams, 'scoresType', null);
    currentScoresPage = opt(fetchParams, 'scoresPage', null);

    setParams({currentPlayerId, currentScoresType, currentScoresPage})
  }

  const provider = createApiPlayerWithScoresProvider();

  const httpStore = createHttpStore(
    provider,
    playerId ? {playerId, scoresType, scoresPage} : null,
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
    },
    initialStateType
  );

  const fetch = async (playerId = currentPlayerId, scoresType = currentScoresType, scoresPage = currentScoresPage, force = false) => {
    if (
      (!playerId || playerId === currentPlayerId) &&
      (!scoresType || scoresType === currentScoresType) &&
      (!scoresPage || scoresPage === currentScoresPage) &&
      !force
    )
      return false;

    // reset recent play if player has changed
    if (playerId !== playerForLastRecentPlay) {
      lastRecentPlay = null;
      playerForLastRecentPlay = playerId;
    }

    return httpStore.fetch({playerId, scoresType, scoresPage}, force, provider, !playerId || playerId !== currentPlayerId || force);
  }

  const refresh = async () => fetch(currentPlayerId, currentScoresType, currentScoresPage, true);

  const playerRecentPlayUpdatedUnsubscribe = eventBus.on('player-recent-play-updated', async ({playerId, recentPlay}) => {
    if (!playerId || !currentPlayerId || playerId !== currentPlayerId) return;

    if (!recentPlay || !lastRecentPlay || recentPlay <= lastRecentPlay) {
      if (recentPlay) {
        lastRecentPlay = recentPlay;
        playerForLastRecentPlay = playerId;
      }
      return;
    }

    lastRecentPlay = recentPlay;
    playerForLastRecentPlay = playerId;

    await refresh();
  });

  const subscribe = fn => {
    const storeUnsubscribe = httpStore.subscribe(fn);

    return () => {
      storeUnsubscribe();
      playerRecentPlayUpdatedUnsubscribe();
    }
  }

  const DEFAULT_RECENT_PLAY_REFRESH_INTERVAL = MINUTE;

  const enqueueRecentPlayRefresh = async () => {
    if (!currentPlayerId) {
      setTimeout(() => enqueueRecentPlayRefresh(), DEFAULT_RECENT_PLAY_REFRESH_INTERVAL);

      return;
    }

    await playerService.fetchPlayerAndUpdateRecentPlay(currentPlayerId);

    const refreshInterval = !lastRecentPlay || lastRecentPlay >= addToDate(-30 * MINUTE, new Date())
      ? DEFAULT_RECENT_PLAY_REFRESH_INTERVAL
      : 15 * MINUTE;

    setTimeout(() => enqueueRecentPlayRefresh(), refreshInterval);

  }

  setTimeout(() => enqueueRecentPlayRefresh(), DEFAULT_RECENT_PLAY_REFRESH_INTERVAL);

  return {
    ...httpStore,
    subscribe,
    fetch,
    refresh,
    params: {subscribe: subscribeParams},
    getPlayerId: () => currentPlayerId,
    getType: () => currentScoresType,
    setType: type => {
      currentScoresType = type;
      setParams({currentPlayerId, currentScoresType, currentScoresPage})
    },
    getPage: () => currentScoresPage,
    setPage: page => {
      currentScoresPage = page
      setParams({currentPlayerId, currentScoresType, currentScoresPage})
    },
  }
}

