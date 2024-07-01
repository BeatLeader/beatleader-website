import createHttpStore from './http-store';
import createApiRankingProvider from './providers/api-ranking';
import stringify from 'json-stable-stringify';

export default (type = 'global', page = 1, filters = {}, initialState = null, initialStateType = 'initial') => {
	let currentType = type ? type : 'global';
	let currentPage = page ? page : 1;
	let currentFilters = filters ?? {};

	const onNewData = ({fetchParams}) => {
		currentType = fetchParams?.type ?? 'global';
		currentPage = fetchParams?.page ?? 1;
		currentFilters = fetchParams?.filters ?? {};
	};

	const provider = createApiRankingProvider();

	const httpStore = createHttpStore(
		provider,
		{type, page, filters},
		initialState,
		{
			onInitialized: onNewData,
			onAfterStateChange: onNewData,
			onSetPending: ({fetchParams}) => ({...fetchParams}),
		},
		initialStateType
	);

	const fetch = async (type = currentType, count, page = currentPage, filters = currentFilters, force = false) => {
		if (
			(!type || type === currentType) &&
			(!page || page === currentPage) &&
			(!filters || stringify(filters) === stringify(currentFilters)) &&
			!force
		)
			return false;

		return httpStore.fetch({type, count, page, filters}, force, provider);
	};

	const refresh = async () => fetch(currentType, currentPage, currentFilters, true);

	return {
		...httpStore,
		fetch,
		refresh,
		getType: () => currentType,
		getPage: () => currentPage,
		getFilters: () => currentFilters,
	};
};
