<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import {
		createBuildFiltersFromLocation,
		buildSearchFromFilters,
		processStringFilter,
		processStringArrayFilter,
		processIntArrayFilter,
	} from '../utils/filters';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import ssrConfig from '../ssr-config';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import RankingTable from '../components/Ranking/RankingTable.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import {debounce} from '../utils/debounce';
	import Switcher from '../components/Common/Switcher.svelte';
	import Countries from '../components/Ranking/Countries.svelte';

	export let page = 1;
	export let location;

	document.body.classList.remove('slim');

	const FILTERS_DEBOUNCE_MS = 500;

	const findParam = key => params.find(p => p.key === key);

	const onInputChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = e.target.value ?? '';

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

	let start = null;

	var rangeChange = (event, key) => {
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
			key: 'search',
			label: 'Player Name',
			default: '',
			process: processStringFilter,
			type: 'input',
			value: '',
			placeholder: 'Search for a player',
			onChange: e => {
				const length = e?.target?.value?.length;
				if (length > 0 && length < 3) return;

				onInputChange(e, 'search');
			},
		},
		{
			key: 'countries',
			label: 'Countries',
			default: '',
			process: processStringArrayFilter,
			type: 'countries',
			value: [],
			values: [],
			onChange: e => {
				const param = findParam('countries');
				if (param) {
					param.value = e?.detail ?? [];

					updateCurrentFiltersFromParams();
				}
			},
			multi: true,
		},
		{
			key: 'platform',
			label: 'Platform',
			default: '',
			process: processStringArrayFilter,
			type: 'switch',
			value: [],
			values: [
				{id: 'steam', label: 'Steam'},
				{id: 'oculus', label: 'Quest'},
				{id: 'oculuspc', label: 'Oculus'},
			],
			onChange: e => onMultiSwitchChange(e, 'platform'),
			multi: true,
		},
		{
			key: 'hmd',
			label: 'HMD',
			default: '',
			process: processStringArrayFilter,
			type: 'switch',
			value: [],
			values: [
				{id: '1', label: 'Rift CV1'},
				{id: '16', label: 'Rift S'},
				{id: '32', label: 'Quest 1'},
				{id: '256', label: 'Quest 2'},
				{id: '8', label: 'WMR'},
				{id: '64', label: 'Valve Index'},
				{id: '2', label: 'Vive'},
				{id: '4', label: 'Vive Pro'},
				{id: '128', label: 'Vive Cosmos'},
			],
			onChange: e => onMultiSwitchChange(e, 'hmd'),
			multi: true,
		},
		{
			key: 'role',
			label: 'Role',
			default: '',
			process: processStringArrayFilter,
			type: 'switch',
			value: [],
			values: [
				{id: 'admin', label: 'Administrator'},
				{id: 'creator', label: 'BL creator'},
				{id: 'rankedteam', label: 'Ranking Team'},
				{id: 'mapper', label: 'Mapper'},
				{id: 'tipper', label: 'Tipper'},
				{id: 'supporter', label: 'Supporter'},
				{id: 'sponsor', label: 'Sponsor'},
			],
			onChange: e => onMultiSwitchChange(e, 'role'),
			multi: true,
		},
		{
			key: 'pp_range',
			label: 'Pp range',
			default: [0, 20000],
			min: 0,
			max: 20000,
			step: 1,
			pipstep: 4000,
			type: 'slider',
			process: processIntArrayFilter,
			values: [],
			onChange: e => rangeChange(e, 'pp_range'),
		},
		{
			key: 'score_range',
			label: 'Scores count',
			default: [0, 2000],
			min: 0,
			max: 2000,
			step: 1,
			pipstep: 250,
			type: 'slider',
			process: processIntArrayFilter,
			values: [],
			onChange: e => rangeChange(e, 'score_range'),
		},
		{
			key: 'sortBy',
			default: 'pp',
			process: processStringFilter,
			type: null,
		},
		{
			key: 'order',
			default: 'desc',
			process: processStringFilter,
			type: null,
		},
		{
			key: 'mapsType',
			default: 'ranked',
			process: processStringFilter,
			type: null,
		},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		params.forEach(p => {
			if (p.bitArray) {
				p.value = (p?.values ?? []).filter(v => Number.isFinite(v.id) && (1 << v.id) & (filters?.[p.key] ?? 0));
				filters[p.key] = filters[p.key] ?? 0;
			} else if (p.key === 'countries') {
				p.value = Array.isArray(filters?.[p.key]) ? filters[p.key] : p?.default ?? [];
				filters[p.key] = filters[p.key] ?? [];
			} else if (p.key === 'pp_range' || p.key === 'score_range') {
				p.values = Array.isArray(filters?.[p.key]) && filters[p.key].length ? filters[p.key] : p?.default ?? [];
				filters[p.key] = filters[p.key] ?? 0;
			} else {
				filters[p.key] = p.multi
					? (p?.values ?? [])?.map(v => v?.id)?.filter(v => filters?.[p.key]?.includes(v)) ?? p?.default ?? []
					: filters?.[p.key]?.length
					? filters[p.key]
					: p?.default ?? '';

				p.value = p.multi
					? p?.values?.filter(v => filters?.[p.key]?.includes(v.id)) ?? p?.default ?? []
					: filters?.[p.key] ?? p?.default ?? '';
			}
		});

		return filters;
	});

	document.body.classList.add('slim');

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentPage = page;
	let currentFilters = buildFiltersFromLocation(location);
	let boxEl = null;

	let isLoading = false;
	let pending = null;
	let preventScroll = false;

	function updateCurrentFiltersFromParams(noScroll) {
		params.forEach(p => {
			if (p.bitArray) {
				currentFilters[p.key] = (p?.value ?? []).map(v => v?.id).reduce((prev, i) => prev + (1 << i), 0);
			} else if (p.key === 'countries') {
				currentFilters[p.key] = p.multi ? (p?.value ?? []).join(',') : p?.value ?? '';
			} else if (p.key === 'pp_range' || p.key === 'score_range') {
				currentFilters[p.key] = (p?.values ?? []).map(i => i + '').join(',');
			} else {
				currentFilters[p.key] = p.multi ? (p?.value ?? [])?.map(p => p.id)?.join(',') : p?.value ?? '';
			}
		});

		params = params;

		currentPage = 1;
		preventScroll = noScroll;

		navigateToCurrentPageAndFilters();
	}

	function scrollToTop() {
		if (!preventScroll && boxEl) scrollToTargetAdjusted(boxEl, 70);
		preventScroll = false;
	}

	function changeParams(newPage, newLocation, replace) {
		currentFilters = buildFiltersFromLocation(newLocation);
		if (!currentFilters?.sortBy?.length) {
			currentFilters.sortBy = 'pp';
		}
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentPage = newPage;
	}

	function onPageChanged(event) {
		if (event?.detail?.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/ranking/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
	}

	function navigateToCurrentPageAndFilters(replace) {
		navigate(`/ranking/${currentPage}?${buildSearchFromFilters(currentFilters)}`, {replace});
	}

	function onSortChanged(event) {
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

	function onMapsTypeChanged(event) {
		currentFilters.mapsType = event.detail;

		findParam('mapsType').value = currentFilters.mapsType;

		navigateToCurrentPageAndFilters();
	}

	function onFiltersUpdated(e) {
		if (!e?.detail?.currentFilters) return;

		currentFilters = {...e.detail.currentFilters};

		currentPage = e?.detail?.currentPage ?? 1;

		navigateToCurrentPageAndFilters();
	}

	$: changeParams(page, location, true);
	$: scrollToTop(pending);
</script>

<svelte:head>
	<title>Ranking / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade>
		<div class="event-banner" on:click={() => navigate('/event/3')}>
			<div class="event-image" />
		</div>
		<ContentBox bind:box={boxEl}>
			<h1 class="title is-5">
				Ranking

				{#if isLoading}
					<Spinner />
				{/if}
			</h1>

			<RankingTable
				page={currentPage}
				filters={currentFilters}
				on:filters-updated={onFiltersUpdated}
				on:page-changed={onPageChanged}
				on:sort-changed={onSortChanged}
				on:maps-type-changed={onMapsTypeChanged}
				on:loading={e => (isLoading = !!e?.detail)}
				on:pending={e => (pending = e?.detail)} />
		</ContentBox>
	</article>

	<aside>
		<ContentBox>
			<h2 class="title is-5">Filters</h2>

			{#each params as param}
				{#if param.type}
					<section class="filter">
						<label>{param?.label ?? param?.key ?? ''}</label>

						{#if param?.type === 'input'}
							<input
								type="text"
								placeholder={param.placeholder ?? null}
								value={param.value}
								on:input={debounce(param.onChange, FILTERS_DEBOUNCE_MS)} />
						{:else if param?.type === 'switch'}
							<Switcher values={param.values} value={param.value} multi={!!param?.multi} on:change={param.onChange} />
						{:else if param?.type === 'countries'}
							<Countries countries={param.value} on:change={param.onChange} />
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
						{/if}
					</section>
				{/if}
			{/each}
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

	aside {
		width: 25em;
	}

	aside .filter {
		margin-bottom: 1.5rem;
		transition: opacity 300ms;
	}

	aside .filter.disabled {
		opacity: 0.25;
	}

	aside label {
		display: block;
		font-weight: 500;
		margin-bottom: 1rem;
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

	.event-banner {
		background: rgb(0, 0, 0);
		height: 4em;
		margin: 0.6em;
		border-radius: 0.5em;
		cursor: pointer;
	}

	.event-image {
		width: 100%;
		height: 100%;
		background-size: contain;
		background-image: url('https://cdn.beatleader.xyz/assets/gladde-paling.png'), url('https://cdn.beatleader.xyz/assets/gladde-paling.png');

		background-repeat: repeat-x, repeat-x;
		background-position-y: -13px, 13px;
		background-position-x: 9px, -31px;
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
