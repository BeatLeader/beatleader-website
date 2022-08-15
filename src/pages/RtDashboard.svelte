<script>
	import {fade} from 'svelte/transition';
	import {navigate} from 'svelte-routing';
	import createAccountStore from '../stores/beatleader/account';
	import createLocalStorageStore from '../stores/localstorage';
	import apiClient from '../network/clients/beatleader/leaderboard/api-leaderboards';
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
	import Totals from '../components/Rt/Totals.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import Difficulty from '../components/Song/Difficulty.svelte';
	import MapTypeDescription from '../components/Leaderboard/MapTypeDescription.svelte';
	import Select from 'svelte-select';

	export let location;

	document.body.classList.add('remove');

	const account = createAccountStore();
	const labelsStore = createLocalStorageStore('rt-maps-labels');

	const ITEMS_PER_PAGE = 100;
	const VOTED = 100; // max 100

	let allLabels = [];

	const updateAllLabels = store => {
		allLabels = [...new Set(Object.values(store).reduce((carry, labels) => [...carry, ...labels], []))].map(label => ({
			id: label,
			label: label,
		}));
	};

	updateAllLabels($labelsStore);

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

	let sortValue = sortValues[0];

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
			type: 'switch',
			value: [],
			valueCondition: 'or',
			values: [
				{id: 'nominated', label: 'Nominated'},
				{id: 'allowed', label: 'Mapper allowed'},
				{id: 'criteria', label: 'Criteria checked'},
				{id: 'approved', label: 'RT approved'},
				{id: 'voted', label: 'Has votes'},
				{id: 'with_stars', label: 'Has stars'},
			],
			onChange: e => onMultiSwitchChange(e, 'status'),
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
			type: 'switch',
			value: [],
			valueCondition: 'or',
			values: [
				{id: 'nominated', label: 'Nominated'},
				{id: 'allowed', label: 'Mapper allowed'},
				{id: 'criteria', label: 'Criteria checked'},
				{id: 'approved', label: 'RT approved'},
				{id: 'voted', label: 'Has votes'},
				{id: 'with_stars', label: 'Has stars'},
			],
			onChange: e => onMultiSwitchChange(e, 'status_not'),
			multi: true,
			withCondition: true,
			onConditionChange: e => onConditionChange(e, 'status_not'),
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
			default: [0, 20],
			min: 0,
			max: 20,
			step: 0.1,
			pipstep: 25,
			type: 'slider',
			process: processIntArrayFilter,
			values: [],
			onChange: e => rangeChange(e, 'star_range'),
		},
		{
			key: 'sortBy',
			default: 'max_stars',
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
					currentFilters[p.key] = p.multi ? (p?.value ?? [])?.map(p => p.id) : p?.value ?? '';
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
		const param = findParam('tags');
		if (param) {
			const currentValues = param?.value?.map(v => v?.id)?.filter(v => v) ?? [];
			param.values = allLabels;
			param.value = allLabels.filter(l => currentValues.includes(l.id));
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

	async function fetchAllMapsWithType(type, sortBy = 'stars') {
		let data = [];
		let page = 1;
		let count = ITEMS_PER_PAGE;
		let pageCount = null;

		while (!pageCount || page <= pageCount) {
			const pageData = await apiClient.getProcessed({page, filters: {type, sortBy, count}});

			if (!pageData?.data?.length) return data;

			data = [...data, ...pageData.data.map(map => ({...map, type}))];

			if (!pageCount) {
				count = pageData?.metadata?.itemsPerPage ?? ITEMS_PER_PAGE;
				pageCount = pageData?.metadata?.total ? Math.ceil(pageData.metadata.total / count) : null;
			}

			page++;
		}

		return data;
	}

	async function fetchVotedMaps() {
		const data = await apiClient.getProcessed({page: 1, filters: {sortBy: 'votecount', count: VOTED}});

		return data?.data?.map(map => ({...map, type: 'voted'})) ?? [];
	}

	async function fetchMaps() {
		try {
			isLoading = true;
			error = null;

			songs = Object.values(
				(
					await Promise.all([
						fetchAllMapsWithType('nominated'),
						fetchAllMapsWithType('qualified'),
						fetchAllMapsWithType('nominated', 'votecount'),
						fetchAllMapsWithType('qualified', 'votecount'),
						fetchVotedMaps(),
					])
				)
					.reduce((carry, maps) => [...carry, ...maps], [])
					.reduce((carry, map) => {
						const {difficulty, qualification, song, votes, ...rest} = map;

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

						const diffIdx = carry[song.hash]?.difficulties?.findIndex(d => d.id === difficulty.id);
						if (diffIdx >= 0) {
							const votesPositive = votes?.reduce((sum, v) => sum + (v?.rankability > 0 ? 1 : 0), 0) ?? 0;
							const votesNegative =
								votes?.reduce((sum, v) => sum + (Number.isFinite(v?.rankability) && v.rankability <= 0 ? 1 : 0), 0) ?? 0;

							const votesTotal = votes?.length ?? 0;
							const votesScore = votesTotal ? votesPositive / votesTotal : 0;
							const votesRating = votesScore - (votesScore - 0.5) * Math.pow(2, -Math.log10(votesTotal + 1));

							carry[song.hash].difficulties[diffIdx] = {
								...rest,
								...carry[song.hash].difficulties[diffIdx],
								qualification,
								leaderboardId: rest?.id,
								votes,
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
							carry.nominated += !!diff?.qualification ? 1 : 0;
							carry.mapperAllowed += diff?.qualification?.mapperAllowed ? 1 : 0;
							carry.criteriaMet += diff?.qualification?.criteriaMet === 1 ? 1 : 0;
							carry.approved += diff?.qualification?.approved ? 1 : 0;
							carry.votesTotal += diff?.votes?.length ?? 0;
							carry.votesPositive += diff?.votesPositive ?? 0;
							carry.votesNegative += diff?.votesNegative ?? 0;

							['nominated', 'mapperAllowed', 'criteriaMet', 'approved'].forEach(key => {
								carry[`${key}Ratio`] = s?.difficulties?.length ? carry[key] / s.difficulties.length : 0;
							});

							const votesScore = carry.votesTotal ? carry.votesPositive / carry.votesTotal : 0;
							carry.votesRating = votesScore - (votesScore - 0.5) * Math.pow(2, -Math.log10(carry.votesTotal + 1));

							return carry;
						},
						{
							nominated: 0,
							nominatedRatio: 0,
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
						}
					);

					return {...s, totals};
				})
				.filter(s => !s?.difficulties?.every(d => d?.ranked));
		} catch (err) {
			error = err;
		} finally {
			isLoading = false;
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

	const getMinQualificationTime = (song, key) =>
		song?.difficulties?.reduce((min, d) => (min < d?.qualification?.[key] ? d.qualification[key] : min), 0) ?? 0;

	$: updateAllLabels($labelsStore);
	$: updateTags(allLabels);
	$: allLabelsHash = allLabels.map(v => v?.id ?? '').join(':') ?? '';

	$: playerId = $account?.id;
	$: isRT = $account?.player?.playerInfo?.role?.split(',')?.some(role => ['admin', 'rankedteam', 'creator'].includes(role));
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
						? !!s?.difficulties?.some(
								d =>
									d?.qualification?.rtMember === playerId ||
									d?.qualification?.mapperId === playerId ||
									d?.qualification?.criteriaChecker === playerId
						  )
						: true;

				const statusCond = currentFilters?.status_cond ?? 'or';
				result &&= currentFilters?.status?.length
					? currentFilters.status.reduce((result, key) => {
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
									if (statusCond === 'or') result ||= s?.totals?.criteriaMet > 0;
									else result &&= s?.totals?.criteriaMet > 0;
									break;

								case 'approved':
									if (statusCond === 'or') result ||= s?.totals?.approved > 0;
									else result &&= s?.totals?.approved > 0;
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
									if (statusNotCond === 'or') result ||= s?.totals?.criteriaMet < s?.difficulties?.length;
									else result &&= s?.totals?.criteriaMet < s?.difficulties?.length;
									break;

								case 'approved':
									if (statusNotCond === 'or') result ||= s?.totals?.approved < s?.difficulties?.length;
									else result &&= s?.totals?.approved < s?.difficulties?.length;
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
						? s?.difficulties?.some(d => currentFilters.star_range[0] < d.stars && d.stars < currentFilters.star_range[1])
						: true;

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
</script>

<svelte:head>
	<title>RT Dashboard</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade>
		<ContentBox>
			<h1 class="title is-3">
				RT Dashboard
				{#if !error && !isLoading}
					/ {formatNumber(filteredSongs?.length, 0)} song(s) / {formatNumber(diffsCount, 0)} diff(s)
				{/if}
			</h1>

			<section class="content">
				{#if error}
					<Error {error} />
				{:else if isLoading}
					<Spinner /> Loading...
				{:else if filteredSongs?.length}
					{#each filteredSongs as song (song.hash)}
						<div class="row">
							<div class="song">
								<img
									src={song.coverImage}
									alt="Cover"
									on:click={() => copyToClipboard(song.hash)}
									title={`Click to copy hash "${song.hash}"`} />

								<div class="songinfo">
									<span class="name">{song?.name} {song?.subName}</span>
									<div class="author">{song?.author} <small>{song?.mapper}</small></div>
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
				<h2 class="title is-5">Sorting</h2>

				<Switcher values={currentSortValues} value={sortValue} on:change={onSortChange} />

				<h2 class="title is-5">Filtering</h2>
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

	aside {
		width: 30em;
	}

	aside .filter {
		margin-bottom: 1.5rem;
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

	aside input {
		width: 100%;
		font-size: 1em;
		color: var(--beatleader-primary);
		background-color: var(--foreground);
		border: none;
		border-bottom: 1px solid var(--faded);
		outline: none;
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
