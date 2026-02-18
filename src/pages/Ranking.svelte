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
	// import EventBanner from '../components/Event/EventBanner.svelte';
	import RankingSorters from '../components/Ranking/RankingSorters.svelte';

	export let page = 1;
	export let location;

	document.body.classList.remove('slim');

	const FILTERS_DEBOUNCE_MS = 500;

	const platformOptions = [
		{id: 'steam', label: 'Steam'},
		{id: 'oculus', label: 'Quest'},
		{id: 'oculuspc', label: 'Oculus'},
	];
	const roleOptions = [
		{id: 'admin', label: 'Administrator'},
		{id: 'creator', label: 'BL creator'},
		{id: 'rankedteam', label: 'Ranking Team'},
		{id: 'qualityteam', label: 'Quality Team'},

		{id: 'sponsor', label: 'Sponsor'},
		{id: 'supporter', label: 'Supporter'},
		{id: 'tipper', label: 'Tipper'},
		{id: 'mapper', label: 'Mapper'},
	];

	const tabOptions = [
		{value: 'ranking', label: 'Ranking', iconFa: 'fas fa-hashtag', url: '/ranking/1', cls: 'ranking-tab-button'},
		// {value: 'countries', label: 'Countries', iconFa: 'fas fa-flag', url: '/countries/1', cls: 'ranking-tab-button'},
		{value: 'scores', label: 'Scores', iconFa: 'fas fa-trophy', url: '/scores/1', cls: 'ranking-tab-button'},
	];
	const currentTab = tabOptions[0];

	function onTabChanged(e) {
		navigate(`/scores/1`);
	}

	var params = [
		{key: 'search', default: '', process: processStringFilter},
		{key: 'countries', default: '', process: processStringFilter},
		{key: 'platform', default: '', process: processStringFilter},
		{key: 'hmd', default: '', process: processStringFilter},
		{key: 'role', default: '', process: processStringFilter},
		{key: 'pp_range', default: '', process: processStringFilter},
		{key: 'score_range', default: '', process: processStringFilter},
		{key: 'ranked_score_range', default: '', process: processStringFilter},
		{key: 'acc_pp_range', default: '', process: processStringFilter},
		{key: 'pass_pp_range', default: '', process: processStringFilter},
		{key: 'tech_pp_range', default: '', process: processStringFilter},
		{
			key: 'sortBy',
			default: 'pp',
			process: processStringFilter,
		},
		{
			key: 'order',
			default: 'desc',
			process: processStringFilter,
		},
		{
			key: 'mapsType',
			default: 'ranked',
			process: processStringFilter,
		},
		{
			key: 'ppType',
			default: 'general',
			process: processStringFilter,
		},
		{
			key: 'firstScoreTime',
			default: null,
			process: processIntFilter,
		},
		{
			key: 'recentScoreTime',
			default: null,
			process: processIntFilter,
		},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		return filters;
	});

	let ranges_limits = {
		pp: 24269.979,
		techPp: 2056.7563,
		accPp: 20292.66,
		passPp: 10001.825,
		playCount: 31387,
		rankedPlayCount: 3217,
	};
	function fetchMaxPp() {
		fetch(`${BL_API_URL}players/top?leaderboardContext=${GLOBAL_LEADERBOARD_TYPE}`)
			.then(res => res.json())
			.then(data => {
				ranges_limits = data;
			});
	}

	document.body.classList.add('slim');

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentPage = page;

	let previousPage = 0;
	let currentFilters = buildFiltersFromLocation(location);
	let boxEl = null;

	let isLoading = false;
	let pending = null;

	function changeParams(newPage, newFilters, replace, setUrl = true) {
		if (!newFilters?.sortBy?.length) {
			newFilters.sortBy = 'pp';
		}
		currentFilters = newFilters;

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
		currentFilters.sortBy = event.detail;

		navigateToCurrentPageAndFilters();
	}

	function onMapsTypeChanged(event) {
		currentFilters.mapsType = event.detail;

		navigateToCurrentPageAndFilters();
	}

	function onPpTypeChanged(event) {
		currentFilters.ppType = event.detail;

		navigateToCurrentPageAndFilters();
	}

	function onOrderChanged(event) {
		currentFilters.order = event.detail;

		navigateToCurrentPageAndFilters();
	}

	$: document.body.scrollIntoView({behavior: 'smooth'});
	$: changeParams(page, buildFiltersFromLocation(location), false, false);

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

	let isRangeFilterOpen = !!(
		currentFilters.pp_range ||
		currentFilters.score_range ||
		currentFilters.ranked_score_range ||
		currentFilters.acc_pp_range ||
		currentFilters.pass_pp_range ||
		currentFilters.tech_pp_range
	);
	let isPlatformFilterOpen = !!currentFilters.platform;
	let isRoleFilterOpen = !!currentFilters.role;
	let isDateFilterOpen = !!currentFilters.firstScoreTime || !!currentFilters.recentScoreTime;

	function labelFormatter(max, step) {
		// Return a formatter function
		return value => {
			const lastPipValue = Math.floor((max - 1) / step) * step;

			// If the current value is the last pip from pipstep AND it's too close to the max value, hide it.
			if (value === lastPipValue && max - lastPipValue < max * 0.08) {
				return '';
			}

			return Math.round(value);
		};
	}
