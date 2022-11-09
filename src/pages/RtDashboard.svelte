<script>
	import {fade} from 'svelte/transition';
	import {navigate} from 'svelte-routing';
	import createAccountStore from '../stores/beatleader/account';
	import createLocalStorageStore from '../stores/localstorage';
	import leaderboardsApiClient from '../network/clients/beatleader/leaderboard/api-leaderboards';
	import leaderboardByHashApiClient from '../network/clients/beatleader/leaderboard/api-leaderboards-hash';
	import playersApiClient from '../network/clients/beatleader/player/api';
	import {copyToClipboard} from '../utils/clipboard';
	import {
		buildSearchFromFilters,
		createBuildFiltersFromLocation,
		processIntArrayFilter,
		processStringArrayFilter,
		processStringFilter,
	} from '../utils/filters';
	import {formatNumber} from '../utils/format';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Error from '../components/Common/Error.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import QualificationStatus from '../components/Leaderboard/QualificationStatus.svelte';
	import Totals from '../components/Rt/Summary.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import Difficulty from '../components/Song/Difficulty.svelte';
	import MapTypeDescription from '../components/Leaderboard/MapTypeDescription.svelte';
	import Select from 'svelte-select';
	import CustomSelect from '../components/Common/Select.svelte';
	import {dateFromUnix, DAY, formatDate, formatDateRelative, willBeRankedInCurrentBatch} from '../utils/date';
	import Button from '../components/Common/Button.svelte';
	import {DifficultyStatus, mapTypeFromMask, typesDescription, typesMap} from '../utils/beatleader/format';
	import {capitalize} from '../utils/js';
	import {MAX_STARS, MIN_STARS, STAR_GRANULARITY} from './../utils/beatleader/consts'

	export let location;

	document.body.classList.add('remove');

	const account = createAccountStore();
	const labelsStore = createLocalStorageStore('rt-maps-labels');
	const playersCache = createLocalStorageStore('rt-players');

	const ITEMS_PER_PAGE = 50;
	const VOTED = 100;

	let showEventLog = false;
	let allLabels = [];

	const updateAllLabels = store => {
		allLabels = [...new Set(Object.values(store).reduce((carry, labels) => [...carry, ...labels], []))].map(label => ({
			id: label,
			label: label,
		}));
	};

	updateAllLabels($labelsStore);

	const logTypeValues = [
		{id: 'nomination', label: 'Nomination'},
		{id: 'criteria', label: 'Criteria'},
		{id: 'approval', label: 'Approval'},
		{id: 'stars', label: 'Stars'},
		{id: 'category', label: 'Category'},
	];
	let logTypeFilter = [];
	let logPlayerFilter = '';

	let showMapSearch = false;
	let mapIsSearched = false;
	let mapSearchError = null;
	let mapHash = '';
	let mapFound = undefined;

	const sortValues = [
		{id: 'max_stars', label: 'Max stars', title: 'Sort by max diff stars', iconFa: 'fa fa-star'},
		{id: 'min_stars', label: 'Min stars', title: 'Sort by min diff stars', iconFa: 'fa fa-star'},
		{id: 'name', label: 'Name', title: 'Sort by name', iconFa: 'fa fa-a'},
		{id: 'votescount', label: 'Votes count', title: 'Sort by votes count', iconFa: 'fas fa-calculator'},
		{id: 'votesrating', label: 'Votes rating', title: 'Sort by votes rating', iconFa: 'far fa-smile-beam'},
		{id: 'nomination', label: 'Nomination date', title: 'Sort by nomination date', iconFa: 'far fa-calendar'},
		{id: 'criteria', label: 'Criteria date', title: 'Sort by criteria check date', iconFa: 'far fa-calendar'},
		{id: 'approval', label: 'Approval date', title: 'Sort by approval date', iconFa: 'far fa-calendar'},
	];

	let sortValue;

	const categoryFilterOptions = Object.entries(typesMap).map(([key, type]) => {
		return {
			id: type,
			label: capitalize(typesDescription?.[key]?.name ?? key),
			icon: `<span class="${typesDescription?.[key]?.icon ?? `${key}-icon`}"></span>`,
			color: typesDescription?.[key]?.color ?? 'var(--beatleader-primary',
			textColor: typesDescription?.[key]?.textColor ?? null,
		};
	});

	const findParam = key => params.find(p => p.key === key);

	const onInputChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = e.target.value ?? '';

			updateCurrentFiltersFromParams();
		}
	};

	const onSingleSwitchChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = (param.values ?? []).find(p => p?.id === e?.detail?.id);

			updateCurrentFiltersFromParams();
		}
	};

	const onMultiSwitchChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = (param?.value ?? []).includes(e.detail)
				? (param?.value ?? []).filter(p => p?.id !== e.detail.id)
				: [...(param?.value ?? []), e.detail];

			updateCurrentFiltersFromParams();
		}
	};

	const onSwitchWithMultiSelectChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			if (e?.detail?.componentValue) {
				const paramValue = param?.values?.find(pv => pv.id === e?.detail?.id);
				if (!paramValue?.componentProps?.value) return;

				if (e.detail.componentValue?.value) {
					paramValue.componentProps.value = e.detail.componentValue.value;
				}

				param.value = (param?.value ?? []).find(v => v.id === paramValue.id)
					? (param?.value ?? []).filter(p => p?.id !== paramValue.id).concat(paramValue.componentProps.value?.length ? paramValue : [])
					: [...(param?.value ?? []), paramValue];

				updateCurrentFiltersFromParams();
			} else {
				onMultiSwitchChange(e, key);
			}
		}
	};

	const onConditionChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.valueCondition = e.target.value ?? 'or';

			updateCurrentFiltersFromParams();
		}
	};

	let start = null;
	const rangeChange = (event, key) => {
		if (!Array.isArray(event?.detail?.values) || event.detail.values.length !== 2) return;

		const range = findParam(key);
		if (range) {
			range.values = event.detail.values;
		}

		start = new Date().getTime();
		setTimeout(() => {
			if (new Date().getTime() - start > 499) {
				updateCurrentFiltersFromParams(true);
			}
		}, 500);
	};

	const criteriaValues = [
		{label: 'Met', value: 1},
		{label: 'NOT checked', value: 0},
		{label: 'On hold', value: 3},
		{label: 'NOT met', value: 2},
	];

	const serializeCriteriaStatus = paramValue =>
		paramValue?.id +
		':' +
		(paramValue?.componentProps?.value ?? [])
			.map(v => v?.value)
			.filter(v => Number.isFinite(v))
			.join(':');

	const deserializeCriteriaStatus = (paramValue, values) => {
		if (!values?.length || !paramValue?.componentProps?.items?.length) return;

		const valuesCasted = values.map(v => parseInt(v, 10)).filter(v => !isNaN(v));
		paramValue.componentProps.value = paramValue.componentProps.items.filter(i => valuesCasted.includes(i.value));
	};

	const deserializeStatus = (param, filters) => {
		if (param.multi) {
			const filterValue = (filters?.[param.key] ?? [])
				.map(filterValue => {
					const parts = filterValue.split(':');
					const id = parts.shift();

					return id ? {id, rest: parts} : null;
				})
				.filter(fv => fv);
			const filterIds = filterValue.map(fv => fv?.id).filter(id => id);

			param.value = param?.values?.filter(v => filterIds.includes(v.id)) ?? param?.default ?? [];

			param.value.forEach(pv => {
				if (!pv.deserializeParam) return;

				pv.deserializeParam(pv, filterValue.find(fv => fv.id === pv.id)?.rest ?? null);
			});
		} else {
			param.value = filters?.[param.key] ?? param?.default ?? '';
		}

		filters[param.key] = param.multi
			? (param?.value ?? [])
					?.map(paramValue => (paramValue?.serializeParam ? paramValue.serializeParam(paramValue) : paramValue.id))
					?.filter(v => v) ??
			  param?.default ??
			  []
			: filters?.[param.key]?.length
			? filters[param.key]
			: param?.default ?? '';
	};

	let constants;
	const params = [
		{
			key: 'mine',
			label: 'Engagement',
			default: 'all',
			process: processStringFilter,
			type: 'switch',
			value: null,
			values: [
				{id: 'all', label: 'All maps'},
				{id: 'mine', label: 'Mine only'},
				{id: 'others', label: 'Others only'},
			],
			onChange: e => onSingleSwitchChange(e, 'mine'),
			multi: false,
		},
		{
			key: 'status',
			label: 'It has a status of',
			default: '',
			defaultCondition: 'or',
			process: processStringArrayFilter,
			deserialize: deserializeStatus,
			type: 'switch',
			value: [],
			valueCondition: 'or',
			values: [
				{id: 'current_batch', label: 'Current batch'},
				{id: 'nominated', label: 'Nominated'},
				{id: 'allowed', label: 'Mapper allowed'},
				{
					id: 'criteria',
					label: 'Any Criteria',
					component: CustomSelect,
					componentProps: {
						value: [],
						items: criteriaValues.map(v => ({...v})),
						multiple: true,
						noSelected: 'Any Criteria',
						prefix: 'Criteria: ',
						minSelected: 0,
					},
					serializeParam: serializeCriteriaStatus,
					deserializeParam: deserializeCriteriaStatus,
				},
				{id: 'approved', label: 'RT approved'},
				{id: 'voted', label: 'Has votes'},
				{id: 'with_stars', label: 'Has stars'},
			],
			onChange: e => onSwitchWithMultiSelectChange(e, 'status'),
			multi: true,
			withCondition: true,
			onConditionChange: e => onConditionChange(e, 'status'),
		},
		{
			key: 'status_not',
			label: 'It has NOT a status of',
			default: '',
			defaultCondition: 'or',
			process: processStringArrayFilter,
			deserialize: deserializeStatus,
			type: 'switch',
			value: [],
			valueCondition: 'or',
			values: [
				{id: 'current_batch', label: 'Current batch'},
				{id: 'nominated', label: 'Nominated'},
				{id: 'allowed', label: 'Mapper allowed'},
				{
					id: 'criteria',
					label: 'Any Criteria',
					component: CustomSelect,
					componentProps: {
						value: [],
						items: criteriaValues.map(v => ({...v})),
						multiple: true,
						noSelected: 'Any Criteria',
						prefix: 'Criteria: ',
						minSelected: 0,
					},
					serializeParam: serializeCriteriaStatus,
					deserializeParam: deserializeCriteriaStatus,
				},
				{id: 'approved', label: 'RT approved'},
				{id: 'voted', label: 'Has votes'},
				{id: 'with_stars', label: 'Has stars'},
			],
			onChange: e => onSwitchWithMultiSelectChange(e, 'status_not'),
			multi: true,
			withCondition: true,
			onConditionChange: e => onConditionChange(e, 'status_not'),
		},
		{
			key: 'mapType',
			label: 'Map category',
			default: [],
			defaultCondition: 'or',
			process: processIntArrayFilter,
			type: 'switch',
			value: [],
			valueCondition: 'or',
			values: categoryFilterOptions,
			onChange: e => onMultiSwitchChange(e, 'mapType'),
			multi: true,
			withCondition: true,
			onConditionChange: e => onConditionChange(e, 'mapType'),
		},
		{
			key: 'tags',
			label: 'Tags',
			default: '',
			defaultCondition: 'or',
			process: processStringArrayFilter,
			type: 'tags',
			value: [],
			values: allLabels,
			valueCondition: 'or',
			onChange: e => {
				const param = findParam('tags');
				if (param) {
					param.value = e?.detail ?? [];

					updateCurrentFiltersFromParams();
				}
			},
			multi: true,
			withCondition: true,
			onConditionChange: e => onConditionChange(e, 'tags'),
		},
		{
			key: 'tags_not',
			label: 'No tags',
			default: '',
			defaultCondition: 'or',
			process: processStringArrayFilter,
			type: 'tags',
			value: [],
			values: allLabels,
			valueCondition: 'or',
			onChange: e => {
				const param = findParam('tags_not');
				if (param) {
					param.value = e?.detail ?? [];

					updateCurrentFiltersFromParams();
				}
			},
			multi: true,
			withCondition: true,
			onConditionChange: e => onConditionChange(e, 'tags_not'),
		},
		{
			key: 'mapper',
			label: 'Mapper',
			default: '',
			process: processStringFilter,
			type: 'input',
			value: '',
			placeholder: 'Search for a mapper',
			onChange: e => onInputChange(e, 'mapper'),
		},
		{
			key: 'name',
			label: 'Map Name',
			default: '',
			process: processStringFilter,
			type: 'input',
			value: '',
			placeholder: 'Search for a map',
			onChange: e => onInputChange(e, 'name'),
		},
		{
			key: 'star_range',
			label: 'Star range',
			default: [MIN_STARS, MAX_STARS],
			min: MIN_STARS,
			max: MAX_STARS,
			step: STAR_GRANULARITY,
			pipstep: 25,
			type: 'slider',
			process: processIntArrayFilter,
			values: [],
			onChange: e => rangeChange(e, 'star_range'),
		},
		{
			key: 'sortBy',
			default: 'votesrating',
			process: processStringFilter,
			type: null,
		},
		{
			key: 'order',
			default: 'desc',
			process: processStringFilter,
			type: null,
		},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		params.forEach(p => {
			switch (true) {
				case !!p.deserialize:
					p.deserialize(p, filters);
					break;

				case p.key === 'star_range':
					p.values = Array.isArray(filters?.[p.key]) && filters[p.key].length ? filters[p.key] : p?.default ?? [];
					filters[p.key] = filters[p.key] ?? 0;
					break;

				case p.type === 'switch' && !p.multi:
					filters[p.key] = (p?.values ?? [])?.map(v => v?.id)?.find(v => v === filters?.[p.key]) ?? p?.default ?? [];
					p.value = p?.values?.find(v => v.id === filters?.[p.key]) ?? null;
					break;

				default:
					filters[p.key] = p.multi
						? (p?.values ?? [])?.map(v => v?.id)?.filter(v => filters?.[p.key]?.includes(v)) ?? p?.default ?? []
						: filters?.[p.key]?.length
						? filters[p.key]
						: p?.default ?? '';

					p.value = p.multi
						? p?.values?.filter(v => filters?.[p.key]?.includes(v.id)) ?? p?.default ?? []
						: filters?.[p.key] ?? p?.default ?? '';
			}

			if (p.multi && p.withCondition) {
				p.valueCondition = filters[p.key + '_cond'] ?? p.defaultCondition ?? 'or';
			}
		});

		return filters;
	});

	function updateCurrentFiltersFromParams(noScroll) {
		params.forEach(p => {
			switch (true) {
				case p.key === 'star_range':
					currentFilters[p.key] = p?.values ?? [];
					break;

				case p.type === 'switch' && !p.multi:
					currentFilters[p.key] = p?.value?.id ?? '';
					break;

				default:
					currentFilters[p.key] = p.multi
						? (p?.value ?? [])?.map(paramValue => (paramValue?.serializeParam ? paramValue.serializeParam(paramValue) : paramValue.id))
						: p?.value ?? '';
					break;
			}

			if (p.multi && p.withCondition) {
				currentFilters[p.key + '_cond'] = p.valueCondition ?? 'or';
			}
		});

		params = params;

		navigateToCurrentPageAndFilters();
	}

	function updateTags(allLabels) {
		const params = [findParam('tags'), findParam('tags_not')].filter(p => p);
		if (params.length) {
			params.forEach(param => {
				const currentValues = param?.value?.map(v => v?.id)?.filter(v => v) ?? [];
				param.values = allLabels;
				param.value = allLabels.filter(l => currentValues.includes(l.id));
			});
		}
	}

	function navigateToCurrentPageAndFilters(replace) {
		navigate(`/rt?${buildSearchFromFilters(currentFilters)}`, {replace});
	}

	let currentFilters = buildFiltersFromLocation(location);

	let error = null;
	let isLoading = true;

	let songs = [];
	let detailsOpened = [];

	async function fetchMapsWithType(type, sortBy = 'stars', maxNum = null) {
		let data = [];
		let page = 1;
		let count = ITEMS_PER_PAGE;
		let pageCount = null;

		while (!pageCount || page <= pageCount) {
			const pageData = await leaderboardsApiClient.getProcessed({page, filters: {type, sortBy, order: 'desc', count}});

			if (!pageData?.data?.length) return data;

			data = [...data, ...pageData.data.map(map => ({...map, type}))];

			if (maxNum && data.length >= maxNum) return data;

			if (!pageCount) {
				count = pageData?.metadata?.itemsPerPage ?? ITEMS_PER_PAGE;
				pageCount = pageData?.metadata?.total ? Math.ceil(pageData.metadata.total / count) : null;
			}

			page++;
		}

		return data;
	}

	async function fetchMaps() {
		try {
			isLoading = true;
			error = null;

			songs = Object.values(
				(
					await Promise.all([fetchMapsWithType('nominated', 'votecount'), fetchMapsWithType('qualified', 'votecount')]).then(async data => [
						...data,
						await fetchMapsWithType('unranked', 'votecount', VOTED),
					])
				)
					.reduce((carry, maps) => [...carry, ...maps], [])
					.reduce((carry, map) => {
						const {difficulty, qualification, song, positiveVotes, negativeVotes, ...rest} = map;

						song.difficulties = (song?.difficulties ?? []).filter(d => d?.modeName === 'Standard');

						if (song?.hash?.length && !carry[song.hash]) {
							const minStars = song?.difficulties?.reduce(
								(min, d) => (Number.isFinite(d?.stars) && (!Number.isFinite(min) || min > d.stars) ? d.stars : min),
								null
							);
							const maxStars = song?.difficulties?.reduce(
								(max, d) => (Number.isFinite(d?.stars) && (!Number.isFinite(max) || max < d.stars) ? d.stars : max),
								null
							);

							carry[song.hash] = {...song, minStars, maxStars};
						}

						const existingDiffs = (carry[song.hash]?.difficulties ?? []).map(d => ({mode: d?.mode, value: d?.value}));
						const diffsToAdd = (song?.difficulties ?? []).filter(
							d => !existingDiffs.find(ed => ed.mode === d?.mode && ed.value === d?.value)
						);
						if (diffsToAdd?.length)
							carry[song.hash].difficulties = (carry[song.hash]?.difficulties ?? []).concat(diffsToAdd).sort((a, b) => b.value - a.value);

						const diffIdx = carry[song.hash]?.difficulties?.findIndex(d => d.id === difficulty.id);
						if (diffIdx >= 0) {
							const votesPositive = positiveVotes ?? 0;
							const votesNegative = negativeVotes ?? 0;

							const votesTotal = votesPositive + votesNegative ?? 0;
							const votesScore = votesTotal ? votesPositive / votesTotal : 0;
							const votesRating = votesScore - (votesScore - 0.5) * Math.pow(2, -Math.log10(votesTotal + 1));

							carry[song.hash].difficulties[diffIdx] = {
								...rest,
								...carry[song.hash].difficulties[diffIdx],
								qualification,
								leaderboardId: rest?.id,
								votesPositive,
								votesNegative,
								votesRating,
								votesTotal,
							};
						}

						return carry;
					}, {})
			)
				.map(s => {
					const totals = (s?.difficulties ?? []).reduce(
						(carry, diff) => {
							carry.nominated +=
								[DifficultyStatus.nominated, DifficultyStatus.qualified, DifficultyStatus.ranked].includes(diff?.status) ||
								!!diff?.nominated ||
								!!diff?.qualified ||
								!!diff?.ranked ||
								diff?.qualification?.timeset
									? 1
									: 0;
							carry.qualified +=
								diff?.status === DifficultyStatus.qualified || DifficultyStatus.ranked || !!diff?.qualified || !!diff?.ranked ? 1 : 0;
							carry.mapperAllowed += diff?.qualification?.mapperAllowed ? 1 : 0;
							carry.criteriaMet += [1, 2].includes(diff?.qualification?.criteriaMet) ? 1 : 0;
							carry.approved += diff?.qualification?.approved ? 1 : 0;
							carry.votesTotal += diff?.votesTotal ?? 0;
							carry.votesPositive += diff?.votesPositive ?? 0;
							carry.votesNegative += diff?.votesNegative ?? 0;

							['nominated', 'qualified', 'mapperAllowed', 'criteriaMet', 'approved'].forEach(key => {
								carry[`${key}Ratio`] = s?.difficulties?.length ? carry[key] / s.difficulties.length : 0;
							});

							const votesScore = carry.votesTotal ? carry.votesPositive / carry.votesTotal : 0;
							carry.votesRating = votesScore - (votesScore - 0.5) * Math.pow(2, -Math.log10(carry.votesTotal + 1));

							return carry;
						},
						{
							nominated: 0,
							nominatedRatio: 0,
							qualified: 0,
							qualifiedRatio: 0,
							mapperAllowed: 0,
							mapperAllowedRatio: 0,
							criteriaMet: 0,
							criteriaMetRatio: 0,
							approved: 0,
							approvedRatio: 0,
							votesTotal: 0,
							votesPositive: 0,
							votesNegative: 0,
							votesRating: 0,
							byDiff: (s?.difficulties ?? []).map(diff => {
								return {
									name: diff.difficultyName,
									votesPositive: diff.votesPositive ?? 0,
									votesNegative: diff.votesNegative ?? 0,
									votesTotal: diff.votesTotal ?? 0,
									votesRating: diff.votesRating ?? 0,
									nominated:
										[DifficultyStatus.nominated, DifficultyStatus.qualified, DifficultyStatus.ranked].includes(diff?.status) ||
										!!diff?.nominated ||
										!!diff?.qualified ||
										!!diff?.ranked ||
										diff?.qualification?.timeset
											? 'Yes'
											: 'No',
									qualified:
										diff?.status === DifficultyStatus.qualified || DifficultyStatus.ranked || !!diff?.qualified || !!diff?.ranked
											? 'Yes'
											: 'No',
									mapperAllowed: diff?.qualification?.mapperAllowed ? 'Yes' : 'No',
									criteriaMet:
										diff?.qualification?.criteriaMet === 1
											? 'Yes'
											: diff?.qualification?.criteriaMet === 2
											? 'Failed'
											: diff?.qualification?.criteriaMet === 3
											? 'On hold'
											: 'No',
									approved: diff?.qualification?.approved ? 'Yes' : 'No',
								};
							}),
						}
					);

					return {...s, totals};
				})
				.filter(s => !(s?.difficulties ?? [])?.every(d => [DifficultyStatus.ranked, DifficultyStatus.unrankable].includes(d?.status)));
		} catch (err) {
			error = err;
		} finally {
			isLoading = false;
		}
	}

	function fetchPlayers(players) {
		const cachedPlayerIds = Object.keys($playersCache);

		const playersToFetch = players.filter(
			playerId => !cachedPlayerIds.includes(playerId) || $playersCache[playerId]?.updated + DAY < Date.now()
		);

		if (playersToFetch.length) {
			playersToFetch.map(async playerId =>
				playersApiClient.getProcessed({playerId}).then(player => {
					const {playerId, name} = player ?? {};
					$playersCache[playerId] = {playerId, name, updated: Date.now()};
				})
			);
		}
	}

	async function searchByMapHash(hash) {
		if (!hash?.length) return;

		try {
			mapIsSearched = true;
			mapSearchError = null;
			mapFound = undefined;

			mapFound = await leaderboardByHashApiClient.getProcessed({hash});
		} catch (err) {
			mapSearchError = err;
		} finally {
			mapIsSearched = false;
		}
	}

	function toggleSongDetails(hash) {
		if (!hash?.length) return;

		if (detailsOpened.includes(hash)) detailsOpened = detailsOpened.filter(h => h !== hash);
		else detailsOpened = [...detailsOpened, hash];
	}

	function onSortChange(event) {
		if (!event?.detail?.id) return null;

		if (currentFilters.sortBy === event.detail.id) {
			currentFilters.order = currentFilters.order === 'asc' ? 'desc' : 'asc';
		} else {
			currentFilters.sortBy = event.detail.id;
			currentFilters.order = 'desc';
		}
		findParam('sortBy').value = currentFilters.sortBy;
		findParam('order').value = currentFilters.order;

		navigateToCurrentPageAndFilters();
	}

	function onDiffLabelChange(leaderboardId, event) {
		if (!leaderboardId?.length) return;

		let current = $labelsStore;

		const newLabels = (event?.detail ?? []).map(l => l?.id ?? l?.value).filter(l => l);
		if (newLabels.length) current = {...current, [leaderboardId]: newLabels};
		else delete current[leaderboardId];

		$labelsStore = current;
	}

	function onLogTypeChange(event) {
		logTypeFilter = logTypeFilter.includes(event?.detail)
			? logTypeFilter.filter(p => p?.id !== event?.detail?.id)
			: [...logTypeFilter, event?.detail];
	}

	const getMinQualificationTime = (song, key) =>
		song?.difficulties?.reduce((min, d) => (min < d?.qualification?.[key] ? d.qualification[key] : min), 0) ?? 0;

	const getLogEntry = (song, difficulty) => ({
		song: {
			id: song.id,
			hash: song.hash,
			name: song.name,
			subName: song.subName,
			mapper: song.mapper,
			author: song.author,
			coverImage: song.coverImage,
		},
		difficulty: {
			id: difficulty.id,
			leaderboardId: difficulty.leaderboardId,
			name: difficulty.difficultyName,
			value: difficulty.value,
			mode: difficulty.mode,
			modeName: difficulty.modeName,
			type: difficulty.type,
			stars: difficulty.stars,
		},
	});

	$: updateAllLabels($labelsStore);
	$: updateTags(allLabels);
	$: allLabelsHash = allLabels.map(v => v?.id ?? '').join(':') ?? '';

	$: playerId = $account?.id;
	$: isRT = $account?.player?.playerInfo?.role
		?.split(',')
		?.some(role => ['admin', 'rankedteam', 'juniorrankedteam', 'creator'].includes(role));
	$: if (!$account?.loading && isRT) fetchMaps();
	$: if (!$account?.loading && !isRT) navigate('/');

	$: currentSortValues = sortValues.map(v => {
		return {
			...v,
			iconFa:
				currentFilters?.sortBy === v.id
					? currentFilters?.order === 'asc'
						? 'fas fa-long-arrow-alt-up'
						: 'fas fa-long-arrow-alt-down'
					: v.iconFa,
		};
	});
	$: sortValue = currentSortValues.find(v => v.id === currentFilters.sortBy);

	$: filteredSongs =
		songs
			.filter(s => {
				let result =
					currentFilters?.mine === 'mine'
						? !!(s?.difficulties ?? [])?.some(
								d =>
									d?.qualification?.rtMember === playerId ||
									d?.qualification?.mapperId === playerId ||
									d?.qualification?.criteriaChecker === playerId
						  )
						: currentFilters?.mine === 'others'
						? !!(s?.difficulties ?? [])?.every(
								d =>
									d?.qualification?.rtMember !== playerId &&
									d?.qualification?.mapperId !== playerId &&
									d?.qualification?.criteriaChecker !== playerId
						  )
						: true;

				const statusCond = currentFilters?.status_cond ?? 'or';
				result &&= currentFilters?.status?.length
					? currentFilters.status.reduce((result, key) => {
							const parts = key.split(':');
							key = parts?.length ? parts.shift() : key;
							const values = (parts ?? []).map(v => parseInt(v, 10)).filter(v => !isNaN(v));

							switch (key) {
								case 'nominated':
									if (statusCond === 'or') result ||= s?.totals?.nominated > 0;
									else result &&= s?.totals?.nominated > 0;
									break;

								case 'allowed':
									if (statusCond === 'or') result ||= s?.totals?.mapperAllowed > 0;
									else result &&= s?.totals?.mapperAllowed > 0;
									break;

								case 'criteria':
									switch (statusCond) {
										case 'or':
											result ||= (s?.difficulties ?? [])?.some(d => values.includes(d?.qualification?.criteriaMet));
											break;

										case 'and':
											result &&= (s?.difficulties ?? [])?.some(d => values.includes(d?.qualification?.criteriaMet));
											break;
									}
									break;

								case 'approved':
									if (statusCond === 'or') result ||= s?.totals?.approved > 0;
									else result &&= s?.totals?.approved > 0;
									break;

								case 'current_batch':
									if (statusCond === 'or')
										result ||= (s?.difficulties ?? []).some(
											d => d?.qualification?.approved && willBeRankedInCurrentBatch(d?.qualification?.approvalTimeset)
										);
									else
										result &&= (s?.difficulties ?? []).some(
											d => d?.qualification?.approved && willBeRankedInCurrentBatch(d?.qualification?.approvalTimeset)
										);
									break;

								case 'voted':
									if (statusCond === 'or') result ||= s?.totals?.votesTotal > 0;
									else result &&= s?.totals?.votesTotal > 0;
									break;

								case 'with_stars':
									if (statusCond === 'or') result ||= s?.minStars || s?.maxStars;
									else result &&= s?.minStars || s?.maxStars;
									break;
							}

							return result;
					  }, statusCond !== 'or')
					: true;

				const statusNotCond = currentFilters?.status_not_cond ?? 'or';
				result &&= currentFilters?.status_not?.length
					? currentFilters.status_not.reduce((result, key) => {
							const parts = key.split(':');
							key = parts?.length ? parts.shift() : key;
							const values = (parts ?? []).map(v => parseInt(v, 10)).filter(v => !isNaN(v));

							switch (key) {
								case 'nominated':
									if (statusNotCond === 'or') result ||= s?.totals?.nominated < s?.difficulties?.length;
									else result &&= s?.totals?.nominated < s?.difficulties?.length;
									break;

								case 'allowed':
									if (statusNotCond === 'or') result ||= s?.totals?.mapperAllowed < s?.difficulties?.length;
									else result &&= s?.totals?.mapperAllowed < s?.difficulties?.length;
									break;

								case 'criteria':
									switch (statusCond) {
										case 'or':
											result ||= (s?.difficulties ?? [])?.some(d => !values.includes(d?.qualification?.criteriaMet));
											break;

										case 'and':
											result &&= (s?.difficulties ?? [])?.some(d => !values.includes(d?.qualification?.criteriaMet));
											break;
									}
									break;

								case 'approved':
									if (statusNotCond === 'or') result ||= s?.totals?.approved < s?.difficulties?.length;
									else result &&= s?.totals?.approved < s?.difficulties?.length;
									break;

								case 'current_batch':
									if (statusNotCond === 'or')
										result ||= (s?.difficulties ?? []).every(
											d => !d?.qualification?.approved || !willBeRankedInCurrentBatch(d?.qualification?.approvalTimeset)
										);
									else
										result &&= (s?.difficulties ?? []).every(
											d => !d?.qualification?.approved || !willBeRankedInCurrentBatch(d?.qualification?.approvalTimeset)
										);
									break;

								case 'voted':
									if (statusNotCond === 'or') result ||= s?.totals?.votesTotal === 0;
									else result &&= s?.totals?.votesTotal === 0;
									break;

								case 'with_stars':
									if (statusNotCond === 'or') result ||= !s?.minStars && !s?.maxStars;
									else result &&= !s?.minStars && !s?.maxStars;
							}

							return result;
					  }, statusNotCond !== 'or')
					: true;

				result &&= currentFilters?.mapper?.length
					? (s?.mapper?.toLowerCase() ?? '').indexOf(currentFilters.mapper.toLowerCase()) >= 0
					: true;

				result &&= currentFilters?.name?.length
					? `${s?.name?.toLowerCase() ?? ''} ${s?.subName?.toLowerCase() ?? ''}`.indexOf(currentFilters.name.toLowerCase()) >= 0
					: true;

				result &&=
					currentFilters?.star_range?.length === 2 &&
					currentFilters?.star_range?.toString() !== findParam('star_range')?.default?.toString()
						? (s?.difficulties ?? [])?.some(d => currentFilters.star_range[0] < d.stars && d.stars < currentFilters.star_range[1])
						: true;

				const mapTypeCond = currentFilters?.mapType_cond ?? 'or';
				if (currentFilters?.mapType?.length) {
					switch (mapTypeCond) {
						case 'or':
							result &&= (s?.difficulties ?? [])?.some(d => currentFilters.mapType.some(t => d.type & t));
							break;

						case 'and':
							result &&= (s?.difficulties ?? [])?.some(d => currentFilters.mapType.every(t => d.type & t));
							break;
					}
				}

				const tagsCond = currentFilters?.tags_cond ?? 'or';
				if (currentFilters?.tags?.length) {
					const songLabels = s?.difficulties?.map(d => $labelsStore[d?.leaderboardId] ?? null).filter(l => l) ?? [];

					switch (tagsCond) {
						case 'or':
							result &&= songLabels.some(labels => currentFilters.tags.some(filterLabel => labels.includes(filterLabel)));
							break;

						case 'and':
							result &&= songLabels.some(labels => currentFilters.tags.every(filterLabel => labels.includes(filterLabel)));
							break;
					}
				}

				const noTagsCond = currentFilters?.tags_not_cond ?? 'or';
				if (currentFilters?.tags_not?.length) {
					switch (noTagsCond) {
						case 'or':
							result &&= (s?.difficulties ?? []).some(
								d => !currentFilters.tags_not.some(filterLabel => ($labelsStore[d?.leaderboardId] ?? []).includes(filterLabel))
							);
							break;

						case 'and':
							result &&= (s?.difficulties ?? []).some(d =>
								currentFilters.tags_not.some(filterLabel => !($labelsStore[d?.leaderboardId] ?? []).includes(filterLabel))
							);
							break;
					}
				}

				return result;
			})
			.sort((a, b) => {
				switch (currentFilters?.sortBy) {
					case 'min_stars':
						return currentFilters?.order === 'asc' ? a?.minStars - b?.minStars : b?.minStars - a?.minStars;

					case 'max_stars':
						return currentFilters?.order === 'asc' ? a?.maxStars - b?.maxStars : b?.maxStars - a?.maxStars;

					case 'name':
						return currentFilters?.order === 'asc' ? a?.name.localeCompare(b.name) : b?.name?.localeCompare(a.name);

					case 'votescount':
						return currentFilters?.order === 'asc'
							? a?.totals?.votesTotal - b?.totals?.votesTotal
							: b?.totals?.votesTotal - a?.totals?.votesTotal;

					case 'votesrating':
						return currentFilters?.order === 'asc'
							? a?.totals?.votesRating - b?.totals?.votesRating
							: b?.totals?.votesRating - a?.totals?.votesRating;

					case 'nomination':
						const minNominationTimeA = getMinQualificationTime(a, 'timeset');
						const minNominationTimeB = getMinQualificationTime(b, 'timeset');

						return currentFilters?.order === 'asc' ? minNominationTimeA - minNominationTimeB : minNominationTimeB - minNominationTimeA;

					case 'criteria':
						const minCriteraTimeA = getMinQualificationTime(a, 'criteriaTimeset');
						const minCriteriaTimeB = getMinQualificationTime(b, 'criteriaTimeset');

						return currentFilters?.order === 'asc' ? minCriteraTimeA - minCriteriaTimeB : minCriteriaTimeB - minCriteraTimeA;

					case 'approval':
						const minApprovalTimeA = getMinQualificationTime(a, 'approvalTimeset');
						const minApprovalTimeB = getMinQualificationTime(b, 'approvalTimeset');

						return currentFilters?.order === 'asc' ? minApprovalTimeA - minApprovalTimeB : minApprovalTimeB - minApprovalTimeA;

					default:
						return 0;
				}
			}) ?? [];

	$: diffsCount = filteredSongs?.reduce((cnt, s) => cnt + (s?.difficulties?.length ?? 0), 0) ?? 0;

	$: events = filteredSongs
		.reduce((carry, song) => {
			carry = [
				...carry,
				...(song?.difficulties?.reduce((diffCarry, difficulty) => {
					if (difficulty?.qualification) {
						const qual = difficulty.qualification;

						if (qual.rtMember?.length && qual.timeset)
							diffCarry.push({
								...getLogEntry(song, difficulty),
								timestamp: dateFromUnix(qual.timeset),
								playerId: qual.rtMember,
								type: 'nomination',
								value: null,
								desc: ``,
							});

						if (qual.criteriaMet && qual.criteriaTimeset && qual.criteriaChecker?.length)
							diffCarry.push({
								...getLogEntry(song, difficulty),
								timestamp: dateFromUnix(qual.criteriaTimeset),
								playerId: qual.criteriaChecker,
								type: 'criteria',
								value: qual.criteriaMet,
								notes: qual.criteriaCommentary,
								desc: `${qual.criteriaMet === 1 ? 'ok' : `${qual.criteriaCommentary ?? 'no description'}`}`,
								level: qual.criteriaMet === 2 ? 'error' : 'info',
							});

						if (qual.approved && qual.approvers?.length && qual.approvalTimeset)
							diffCarry.push({
								...getLogEntry(song, difficulty),
								timestamp: dateFromUnix(qual.approvalTimeset),
								playerId: qual.approvers,
								type: 'approval',
								value: null,
								desc: `ok`,
								level: 'ok',
							});

						if (qual?.changes?.length) {
							qual.changes.forEach(change => {
								[
									{
										field: 'Rankability',
										type: 'nomination',
										shouldAdd: (field, change, diff) =>
											!!change?.[`new${field}`] !== diff?.nominated || change?.['timeset'] !== diff?.nominatedTime,
										notes: (field, change, diff) => (!!change?.[`new${field}`] ? 'unrankable' : ''),
										level: (field, change, diff) => (!!change?.[`new${field}`] ? 'error' : 'info'),
									},
									{
										field: 'CriteriaMet',
										type: 'criteria',
										shouldAdd: (field, change, diff) =>
											change?.[`new${field}`] !== diff?.qualification?.criteriaMet ||
											change?.['timeset'] !== diff?.qualification?.criteriaTimeset,
										notes: (field, change, diff) =>
											change?.[`new${field}`] === 2 ? diff?.qualification?.criteriaCommentary ?? 'no description' : 'ok',
										level: (field, change, diff) => (change?.[`new${field}`] === 2 ? 'error' : 'info'),
									},
									{
										field: 'Stars',
										type: 'stars',
										shouldAdd: () => true,
										notes: (field, change, diff) => `${change?.[`old${field}`]}★ → ${change?.[`new${field}`]}★`,
										level: () => 'info',
									},
									{
										field: 'Type',
										type: 'category',
										shouldAdd: () => true,
										notes: (field, change, diff) =>
											`${mapTypeFromMask(change?.[`old${field}`])} → ${mapTypeFromMask(change?.[`new${field}`])}`,
										level: () => 'info',
									},
								].forEach(def => {
									if (
										change?.[`new${def.field}`] === undefined ||
										change?.[`new${def.field}`] === change?.[`old${def.field}`] ||
										!def?.shouldAdd(def.field, change, difficulty)
									)
										return;

									diffCarry.push({
										...getLogEntry(song, difficulty),
										timestamp: dateFromUnix(change?.timeset),
										playerId: change?.playerId ?? null,
										type: def.type,
										value: change?.[`new${def.field}`],
										notes: def?.notes(def.field, change, difficulty) ?? '',
										desc: def?.notes(def.field, change, difficulty) ?? '',
										level: def?.level(def.field, change, difficulty) ?? 'info',
									});
								});
							});
						}
					}

					return diffCarry;
				}, []) ?? []),
			];

			return carry;
		}, [])
		.sort((a, b) => b.timestamp - a.timestamp);
	$: eventsPlayers = [...new Set(events.map(e => e?.playerId).filter(playerId => playerId))];
	$: fetchPlayers(eventsPlayers);

	$: filteredEventLog = events?.filter(
		e =>
			(!logPlayerFilter?.length || $playersCache[e?.playerId]?.name?.toLowerCase()?.indexOf(logPlayerFilter.toLowerCase()) >= 0) &&
			(!logTypeFilter?.length ||
				logTypeFilter
					.map(lt => lt.id)
					.filter(lt => lt)
					.includes(e.type))
	);
