import createHttpStore from './http-store';
import {opt} from '../../utils/js'
import createApiRankingProvider from './providers/api-ranking-global'

export default (page = 1, initialState = null, initialStateType = 'initial') => {
  let currentPage = page ? page : 1;

  const onNewData = ({fetchParams}) => {
    currentPage = opt(fetchParams, 'page', 1);
  }

  const provider = createApiRankingProvider();

  const httpStore = createHttpStore(
    provider,
    {page},
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
      onSetPending: ({fetchParams}) => ({...fetchParams}),
    },
    initialStateType
  );

  const fetch = async (page = currentPage, force = false) => {
    if ((!page || page === currentPage) && !force) return false;

    return httpStore.fetch({page}, force, provider);
  }

  const refresh = async () => fetch(currentPage, true);

  return {
    ...httpStore,
    fetch,
    refresh,
    getPage: () => currentPage,
  }
}

