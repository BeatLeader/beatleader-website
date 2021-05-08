import createHttpStore from './http-store';
import apiPlayerWithScoresProvider from './providers/player/api-info-with-scores'
import {opt} from '../utils/js'

export default (playerId = null, scoresType = 'recent', initialState = null, timeout = 10000) => {
  let currentPlayerId = playerId;
  let currentScoresType = scoresType;

  const onNewData = ({fetchParams}) => {
    currentPlayerId = opt(fetchParams, 'playerId', null);
    currentScoresType = opt(fetchParams, 'scoresType', null);
  }

  const httpStore = createHttpStore(
    apiPlayerWithScoresProvider,
    playerId ? {playerId, scoresType} : null,
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
      timeout
    },
  );

  const fetch = async (playerId = currentPlayerId, scoresType = currentScoresType, force = false) => {
    if ((!playerId || playerId === currentPlayerId) && (!scoresType || scoresType === currentScoresType) && !force) return false;

    return httpStore.fetch({playerId, scoresType}, force, apiPlayerWithScoresProvider);
  }

  return {
    ...httpStore,
    fetch,
    getPlayerId: () => currentPlayerId,
    getType: () => currentScoresType,
    setType: type => currentScoresType = type,
  }
}

