import createHttpStore from './http-store';
import apiPlayerProvider from './providers/player/api-info'
import {opt} from '../utils/js'

export default (playerId = null, initialState = null) => {
  let currentPlayerId = playerId;

  const onNewData = ({fetchParams}) => {
    currentPlayerId = opt(fetchParams, 'playerId', null);
  }

  const httpStore = createHttpStore(
    apiPlayerProvider,
    playerId ? {playerId} : null,
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
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

