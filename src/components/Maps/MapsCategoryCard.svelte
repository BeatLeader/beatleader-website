<script>
	import {navigate} from 'svelte-routing';
	import rankedTimer from '../../stores/ranked-timer';
	import {fade} from 'svelte/transition';
	import MapIcon from './MapIcon.svelte';
	import {fetchJson} from '../../network/fetch';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let categoryName;
	export let showRankedCounter = false;
	export let bgColor = '#292823';
	export let showComingSoon = false;
	export let redirectUrl = null;

	let icons = [];

	function setIcons() {
		switch (categoryName) {
			case 'Ranked':
				setRankedIcons();
				break;
			case 'Trending':
				setTrendingIcons();
				break;
			case 'Curated':
				setCuratedIcons();
				break;
		}
	}

	async function setRankedIcons() {
		let images = [];

		await fetchJson(
			BL_API_URL +
				'leaderboards/groupped' +
				'?leaderboardContext=general&page=1&count=3&type=ranked&sortBy=timestamp&order=desc&allTypes=0&allRequirements=0'
		).then(response => {
			let uniqueData = response.body.data.filter((map, index, self) => {
				const songId = map?.song?.id;
				return songId && self.findIndex(m => m?.song?.id === songId) === index;
			});

			uniqueData.forEach(map => {
				images.push(map?.song?.fullCoverImage ?? map?.song?.coverImage);
			});
		});

		icons = [
			{
				width: '47%',
				left: '-9%',
				top: '32%',
				image: images[0],
			},
			{
				width: '39%',
				right: '-3%',
				top: '27%',
				image: images[1],
			},
			{
				width: '41%',
				left: '8%',
				top: '-22.7%',
				image: images[2],
			},
		];
	}

	async function setTrendingIcons() {
		icons = [];
	}

	async function setCuratedIcons() {
		let images = [];

		await fetchJson(
			BL_API_URL +
				'leaderboards/groupped' +
				'?leaderboardContext=general&page=1&count=3&type=all&sortBy=timestamp&order=desc&allTypes=0&songStatus=2&allRequirements=0'
		).then(response => {
			let uniqueData = response.body.data.filter((map, index, self) => {
				const songId = map?.song?.id;
				return songId && self.findIndex(m => m?.song?.id === songId) === index;
			});

			uniqueData.forEach(map => {
				images.push(map?.song?.fullCoverImage ?? map?.song?.coverImage);
			});
		});

		icons = [
			{
				width: '52%',
				left: '-7%',
				top: '44%',
				image: images[0],
			},
			{
				width: '43%',
				right: '-5%',
				top: '30%',
				image: images[1],
			},
			{
				width: '41%',
				left: '8%',
				top: '-22.7%',
				image: images[2],
			},
		];
	}

	function handleClick() {
		if (redirectUrl) navigate(redirectUrl);
	}

	$: categoryName && setIcons();
</script>

<a href={redirectUrl} class="card" style="background: {bgColor} !important;" on:click|preventDefault={handleClick}>
	<h1>{categoryName}</h1>

	<div class="icons-container">
		{#each icons as icon}
			<MapIcon {...icon} />
		{/each}
	</div>

	{#if showRankedCounter && $rankedTimer}
		<div class="rankedBatchCounter" transition:fade>
			<span class="counterHeader">Next batch in:</span>
			{#if $rankedTimer.days > 0}
				<span class="countdown">{$rankedTimer.days} Day{$rankedTimer.days !== 1 ? 's' : ''}</span>
				<span class="countdown">{$rankedTimer.hours} Hour{$rankedTimer.hours !== 1 ? 's' : ''}</span>
			{:else if $rankedTimer.hours > 0}
				<span class="countdown">{$rankedTimer.hours} Hour{$rankedTimer.hours !== 1 ? 's' : ''}</span>
			{:else if $rankedTimer.minutes > 0}
				<span class="countdown">{$rankedTimer.minutes} Minute{$rankedTimer.minutes !== 1 ? 's' : ''}</span>
			{:else}
				<span class="countdown">{Math.round($rankedTimer.seconds)} Second{$rankedTimer.seconds !== 1 ? 's' : ''}</span>
			{/if}
		</div>
	{/if}

	{#if showComingSoon}
		<div class="rankedBatchCounter" transition:fade>
			<span class="counterHeader">Coming Soon</span>
		</div>
	{/if}
</a>

<style>
	.card {
		width: 100%;
		height: 25em;
		border-radius: 12px;
		position: relative;
		box-shadow: 2px 2px 18px 4px rgba(0, 0, 0, 0.25);
		overflow: hidden;
		cursor: pointer;

		-webkit-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	@media screen and (max-width: 950px) {
		.card {
			height: 29em;
		}
	}

	h1 {
		position: absolute;
		top: 1em;
		left: 50%;
		transform: translateX(-50%);
		justify-content: center;
		text-align: center;

		color: #fff;
		font-family: Noto Sans SC;
		font-size: 2.625em;

		font-style: normal;
		font-weight: 700;
		line-height: normal;
		z-index: 30;
		text-shadow: 2px 2px 4px black;
		pointer-events: none;
	}

	.rankedBatchCounter {
		position: absolute;
		bottom: 1.5em;
		left: 50%;
		transform: translateX(-50%);
		justify-content: center;
		text-align: center;
		display: flex;
		flex-direction: column;
		z-index: 30;
		text-shadow: 2px 2px 4px black;
		pointer-events: none;
	}

	.counterHeader {
		color: #fff;
		font-family: Noto Sans SC;
		font-size: 1.25em;
		font-style: normal;
		font-weight: 700;
		line-height: normal;
	}

	.countdown {
		color: #fff;
		font-family: Noto Sans SC;
		font-size: 1.5em;
		font-style: normal;
		font-weight: 700;
		line-height: normal;
	}

	.icons-container {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 1;
		transition: transform 600ms ease-in-out;
		transform-origin: 50% 20%;
	}

	.icons-container:hover {
		transform: scale(1.1);
	}
</style>
