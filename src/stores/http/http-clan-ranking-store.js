import createHttpStore from './http-store';
import createClanRankingPageProvider from './providers/api-clan-ranking';
import {writable} from 'svelte/store';

export default (leaderboardId, clanRankingId, page = 1, initialState = null, initialStateType = 'initial') => {
	let currentLeaderboardId = leaderboardId ? leaderboardId : null;
	let currentClanRankingId = clanRankingId ? clanRankingId : null;
	let currentPage = page ? page : 1;

	const {subscribe: subscribeEnhanced, set: setEnhanced} = writable(null);

	const onNewData = ({fetchParams, state, set}) => {
		currentLeaderboardId = fetchParams?.leaderboardId ?? null;
		currentPage = fetchParams?.page ?? 1;

		if (!state) return;
	}

	const provider = createClanRankingPageProvider();

	const httpStore = createHttpStore(
		provider,
		{leaderboardId, page},
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
		clanRankingId = currentClanRankingId,
		page = currentPage,
		force = false
	) => {
		if (!leaderboardId) return false;

		if (
			leaderboardId === currentLeaderboardId &&
			clanRankingId === currentClanRankingId &&
			(!page || page === currentPage) &&
			!force
		)
			return false;

		return httpStore.fetch({leaderboardId, clanRankingId, page}, force, provider);
	};

	const refresh = async () => fetch(currentLeaderboardId, currentPage, true);

	return {
		...httpStore,
		fetch,
		refresh,
		getLeaderboardId: () => currentLeaderboardId,
		getPage: () => currentPage,
		enhanced: {subscribe: subscribeEnhanced},
	};
};
