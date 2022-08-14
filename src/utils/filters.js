export const buildSearchFromFilters = filters => {
	if (!filters) return '';

	const searchParams = new URLSearchParams();
	Object.entries(filters).forEach(([key, value]) => {
		if (value?.toString()?.length) searchParams.append(key, value);
	});

	return searchParams.toString();
};

export const processStringFilter = val => val?.toString() ?? '';
export const processStringArrayFilter = val => (val?.toString()?.length ? val.toString().split(',') : []);
export const processIntArrayFilter = val =>
	val?.toString()?.length
		? val
				.toString()
				.split(',')
				.map(s => parseInt(s))
		: [];
export const processIntFilter = val => {
	val = parseInt(val, 10);
	if (isNaN(val)) return null;

	return val < 0 ? 0 : val;
};
export const processFloatFilter = val => {
	val = parseFloat(val);
	if (isNaN(val)) return null;

	return val < 0 ? 0 : val;
};

export const createBuildFiltersFromLocation = (params, afterFunc = null) => {
	return location => {
		const searchParams = new URLSearchParams(location?.search ?? '');

		let filters = params.reduce(
			(cum, param) => ({
				...cum,
				[param.key]: param.process(searchParams.get(param.key)) ?? param.default,
				...(param.type === 'switch' && param.multi && param.withCondition
					? {
							[param.key + '_cond']: ['and', 'or'].includes(searchParams.get(param.key + '_cond'))
								? searchParams.get(param.key + '_cond')
								: param.defaultCondition ?? 'or',
					  }
					: {}),
			}),
			{}
		);

		if (afterFunc) filters = afterFunc(filters);

		return filters;
	};
};
