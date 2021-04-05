import createApiStore from './api-store';
import recentScoresProvider from './providers/recent-scores-api-provider'
import topScoresProvider from './providers/top-scores-api-provider'

const getProviderByType = type => type === 'top' ? topScoresProvider : recentScoresProvider;

export default (playerId = null, type = 'recent', page = 1, initialState = null) => {
  let currentPlayerId = playerId;
  let currentPage = page ?? 1;
  let currentProvider = getProviderByType(type);

  let pendingProvider = null;

  const onNewData = ({params}) => {
    console.warn('new data available')

    currentPage = params?.page ?? 1;
    currentPlayerId = params?.playerId ?? null;

    if (pendingProvider) {
      currentProvider = pendingProvider;
      pendingProvider = null;
    }
  }

  const apiStore = createApiStore(
    currentProvider,
    {playerId, page},
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
      onSetPending: params => ({...params, type: pendingProvider?.type ?? currentProvider.type}),
    },
  );

  const fetch = async (page, type = currentProvider.type, playerId = currentPlayerId, force = false) => {
    if (page === currentPage && playerId === currentPlayerId && type === currentProvider?.type && !force) return;

    console.log(`apiScoresStore::fetch() ${playerId} / ${page}`)

    pendingProvider = getProviderByType(type);

    const shouldForce = force || pendingProvider?.type !== currentProvider?.type;

    await apiStore.fetch({playerId, page}, shouldForce, pendingProvider);

    return true;
  }

  return {
    ...apiStore,
    fetch,
    getPlayerId: () => currentPlayerId,
    getPage: () => currentPage,
    getType: () => currentProvider.type,
  }
}

