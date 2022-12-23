<script>
	import {navigate} from 'svelte-routing';
	import ssrConfig from '../ssr-config';
	import {createEventDispatcher} from 'svelte';
	import {fade, fly} from 'svelte/transition';
	import createEventsStore from '../stores/http/http-events-store';
	import createAccountStore from '../stores/beatleader/account';
	import Pager from '../components/Common/Pager.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Event from '../components/Event/Event.svelte';
	import {scrollToTargetAdjusted} from '../utils/browser';

	export let page = 1;
	export let location;

	const dispatch = createEventDispatcher();

	let shouldBeForceRefreshed = new URLSearchParams(location?.search ?? '')?.get('refresh') ?? false;

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	const buildFiltersFromLocation = location => {
		const params = [];

		const searchParams = new URLSearchParams(location?.search ?? '');

		return params.reduce(
			(cum, param) => ({
				...cum,
				[param.key]: param.process(searchParams.get(param.key)) ?? param.default,
			}),
			{}
		);
	};
	const buildSearchFromFilters = filters => {
		if (!filters) return '';

		const searchParams = new URLSearchParams();
		Object.entries(filters).forEach(([key, value]) => searchParams.append(key, value));

		return searchParams.toString();
	};

	let currentPage = page;
	let currentFilters = buildFiltersFromLocation(location);
	let boxEl = null;

	const eventsStore = createEventsStore(page, currentFilters);

	function changePageAndFilters(newPage, newLocation, force) {
		shouldBeForceRefreshed = false;

		currentFilters = buildFiltersFromLocation(newLocation);

		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentPage = newPage;
		eventsStore.fetch(currentPage, {...currentFilters}, force);
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/events/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
	}

	function scrollToTop() {
		if (boxEl) scrollToTargetAdjusted(boxEl, 60);
	}

	const account = createAccountStore();

	$: isLoading = eventsStore.isLoading;
	$: pending = eventsStore.pending;
	$: numOfEvents = $eventsStore ? $eventsStore?.metadata?.total : null;
	$: itemsPerPage = $eventsStore ? $eventsStore?.metadata?.itemsPerPage : 10;

	$: changePageAndFilters(page, location, shouldBeForceRefreshed);

	$: eventsPage = $eventsStore?.data ?? [];

	$: scrollToTop($pending);
</script>

<svelte:head>
	<title>Events / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade>
		<ContentBox bind:box={boxEl}>
			<h1 class="title is-5">
				Events

				{#if $isLoading}
					<Spinner />
				{/if}
			</h1>

			{#if eventsPage?.length}
				<div class="events">
					{#each eventsPage as event, idx (event.id)}
						<a
							href={`/event/${event.id}`}
							on:click={e => {
								navigate(`/event/${event.id}`);
								e.preventDefault();
							}}
							class="event-box"
							class:finished={Date.now() / 1000 > event?.endDate}
							in:fade={{delay: idx * 10}}>
							<ContentBox cls={event.id == 23 ? 'festive' : ''}>
								<Event {event} on:show-playlist={e => navigate('/playlist/' + e?.detail?.playlistId)} />
							</ContentBox>
						</a>
					{/each}
				</div>

				<Pager
					totalItems={numOfEvents}
					{itemsPerPage}
					itemsPerPageValues={null}
					currentPage={currentPage - 1}
					loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
					mode={numOfEvents ? 'pages' : 'simple'}
					on:page-changed={onPageChanged} />
			{:else if !$isLoading}
				<p>No events found.</p>
			{/if}
		</ContentBox>
	</article>
</section>

<style>
	.align-content {
		display: flex;
		align-items: flex-start;
		justify-content: center;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	.events {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-gap: 2rem;
	}

	.events :global(.content-box) {
		height: 100%;
		margin: 0;
	}

	.event-box.finished {
		filter: grayscale(1);
		opacity: 0.5;
		transition: opacity 100ms;
	}

	.event-box.finished:hover {
		filter: none;
		opacity: 1;
	}

	@media screen and (max-width: 1023px) {
		.events {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media screen and (max-width: 649px) {
		.events {
			grid-template-columns: 1fr;
		}
	}
</style>
