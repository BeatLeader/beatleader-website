import createApiStore from './api-store';
import recentScoresProvider from './providers/recent-scores-api-provider'
import topScoresProvider from './providers/top-scores-api-provider'

class TimeoutError extends Error {
  constructor(timeout, message) {
    super(message);

    this.name = "TimeoutError";
    this.timeout = timeout;
  }

  toString() {
    return `Time out Error (${this.timeout}ms)`
  }
}

const getProviderByType = type => type === 'top' ? topScoresProvider : recentScoresProvider;

export default (playerId = null, type = 'recent', page = 1, initialState = null, timeout = 10000) => {
  let currentPlayerId = playerId;
  let currentPage = page ?? 1;
  let currentProvider = getProviderByType(type);

  let pendingProvider = null;

  const onNewData = ({fetchParams}) => {
    console.warn('new data available')

    currentPage = fetchParams?.page ?? 1;
    currentPlayerId = fetchParams?.playerId ?? null;

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
      onSetPending: ({fetchParams}) => ({...fetchParams, type: pendingProvider?.type ?? currentProvider.type}),
      onError: err => {
        if (err?.name === 'AbortError' || err?.message === 'AbortError') {
          return new TimeoutError(timeout, `Timeout`)
        }

        return err;
      },
      timeout
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

