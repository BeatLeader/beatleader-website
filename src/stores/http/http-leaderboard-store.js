import createHttpStore from './http-store';
import beatMapsEnhancer from './enhancers/common/beatmaps'
import accEnhancer from './enhancers/scores/acc'
import createLeaderboardPageProvider from './providers/page-leaderboard'
import {writable} from 'svelte/store'
import {findDiffInfoWithDiffAndTypeFromBeatMaps} from '../../utils/scoresaber/song'
import {debounce} from '../../utils/debounce'
import produce, {applyPatches} from 'immer'
import ppAttributionEnhancer from './enhancers/scores/pp-attribution'
import hasReplayEnhancer from './enhancers/scores/replay'

export default (leaderboardId, type = 'global', page = 1, initialState = null, initialStateType = 'initial') => {
  let currentLeaderboardId = leaderboardId ? leaderboardId : null;
  let currentType = type ? type : 'global';
  let currentPage = page ? page : 1;

  const {subscribe: subscribeEnhanced, set: setEnhanced} = writable(null);

  const getCurrentEnhanceTaskId = () => `${currentLeaderboardId}/${currentPage}/${currentType}`;
  const getPatchId = (leaderboardId, scoreRow) => `${leaderboardId}/${scoreRow?.player?.playerId}`

  let enhancePatches = {};
  let currentEnhanceTaskId = null;

  const onNewData = ({fetchParams, state, set}) => {
    currentLeaderboardId = fetchParams?.leaderboardId ?? null;
    currentType = fetchParams?.type ?? 'global';
    currentPage = fetchParams?.page ?? 1;

    if (!state) return;

    const enhanceTaskId = getCurrentEnhanceTaskId();
    if (currentEnhanceTaskId !== enhanceTaskId) {
      enhancePatches = {}
      currentEnhanceTaskId = enhanceTaskId;
    }

    const stateProduce = (state, patchId, producer) => produce(state, producer, patches => {
      if (!enhancePatches[patchId]) enhancePatches[patchId] = [];

      enhancePatches[patchId].push(...patches)
    })

    const debouncedSetState = debounce((enhanceTaskId, state) => {
      if (currentEnhanceTaskId !== enhanceTaskId) return;

      set(state);
    }, 100);

    const newState = {...state};

    const setStateRow = (enhanceTaskId, scoreRow) => {
      if (currentEnhanceTaskId !== enhanceTaskId) return null;

      const patchId = getPatchId(currentLeaderboardId, scoreRow)
      const stateRowIdx = newState.scores.findIndex(s => getPatchId(currentLeaderboardId, s) === patchId)
      if (stateRowIdx < 0) return;

      newState.scores[stateRowIdx] = applyPatches(newState.scores[stateRowIdx], enhancePatches[patchId]);

      debouncedSetState(enhanceTaskId, newState);

      return newState.scores[stateRowIdx];
    }

    if (newState.leaderboard)
      beatMapsEnhancer(newState)
        .then(_ => {
          const versions = newState?.leaderboard?.beatMaps?.versions ?? null
          const versionsLastIdx = versions && Array.isArray(versions) && versions.length ? versions.length - 1 : 0;

          const bpm = newState?.leaderboard?.beatMaps?.metadata?.bpm ?? null;
          const bmStats = findDiffInfoWithDiffAndTypeFromBeatMaps(newState?.leaderboard?.beatMaps?.versions?.[versionsLastIdx]?.diffs, newState?.leaderboard?.diffInfo);
          if (!bmStats) return null;

          newState.leaderboard.stats = {...newState.leaderboard.stats, ...bmStats, bpm};

          setEnhanced({leaderboardId, type, page, enhancedAt: new Date()})
          debouncedSetState(enhanceTaskId, newState);

          return newState.leaderboard.beatMaps;
        })
        .then(_ => {
          if (!newState.scores || !newState.scores.length) return;

          for (const scoreRow of newState.scores) {
                  stateProduce({...scoreRow, leaderboard: newState.leaderboard}, getPatchId(currentLeaderboardId, scoreRow), draft => accEnhancer(draft)).then(scoreRow => setStateRow(enhanceTaskId, scoreRow))
.then(scoreRow => stateProduce({...scoreRow, leaderboard: newState.leaderboard}, getPatchId(currentLeaderboardId, scoreRow), draft => ppAttributionEnhancer(draft, scoreRow?.player?.playerId, true)))
.then(scoreRow => stateProduce({...scoreRow, leaderboard: newState.leaderboard}, getPatchId(currentLeaderboardId, scoreRow), draft => hasReplayEnhancer(draft, scoreRow?.player?.playerId)))
              .then(scoreRow => setStateRow(enhanceTaskId, scoreRow))
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

