import createHttpStore from './http-store';
import createClanProvider from './providers/api-clan';
import stringify from 'json-stable-stringify';

// TODO: REVERT BEFORE PROD
// export default (clanId, page = 1, filters = {}, initialState = null, initialStateType = 'initial') => {
export default (clanId, type = 'players', page = 1, filters = {}, initialState = null, initialStateType = 'initial') => {
	let currentClanId = clanId ? clanId : null;
	let currentPage = page ? page : 1;
	let currentFilters = filters ?? {};
	let currentType = type ? type : 'players'; // TODO: REVERT BEFORE PROD

	const onNewData = ({fetchParams, state, set}) => {
		currentClanId = fetchParams?.clanId ?? null;
		currentType = fetchParams?.type ?? 'players'; // TODO: REVERT BEFORE PROD
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

	// TODO: REVERT BEFORE PROD
	// const fetch = async (clanId = currentClanId, page = currentPage, filters = currentFilters, force = false) => {
	const fetch = async (clanId = currentClanId, type = currentType, page = currentPage, filters = currentFilters, force = false) => {
		if (
			clanId &&
			clanId === currentClanId &&
			(!page || page === currentPage) &&
			(!filters || stringify(filters) === stringify(currentFilters)) &&
			!force
		)
			return false;

		// TODO: REVERT BEFORE PROD
		// return httpStore.fetch({clanId, page, filters}, force, provider);
		return httpStore.fetch({clanId, type, page, filters}, force, provider);
	};

	// TODO: REVERT BEFORE PROD
	// const refresh = async () => fetch(currentClanId, currentPage, currentFilters, true);
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
