<script>
	import {navigate} from 'svelte-routing';
	import ssrConfig from '../ssr-config';
	import {fade, fly} from 'svelte/transition';
	import createEventsStore from '../stores/http/http-events-store';
	import Pager from '../components/Common/Pager.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Event from '../components/Event/Event.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import BuildingBlocks from '../components/Event/BuildingBlocks.svelte';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';

	export let page = 1;
	export let location;

	const tabOptions = [
		{value: 'events', label: 'Events', iconFa: 'fas fa-calendar-alt', url: '/events/1', cls: 'ranking-tab-button'},
		{value: 'badges', label: 'Badges', iconFa: 'fas fa-medal', url: '/badges', cls: 'ranking-tab-button'},
	];
	const currentTab = tabOptions[0];

	function onTabChanged(e) {
		if (e.detail.value === 'badges') {
			navigate(`/badges`);
		}
	}

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

		navigate(`/events/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`, {preserveScroll: true});
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

	$: cinematicsCanvas && drawCinematics(cinematicsCanvas, '/assets/bswc2025background.webp');

	$: isLoading = eventsStore.isLoading;
	$: pending = eventsStore.pending;
	$: numOfEvents = $eventsStore ? $eventsStore?.metadata?.total : null;
	$: itemsPerPage = $eventsStore ? $eventsStore?.metadata?.itemsPerPage : 10;

	$: changePageAndFilters(page, location, shouldBeForceRefreshed);

	$: eventsPage = $eventsStore?.data ?? [];
	$: metaDescription = 'Competitions, ranked weeks and special occasions';
</script>

<svelte:head>
	<title>Events / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<div class="ranking-switcher">
			<TabSwitcher values={tabOptions} value={currentTab} on:change={onTabChanged} class="ranking" />
		</div>
		<ContentBox>
			{#if $isLoading}
				<Spinner />
			{/if}

			{#if eventsPage?.length}
				<div class="events">
					{#each eventsPage as event, idx (event.id)}
						{#if event.id == 63}
							<a
								href={`/event/building-blocks-2024`}
								on:click={e => {
									navigate(`/event/building-blocks-2024`);
									e.preventDefault();
								}}
								class="event-box"
								class:finished={Date.now() / 1000 > 1738699200}
								in:fade|global={{delay: idx * 10}}>
								<ContentBox>
									<BuildingBlocks />
								</ContentBox>
							</a>
						{:else if event.id == 62}
							<a
								href={`/event/project-tree`}
								on:click={e => {
									navigate(`/event/project-tree`);
									e.preventDefault();
								}}
								class="event-box"
								class:finished={Date.now() / 1000 > event?.endDate}
								in:fade|global={{delay: idx * 10}}>
								<ContentBox>
									{#if event.id == 74 && !(Date.now() / 1000 > event?.endDate)}
										<div class="cinematics">
											<div class="cinematics-canvas">
												<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
											</div>
										</div>
										<div class="bswcbg" />
										<div class="bswcbgblur" />
									{/if}
									<Event {event} withLeader={false} on:show-playlist={e => navigate('/playlist/' + e?.detail?.playlistId)} />
								</ContentBox>
							</a>
						{:else}
							<a
								href={`/event/${event.pageAlias ?? event.id}`}
								on:click={e => {
									navigate(`/event/${event.pageAlias ?? event.id}`);
									e.preventDefault();
								}}
								class="event-box"
								class:finished={Date.now() / 1000 > event?.endDate}
								in:fade|global={{delay: idx * 10}}>
								<ContentBox cls={event.id == 23 ? 'festive' : event.id == 74 ? 'bswc-box' : ''}>
									{#if event.id == 74 && !(Date.now() / 1000 > event?.endDate)}
										<div class="cinematics">
											<div class="cinematics-canvas">
												<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
											</div>
										</div>
										<div class="bswcbg" />
										<div class="bswcbgblur" />
									{/if}
									<Event {event} on:show-playlist={e => navigate('/playlist/' + e?.detail?.playlistId)} />
								</ContentBox>
							</a>
						{/if}
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

<MetaTags
	title="Beat Saber events"
	description={metaDescription}
	openGraph={{
		title: 'Beat Saber events',
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: 'Beat Saber events',
		description: metaDescription,
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: ssrConfig.name + "'s logo",
	}} />

<style>
	.align-content {
		display: flex;
		align-items: flex-start;
		justify-content: center;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
		overflow: visible;
	}

	.ranking-switcher {
		margin-left: 0.8em;
		margin-top: 0.5em;
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

	.bswcbg {
		background-image: url(/assets/bswc2025background.webp) !important;
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
		filter: brightness(0.6);
		z-index: 2;
		width: 102%;
		position: absolute;
		height: 102%;
		top: -1%;
		left: -1%;
		border-radius: 8px;
		--webkit-transofrm: translateZ(0);
		--webkit-perspective: 1000;
		--webkit-backface-visibility: hidden;
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
		transform: scale(0.85) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
		transition: opacity 0.2s ease-in-out;
	}

	:global(.bswc-box .event) {
		position: relative;
		z-index: 2;
	}

	:global(.bswc-box) {
		transition: scale 0.2s ease-in-out;
	}

	:global(.bswc-box:hover .cinematics-canvas) {
		opacity: 1;
	}

	:global(.bswc-box:has(.event):hover) {
		scale: 1.015;
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
