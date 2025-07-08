<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import {
		createBuildFiltersFromLocation,
		processStringFilter,
		processStringArrayFilter,
		processIntArrayFilter,
		processIntFilter,
		buildSearchFromFiltersWithDefaults,
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
	import {configStore} from '../stores/config';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';

	import {produce} from 'immer';
	import {dateFromUnix} from '../utils/date';
	import DatePicker from '../components/Common/DatePicker.svelte';
	import Button from '../components/Common/Button.svelte';
	import {GLOBAL_LEADERBOARD_TYPE} from '../utils/format';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';
	import AsideBox from '../components/Common/AsideBox.svelte';
	import CountryCard from '../components/Ranking/CountryCard.svelte';

	export let page = 1;
	export let location;

	document.body.classList.remove('slim');

	const FILTERS_DEBOUNCE_MS = 500;

	const tabOptions = [
		{value: 'ranking', label: 'Ranking', iconFa: 'fas fa-hashtag', url: '/ranking/1', cls: 'ranking-tab-button'},
		// {value: 'countries', label: 'Countries', iconFa: 'fas fa-flag', url: '/countries/1', cls: 'ranking-tab-button'},
		{value: 'scores', label: 'Scores', iconFa: 'fas fa-trophy', url: '/scores/1', cls: 'ranking-tab-button'},
	];
	const currentTab = tabOptions[0];

	function onTabChanged(e) {
		navigate(`/scores/1`);
	}

	const findParam = key => params.find(p => p.key === key);

	const onInputValueChange = (value, key) => {
		const param = findParam(key);
		if (param) {
			param.value = value;

			updateCurrentFiltersFromParams();
		}
	};

	const onInputChange = (e, key) => {
		onInputValueChange(e.target.value ?? '', key);
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
				if (length > 0 && length < 2) return;

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
				const newValues = e?.detail ?? [];
				if (param && param.value.join('') != newValues.join('')) {
					param.value = newValues;

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
				const newValues = e?.detail ?? [];
				if (param && param.value.join('') != newValues.join('')) {
					param.value = newValues;

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
			default: [null, null],
			min: 0,
			max: 24000,
			step: 1,
			pipstep: 5000,
			type: 'slider',
			process: processIntArrayFilter,
			values: [],
			onChange: e => rangeChange(e, 'pp_range'),
		},
		{
			key: 'score_range',
			label: 'Scores count',
			default: [null, null],
			min: 0,
			max: 15000,
			step: 1,
			pipstep: 5000,
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
		{
			key: 'firstScoreTime',
			label: 'Started playing after',
			default: null,
			type: 'date',
			process: processIntFilter,
			onChange: e => onInputValueChange(e.detail ? e.detail.getTime() / 1000 : null, 'firstScoreTime'),
		},
		{
			key: 'recentScoreTime',
			label: 'Most recent score after',
			default: null,
			type: 'date',
			process: processIntFilter,
			onChange: e => onInputValueChange(e.detail ? e.detail.getTime() / 1000 : null, 'recentScoreTime'),
		},
	];

	function fetchMaxPp() {
		fetch(`${BL_API_URL}players/top/pp?leaderboardContext=${GLOBAL_LEADERBOARD_TYPE}`)
			.then(res => res.text())
			.then(data => {
				const maxPp = parseFloat(data);
				if (maxPp) {
					params.find(p => p.key === 'pp_range').max = Math.floor(maxPp) + 1;
					params = params;
				}
			});
	}

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		params.forEach(p => {
			if (p.bitArray) {
				p.value = (p?.values ?? []).filter(v => Number.isFinite(v.id) && (1 << v.id) & (filters?.[p.key] ?? 0));
				filters[p.key] = filters[p.key] ?? 0;
			} else if (p.key === 'countries' || p.key === 'hmd') {
				p.value = Array.isArray(filters?.[p.key]) ? filters[p.key] : (p?.default ?? []);
				filters[p.key] = filters[p.key] ?? [];
			} else if (p.key === 'pp_range' || p.key === 'score_range') {
				p.values = Array.isArray(filters?.[p.key]) && filters[p.key].length ? filters[p.key] : (p?.default ?? []);
				filters[p.key] = filters[p.key] ?? 0;
			} else if (p.type === 'date') {
				p.value = filters[p.key] ? filters[p.key] : p?.default;
			} else {
				filters[p.key] = p.multi
					? ((p?.values ?? [])?.map(v => v?.id)?.filter(v => filters?.[p.key]?.includes(v)) ?? p?.default ?? [])
					: filters?.[p.key]?.length
						? filters[p.key]
						: (p?.default ?? '');

				p.value = p.multi
					? (p?.values?.filter(v => filters?.[p.key]?.includes(v.id)) ?? p?.default ?? [])
					: (filters?.[p.key] ?? p?.default ?? '');
			}
		});

		return filters;
	});

	document.body.classList.add('slim');

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentPage = page;

	let previousPage = 0;
	let currentFilters = buildFiltersFromLocation(location);
	let boxEl = null;

	let isLoading = false;
	let pending = null;

	function updateCurrentFiltersFromParams() {
		params.forEach(p => {
			if (p.bitArray) {
				currentFilters[p.key] = (p?.value ?? []).map(v => v?.id).reduce((prev, i) => prev + (1 << i), 0);
			} else if (p.key === 'countries' || p.key === 'hmd') {
				currentFilters[p.key] = p.multi ? (p?.value ?? []).join(',') : (p?.value ?? '');
			} else if (p.key === 'pp_range' || p.key === 'score_range') {
				if (p?.values?.find(p => p)) {
					currentFilters[p.key] = (p?.values ?? []).map(i => i + '').join(',');
				} else {
					currentFilters[p.key] = null;
				}
			} else {
				currentFilters[p.key] = p.multi ? (p?.value ?? [])?.map(p => p.id)?.join(',') : (p?.value ?? '');
			}
		});

		params = params;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function changeParams(newPage, newFilters, replace, setUrl = true) {
		currentFilters = newFilters;
		if (!currentFilters?.sortBy?.length) {
			currentFilters.sortBy = 'pp';
		}
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;
		previousPage = currentPage;
		currentPage = newPage;

		if (setUrl) {
			const query = buildSearchFromFiltersWithDefaults(currentFilters, params);
			const url = `/ranking/${currentPage}${query.length ? '?' + query : ''}`;
			if (replace) {
				window.history.replaceState({}, '', url);
			} else {
				window.history.pushState({}, '', url);
			}
		}
	}

	function navigateToCurrentPageAndFilters(replace) {
		changeParams(currentPage, currentFilters, replace);
	}

	function onPageChanged(event) {
		if (event?.detail?.initial || !Number.isFinite(event.detail.page)) return;

		currentPage = event.detail.page + 1;

		navigateToCurrentPageAndFilters();
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

	function boolflip(name) {
		$configStore = produce($configStore, draft => {
			draft.preferences[name] = !draft.preferences[name];
		});
	}

	let cinematicsCanvas;

	function drawCinematics(cinematicsCanvas, coverUrl) {
		if (coverUrl && cinematicsCanvas) {
			cinematicsCanvas.style.opacity = 1;
			const context = cinematicsCanvas.getContext('2d');

			const cover = new Image();
			cover.onload = function () {
				context.drawImage(cover, 0, 0, cinematicsCanvas.width, cinematicsCanvas.height);
			};
			cover.src = coverUrl;
		}
	}

	$: document.body.scrollIntoView({behavior: 'smooth'});
	$: changeParams(page, buildFiltersFromLocation(location), false, false);
	$: cinematicsCanvas && drawCinematics(cinematicsCanvas, '/assets/week120_bg.webp');

	$: showFilters = $configStore.preferences.showFiltersOnRanking;
	$: fetchMaxPp();

	let sotw = null;

	function getSotw() {
		fetch(`${BL_API_URL}score/sotw`)
			.then(r => r.json())
			.then(response => {
				sotw = response;
			});
	}

	$: getSotw();
</script>

<svelte:head>
	<title>Ranking / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<!-- <ContentBox cls="event-banner" on:click={() => navigate('/event/49')}>
			<div class="event-container">
				<img alt="Event banner" class="event-image" src="https://cdn.assets.beatleader.com/75058-event.png" />
				<div class="event-text-container">
					<span class="event-title">Ranked weeks #87-91!</span>
					<span class="event-text">Check out what was ranked in April and compete for a badge.</span>
				</div>
				<Button label="Event" iconFa="fas fa-rocket" on:click={() => navigate('/event/49')} />
			</div>
		</ContentBox> -->
		<!-- <ContentBox cls="event-banner" on:click={() => navigate('/event/67')}>
			<div class="cinematics">
				<div class="cinematics-canvas">
					<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
				</div>
			</div>

			<div class="event-container">
				{#await import('atropos/svelte').then(m => m.default)}
					<div class="loading-container">
						<div class="cover-bg" />
						<div class="cover-hands" />
					</div>
				{:then Atropos}
					<svelte:component this={Atropos} rotateXMax={1} rotateYMax={1} highlight="false" shadow="false" rotateTouch="scroll-y">
						<div class="cover-bg" data-atropos-offset="-2" />
						<div class="cover-hands" data-atropos-offset="3" />
					</svelte:component>
				{/await}

				<div class="event-text-and-button">
					<div class="event-text-container">
						<span class="event-title"></span>
					</div>
					<div>
						<Button label=". ...- . -. -" cls="event-cover-btn" iconFa="fas fa-question" on:click={() => navigate('/event/67')} />
					</div>
				</div>
			</div>
		</ContentBox> -->

		<!-- <ContentBox cls="country-card-container">
			<CountryCard />
		</ContentBox> -->

		<div class="ranking-switcher">
			<TabSwitcher values={tabOptions} value={currentTab} on:change={onTabChanged} class="ranking" />
		</div>

		<ContentBox bind:box={boxEl}>
			<RankingTable
				page={currentPage}
				filters={currentFilters}
				meta={true}
				animationSign={currentPage >= previousPage ? 1 : -1}
				on:filters-updated={onFiltersUpdated}
				on:page-changed={onPageChanged}
				on:sort-changed={onSortChanged}
				on:maps-type-changed={onMapsTypeChanged}
				on:pp-type-changed={onPpTypeChanged}
				on:loading={e => (isLoading = !!e?.detail)}
				on:pending={e => (pending = e?.detail)} />
		</ContentBox>
	</article>

	<aside class="ranking-aside">
		<AsideBox title="Filters" boolname="showFiltersOnRanking" faicon="fas fa-filter">
			{#each params as param}
				{#if param.type}
					<section class="filter">
						<label
							>{param?.label ?? param?.key ?? ''}
							{#if param?.type === 'slider' && (param.values[0] || param.values[1])}
								<button
									class="remove-type"
									title="Remove"
									on:click={() => {
										param.onChange({detail: {values: [null, null]}});
									}}><i class="fas fa-xmark" /></button>
							{/if}
						</label>

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
							<Headsets value={param.value} on:change={param.onChange} />
						{:else if param?.type === 'slider'}
							<RangeSlider
								range
								min={param.min}
								max={param.max}
								step={param.step}
								values={[
									Number.isFinite(param.values[0]) ? param.values[0] : Number.NEGATIVE_INFINITY,
									Number.isFinite(param.values[1]) ? param.values[1] : Number.POSITIVE_INFINITY,
								]}
								float
								hoverable
								pips
								pipstep={param.pipstep}
								all="label"
								on:change={param.onChange} />
						{:else if param?.type === 'date'}
							<DatePicker type="date" date={dateFromUnix(param.value)} on:change={param.onChange} />
						{/if}
					</section>
				{/if}
			{/each}
		</AsideBox>
		{#if sotw}
			<AsideBox title="Score Of The Week" boolname="showFeaturedScoreOnScores" faicon="fas fa-award">
				<div style="display: flex; width: 100%; height: 100%; justify-content: center;">
					<iframe
						width="100%"
						style="aspect-ratio: 16/9;"
						src={`https://www.youtube-nocookie.com/embed/${sotw.link.replace('https://youtu.be/', '')}?si=b4lLpGGYeIZ8kRb8`}
						title="YouTube video player"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen />
				</div>
			</AsideBox>
		{/if}
	</aside>
</section>

<BackToTop />

<style>
	aside {
		width: 22em;
	}
	:global(.ranking-aside .aside-box) {
		min-width: unset !important;
	}
	.align-content {
		display: flex;
		justify-content: center;
	}

	.page-content {
		max-width: 58em;
		width: 100%;
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

	.ranking-switcher {
		margin-left: 0.8em;
	}

	:global(.ranking-tab-button) {
		margin-bottom: -0.5em !important;
		height: 3.5em;
		border-radius: 12px 12px 0 0 !important;
		min-width: 7em;
		max-width: 7em;
	}

	:global(.ranking-tab-button span) {
		font-weight: 900;
		text-align: center;
		white-space: break-spaces;
		margin-right: -0.3em;
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
		padding: 0 !important;
		border-radius: 0.5em;
		cursor: pointer;
	}

	:global(.show-filters-box) {
		margin-inline: 0;
		padding: 0.5rem !important;
	}

	.event-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: space-around;
		position: relative;
		height: 9em;
		align-items: center;
		overflow: hidden;
		border-radius: 0.5em;
	}
	:global(.content-box.event-banner .atropos) {
		width: 100%;
		position: absolute;
		width: 100%;
		height: 100%;
	}
	:global(.content-box.event-banner .atropos-highlight) {
		display: none;
	}
	:global(.content-box.event-banner .atropos-shadow) {
		display: none;
	}
	.event-title-mobile {
		display: none;
	}
	.event-title-desktop {
		color: #4caf50 !important;
	}
	.event-text-and-button {
		display: flex;
		flex-direction: column;
		z-index: 2;
		align-items: center;
	}

	.event-text-container {
		display: flex;
		flex-direction: column;
	}

	.event-image {
		width: 7em;
		height: 7em;
		margin-right: 1em;
		border-radius: 18px;
	}

	:global(.event-cover-btn) {
		box-shadow: 1px 1px black !important;
	}
	.cover-bg {
		position: absolute;
		display: block;
		background: url(/assets/week120_bg.webp) !important;
		background-size: cover !important;
		background-position-y: 50% !important;
		bottom: -10%;
		left: -10%;
		height: 120%;
		width: 120%;
	}
	.cover-girls {
		position: absolute;
		display: block;
		background: url(/assets/week120_girl.webp) !important;
		background-size: cover !important;
		background-position-y: 50% !important;
		height: 23em;
		left: calc(50% - 10em);
		top: calc(50% - 8em);
		width: 23em;
	}

	.cover-hands {
		position: absolute;
		display: block;
		background: url(/assets/week120_girl.webp) !important;
		background-size: cover !important;
		background-position-y: 50% !important;
		width: 59em;
		height: 22em;
		left: calc(50% - 30em);
		top: calc(50% - 8.5em);
		mix-blend-mode: color-burn;
	}

	.cinematics {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		pointer-events: none;
	}

	.cinematics-canvas {
		filter: blur(5em) opacity(0.5) saturate(250%);
		left: 0;
		opacity: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.1) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
		transition: opacity 0.2s ease-in-out;
	}

	:global(.content-box.event-banner:hover .cinematics-canvas) {
		opacity: 1;
	}

	.event-title {
		color: var(--text-color);
		font-size: x-large;
		font-weight: 800;
		text-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
		text-shadow: 1px 1px 11px #000000e8;
	}

	.event-text {
		color: var(--text-color);
		font-size: larger;
		text-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
	}

	.header-title {
		margin-bottom: unset !important;
	}

	.score-options-section {
		display: grid;
		justify-items: center;
		margin: 0.3em;
	}

	.to-the-left {
		margin-left: -0.5em !important;
	}

	.box-with-left-arrow {
		display: grid;
		align-items: center;
		grid-template-columns: 1em auto !important;
		max-width: 20em;
	}

	.clickable {
		cursor: pointer;
	}

	.remove-type {
		border: none;
		color: rgb(255, 0, 0);
		background-color: transparent;
		cursor: pointer;
		transform: translate(-7px, -2px);
	}

	.ranking-grid-header {
		display: flex;
		justify-content: start;
		align-items: center;
		gap: 1em;
	}

	:global(.country-card-container) {
		padding: 0 !important;
	}

	@media screen and (max-width: 512px) {
		.cover-hands {
			background-position-y: 0.2em !important;
		}
	}

	@media screen and (max-width: 760px) {
		.cover-hands {
			position: absolute;
			display: block;
			background-size: cover !important;
			background-position-y: 50% !important;
			width: 27em;
			height: 22em;
			left: calc(50% - 14em);
			top: calc(50% - 7em);
		}

		.event-title-desktop {
			display: none;
		}
		.event-title-mobile {
			display: block;
			color: #4caf50 !important;
		}
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

		.event-text-container {
			margin-bottom: 1em;
			align-items: center;
			text-align: center;
		}

		.event-image {
			width: 10em;
			height: 10em;
			margin-right: 1em;
		}
	}
</style>
