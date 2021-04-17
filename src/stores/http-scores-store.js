import createHttpStore from './http-store';
import apiRecentScoresProvider from './providers/scores/api-recent'
import apiTopScoresProvider from './providers/scores/api-top'

const getProviderByType = type => type === 'top' ? apiTopScoresProvider : apiRecentScoresProvider;

export default (playerId = null, type = 'recent', page = 1, initialState = null, timeout = 10000) => {
  let currentPlayerId = playerId;
  let currentPage = page ?? 1;
  let currentProvider = getProviderByType(type);

  let pendingProvider = null;

  const onNewData = ({fetchParams}) => {
    currentPage = fetchParams?.page ?? 1;
    currentPlayerId = fetchParams?.playerId ?? null;

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
      onSetPending: ({fetchParams}) => ({...fetchParams, type: pendingProvider?.type ?? currentProvider.type}),
      timeout
    },
  );

  const fetch = async (page, type = currentProvider.type, playerId = currentPlayerId, force = false) => {
    if (page === currentPage && playerId === currentPlayerId && type === currentProvider?.type && !force) return false;

    pendingProvider = getProviderByType(type);

    const shouldForce = force || pendingProvider?.type !== currentProvider?.type;

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