</script>

<svelte:head>
	<title>Ranking / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<!-- <EventBanner /> -->
		<div class="ranking-switcher">
			<TabSwitcher
				values={tabOptions}
				value={currentTab}
				loadingValue={pending ? currentTab : null}
				on:change={onTabChanged}
				class="ranking" />
		</div>

		<ContentBox cls="ranking-main-box" zIndex={2} bind:box={boxEl}>
			<RankingTable
				page={currentPage}
				filters={currentFilters}
				meta={true}
				animationSign={currentPage >= previousPage ? 1 : -1}
				on:page-changed={onPageChanged}
				on:loading={e => (isLoading = !!e?.detail)}
				on:pending={e => (pending = e?.detail)} />
		</ContentBox>
	</article>

	<aside class="ranking-aside">
		<AsideBox
			title="Filters"
			boolname={window?.innerWidth < 767 ? 'showFiltersOnRankingMobile' : 'showFiltersOnRanking'}
			faicon="fas fa-filter"
			cls="ranking-filters-dropdown">
			<RankingSorters
				filters={currentFilters}
				on:sort-changed={onSortChanged}
				on:maps-type-changed={onMapsTypeChanged}
				on:pp-type-changed={onPpTypeChanged}
				on:order-changed={onOrderChanged} />
			<section class="filter">
				<input
					type="text"
					placeholder={'Search by a player name'}
					value={currentFilters.search}
					on:input={debounce(e => {
						const length = e?.target?.value?.length;
						if (length > 0 && length < 2) return;

						currentFilters.search = e.target.value ?? '';
						currentPage = 1;
						navigateToCurrentPageAndFilters();
					}, FILTERS_DEBOUNCE_MS)} />
			</section>

			<section class="filter">
				<Countries
					countries={currentFilters.countries?.split(',').filter(c => c) ?? []}
					placeholder="Click to filter by countries"
					on:change={e => {
						const newValues = e?.detail ?? [];
						if (currentFilters.countries != newValues.join(',')) {
							currentFilters.countries = newValues.join(',');
							currentPage = 1;
							navigateToCurrentPageAndFilters();
						}
					}} />
			</section>

			<section class="filter">
				<Headsets
					value={currentFilters.hmd?.split(',').filter(c => c) ?? []}
					placeholder="Click to filter by headsets"
					on:change={e => {
						const newValues = e?.detail ?? [];
						if (currentFilters.hmd != newValues.join(',')) {
							currentFilters.hmd = newValues.join(',');
							currentPage = 1;
							navigateToCurrentPageAndFilters();
						}
					}} />
			</section>

			<section class="filter dropdown-filter" class:has-value={currentFilters.platform?.length}>
				<div class="dropdown-header" on:click={() => (isPlatformFilterOpen = !isPlatformFilterOpen)}>
					<div class="header-content">
						<i class="fas fa-computer" />
						<span>Platform</span>
					</div>
					<i class="fas fa-chevron-{isPlatformFilterOpen ? 'up' : 'down'}" />
				</div>

				{#if isPlatformFilterOpen}
					<div class="dropdown-content" transition:fade>
						<section class="filter">
							<Switcher
								values={platformOptions}
								value={platformOptions.filter(v => currentFilters.platform?.split(',').includes(v.id))}
								multi={true}
								on:change={e => {
									var currentValue = currentFilters.platform?.split(',') ?? [];

									currentFilters.platform = (
										currentValue.includes(e.detail.id) ? currentValue.filter(p => p !== e.detail.id) : [...currentValue, e.detail.id]
									)
										.filter(r => r.length)
										.join(',');
									currentPage = 1;
									navigateToCurrentPageAndFilters();
								}} />
						</section>
					</div>
				{/if}
			</section>

			<section class="filter dropdown-filter" class:has-value={currentFilters.role?.length}>
				<div class="dropdown-header" on:click={() => (isRoleFilterOpen = !isRoleFilterOpen)}>
					<div class="header-content">
						<i class="fas fa-tags" />
						<span>Role</span>
					</div>
					<i class="fas fa-chevron-{isRoleFilterOpen ? 'up' : 'down'}" />
				</div>

				{#if isRoleFilterOpen}
					<div class="dropdown-content" transition:fade>
						<section class="filter">
							<Switcher
								values={roleOptions}
								value={roleOptions.filter(v => currentFilters.role?.split(',').includes(v.id))}
								multi={true}
								on:change={e => {
									var currentValue = currentFilters.role?.split(',') ?? [];

									currentFilters.role = (
										currentValue.includes(e.detail.id) ? currentValue.filter(p => p !== e.detail.id) : [...currentValue, e.detail.id]
									)
										.filter(r => r.length)
										.join(',');
									currentPage = 1;
									navigateToCurrentPageAndFilters();
								}} />
						</section>
					</div>
				{/if}
			</section>

			<section
				class="filter dropdown-filter"
				class:has-value={currentFilters.pp_range?.length ||
					!!currentFilters.score_range?.length ||
					!!currentFilters.ranked_score_range?.length ||
					!!currentFilters.acc_pp_range?.length ||
					!!currentFilters.pass_pp_range?.length ||
					!!currentFilters.tech_pp_range?.length}>
				<div class="dropdown-header" on:click={() => (isRangeFilterOpen = !isRangeFilterOpen)}>
					<div class="header-content">
						<i class="fas fa-ruler" />
						<span>Ranges</span>
					</div>
					<i class="fas fa-chevron-{isRangeFilterOpen ? 'up' : 'down'}" />
				</div>

				{#if isRangeFilterOpen}
					<div class="dropdown-content" transition:fade>
						<section class="filter">
							<label
								>Total PP range
								{#if currentFilters.pp_range}
									<button
										class="remove-type"
										title="Remove"
										on:click={() => {
											currentFilters.pp_range = '';
											currentPage = 1;
											navigateToCurrentPageAndFilters();
										}}><i class="fas fa-xmark" /></button>
								{/if}
							</label>

							<RangeSlider
								range
								min={0}
								max={ranges_limits.pp + 1}
								step={1}
								values={(() => {
									const values = (currentFilters.pp_range || ',').split(',').map(v => (v ? parseFloat(v) : null));
									return [
										Number.isFinite(values[0]) ? values[0] : Number.NEGATIVE_INFINITY,
										Number.isFinite(values[1]) ? values[1] : Number.POSITIVE_INFINITY,
									];
								})()}
								float
								hoverable
								pips
								pipstep={10000}
								all="label"
								formatter={labelFormatter(ranges_limits.pp + 1, 10000)}
								on:change={debounce(e => {
									if (!Array.isArray(e?.detail?.values) || e.detail.values.length !== 2) return;

									currentFilters.pp_range = e.detail.values.join(',');
									currentPage = 1;
									navigateToCurrentPageAndFilters();
								}, 500)} />
						</section>

						<section class="filter">
							<label
								>All Scores count
								{#if currentFilters.score_range}
									<button
										class="remove-type"
										title="Remove"
										on:click={() => {
											currentFilters.score_range = '';
											currentPage = 1;
											navigateToCurrentPageAndFilters();
										}}><i class="fas fa-xmark" /></button>
								{/if}
							</label>

							<RangeSlider
								range
								min={0}
								max={ranges_limits.playCount + 1}
								step={1}
								values={(() => {
									const values = (currentFilters.score_range || ',').split(',').map(v => (v ? parseFloat(v) : null));
									return [
										Number.isFinite(values[0]) ? values[0] : Number.NEGATIVE_INFINITY,
										Number.isFinite(values[1]) ? values[1] : Number.POSITIVE_INFINITY,
									];
								})()}
								float
								hoverable
								pips
								pipstep={10000}
								all="label"
								formatter={labelFormatter(ranges_limits.playCount + 1, 10000)}
								on:change={debounce(e => {
									if (!Array.isArray(e?.detail?.values) || e.detail.values.length !== 2) return;

									currentFilters.score_range = e.detail.values.join(',');
									currentPage = 1;
									navigateToCurrentPageAndFilters();
								}, 500)} />
						</section>

						<section class="filter">
							<label
								>Ranked Scores count
								{#if currentFilters.ranked_score_range}
									<button
										class="remove-type"
										title="Remove"
										on:click={() => {
											currentFilters.ranked_score_range = '';
											currentPage = 1;
											navigateToCurrentPageAndFilters();
										}}><i class="fas fa-xmark" /></button>
								{/if}
							</label>

							<RangeSlider
								range
								min={0}
								max={ranges_limits.rankedPlayCount + 1}
								step={1}
								values={(() => {
									const values = (currentFilters.ranked_score_range || ',').split(',').map(v => (v ? parseFloat(v) : null));
									return [
										Number.isFinite(values[0]) ? values[0] : Number.NEGATIVE_INFINITY,
										Number.isFinite(values[1]) ? values[1] : Number.POSITIVE_INFINITY,
									];
								})()}
								float
								hoverable
								pips
								pipstep={1000}
								all="label"
								formatter={labelFormatter(ranges_limits.rankedPlayCount + 1, 1000)}
								on:change={debounce(e => {
									if (!Array.isArray(e?.detail?.values) || e.detail.values.length !== 2) return;

									currentFilters.ranked_score_range = e.detail.values.join(',');
									currentPage = 1;
									navigateToCurrentPageAndFilters();
								}, 500)} />
						</section>

						<section class="filter">
							<label
								>Acc PP range
								{#if currentFilters.acc_pp_range}
									<button
										class="remove-type"
										title="Remove"
										on:click={() => {
											currentFilters.acc_pp_range = '';
											currentPage = 1;
											navigateToCurrentPageAndFilters();
										}}><i class="fas fa-xmark" /></button>
								{/if}
							</label>

							<RangeSlider
								range
								min={0}
								max={ranges_limits.accPp + 1}
								step={1}
								values={(() => {
									const values = (currentFilters.acc_pp_range || ',').split(',').map(v => (v ? parseFloat(v) : null));
									return [
										Number.isFinite(values[0]) ? values[0] : Number.NEGATIVE_INFINITY,
										Number.isFinite(values[1]) ? values[1] : Number.POSITIVE_INFINITY,
									];
								})()}
								float
								hoverable
								pips
								pipstep={5000}
								all="label"
								formatter={labelFormatter(ranges_limits.accPp + 1, 5000)}
								on:change={debounce(e => {
									if (!Array.isArray(e?.detail?.values) || e.detail.values.length !== 2) return;

									currentFilters.acc_pp_range = e.detail.values.join(',');
									currentPage = 1;
									navigateToCurrentPageAndFilters();
								}, 500)} />
						</section>

						<section class="filter">
							<label
								>Pass PP range
								{#if currentFilters.pass_pp_range}
									<button
										class="remove-type"
										title="Remove"
										on:click={() => {
											currentFilters.pass_pp_range = '';
											currentPage = 1;
											navigateToCurrentPageAndFilters();
										}}><i class="fas fa-xmark" /></button>
								{/if}
							</label>

							<RangeSlider
								range
								min={0}
								max={ranges_limits.passPp + 1}
								step={1}
								values={(() => {
									const values = (currentFilters.pass_pp_range || ',').split(',').map(v => (v ? parseFloat(v) : null));
									return [
										Number.isFinite(values[0]) ? values[0] : Number.NEGATIVE_INFINITY,
										Number.isFinite(values[1]) ? values[1] : Number.POSITIVE_INFINITY,
									];
								})()}
								float
								hoverable
								pips
								pipstep={2000}
								all="label"
								formatter={labelFormatter(ranges_limits.passPp + 1, 2000)}
								on:change={debounce(e => {
									if (!Array.isArray(e?.detail?.values) || e.detail.values.length !== 2) return;

									currentFilters.pass_pp_range = e.detail.values.join(',');
									currentPage = 1;
									navigateToCurrentPageAndFilters();
								}, 500)} />
						</section>

						<section class="filter">
							<label
								>Tech PP range
								{#if currentFilters.tech_pp_range}
									<button
										class="remove-type"
										title="Remove"
										on:click={() => {
											currentFilters.tech_pp_range = '';
											currentPage = 1;
											navigateToCurrentPageAndFilters();
										}}><i class="fas fa-xmark" /></button>
								{/if}
							</label>

							<RangeSlider
								range
								min={0}
								max={ranges_limits.techPp + 1}
								step={1}
								values={(() => {
									const values = (currentFilters.tech_pp_range || ',').split(',').map(v => (v ? parseFloat(v) : null));
									return [
										Number.isFinite(values[0]) ? values[0] : Number.NEGATIVE_INFINITY,
										Number.isFinite(values[1]) ? values[1] : Number.POSITIVE_INFINITY,
									];
								})()}
								float
								hoverable
								pips
								pipstep={500}
								all="label"
								formatter={labelFormatter(ranges_limits.techPp + 1, 500)}
								on:change={debounce(e => {
									if (!Array.isArray(e?.detail?.values) || e.detail.values.length !== 2) return;

									currentFilters.tech_pp_range = e.detail.values.join(',');
									currentPage = 1;
									navigateToCurrentPageAndFilters();
								}, 500)} />
						</section>
					</div>
				{/if}
			</section>

			<section class="filter dropdown-filter" class:has-value={!!currentFilters.firstScoreTime || !!currentFilters.recentScoreTime}>
				<div class="dropdown-header" on:click={() => (isDateFilterOpen = !isDateFilterOpen)}>
					<div class="header-content">
						<i class="fas fa-calendar-alt" />
						<span>Dates</span>
					</div>
					<i class="fas fa-chevron-{isDateFilterOpen ? 'up' : 'down'}" />
				</div>

				{#if isDateFilterOpen}
					<div class="dropdown-content" transition:fade>
						<section class="filter">
							<label>Started playing after</label>
							<DatePicker
								type="date"
								date={dateFromUnix(currentFilters.firstScoreTime)}
								on:change={e => {
									currentFilters.firstScoreTime = e.detail ? e.detail.getTime() / 1000 : null;
									currentPage = 1;
									navigateToCurrentPageAndFilters();
								}} />
						</section>

						<section class="filter">
							<label>Most recent score after</label>
							<DatePicker
								type="date"
								date={dateFromUnix(currentFilters.recentScoreTime)}
								on:change={e => {
									currentFilters.recentScoreTime = e.detail ? e.detail.getTime() / 1000 : null;
									currentPage = 1;
									navigateToCurrentPageAndFilters();
								}} />
						</section>
					</div>
				{/if}
			</section>
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
		margin-top: 0.5em;
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

	:global(.show-filters-box) {
		margin-inline: 0;
		padding: 0.5rem !important;
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

	.dropdown-filter {
		border: 1px solid var(--faded);
		border-radius: 4px;
		overflow: hidden;
	}

	.dropdown-filter.has-value {
		border-color: rgba(255, 100, 150, 0.5);
	}

	.dropdown-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background-color: var(--foreground);
		cursor: pointer;
		user-select: none;
	}

	.dropdown-header:hover {
		background-color: var(--background);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.dropdown-content {
		padding: 1rem;
		background-color: var(--foreground);
	}

	.dropdown-filter + .dropdown-filter {
		margin-top: 1rem;
	}

	:global(.country-card-container) {
		padding: 0 !important;
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
	}

	@media screen and (max-width: 767px) {
		.ranking-switcher {
			margin-top: 1em;
		}

		:global(.ranking-main-box .pagination) {
			margin-bottom: -0.4em !important;
			margin-left: 0.1em !important;
			margin-top: 0.4em !important;
		}

		:global(.ranking-filters-dropdown) {
			position: absolute !important;
			top: 4.2em;
			right: 0.5em;
			z-index: 3 !important;
		}
	}
</style>
