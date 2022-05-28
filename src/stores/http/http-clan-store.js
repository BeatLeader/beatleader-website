import createHttpStore from './http-store';
import createClanProvider from './providers/api-clan'
import stringify from 'json-stable-stringify'

export default (clanId, page = 1, filters = {}, initialState = null, initialStateType = 'initial') => {
  let currentClanId = clanId ? clanId : null;
  let currentPage = page ? page : 1;
  let currentFilters = filters ?? {};

  const onNewData = ({fetchParams, state, set}) => {
    currentClanId = fetchParams?.clanId ?? null;
    currentPage = fetchParams?.page ?? 1;
    currentFilters = fetchParams?.filters ?? {};
  }

  const provider = createClanProvider();

  const httpStore = createHttpStore(
    provider,
    {clanId, page},
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
      onSetPending: ({fetchParams}) => ({...fetchParams}),
    },
    initialStateType
  );

  const fetch = async (clanId = currentClanId, page = currentPage, filters = currentFilters, force = false) => {
    if (clanId && clanId === currentClanId && (!page || page === currentPage) && (!filters || stringify(filters) === stringify(currentFilters)) && !force) return false;

    return httpStore.fetch({clanId, page, filters}, force, provider);
  }

  const refresh = async () => fetch(currentClanId, currentPage, currentFilters, true);

  return {
    ...httpStore,
    fetch,
    refresh,
    getClanId: () => currentClanId,
    getPage: () => currentPage,
    getFilters: () => currentFilters
  }
}
