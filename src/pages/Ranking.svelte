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
	import ssrConfig from '../ssr-config';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import RankingTable from '../components/Ranking/RankingTable.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import {debounce} from '../utils/debounce';
	import Switcher from '../components/Common/Switcher.svelte';
	import Countries from '../components/Ranking/Countries.svelte';
	import Headsets from '../components/Ranking/Headsets.svelte';
	import BackToTop from '../components/Common/BackToTop.svelte';

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
				updateCurrentFiltersFromParams();
			}
		}, 500);
	};

	var params = [
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
			default: [],
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
			default: [],
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
			label: 'Headsets',
			default: [],
			process: processStringArrayFilter,
			type: 'headsets',
			value: [],
			values: [],
			onChange: e => {
				const param = findParam('hmd');
				if (param) {
					param.value = e?.detail ?? [];

					updateCurrentFiltersFromParams();
				}
			},
			multi: true,
		},
		{
			key: 'role',
			label: 'Role',
			default: [],
			process: processStringArrayFilter,
			type: 'switch',
			value: [],
			values: [
				{id: 'admin', label: 'Administrator'},
				{id: 'creator', label: 'BL creator'},
				{id: 'rankedteam', label: 'Ranking Team'},
				{id: 'qualityteam', label: 'Quality Team'},

				{id: 'sponsor', label: 'Sponsor'},
				{id: 'supporter', label: 'Supporter'},
				{id: 'tipper', label: 'Tipper'},
				{id: 'mapper', label: 'Mapper'},
			],
			onChange: e => onMultiSwitchChange(e, 'role'),
			multi: true,
		},
		{
			key: 'pp_range',
			label: 'Pp range',
			default: [0, 24000],
			min: 0,
			max: 24000,
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
			default: [0, 4000],
			min: 0,
			max: 4000,
			step: 1,
			pipstep: 500,
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
		{
			key: 'ppType',
			default: 'general',
			process: processStringFilter,
			type: null,
		},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		params.forEach(p => {
			if (p.bitArray) {
				p.value = (p?.values ?? []).filter(v => Number.isFinite(v.id) && (1 << v.id) & (filters?.[p.key] ?? 0));
				filters[p.key] = filters[p.key] ?? 0;
			} else if (p.key === 'countries' || p.key === 'hmd') {
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

	function updateCurrentFiltersFromParams() {
		params.forEach(p => {
			if (p.bitArray) {
				currentFilters[p.key] = (p?.value ?? []).map(v => v?.id).reduce((prev, i) => prev + (1 << i), 0);
			} else if (p.key === 'countries' || p.key === 'hmd') {
				currentFilters[p.key] = p.multi ? (p?.value ?? []).join(',') : p?.value ?? '';
			} else if (p.key === 'pp_range' || p.key === 'score_range') {
				currentFilters[p.key] = (p?.values ?? []).map(i => i + '').join(',');
			} else {
				currentFilters[p.key] = p.multi ? (p?.value ?? [])?.map(p => p.id)?.join(',') : p?.value ?? '';
			}
		});

		params = params;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
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

	function onPpTypeChanged(event) {
		currentFilters.ppType = event.detail;

		findParam('ppType').value = currentFilters.ppType;

		navigateToCurrentPageAndFilters();
	}

	function onFiltersUpdated(e) {
		if (!e?.detail?.currentFilters) return;

		currentFilters = {...e.detail.currentFilters};

		currentPage = e?.detail?.currentPage ?? 1;

		navigateToCurrentPageAndFilters();
	}

	$: document.body.scrollIntoView({behavior: 'smooth'});
	$: changeParams(page, location, true);
</script>

<svelte:head>
	<title>Ranking / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade>
		<ContentBox cls="event-banner" on:click={() => navigate('/playlist/ranked')}>
			<div class="event-container">
				<img alt="Event banner" class="event-image" src="/assets/favicon-128.png" />
				<div class="event-text-container">
					<span class="event-title">Ranked pool and rools were changed!</span>
					<span class="event-text">Check out the new ranked maps.<br />Poodles!</span>
				</div>
			</div>
		</ContentBox>

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
				meta={true}
				on:filters-updated={onFiltersUpdated}
				on:page-changed={onPageChanged}
				on:sort-changed={onSortChanged}
				on:maps-type-changed={onMapsTypeChanged}
				on:pp-type-changed={onPpTypeChanged}
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
						{:else if param?.type === 'headsets'}
							<Headsets headsets={param.value} on:change={param.onChange} />
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

<BackToTop />

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

	:global(.content-box.event-banner) {
		display: flex;
		align-items: center;
		grid-gap: 1em;
		justify-content: center;
		margin: 0.6em;
		padding: 0;
		border-radius: 0.5em;
		height: 8em;
		cursor: pointer;
		background-color: black;
	}

	.event-container {
		backdrop-filter: blur(10px) brightness(0.9);
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.event-text-container {
		display: flex;
		flex-direction: column;
	}

	.event-image {
		width: 8em;
		height: 8em;
	}

	.event-title {
		color: white;
		font-size: x-large;
		font-weight: 800;
	}

	.event-text {
		color: white;
		font-size: larger;
		font-weight: 600;
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}

		:global(.content-box.event-banner) {
			height: 12em;
		}
	}
</style>
