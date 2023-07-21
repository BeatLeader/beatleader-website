import createHttpStore from './http-store';
import createClanProvider from './providers/api-clan';
import stringify from 'json-stable-stringify';

export default (clanId, type = 'players', page = 1, filters = {}, initialState = null, initialStateType = 'initial') => {
	let currentClanId = clanId ? clanId : null;
	let currentPage = page ? page : 1;
	let currentFilters = filters ?? {};
	let currentType = type ? type : 'players';

	const onNewData = ({fetchParams, state, set}) => {
		currentClanId = fetchParams?.clanId ?? null;
		currentType = fetchParams?.type ?? 'players';
		currentPage = fetchParams?.page ?? 1;
		currentFilters = fetchParams?.filters ?? {};
	};

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

	const fetch = async (clanId = currentClanId, type = currentType, page = currentPage, filters = currentFilters, force = false) => {
		if (
			clanId &&
			clanId === currentClanId &&
			(!page || page === currentPage) &&
			(!filters || stringify(filters) === stringify(currentFilters)) &&
			!force
		)
			return false;

		return httpStore.fetch({clanId, type, page, filters}, force, provider);
	};

	const refresh = async () => fetch(currentClanId, currentType, currentPage, currentFilters, true);

	return {
		...httpStore,
		fetch,
		refresh,
		getClanId: () => currentClanId,
		getType: () => currentType,
		getPage: () => currentPage,
		getFilters: () => currentFilters,
	};
};
