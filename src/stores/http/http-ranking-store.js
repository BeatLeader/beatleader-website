import createHttpStore from './http-store';
import {opt} from '../../utils/js'
import createApiRankingProvider from './providers/api-ranking'

export default (type = 'global', page = 1, initialState = null, initialStateType = 'initial') => {
  let currentType = type ? type : 'global';
  let currentPage = page ? page : 1;

  const onNewData = ({fetchParams}) => {
    currentType = opt(fetchParams, 'type', 'global');
    currentPage = opt(fetchParams, 'page', 1);
  }

  const provider = createApiRankingProvider();

  const httpStore = createHttpStore(
    provider,
    {type, page},
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
      onSetPending: ({fetchParams}) => ({...fetchParams}),
    },
    initialStateType
  );

  const fetch = async (type = currentType, page = currentPage, force = false) => {
    if ((!type || type === currentType) && (!page || page === currentPage) && !force) return false;

    return httpStore.fetch({type, page}, force, provider);
  }

  const refresh = async () => fetch(currentType, currentPage, true);

  return {
    ...httpStore,
    fetch,
    refresh,
    getType: () => currentType,
    getPage: () => currentPage,
  }
}

