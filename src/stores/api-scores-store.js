import createApiStore from './api-store';

export default (scoresProvider, playerId = null, page = 1, initialState = null) => {
  let currentPlayerId = playerId;
  let currentPage = page ?? 1;

  const onNewData = ({params}) => {
    console.warn('new data available')

    currentPage = params?.page ?? 1;
    currentPlayerId = params?.playerId ?? null;
  }

  const apiStore = createApiStore(
    scoresProvider,
    {playerId, page},
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
    },
  );

  const fetch = async (page, playerId = currentPlayerId, force = false) => {
    if (page === currentPage && playerId === currentPlayerId && !force) return;

    console.log(`apiScoresStore::fetch() ${playerId} / ${page}`)

    await apiStore.fetch({playerId, page}, force);

    return true;
  }

  return {
    ...apiStore,
    fetch,
    getPlayerId: () => currentPlayerId,
    getPage: () => currentPage,
  }
}

