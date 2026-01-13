<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import ssrConfig from '../../ssr-config';
	import Spinner from '../Common/Spinner.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import RankingTable from '../Ranking/RankingTable.svelte';
	import Button from '../Common/Button.svelte';
	import createAccountStore from '../../stores/beatleader/account';
	import {
		createBuildFiltersFromLocation,
		buildSearchFromFilters,
		processStringFilter,
		processStringArrayFilter,
		buildSearchFromFiltersWithDefaults,
	} from '../../utils/filters';
	import RangeSlider from 'svelte-range-slider-pips';
	import {debounce} from '../../utils/debounce';
	import {dateFromUnix, formatDateRelative, formatDate, WEEKSECONDS} from '../../utils/date';
	import Switcher from '../Common/Switcher.svelte';
	import Countries from '../Ranking/Countries.svelte';
	import Event from './Event.svelte';
	import {Confetti} from 'svelte-confetti';
	import EventMeta from './EventMeta.svelte';
	import PlayerMention from '../Scores/PlayerMention.svelte';
	import EventRankingTable from '../Ranking/EventRankingTable.svelte';

	export let currentEvent;
	export let page = 1;
	export let location;
	export let eventId;

	const account = createAccountStore();

	const FILTERS_DEBOUNCE_MS = 500;

	var params = [
		{
			key: 'search',
			default: '',
			process: processStringFilter,
			type: 'input',
		},
		{
			key: 'countries',
			default: '',
			process: processStringFilter,
			type: 'countries',
		},
		{
			key: 'ppType',
			default: 'general',
			process: processStringFilter,
		},
		{
			key: 'sortBy',
			default: 'pp',
			process: processStringFilter,
		},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		params.forEach(p => {
			if (p.key === 'countries') {
				p.value = Array.isArray(filters?.[p.key]) ? filters[p.key] : (p?.default ?? []);
				filters[p.key] = filters[p.key] ?? [];
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

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentPage = page;
	let currentFilters = buildFiltersFromLocation(location);
	let currentEventId = eventId;
	let boxEl = null;

	let isLoading = false;
	let pending = null;
	let preventScroll = false;

	function updateCurrentFiltersFromParams(noScroll) {
		params = params;

		currentPage = 1;
		preventScroll = noScroll;

		navigateToCurrentPageAndFilters();
	}

	function changeParams(newPage, eventId, newLocation) {
		currentEventId = eventId;
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentFilters = buildFiltersFromLocation(newLocation);
		if (!currentFilters?.sortBy?.length) {
			currentFilters.sortBy = 'pp';
			currentFilters.ppType = 'general';
		}

		currentPage = newPage;
	}

	function onPageChanged(event) {
		if (event?.detail?.initial || !Number.isFinite(event.detail.page)) return;

		currentPage = event.detail.page + 1;

		navigateToCurrentPageAndFilters();
	}

	function navigateToCurrentPageAndFilters(replace) {
		const query = buildSearchFromFiltersWithDefaults(currentFilters, params);
		const url = `/event/${currentEvent?.pageAlias ?? currentEventId}/${currentPage}${query.length ? '?' + query : ''}`;
		if (replace) {
			window.history.replaceState({}, '', url);
		} else {
			window.history.pushState({}, '', url);
		}
	}

	let topPlayerId;
	let tenthPlayerId;
	let fifteethPlayerId;
	function onPlayersFetched(event) {
		if (event.detail && event.detail.length && currentFilters.countries.length == 0 && currentFilters.search.length == 0) {
			topPlayerId = event.detail[0].playerId;
			tenthPlayerId = event.detail.length > 10 ? event.detail[9].playerId : null;
			fifteethPlayerId = event.detail.length > 50 ? event.detail[49].playerId : null;
		}
	}

	let modalShown;

	$: changeParams(page, eventId, location);
	$: mainPlayerId = $account?.id;
</script>


<ContentBox cls={modalShown ? 'inner-modal' : ''}>
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
</ContentBox>

<ContentBox bind:box={boxEl}>
	<h1 class="title is-5">
		{#if isLoading}
			<Spinner />
		{/if}
	</h1>

	<EventRankingTable
		page={currentPage}
		filters={currentFilters}
		playerClickFilter={`eventId=${currentEvent?.id ?? ''}`}
		eventId={currentEventId}
		on:players-fetched={onPlayersFetched}
		on:page-changed={onPageChanged}
		on:loading={e => (isLoading = !!e?.detail)}
		on:pending={e => (pending = e?.detail)} />
</ContentBox>

{#if mainPlayerId && topPlayerId && (mainPlayerId == topPlayerId || (eventId == 50 && (mainPlayerId == tenthPlayerId || mainPlayerId == fifteethPlayerId))) && currentEvent && Date.now() / 1000 < currentEvent.endDate + WEEKSECONDS}
<div class="confetti">
	<Confetti x={[-5, 5]} y={[0, 0.1]} delay={[500, 2000]} size="20" infinite duration="5000" amount="200" fallDistance="100vh" />
</div>
{/if}

<style>
	.align-content {
		display: flex;
		justify-content: flex-start;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	aside {
		width: 25em;
	}

	aside :global(.switch-types) {
		justify-content: flex-start;
	}

	.confetti {
		position: fixed;
		top: -50px;
		left: 0;
		height: 100vh;
		width: 100vw;
		display: flex;
		justify-content: center;
		overflow: hidden;
		pointer-events: none;
	}

	.bswcbg {
		background-image: url(https://cdn.cube.community/1706455892406-Artboard_1_copy_3.webp) !important;
		background-size: cover !important;
		background-position: center !important;
		z-index: 1;
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		border-radius: 8px;
		left: 0;
	}

	.bswcbgblur {
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		filter: brightness(0.5);
		z-index: 2;
		width: 100%;
		position: absolute;
		height: 100%;
		top: 0;
		left: 0;
		border-radius: 8px;
		--webkit-transofrm: translateZ(0);
		--webkit-perspective: 1000;
		--webkit-backface-visibility: hidden;
	}

	.bswc-container {
		position: relative;
		display: flex;
		flex-direction: column;
		z-index: 3;
	}

	:global(.bswc-2025-buttons button) {
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4) !important;
	}

	input::placeholder {
		color: var(--faded) !important;
	}

	.star-message {
		font-size: 0.875em;
		color: var(--faded);
		margin: 1em;
		display: block;
	}

	:global(.inner-modal) {
		z-index: 10;
		position: relative;
	}

	:global(.bswc-box) {
		position: relative !important;
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
</style>
