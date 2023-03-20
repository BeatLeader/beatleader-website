<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import ssrConfig from '../ssr-config';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import RankingTable from '../components/Ranking/RankingTable.svelte';
	import Button from '../components/Common/Button.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import {createBuildFiltersFromLocation, buildSearchFromFilters, processStringFilter, processStringArrayFilter} from '../utils/filters';
	import RangeSlider from 'svelte-range-slider-pips';
	import {debounce} from '../utils/debounce';
	import {dateFromUnix, formatDateRelative, formatDate, WEEKSECONDS} from '../utils/date';
	import Switcher from '../components/Common/Switcher.svelte';
	import Countries from '../components/Ranking/Countries.svelte';
	import Event from '../components/Event/Event.svelte';
	import {Confetti} from 'svelte-confetti';

	export let page = 1;
	export let location;
	export let eventId;

	const account = createAccountStore();

	const FILTERS_DEBOUNCE_MS = 500;

	const findParam = key => params.find(p => p.key === key);

	const onInputChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = e.target.value ?? '';

			updateCurrentFiltersFromParams();
		}
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
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		params.forEach(p => {
			if (p.key === 'countries') {
				p.value = Array.isArray(filters?.[p.key]) ? filters[p.key] : p?.default ?? [];
				filters[p.key] = filters[p.key] ?? [];
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
	let currentEventId = eventId;
	let currentEvent;
	let boxEl = null;

	let isLoading = false;
	let pending = null;
	let preventScroll = false;

	function updateCurrentFiltersFromParams(noScroll) {
		params.forEach(p => {
			if (p.key === 'countries') {
				currentFilters[p.key] = p.multi ? (p?.value ?? []).join(',') : p?.value ?? '';
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

	function changeParams(newPage, eventId, newLocation, replace) {
		currentEventId = eventId;
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentFilters = buildFiltersFromLocation(newLocation);
		if (!currentFilters?.sortBy?.length) {
			currentFilters.sortBy = 'pp';
		}

		currentPage = newPage;

		if (!currentEvent) {
			fetch(BL_API_URL + 'event/' + eventId)
				.then(response => response.json())
				.then(ev => {
					currentEvent = ev;
				});
		}
	}

	function onPageChanged(event) {
		if (event?.detail?.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/event/${currentEventId}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
	}

	function navigateToCurrentPageAndFilters(replace) {
		navigate(`/event/${currentEventId}/${currentPage}?${buildSearchFromFilters(currentFilters)}`, {replace});
	}

	let topPlayerId;
	function onPlayersFetched(event) {
		if (event.detail && event.detail.length) {
			topPlayerId = event.detail[0].playerId;
		}
	}

	let modalShown;

	$: changeParams(page, eventId, location, true);
	$: scrollToTop(pending);
	$: mainPlayerId = $account?.id;
</script>

<svelte:head>
	<title>Event / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<aside>
		<ContentBox cls={eventId == 23 ? 'festive' : ''}>
			<Event event={currentEvent} withLeader={false} on:show-playlist={e => navigate('/playlist/' + e?.detail?.playlistId)} />
		</ContentBox>
	</aside>

	<article class="page-content" transition:fade>
		{#if eventId == 23}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					Have you ever wondered how Beat Saber would feel with timing based scoring instead of accuracy based? Wonder no more!<br />
					Limited time offer from BeatLeader. Install the mods and play custom mode to try our attempt at reimagining the game.<br />
					No preswing, postswing or accuracy, only you and cubes. <br /><br />
				</span>
				<div class="downloadButtons">
					<a href="https://github.com/BeatLeader/beatleader-modifiers-mod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download PC mod" color="#2d4150" />
					</a>
					<a href="https://github.com/BeatLeader/beatleader-modifiers-qmod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download Quest mod" color="#2d4150" />
					</a>
				</div>
				<span>
					<br />
					Event consists of 10 Christmas themed songs and 10 most voted ranked maps.<br />
					Thank you mappers and ranking team for the productive year<br />
					<b>Happy holidays and have fun!</b>
				</span>
			</ContentBox>
		{/if}
		<ContentBox cls={modalShown ? 'inner-modal' : ''}>
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
						{:else if param?.type === 'countries'}
							<Countries countries={param.value} on:change={param.onChange} on:open={e => (modalShown = e.detail)} />
						{/if}
					</section>
				{/if}
			{/each}
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
				playerClickFilter={`eventId=${currentEvent?.id ?? ''}`}
				eventId={currentEventId}
				on:players-fetched={onPlayersFetched}
				on:page-changed={onPageChanged}
				on:loading={e => (isLoading = !!e?.detail)}
				on:pending={e => (pending = e?.detail)} />
		</ContentBox>
	</article>

	{#if mainPlayerId == topPlayerId && currentEvent && Date.now() / 1000 < currentEvent.endDate + WEEKSECONDS}
		<div
			style="position: fixed; top: -50px; left: 0; height: 100vh; width: 100vw; display: flex; justify-content: center; overflow: hidden;">
			<Confetti x={[-5, 5]} y={[0, 0.1]} delay={[500, 2000]} size="20" infinite duration="5000" amount="200" fallDistance="100vh" />
		</div>
	{/if}
</section>

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

	:global(.inner-modal) {
		z-index: 10;
		position: relative;
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
