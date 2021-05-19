import createHttpStore from './http-store';
import apiRecentScoresProvider from './providers/scores/api-recent'
import apiTopScoresProvider from './providers/scores/api-top'
import {opt} from '../utils/js'

const getProviderByType = type => type === 'top' ? apiTopScoresProvider : apiRecentScoresProvider;

export default (playerId = null, type = 'recent', page = 1, initialState = null) => {
  let currentPlayerId = playerId;
  let currentPage = page ? page : 1;
  let currentProvider = getProviderByType(type);

  let pendingProvider = null;

  const onNewData = ({fetchParams}) => {
    currentPage = opt(fetchParams, 'page', 1);
    currentPlayerId = opt(fetchParams, 'playerId', null);

    if (pendingProvider) {
      currentProvider = pendingProvider;
      pendingProvider = null;
    }
  }

  const httpStore = createHttpStore(
    currentProvider,
    {playerId, page},
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
      onSetPending: ({fetchParams}) => ({...fetchParams, type: opt(pendingProvider, 'type', currentProvider.type)}),
    },
  );

  const fetch = async (page, type = currentProvider.type, playerId = currentPlayerId, force = false) => {
    if (page === currentPage && playerId === currentPlayerId && type === opt(currentProvider, 'type') && !force) return false;

    pendingProvider = getProviderByType(type);

    const shouldForce = force || opt(pendingProvider, 'type') !== opt(currentProvider, 'type');

    return httpStore.fetch({playerId, page}, shouldForce, pendingProvider);
  }

  return {
    ...httpStore,
    fetch,
    getPlayerId: () => currentPlayerId,
    getPage: () => currentPage,
    getType: () => currentProvider.type,
  }
}

