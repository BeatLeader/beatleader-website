import createHttpStore from './http-store';
import createLeaderboardPageProvider from './providers/api-leaderboard'
import stringify from 'json-stable-stringify'

export default (leaderboardId, type = 'global', page = 1, filters = {}, initialState = null, initialStateType = 'initial') => {
  let currentLeaderboardId = leaderboardId ? leaderboardId : null;
  let currentType = type ? type : 'global';
  let currentPage = page ? page : 1;
  let currentFilters = filters ?? {};

  const onNewData = ({fetchParams, state, set}) => {
    currentLeaderboardId = fetchParams?.leaderboardId ?? null;
    currentType = fetchParams?.type ?? 'global';
    currentPage = fetchParams?.page ?? 1;
    currentFilters = fetchParams?.filters ?? {};
  }

  const provider = createLeaderboardPageProvider();

  const httpStore = createHttpStore(
    provider,
    {leaderboardId, type, page, filters},
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
      onSetPending: ({fetchParams}) => ({...fetchParams}),
    },
    initialStateType
  );

  const fetch = async (leaderboardId = currentLeaderboardId, type = currentType, page = currentPage, filters = currentFilters, force = false) => {
    if (!leaderboardId) return false;

    if (leaderboardId === currentLeaderboardId && (!type || type === currentType) && (!page || page === currentPage) && (!filters || stringify(filters) === stringify(currentFilters)) && !force) return false;

    return httpStore.fetch({leaderboardId, type, page, filters}, force, provider);
  }

  const refresh = async () => fetch(currentLeaderboardId, currentType, currentPage, true);

  return {
    ...httpStore,
    fetch,
    refresh,
    getLeaderboardId: () => currentLeaderboardId,
    getType: () => currentType,
    getPage: () => currentPage,
    getFilters: () => currentFilters,
  }
}
