import createHttpStore from './http-store';
import beatSaverEnhancer from './enhancers/leaderboard/beatsaver'
import {opt} from '../../utils/js'
import createLeaderboardPageProvider from './providers/page-leaderboard'
import {writable} from 'svelte/store'
import {findDiffInfoWithDiffAndType} from '../../utils/scoresaber/song'

export default (leaderboardId, type = 'global', page = 1, initialState = null, initialStateType = 'initial') => {
  let currentLeaderboardId = leaderboardId ? leaderboardId : null;
  let currentType = type ? type : 'global';
  let currentPage = page ? page : 1;

  const {subscribe: subscribeEnhanced, set: setEnhanced} = writable(null);

  const onNewData = ({fetchParams, state}) => {
    currentLeaderboardId = opt(fetchParams, 'leaderboardId', null);
    currentType = opt(fetchParams, 'type', 'global');
    currentPage = opt(fetchParams, 'page', 1);

    if (!state) return;

    (async(leaderboardId, type, page) => {
      beatSaverEnhancer(state)
        .then(_ => {
          if (leaderboardId === currentLeaderboardId && type === currentType && page === currentPage) {
            if (!state.leaderboard) return null;

            const bsStats = findDiffInfoWithDiffAndType(opt(state.leaderboard.beatSaver, 'metadata.characteristics'), state.leaderboard.diffInfo);
            if (!bsStats) return null;

            if (bsStats.notes && bsStats.length) bsStats.nps = bsStats.notes / bsStats.length;

            state.leaderboard.stats = {...bsStats};

            setEnhanced({leaderboardId, type, page, enhancedAt: new Date()})
          }
        })
    })(currentLeaderboardId, currentType, currentPage)
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
    enhanced: {subscribe: subscribeEnhanced},
  }
}

