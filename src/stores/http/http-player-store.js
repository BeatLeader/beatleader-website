import createHttpStore from './http-store';
import playerApiClient from '../../network/clients/beatleader/player/api'

export default (playerId = null, initialState = null, initialStateType = 'initial') => {
  let currentPlayerId = playerId;

  const onNewData = ({fetchParams}) => {
    currentPlayerId = fetchParams?.playerId ?? null;
  }

  const httpStore = createHttpStore(
    playerApiClient,
    playerId ? {playerId} : null,
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
    },
    initialStateType,
  );

  const fetch = async (playerId = currentPlayerId, force = false) => {
    if (!playerId || (playerId === currentPlayerId && !force)) return false;

    return httpStore.fetch({playerId}, force, playerApiClient);
  }

  return {
    ...httpStore,
    fetch,
    getPlayerId: () => currentPlayerId,
  }
}

