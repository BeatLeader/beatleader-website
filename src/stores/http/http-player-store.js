import createHttpStore from './http-store';
import playerApiClient from '../../network/scoresaber/player/api'
import {opt} from '../../utils/js'

export default (playerId = null, initialState = null, initialStateType = 'initial') => {
  let currentPlayerId = playerId;

  const onNewData = ({fetchParams}) => {
    currentPlayerId = opt(fetchParams, 'playerId', null);
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

