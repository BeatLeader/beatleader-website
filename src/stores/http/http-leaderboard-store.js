import createHttpStore from './http-store';
import createLeaderboardPageProvider from './providers/api-leaderboard';
import {writable} from 'svelte/store';
import {debounce} from '../../utils/debounce';
import {produce, applyPatches} from 'immer';
import stringify from 'json-stable-stringify';

export default (leaderboardId, type = 'global', page = 1, filters = {}, initialState = null, initialStateType = 'initial') => {
	let currentLeaderboardId = leaderboardId ? leaderboardId : null;
	let currentType = type ? type : 'global';
	let currentPage = page ? page : 1;
	let currentFilters = filters ?? {};

	const {subscribe: subscribeEnhanced, set: setEnhanced} = writable(null);

	const getCurrentEnhanceTaskId = () => `${currentLeaderboardId}/${currentPage}/${currentType}`;
	const getPatchId = (leaderboardId, scoreRow) => `${leaderboardId}/${scoreRow?.player?.playerId}`;

	let enhancePatches = {};
	let currentEnhanceTaskId = null;

	const onNewData = ({fetchParams, state, set}) => {
		currentLeaderboardId = fetchParams?.leaderboardId ?? null;
		currentType = fetchParams?.type ?? 'global';
		currentPage = fetchParams?.page ?? 1;
		currentFilters = fetchParams?.filters ?? {};

		if (!state) return;

		const enhanceTaskId = getCurrentEnhanceTaskId();
		if (currentEnhanceTaskId !== enhanceTaskId) {
			enhancePatches = {};
			currentEnhanceTaskId = enhanceTaskId;
		}

		const stateProduce = (state, patchId, producer) =>
			produce(state, producer, patches => {
				if (!enhancePatches[patchId]) enhancePatches[patchId] = [];

				enhancePatches[patchId].push(...patches);
			});

		const debouncedSetState = debounce((enhanceTaskId, state) => {
			if (currentEnhanceTaskId !== enhanceTaskId) return;

			set(state);
		}, 100);

		const newState = {...state};

		const setStateRow = (enhanceTaskId, scoreRow) => {
			if (currentEnhanceTaskId !== enhanceTaskId) return null;

			const patchId = getPatchId(currentLeaderboardId, scoreRow);
			const stateRowIdx = newState.scores.findIndex(s => getPatchId(currentLeaderboardId, s) === patchId);
			if (stateRowIdx < 0) return;

			newState.scores[stateRowIdx] = applyPatches(newState.scores[stateRowIdx], enhancePatches[patchId]);

			debouncedSetState(enhanceTaskId, newState);

			return newState.scores[stateRowIdx];
		};
	};

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

	const fetch = async (
		leaderboardId = currentLeaderboardId,
		type = currentType,
		page = currentPage,
		filters = currentFilters,
		force = false
	) => {
		if (!leaderboardId) return false;

		if (
			leaderboardId === currentLeaderboardId &&
			(!type || type === currentType) &&
			(!page || page === currentPage) &&
			(!filters || stringify(filters) === stringify(currentFilters)) &&
			!force
		)
			return false;

		return httpStore.fetch({leaderboardId, type, page, filters}, force, provider);
	};

	const refresh = async () => fetch(currentLeaderboardId, currentType, currentPage, true);

	return {
		...httpStore,
		fetch,
		refresh,
		getLeaderboardId: () => currentLeaderboardId,
		getType: () => currentType,
		getPage: () => currentPage,
		getFilters: () => currentFilters,
		enhanced: {subscribe: subscribeEnhanced},
	};
};
