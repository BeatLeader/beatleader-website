import createHttpStore from './http-store';
import {opt} from '../../utils/js'
import createLeaderboardPageProvider from './providers/page-leaderboard'

export default (leaderboardId, type = 'global', page = 1, initialState = null, initialStateType = 'initial') => {
  let currentLeaderboardId = leaderboardId ? leaderboardId : null;
  let currentType = type ? type : 'global';
  let currentPage = page ? page : 1;

  const onNewData = ({fetchParams}) => {
    currentLeaderboardId = opt(fetchParams, 'leaderboardId', null);
    currentType = opt(fetchParams, 'type', 'global');
    currentPage = opt(fetchParams, 'page', 1);
  }

  const provider = createLeaderboardPageProvider();

  const httpStore = createHttpStore(
    provider,
    {leaderboardId, type, page},
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
      onSetPending: ({fetchParams}) => ({...fetchParams}),
    },
    initialStateType
  );

  const fetch = async (leaderboardId = currentLeaderboardId, type = currentType, page = currentPage, force = false) => {
    if (!leaderboardId) return false;

    if (leaderboardId === currentLeaderboardId && (!type || type === currentType) && (!page || page === currentPage) && !force) return false;

    return httpStore.fetch({leaderboardId, type, page}, force, provider);
  }

  const refresh = async () => fetch(currentLeaderboardId, currentType, currentPage, true);

  return {
    ...httpStore,
    fetch,
    refresh,
    getLeaderboardId: () => currentLeaderboardId,
    getType: () => currentType,
    getPage: () => currentPage,
  }
}

