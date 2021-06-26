import createHttpStore from './http-store';
import createApiPlayerWithScoresProvider from './providers/api-player-with-scores'
import {opt} from '../../utils/js'

export default (playerId = null, scoresType = 'recent', scoresPage = 1, initialState = null) => {
  let currentPlayerId = playerId;
  let currentScoresType = scoresType;
  let currentScoresPage = scoresPage;

  const onNewData = ({fetchParams}) => {
    currentPlayerId = opt(fetchParams, 'playerId', null);
    currentScoresType = opt(fetchParams, 'scoresType', null);
    currentScoresPage = opt(fetchParams, 'scoresPage', null);
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
  );

  const fetch = async (playerId = currentPlayerId, scoresType = currentScoresType, scoresPage = currentScoresPage, force = false) => {
    if (
      (!playerId || playerId === currentPlayerId) &&
      (!scoresType || scoresType === currentScoresType) &&
      (!scoresPage || scoresPage === currentScoresPage) &&
      !force
    )
      return false;

    return httpStore.fetch({playerId, scoresType, scoresPage}, force, provider);
  }

  const refresh = async () => fetch(currentPlayerId, currentScoresType, currentScoresPage, true);

  return {
    ...httpStore,
    fetch,
    refresh,
    getPlayerId: () => currentPlayerId,
    getType: () => currentScoresType,
    setType: type => currentScoresType = type,
    getPage: () => currentScoresPage,
    setPage: page => currentScoresPage = page,
  }
}

