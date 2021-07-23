import createHttpStore from './http-store';
import beatSaverEnhancer from './enhancers/leaderboard/beatsaver'
import accEnhancer from './enhancers/scores/acc'
import {opt} from '../../utils/js'
import createLeaderboardPageProvider from './providers/page-leaderboard'
import {writable} from 'svelte/store'
import {findDiffInfoWithDiffAndType} from '../../utils/scoresaber/song'
import {debounce} from '../../utils/debounce'

export default (leaderboardId, type = 'global', page = 1, initialState = null, initialStateType = 'initial') => {
  let currentLeaderboardId = leaderboardId ? leaderboardId : null;
  let currentType = type ? type : 'global';
  let currentPage = page ? page : 1;

  const {subscribe: subscribeEnhanced, set: setEnhanced} = writable(null);

  const onNewData = ({fetchParams, state, set}) => {
    currentLeaderboardId = opt(fetchParams, 'leaderboardId', null);
    currentType = opt(fetchParams, 'type', 'global');
    currentPage = opt(fetchParams, 'page', 1);

    if (!state) return;

    const getCurrentEnhanceTaskId = () => `${currentLeaderboardId}/${currentPage}/${currentType}`;

    const debouncedSetState = debounce((enhanceTaskId, state) => {
      if (enhanceTaskId !== getCurrentEnhanceTaskId()) return;

      set(state);
    }, 100);

    const enhanceTaskId = getCurrentEnhanceTaskId();
    const newState = {...state, scores: [...state.scores]};

    const setStateRow = (scoreRow, idx, fields = ['player', 'score']) => {
      if (enhanceTaskId !== getCurrentEnhanceTaskId() || !newState || !newState[idx] || !scoreRow) return null;

      fields = !Array.isArray(fields) ? [fields] : fields;

      fields.map(field => {
        const stateValue = opt(newState[idx], field, {});
        const rowValue = opt(scoreRow, field, {});

        newState[idx][field] = {...stateValue, ...rowValue};
      })

      debouncedSetState(enhanceTaskId, newState);
      return newState[idx];

    }

    if (newState.leaderboard)
      beatSaverEnhancer(newState)
        .then(_ => {
          const bsStats = findDiffInfoWithDiffAndType(opt(newState.leaderboard.beatSaver, 'metadata.characteristics'), newState.leaderboard.diffInfo);
          if (!bsStats) return null;

          if (bsStats.notes && bsStats.length) bsStats.nps = bsStats.notes / bsStats.length;

          newState.leaderboard.stats = {...newState.leaderboard.stats, ...bsStats};

          setEnhanced({leaderboardId, type, page, enhancedAt: new Date()})
          debouncedSetState(enhanceTaskId, newState);

          return newState.leaderboard.beatSaver;
        })
        .then(bsData => {
          if (!bsData || !newState.scores || !newState.scores.length) return;

          for (const [idx, scoreRow] of newState.scores.entries()) {
            accEnhancer({...scoreRow, leaderboard: newState.leaderboard})
              .then(enhancedScoreRow => setStateRow(enhancedScoreRow, idx))
          }
        })
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

