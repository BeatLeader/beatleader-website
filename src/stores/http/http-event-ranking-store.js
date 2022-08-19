import createHttpStore from './http-store';
import createApiRankingProvider from './providers/api-event-ranking';
import stringify from 'json-stable-stringify';

export default (type = 'global', page = 1, eventId = 1, filters = {}, initialState = null, initialStateType = 'initial') => {
	let currentType = type ? type : 'global';
	let currentPage = page ? page : 1;
	let currentEventId = eventId ? eventId : 1;
	let currentFilters = filters ?? {};

	const onNewData = ({fetchParams}) => {
		currentType = fetchParams?.type ?? 'global';
		currentPage = fetchParams?.page ?? 1;
		currentEventId = fetchParams?.eventId ?? 1;
		currentFilters = fetchParams?.filters ?? {};
	};

	const provider = createApiRankingProvider();

	const httpStore = createHttpStore(
		provider,
		{type, page, eventId, filters},
		initialState,
		{
			onInitialized: onNewData,
			onAfterStateChange: onNewData,
			onSetPending: ({fetchParams}) => ({...fetchParams}),
		},
		initialStateType
	);

	const fetch = async (type = currentType, page = currentPage, eventId = currentEventId, filters = currentFilters, force = false) => {
		if (
			(!type || type === currentType) &&
			(!page || page === currentPage) &&
			(!eventId || eventId === currentEventId) &&
			(!filters || stringify(filters) === stringify(currentFilters)) &&
			!force
		)
			return false;

		return httpStore.fetch({type, page, eventId, filters}, force, provider);
	};

	const refresh = async () => fetch(currentType, currentPage, currentEventId, currentFilters, true);

	return {
		...httpStore,
		fetch,
		refresh,
		getType: () => currentType,
		getPage: () => currentPage,
		getFilters: () => currentFilters,
	};
};
