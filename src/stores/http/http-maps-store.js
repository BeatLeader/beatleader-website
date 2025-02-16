import createHttpStore from './http-store';
import stringify from 'json-stable-stringify';
import createMapService from '../../services/beatleader/map';
import queue from '../../network/queues/queues';

let provider = null;

export default (page = 1, type = 'ranked', filters = {}, initialState = null, initialStateType = 'initial', force = true) => {
	let currentPage = page ?? 1;
	let currentType = type ?? 'ranked';
	let currentFilters = filters ?? {};

	if (!provider) {
		const mapService = createMapService();

		const getProcessed = async ({
			page = 1,
			type = 'ranked',
			filters = {},
			priority = queue.PRIORITY.FG_HIGH,
			signal = null,
			force = false,
		} = {}) => {
			mapService.fetchAllMapsPage(page, type, filters, priority, signal, force).then(r => {
				console.log(r);
			});

			let result = [];
			for (let i = 0; i < 10; i++) {
				result.push({
					id: i,
					name: 'Placeholder Map',
					artist: 'Unknown Artist',
					hash: '00000000000000000000000000000000',
					cover: 'https://via.placeholder.com/150',
					placeholder: true,
				});
			}
			return {data: result};
		};

		provider = {
			getProcessed,
			getCached: getProcessed,
		};
	}

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
