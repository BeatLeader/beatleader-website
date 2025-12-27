const STORE_SORTING_KEY = 'PlayerScoreSorting';
const STORE_ORDER_KEY = 'PlayerScoreOrder';
const ATTEMPTS_STORE_SORTING_KEY = 'PlayerAttemptsSorting';
const ATTEMPTS_STORE_ORDER_KEY = 'PlayerAttemptsOrder';

// Define valid sort keys for each service
const validSorts = {
	scores: [
		'pp',
		'accPP',
		'passPP',
		'techPP',
		'date',
		'acc',
		'rank',
		'stars',
		'playCount',
		'pauses',
		'maxStreak',
		'replaysWatched',
		'mistakes',
		'sotwNominations',
		'scoreValue',
	],
	attempts: ['pp', 'date', 'acc', 'rank', 'playCount', 'pauses', 'maxStreak', 'mistakes'],
	beatsavior: ['date', 'acc', 'mistakes'],
	accsaber: ['ap', 'date', 'acc', 'rank'],
};

export default () => {
	let currentService = null;
	let currentServiceParams = {};

	const getAllServices = () => ['scores', 'attempts', 'beatsavior', 'accsaber'];

	const get = () => ({service: currentService, params: currentServiceParams});

	const getDefaultParams = service => {
		switch (service) {
			case 'beatsavior':
				return {sort: 'date', order: 'desc', page: 1, filters: {}};
			case 'attempts':
				return {sort: 'date', order: 'desc', page: 1, filters: {}};
			case 'accsaber':
				return {type: 'overall', order: 'desc', sort: 'ap', page: 1, filters: {}};
			default:
				return {sort: 'pp', order: 'desc', page: 1, filters: {}};
		}
	};

	const update = (serviceParams = {}, service = currentService, init = false) => {
		const availableServices = getAllServices();
		if (!availableServices.includes(service)) service = availableServices?.[0] ?? 'scores';

		const defaultServiceParams = getDefaultParams(service);

		if (defaultServiceParams?.page && !Number.isFinite(serviceParams?.page)) {
			const val = parseInt(serviceParams?.page, 10);
			serviceParams.page = !isNaN(val) ? val : 1;
		}

		// preserve old filters
		serviceParams = {...serviceParams};
		serviceParams.filters = {
			...(currentServiceParams?.filters ?? {}),
			...(serviceParams?.filters ?? {}),
		};

		currentService = service;
		currentServiceParams = {...defaultServiceParams, ...currentServiceParams, ...serviceParams};

		// Validate incoming sort parameter BEFORE merging
		if (currentServiceParams?.sort) {
			const serviceValidSorts = validSorts[service] ?? [];
			if (!serviceValidSorts.includes(currentServiceParams.sort)) {
				// If invalid, revert to the default sort for this service
				currentServiceParams.sort = defaultServiceParams.sort;
			}
		}

		// Validate thenSort parameter
		if (currentServiceParams?.thenSort) {
			const serviceValidSorts = validSorts[service] ?? [];
			if (!serviceValidSorts.includes(currentServiceParams.thenSort)) {
				// If invalid, remove thenSort
				currentServiceParams.thenSort = null;
				currentServiceParams.thenOrder = null;
			}
		}

		if (!init) {
			if (currentService === 'scores') {
				localStorage.setItem(STORE_SORTING_KEY, currentServiceParams.sort);
				localStorage.setItem(STORE_ORDER_KEY, currentServiceParams.order);
			} else if (currentService === 'attempts') {
				localStorage.setItem(ATTEMPTS_STORE_SORTING_KEY, currentServiceParams.sort);
				localStorage.setItem(ATTEMPTS_STORE_ORDER_KEY, currentServiceParams.order);
			}
		}

		return get();
	};

	const clearServiceParams = () => (currentServiceParams = {});

	const initFromUrl = (url = null) => {
		const availableServices = getAllServices();
		const defaultService = availableServices?.[0] ?? 'scores';
		const paramsArr = url ? url.split('/') : [defaultService];

		const service = paramsArr[0] ?? 'scores';

		const serviceDefaultParams = getDefaultParams(service);

		switch (service) {
			case 'beatsavior': {
				const urlParams = new URLSearchParams(window?.location?.search);
				const querySort = urlParams.get('sort');
				
				// Old format: beatsavior/{sort}/{page} - New format: beatsavior/{page}?sort=...
				const hasOldFormat = paramsArr[1] && validSorts.beatsavior.includes(paramsArr[1]);
				const sort = querySort ?? (hasOldFormat ? paramsArr[1] : null) ?? serviceDefaultParams?.sort;
				const page = hasOldFormat ? (paramsArr[2] ?? serviceDefaultParams?.page) : (paramsArr[1] ?? serviceDefaultParams?.page);
				
				return update(
					{
						sort,
						order: 'desc',
						page,
					},
					service,
					true
				);
			}

			case 'accsaber': {
				const urlParams = new URLSearchParams(window?.location?.search);
				const querySort = urlParams.get('sort');
				const queryOrder = urlParams.get('order');
				
				// Old format: accsaber/{type}/{sort}/{page} - New format: accsaber/{type}/{page}?sort=...&order=...
				const type = paramsArr[1] ?? serviceDefaultParams?.type;
				const hasOldFormat = paramsArr[2] && validSorts.accsaber.includes(paramsArr[2]);
				const sort = querySort ?? (hasOldFormat ? paramsArr[2] : null) ?? serviceDefaultParams?.sort;
				const order = queryOrder ?? (hasOldFormat && paramsArr[2] === 'rank' ? 'asc' : null) ?? (sort === 'rank' ? 'asc' : 'desc');
				const page = hasOldFormat ? (paramsArr[3] ?? serviceDefaultParams?.page) : (paramsArr[2] ?? serviceDefaultParams?.page);
				
				return update(
					{
						type,
						sort,
						order,
						page,
					},
					service,
					true
				);
			}

			case 'attempts': {
				const urlParams = new URLSearchParams(window?.location?.search);
				const querySort = urlParams.get('sort');
				const queryOrder = urlParams.get('order');
				
				// Old format: attempts/{sort}/{order}/{page} - New format: attempts/{page}?sort=...&order=...
				const hasOldFormat = paramsArr[1] && validSorts.attempts.includes(paramsArr[1]);
				const sort = querySort ?? (hasOldFormat ? paramsArr[1] : null) ?? serviceDefaultParams?.sort;
				const order = queryOrder ?? (hasOldFormat ? paramsArr[2] : null) ?? serviceDefaultParams?.order;
				const page = hasOldFormat ? (paramsArr[3] ?? serviceDefaultParams?.page) : (paramsArr[1] ?? serviceDefaultParams?.page);

				// Collect filters
				const filters = {};
				for (const [key, value] of urlParams.entries()) {
					if (!['sort', 'order'].includes(key)) {
						filters[key] = value;
					}
				}

				return update(
					{
						sort,
						order,
						page,
						filters,
					},
					service,
					true
				);
			}

			case 'scores':
			default: {
				const urlParams = new URLSearchParams(window?.location?.search);
				
				// Extract sort params from query (new format) or fall back to path (old format for backward compatibility)
				const querySort = urlParams.get('sort');
				const queryOrder = urlParams.get('order');
				const thenSort = urlParams.get('thenSort');
				const thenOrder = urlParams.get('thenOrder');
				const noSearchSort = urlParams.get('noSearchSort') === 'true';

				// Determine sort/order: prefer query params, fall back to path params (backward compatibility)
				// Old format: scores/{sort}/{order}/{page} - New format: scores/{page}?sort=...&order=...
				const hasOldFormat = paramsArr[1] && validSorts.scores.includes(paramsArr[1]);
				const sort = querySort ?? (hasOldFormat ? paramsArr[1] : null) ?? serviceDefaultParams?.sort;
				const order = queryOrder ?? (hasOldFormat ? paramsArr[2] : null) ?? serviceDefaultParams?.order;
				// Page is in path: new format scores/{page}, old format scores/{sort}/{order}/{page}
				const page = hasOldFormat ? (paramsArr[3] ?? serviceDefaultParams?.page) : (paramsArr[1] ?? serviceDefaultParams?.page);

				// Collect remaining filters (excluding sort params we already extracted)
				const filters = {};
				for (const [key, value] of urlParams.entries()) {
					if (!['sort', 'order', 'thenSort', 'thenOrder', 'noSearchSort'].includes(key)) {
						filters[key] = value;
					}
				}

				return update(
					{
						sort,
						order,
						page,
						filters,
						noSearchSort,
						...(thenSort ? {thenSort} : {}),
						...(thenOrder ? {thenOrder} : {}),
					},
					service,
					true
				);
			}
		}
	};

	const buildSearchParams = (sortParams = {}, filters = {}) => {
		const searchParams = new URLSearchParams();
		const {sort, order, thenSort, thenOrder, noSearchSort, defaultSort, defaultOrder} = sortParams;

		// Add sort params to query (only if different from defaults)
		if (sort && sort !== defaultSort) {
			searchParams.append('sort', sort);
		}
		if (order && order !== defaultOrder) {
			searchParams.append('order', order);
		}

		// Add secondary sort params
		if (thenSort) {
			searchParams.append('thenSort', thenSort);
		}
		if (thenOrder) {
			searchParams.append('thenOrder', thenOrder);
		}

		// Add noSearchSort if true (skip relevance sorting for search)
		if (noSearchSort) {
			searchParams.append('noSearchSort', 'true');
		}

		// Add filters
		if (filters) {
			Object.entries(filters).forEach(([key, value]) => {
				if (value && key != 'stars') {
					searchParams.append(key, value);
				}
			});

			const stars = filters['stars'];
			if (stars) {
				searchParams.append('stars', `${stars.from},${stars.to}`);
			}
		}

		const result = searchParams.toString();

		return result.length ? '?' + result : result;
	};

	const getUrl = (service, params = {}, noPage = false) => {
		if (!service) return '';

		const serviceDefaultParams = getDefaultParams(service);

		// Create a working copy of params merged with defaults
		let effectiveParams = {...serviceDefaultParams, ...params};

		// Validate sort parameter for the URL generation
		const intendedSort = effectiveParams.sort;
		const serviceValidSorts = validSorts[service] ?? [];
		if (intendedSort && !serviceValidSorts.includes(intendedSort)) {
			// If invalid for this service, use the service's default sort for the URL
			effectiveParams.sort = serviceDefaultParams.sort;
		}

		switch (service) {
			case 'beatsavior': {
				const queryStr = buildSearchParams(
					{
						sort: effectiveParams.sort,
						order: effectiveParams.order,
						defaultSort: serviceDefaultParams.sort,
						defaultOrder: serviceDefaultParams.order,
					},
					{}
				);
				const pageNum = effectiveParams.page;
				const hasNonDefaultPage = !noPage && pageNum && pageNum != serviceDefaultParams.page;
				
				if (hasNonDefaultPage) {
					return `${service}/${pageNum}${queryStr}`;
				} else if (queryStr) {
					return `${service}${queryStr}`;
				}
				return service;
			}

			case 'accsaber': {
				const queryStr = buildSearchParams(
					{
						sort: effectiveParams.sort,
						order: effectiveParams.order,
						defaultSort: serviceDefaultParams.sort,
						defaultOrder: effectiveParams.sort === 'rank' ? 'asc' : 'desc',
					},
					{}
				);
				const pageNum = effectiveParams.page;
				const typeParam = effectiveParams.type;
				const hasNonDefaultPage = !noPage && pageNum && pageNum != serviceDefaultParams.page;
				const hasNonDefaultType = typeParam && typeParam !== serviceDefaultParams.type;
				
				if (hasNonDefaultPage) {
					return `${service}/${typeParam}/${pageNum}${queryStr}`;
				} else if (queryStr || hasNonDefaultType) {
					return `${service}/${typeParam}${queryStr}`;
				}
				return service;
			}

			case 'scores':
				const queryString = buildSearchParams(
					{
						sort: effectiveParams.sort,
						order: effectiveParams.order,
						thenSort: effectiveParams.thenSort,
						thenOrder: effectiveParams.thenOrder,
						noSearchSort: effectiveParams.noSearchSort,
						defaultSort: serviceDefaultParams.sort,
						defaultOrder: serviceDefaultParams.order,
					},
					effectiveParams.filters
				);
				// Page goes in path: scores/{page}?query
				const pageNum = effectiveParams.page;
				const hasNonDefaultPage = !noPage && pageNum && pageNum != serviceDefaultParams.page;
				
				if (hasNonDefaultPage) {
					return `scores/${pageNum}${queryString}`;
				} else if (queryString) {
					return `scores${queryString}`;
				}
				return '';
			case 'attempts': {
				const queryStr = buildSearchParams(
					{
						sort: effectiveParams.sort,
						order: effectiveParams.order,
						defaultSort: serviceDefaultParams.sort,
						defaultOrder: serviceDefaultParams.order,
					},
					effectiveParams.filters
				);
				const pageNum = effectiveParams.page;
				const hasNonDefaultPage = !noPage && pageNum && pageNum != serviceDefaultParams.page;
				
				if (hasNonDefaultPage) {
					return `${service}/${pageNum}${queryStr}`;
				} else if (queryStr) {
					return `${service}${queryStr}`;
				}
				return service;
			}
		}
	};

	const getCurrentServiceUrl = () => getUrl(currentService, currentServiceParams);
	const getCurrentServiceUrlWithoutPage = () => getUrl(currentService, currentServiceParams, true);
	const getDefaultServiceUrl = (service = currentService) => getUrl(service, {});

	return {
		getAvailableServices: getAllServices,
		initFromUrl,
		getDefaultParams,
		getDefaultServiceUrl,
		getCurrentServiceUrl,
		getCurrentServiceUrlWithoutPage,
		getUrl,
		get,
		getService: () => currentService,
		getParams: () => currentServiceParams,
		update,
		clearServiceParams,
	};
};
