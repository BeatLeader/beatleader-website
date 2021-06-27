import createHttpStore from './http-store';
import beatSaverEnhancer from './enhancers/leaderboard/beatsaver'
import accEnhancer from './enhancers/scores/acc'
import beatSaviorEnhancer from './enhancers/scores/beatsavior'
import rankedsEnhancer from './enhancers/leaderboard/rankeds'
import diffEnhancer from './enhancers/scores/diff'
import {debounce} from '../../utils/debounce'
import {opt} from '../../utils/js'
import createApiScoresProvider from './providers/api-scores'

export default (playerId = null, type = 'recent', page = 1, initialState = null) => {
  let currentPlayerId = playerId;
  let currentType = type;
  let currentPage = page ? page : 1;

  const getCurrentEnhanceTaskId = () => `${currentPlayerId}/${currentPage}/${currentType}`;

  const onNewData = ({fetchParams, state, set}) => {
    currentPage = opt(fetchParams, 'page', 1);
    currentType = opt(fetchParams, 'type', null);
    currentPlayerId = opt(fetchParams, 'playerId', null);

    if (!state || !Array.isArray(state)) return;

    const debouncedSetState = debounce((enhanceTaskId, state) => {
      if (enhanceTaskId !== getCurrentEnhanceTaskId()) return;

      set(state);
    }, 100);

    const enhanceTaskId = getCurrentEnhanceTaskId();
    const newState = [...state];

    const setStateRow = (scoreRow, idx, fields = ['leaderboard', 'score']) => {
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

    for(const [idx, scoreRow] of newState.entries()) {
        beatSaverEnhancer(scoreRow)
          .then(enhancedScoreRow => accEnhancer(enhancedScoreRow, currentPlayerId, 'score'))
          .then(enhancedScoreRow => setStateRow(enhancedScoreRow, idx))
          .then(enhancedScoreRow => diffEnhancer(enhancedScoreRow, currentPlayerId, 'score'))
          .then(enhancedScoreRow => setStateRow(enhancedScoreRow, idx));

        beatSaviorEnhancer(scoreRow, currentPlayerId)
          .then(enhancedScoreRow => setStateRow(enhancedScoreRow, idx, 'leaderboard'));

        rankedsEnhancer(scoreRow, currentPlayerId)
          .then(enhancedScoreRow => setStateRow(enhancedScoreRow, idx, 'leaderboard'));
    }
  }

  const provider = createApiScoresProvider();

  const httpStore = createHttpStore(
    provider,
    {playerId, type, page},
    initialState,
    {
      onInitialized: onNewData,
      onAfterStateChange: onNewData,
      onSetPending: ({fetchParams}) => ({...fetchParams}),
    },
  );

  const fetch = async (page, type = currentType, playerId = currentPlayerId, force = false) => {
    if (
      (!playerId || playerId === currentPlayerId) &&
      (!type || type === currentType) &&
      (!page || page === currentPage) &&
      !force
    )
      return false;

    return httpStore.fetch({playerId, type, page}, force, provider);
  }

  const refresh = async () => fetch(currentPage, currentType, currentPlayerId, true);

  return {
    ...httpStore,
    fetch,
    refresh,
    getPlayerId: () => currentPlayerId,
    getPage: () => currentPage,
    getType: () => currentType,
  }
}

