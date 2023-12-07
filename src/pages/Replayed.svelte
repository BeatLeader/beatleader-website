<script>
	import {fade, fly} from 'svelte/transition';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import FeaturedCarousel from '../components/Maps/FeaturedCarousel.svelte';
	import ReplayedCard from '../components/Replayed/ReplayedCard.svelte';
	import ReplayedSummaryCard from '../components/Replayed/ReplayedSummaryCard.svelte';
	import {fetchJson} from '../network/fetch';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import SoundMotionController from '../components/Replayed/SoundMotionController.svelte';

	export let replayedType = 'player';
	export let playerId = null;
	export let location = null;

	let cards;

	function fetchReplayed() {
		fetchJson(BL_API_URL + 'replayed' + (playerId ? `?playerId=${playerId}` : ''), {
			credentials: 'include',
		}).then(async response => {
			if (replayedType === 'player' && response.body.player != null) {
				prepPlayerData(response.body.player);
			} else if (replayedType === 'mapper' && response.body.mapper != null) {
				prepMapperData(response.body.mapper);
			} else {
				return;
			}
		});
	}

	function prepPlayerData(data) {
		let _cards = [];
		_cards.push({
			component: ReplayedSummaryCard,
			props: {
				title: 'Your 2023 in Beat Saber',
				subText: 'A year summarized',
				summaryType: 'player',
				colorStartIndex: color ? color : 0,
				stats: {
					topMappers: data.topMappers.slice(0, 5),
					topMaps: data.topMaps.slice(0, 5),
					extraStats: [
						{
							name: 'Plays',
							value: data.plays,
						},
						{
							name: 'Active days',
							value: data.activeDays,
						},
						{
							name: 'Days streak',
							value: data.daysStreak,
						},
						{
							name: 'Minutes played',
							value: data.minutesPlayed.toFixed(2),
						},
						{
							name: 'Top category',
							value: data.topCategory,
						},
					],
				},
			},
		});

		cards = _cards;
	}

	function prepMapperData(data) {
		let _cards = [];
		_cards.push({
			component: ReplayedSummaryCard,
			props: {
				title: 'Your 2023 in Mapping',
				subText: 'A year summarized',
				summaryType: 'mapper',
				colorStartIndex: color ? color : 4,
				stats: {
					topMaps: data.topMaps.slice(0, 5),
					extraStats: [
						{
							name: 'Plays',
							value: data.playsCount,
						},
						{
							name: 'Fails',
							value: data.failsCount,
						},
						{
							name: 'FCs',
							value: data.fCsCount,
						},
						{
							name: 'Total Minutes played',
							value: data.minutesPlayed.toFixed(2),
						},
						{
							name: 'Total unique players',
							value: data.playersCount,
						},
					],
				},
			},
		});

		cards = _cards;
	}

	$: fetchReplayed();
	$: color = new URLSearchParams(location?.search ?? '')?.get('color') ?? null;
</script>

<svelte:head>
	<title>BeatLeader Replayed 2023</title>
</svelte:head>

<section class="align-content">
	<article class="page-content align-content">
		<div class="items">
			{#if cards}
				<FeaturedCarousel {cards} showFillerCards={false} height={'1000%'} cardWidthRatio={1} />
			{/if}
		</div>
	</article>
</section>

<style>
	.align-content {
		display: flex;
		justify-content: center !important;
	}

	:global(.main-content-replayed) {
		aspect-ratio: 9 / 14.5; /*results in ~9 / 16 for ReplayedCard*/
	}

	.page-content {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	article {
		width: 100%;
		height: 100%;
		overflow-x: visible;
	}

	.items {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>
