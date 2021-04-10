import createHttpStore from './http-store';
import apiPlayerProvider from './providers/player/api-info'

export default (playerId = null, initialState = null, timeout = 10000) => {
  let currentPlayerId = playerId;

  const onNewData = ({fetchParams}) => {
    currentPlayerId = fetchParams?.playerId ?? null;
  }

  const httpStore = createHttpStore(
    apiPlayerProvider,
    playerId ? {playerId} : null,
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
      timeout
    },
  );

  const fetch = async (playerId = currentPlayerId, force = false) => {
    if (!playerId || (playerId === currentPlayerId && !force)) return false;

    return httpStore.fetch({playerId}, force, apiPlayerProvider);
  }

  return {
    ...httpStore,
    fetch,
    getPlayerId: () => currentPlayerId,
  }
}