</script>

<svelte:head>
	<title>RT Dashboard</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade>
		<ContentBox>
			<h1 class="title is-3">
				{#if !error && !isLoading}
					<i
						class="fa-calendar"
						class:fas={showEventLog}
						class:far={!showEventLog}
						title="Click to show/hide event log"
						on:click={() => (showEventLog = !showEventLog)} />
				{/if}

				<i
					class="fas"
					class:fa-search-location={showMapSearch}
					class:fa-search={!showMapSearch}
					title="Click to show/hide map search tool"
					on:click={() => (showMapSearch = !showMapSearch)} />

				RT Dashboard
				{#if !error && !isLoading}
					/ {formatNumber(filteredSongs?.length, 0)} song(s) / {formatNumber(diffsCount, 0)} diff(s)
				{/if}
			</h1>

			{#if showMapSearch}
				<div class="map-search">
					<div class="form">
						<input
							type="text"
							bind:value={mapHash}
							placeholder="Search for a map hash..."
							on:focus={e => e?.target?.select()}
							on:keyup={e => {
								if (e.key === 'Enter') searchByMapHash(mapHash);
							}} />
						<Button
							label="Search"
							iconFa="fas fa-search"
							type="primary"
							loading={mapIsSearched}
							disabled={mapIsSearched}
							on:click={() => searchByMapHash(mapHash)} />
					</div>

					{#if mapSearchError}
						<Error error={mapSearchError} />
					{:else if mapFound}
						<div class="row">
							<div class="song">
								<img src={mapFound?.song.coverImage} alt="Cover" />

								<div class="songinfo">
									<a href={`/leaderboard/global/${mapFound?.leaderboards?.[0]?.id}/1`} target="_blank">
										<span class="name">{mapFound?.song?.name} {mapFound?.song?.subName}</span>
										<div class="author">{mapFound?.song?.author} <small>{mapFound?.song?.mapper}</small></div>
									</a>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<section class="content">
				{#if error}
					<Error {error} />
				{:else if isLoading}
					<Spinner /> Loading...
				{:else if filteredSongs?.length}
					{#if showEventLog}
						<section class="event-log">
							<div class="log-filter">
								<Switcher values={logTypeValues} value={logTypeFilter} multi={true} on:change={onLogTypeChange} />

								<input type="text" bind:value={logPlayerFilter} placeholder="Search for a player name..." />
							</div>

							<div class="wrapper">
								<table width="100%">
									<thead>
										<tr>
											<th>When</th>
											<th>Who</th>
											<th>Action</th>
											<th>Song</th>
											<th>Diff</th>
											<th>Notes</th>
										</tr>
									</thead>

									<tbody>
										{#each filteredEventLog as event, idx (idx + event?.type + event?.player?.id + event?.difficulty?.leaderboardId + event?.timestamp)}
											<tr class:ok={event?.level === 'ok'} class:error={event?.level === 'error'}>
												<td title={formatDate(event.timestamp, 'short', 'short')}>{formatDateRelative(new Date(event.timestamp))}</td>
												<td>
													<a href={`/u/${event?.playerId}`} target="_blank"
														>{$playersCache?.[event?.playerId]?.name ?? event?.playerId ?? 'Unknown'}</a>
												</td>
												<td>{event.type}</td>
												<td>
													<a href={`/leaderboard/global/${event.difficulty?.leaderboardId}/1`} target="_blank">
														{event.song?.name}
														{event.song?.subName} / {event.song?.mapper}
													</a>
												</td>
												<td>
													<a href={`/leaderboard/global/${event.difficulty?.leaderboardId}/1`} target="_blank">
														<Difficulty
															diff={{type: event.difficulty?.modeName, diff: event.difficulty?.name}}
															stars={event.difficulty?.stars}
															nameAndStars={true}
															reverseColors={true} />
													</a>
												</td>
												<td>{event.desc}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</section>
					{/if}

					{#each filteredSongs as song (song.hash)}
						<div class="row">
							<div class="song">
								<img
									src={song.coverImage}
									alt="Cover"
									on:click={() => copyToClipboard(song.hash)}
									title={`Click to copy hash "${song.hash}"`} />

								<div class="songinfo">
									<a href={`/leaderboard/global/${song?.difficulties?.[0]?.leaderboardId}/1`} target="_blank">
										<span class="name">{song?.name} {song?.subName}</span>
										<div class="author">{song?.author} <small>{song?.mapper}</small></div>
									</a>
								</div>

								<div>
									<Totals totals={song.totals} count={song?.difficulties?.length} />

									<span
										class="reveal clickable"
										class:opened={detailsOpened.includes(song.hash)}
										on:click={() => toggleSongDetails(song.hash)}
										title="Show details">
										<i class="fas fa-chevron-down" />
									</span>
								</div>
							</div>

							{#if detailsOpened.includes(song.hash)}
								{#each song.difficulties as difficulty (difficulty.id)}
									<div class="song-diff">
										<div class="diff-name">
											<a href="/leaderboard/global/{difficulty.leaderboardId}/1">
												<Difficulty
													diff={{type: difficulty?.modeName, diff: difficulty?.difficultyName}}
													stars={difficulty?.stars}
													nameAndStars={true}
													reverseColors={true} />

												{#if !difficulty.stars}
													<span>No star rating yet</span>
												{/if}
											</a>

											<MapTypeDescription type={difficulty?.type} />

											<Totals totals={difficulty} />
										</div>

										{#if difficulty?.qualification}
											<div>
												<QualificationStatus qualification={difficulty?.qualification} />
											</div>
										{:else}
											<div>Not yet nominated.</div>
										{/if}

										<div
											class="tags"
											style="--clearSelectTop: 8px; --multiItemBG: var(--selected); --multiClearBG: var(--selected); --listBackground:
	var(--background); --inputColor: var(--textColor); --multiSelectPadding: 2px 35px 2px 4px; --itemColor:
	var(--textColor); --itemHoverColor: var(--textColor); --itemHoverBG: var(--selected)">
											<Select
												value={allLabels.filter(l => ($labelsStore?.[difficulty?.leaderboardId] ?? []).includes(l.id))}
												items={allLabels}
												optionIdentifier="id"
												placeholder="Click to add tag..."
												isSearchable={true}
												isMulti={true}
												isCreatable={true}
												placeholderAlwaysShow={true}
												on:select={e => onDiffLabelChange(difficulty?.leaderboardId, e)} />
										</div>
									</div>
								{/each}
							{/if}
						</div>
					{/each}
				{:else}
					No songs found.
				{/if}
			</section>
		</ContentBox>
	</article>

	<aside>
		<ContentBox>
			{#if !isLoading}
				<section class="filter">
					<label>Sorting</label>
					<Switcher values={currentSortValues} value={sortValue} on:change={onSortChange} />
				</section>

				{#each params as param}
					{#if param.type}
						<section class="filter">
							<label>
								{param?.label ?? param?.key ?? ''}

								{#if param?.multi && param?.withCondition}
									<select value={param.valueCondition} on:change={param.onConditionChange}>
										<option value="or">ANY </option><option value="and">ALL </option>
									</select>
								{/if}
							</label>

							{#if param?.type === 'input'}
								<input type="text" placeholder={param.placeholder ?? null} value={param.value} on:input={param.onChange} />
							{:else if param?.type === 'switch'}
								<Switcher values={param.values} value={param.value} multi={!!param?.multi} on:change={param.onChange} />
							{:else if param?.type === 'slider'}
								<RangeSlider
									range
									min={param.min}
									max={param.max}
									step={param.step}
									values={param.values}
									float
									hoverable
									pips
									pipstep={param.pipstep}
									all="label"
									on:change={param.onChange} />
							{:else if param?.type === 'tags'}
								{#key allLabelsHash}
									<div
										class="tags"
										style=" --clearSelectTop: 8px; --multiItemBG: var(--selected); --multiClearBG: var(--selected); --listBackground:
	var(--background); --inputColor: var(--textColor); --multiSelectPadding: 2px 35px 2px 4px; --itemColor:
	var(--textColor); --itemHoverColor: var(--textColor); --itemHoverBG: var(--selected)">
										<Select
											value={param.value}
											items={param.values}
											optionIdentifier="id"
											placeholder="Click to select..."
											isSearchable={true}
											isMulti={true}
											placeholderAlwaysShow={true}
											on:select={param.onChange}
											{allLabelsHash} />
									</div>
								{/key}
							{/if}
						</section>
					{/if}
				{/each}
			{:else}
				<Spinner /> Loading...
			{/if}
		</ContentBox>
	</aside>
</section>

<style>
	.align-content {
		display: flex;
		justify-content: flex-end !important;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	h1 {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	h1 > i {
		font-size: 0.875em;
		cursor: pointer !important;
	}

	input {
		width: 100%;
		max-width: 25em;
		font-size: 1em;
		color: var(--beatleader-primary);
		background-color: var(--foreground);
		border: none;
		border-bottom: 1px solid var(--faded);
		outline: none;
	}

	.map-search {
		padding-bottom: 2rem;
		margin-bottom: 2rem;
		border-bottom: 1px solid var(--faded);
	}

	.map-search .form {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.map-search input {
		font-size: inherit;
		max-width: none;
	}

	.event-log {
		max-width: calc(100vw - 2rem);
		font-size: 0.85em;
		margin-bottom: 2rem;
	}

	.event-log .wrapper {
		max-height: 70vh;
		overflow-y: scroll;
	}

	.event-log .wrapper::-webkit-scrollbar {
		width: 0.25rem;
	}
	.event-log .wrapper::-webkit-scrollbar-thumb {
		background-color: var(--beatleader-primary, #eb008cff);
		border-radius: 6px;
		border: 3px solid var(--beatleader-primary, #eb008cff);
	}

	.event-log .log-filter {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.event-log table th,
	.event-log table td {
		padding: 0.25em 0.5em;
		vertical-align: middle;
	}

	.event-log table th {
		text-align: center;
	}

	.event-log table th:first-child {
		width: 7em;
	}

	.event-log table td:nth-child(3) {
		text-align: center;
	}

	.event-log table td:nth-child(4) {
		font-weight: bold;
	}

	.event-log table th:nth-child(5) {
		width: 5.5em;
	}

	.event-log tr.ok {
		color: green;
	}

	.event-log tr.error {
		color: orange;
	}

	.event-log :global(.diff) {
		display: block;
		max-height: none;
	}

	aside {
		width: 30em;
	}

	aside .filter {
		margin-bottom: 0.5rem;
		transition: opacity 300ms;
	}

	aside .filter.disabled {
		opacity: 0.25;
	}

	aside label {
		display: inline-flex;
		gap: 0.5rem;
		font-weight: 500;
		margin: 0.75rem 0;
	}

	aside .filter:first-child label {
		margin-top: 0;
	}

	aside label select {
		background-color: transparent;
	}

	aside label select option {
		color: var(--textColor);
		background-color: var(--background);
	}

	aside .filter.disabled label {
		cursor: help;
	}

	aside label span {
		color: var(--beatleader-primary);
	}

	aside :global(.switch-types) {
		justify-content: flex-start;
	}

	aside h2:not(:first-of-type) {
		margin-top: 1.5em;
	}

	aside :global(.rangeSlider.pip-labels) {
		margin-top: 1.5em;
		margin-bottom: 4em;
	}

	.row {
		border-bottom: 1px solid gray;
		padding: 0.5rem 0;
	}

	.map-search .row {
		border-bottom: none;
	}

	.song {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.songinfo {
		flex-grow: 1;
		text-align: left;
		font-size: 0.95rem;
		font-weight: 500;
		max-width: 35rem;
	}

	.songinfo {
		color: var(--alternate);
	}

	.songinfo small {
		margin-left: 0.25em;
		font-size: 0.75em;
		color: var(--ppColour);
	}

	.song img {
		width: 3rem;
		height: 3rem;
	}

	.reveal {
		cursor: pointer;
		transition: transform 500ms;
		transform-origin: 0.42em 0.8em;
		margin-left: 0.5rem;
	}

	.reveal.opened {
		transform: rotateZ(180deg);
	}

	.song-diff {
		margin: 1rem 0;
	}

	.song-diff .diff-name {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
	}

	.song-diff:last-child {
		margin-bottom: 0;
	}

	.song-diff > a {
		margin-bottom: 0.5rem;
	}

	.song-diff .tags {
		margin-top: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		max-width: 30rem;
	}

	.tags :global(.badge-bg) {
		background: rgba(255, 255, 255, 0.123);
		border-bottom: 2px solid transparent;
		border-radius: 0.1rem;
		padding: 0.5rem;
		filter: saturate(0.5) brightness(1.4);
		transform: scale(0.8);
		font-weight: 400 !important;
		color: white !important;
		margin: 0 0;
	}

	.tags :global(.listContainer) {
		background-color: var(--background) !important;
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column-reverse;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}
	}
</style>


<Constants bind:this={constants} />

