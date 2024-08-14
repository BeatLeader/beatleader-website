import createHttpStore from './http-store';
import stringify from 'json-stable-stringify';

export default (provider, page = 1, type = 'ranked', filters = {}, initialState = null, initialStateType = 'initial', force = true) => {
	let currentPage = page ?? 1;
	let currentType = type ?? 'ranked';
	let currentFilters = filters ?? {};

	const onNewData = ({fetchParams}) => {
		currentPage = fetchParams?.page ?? 1;
		currentFilters = fetchParams?.filters ?? {};
		currentType = fetchParams?.type ?? 'ranked';
	};

	const httpStore = createHttpStore(
		provider,
		{page, type, filters},
		initialState,
		{
			onInitialized: onNewData,
			onAfterStateChange: onNewData,
			onSetPending: ({fetchParams}) => ({...fetchParams}),
		},
		initialStateType
	);

	const fetch = async (page = currentPage, type = currentType, filters = currentFilters, force = false) => {
		if ((!page || page === currentPage) && (!filters || stringify(filters) === stringify(currentFilters)) && !force) return false;

		return httpStore.fetch({page, type, filters}, force, provider);
	};

	const refresh = async () => fetch(currentPage, currentType, currentFilters, true);

	return {
		...httpStore,
		fetch,
		refresh,
		getFilters: () => currentFilters,
		getPage: () => currentPage,
		getType: () => currentType,
	};
};
