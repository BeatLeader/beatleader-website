<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import {buildSearchFromFilters} from '../utils/filters';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import ssrConfig from '../ssr-config';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import RankingTable from '../components/Ranking/RankingTable.svelte';
	import Button from '../components/Common/Button.svelte';

	export let page = 1;
	export let eventId;

	document.body.classList.remove('slim');

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentPage = page;
	let currentEventId = eventId;
	let currentEvent;
	let boxEl = null;

	let isLoading = false;
	let pending = null;
	let preventScroll = false;

	function scrollToTop() {
		if (!preventScroll && boxEl) scrollToTargetAdjusted(boxEl, 70);
		preventScroll = false;
	}

	function changeParams(newPage, eventId, replace) {
		currentEventId = eventId;
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentPage = newPage;

		fetch(BL_API_URL + 'event/' + eventId)
			.then(response => response.json())
			.then(ev => {
				currentEvent = ev;
			});
	}

	function onPageChanged(event) {
		if (event?.detail?.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/event/${currentEventId}/${event.detail.page + 1}`);
	}

	$: changeParams(page, eventId, true);
	$: scrollToTop(pending);
</script>

<svelte:head>
	<title>Event / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<aside>
		<ContentBox>
			{#if currentEvent}
				<div class="info-container">
					<img src={currentEvent.image} />
					<h2>{currentEvent.name}</h2>
					<Button label="Show playlist" on:click={() => navigate('/playlist/' + currentEvent.playlistId)} />
				</div>
			{/if}
		</ContentBox>
	</aside>

	<article class="page-content" transition:fade>
		<ContentBox bind:box={boxEl}>
			<h1 class="title is-5">
				Ranking

				{#if isLoading}
					<Spinner />
				{/if}
			</h1>

			<RankingTable
				page={currentPage}
				filters={{}}
				eventId={currentEventId}
				on:page-changed={onPageChanged}
				on:loading={e => (isLoading = !!e?.detail)}
				on:pending={e => (pending = e?.detail)} />
		</ContentBox>
	</article>
</section>

<style>
	.align-content {
		display: flex;
		justify-content: flex-end !important;
	}

	.info-container {
		display: flex;
		align-items: center;
		flex-direction: column;
		grid-gap: 1em;
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
