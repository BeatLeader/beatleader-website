const STORE_SORTING_KEY = 'PlayerScoreSorting';
const STORE_ORDER_KEY = 'PlayerScoreOrder';

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

		if (!init && currentService === 'scores') {
			localStorage.setItem(STORE_SORTING_KEY, currentServiceParams.sort);
			localStorage.setItem(STORE_ORDER_KEY, currentServiceParams.order);
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
			case 'beatsavior':
				return update(
					{
						sort: paramsArr[1] ?? serviceDefaultParams?.sort,
						order: 'desc',
						page: paramsArr[2] ?? serviceDefaultParams?.page,
					},
					service,
					true
				);

			case 'accsaber':
				return update(
					{
						type: paramsArr[1] ?? serviceDefaultParams?.type,
						sort: paramsArr[2] ?? serviceDefaultParams?.sort,
						order: (paramsArr[2] ?? serviceDefaultParams?.sort) === 'rank' ? 'asc' : 'desc',
						page: paramsArr[3] ?? serviceDefaultParams?.page,
					},
					service,
					true
				);

			case 'scores':
			default:
				const urlParams = new URLSearchParams(window?.location?.search);
				let eventId = urlParams.get('eventId') ?? null;
				if (eventId?.length) {
					eventId = parseInt(eventId, 10);
					if (!isNaN(eventId)) update({filters: {eventId}});
				}

				const filters = {};
				for (const [key, value] of urlParams.entries()) {
					filters[key] = value;
				}

				return update(
					{
						sort: paramsArr[1] ?? serviceDefaultParams?.sort,
						order: paramsArr[2] ?? serviceDefaultParams?.order,
						page: paramsArr[3] ?? serviceDefaultParams?.page,
						filters,
					},
					service,
					true
				);
		}
	};

	const buildSearchFromFilters = (params, filters) => {
		if (!filters) return '';

		const searchParams = new URLSearchParams();
		Object.entries(filters).forEach(([key, value]) => {
			if (value && key != 'stars') {
				searchParams.append(key, value);
			}
		});

		const stars = filters['stars'];
		if (stars) {
			searchParams.append('stars', `${stars.from},${stars.to}`);
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
			case 'beatsavior':
				return `${service}/${effectiveParams.sort}${noPage ? '' : `/${effectiveParams.page}`}`;

			case 'accsaber':
				return `${service}/${effectiveParams.type}/${effectiveParams.sort}${noPage ? '' : `/${effectiveParams.page}`}`;

			case 'scores':
				const sort = effectiveParams.sort;
				const order = effectiveParams.order;
				const page = effectiveParams.page;

				let result = '';
				if (
					service != 'scores' || // This condition seems redundant as we are in the 'scores' case
					sort != serviceDefaultParams?.sort ||
					order != serviceDefaultParams?.order ||
					page != serviceDefaultParams?.page
				) {
					result = `${service}/${sort}/${order}${noPage ? '' : `/${page}`}`;
				}
				return `${result}${effectiveParams?.filters ? buildSearchFromFilters(getDefaultParams(service)?.filters, effectiveParams.filters) : ''}`;
			case 'attempts':
				return `${service}/${effectiveParams.sort}/${effectiveParams.order}${noPage ? '' : `/${effectiveParams.page}`}`;
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
