<script>
	import {navigate} from 'svelte-routing';
	import rankedTimer from '../../stores/ranked-timer';
	import {fade} from 'svelte/transition';
	import MapIcon from './MapIcon.svelte';
	import PageOverlay from '../Common/PageOverlay.svelte';

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

	function setRankedIcons() {
		icons = [
			{
				width: '47%',
				left: '-9%',
				top: '32%',
			},
			{
				width: '39%',
				right: '-3%',
				top: '27%',
			},
			{
				width: '41%',
				left: '8%',
				top: '-22.7%',
			},
		];
	}

	function setTrendingIcons() {
		icons = [];
	}

	function setCuratedIcons() {
		icons = [
			{
				width: '52%',
				left: '-7%',
				top: '44%',
			},
			{
				width: '43%',
				right: '-5%',
				top: '30%',
			},
			{
				width: '41%',
				left: '8%',
				top: '-22.7%',
			},
		];
	}

	function handleClick() {
		if (redirectUrl) navigate(redirectUrl);
	}

	$: categoryName && setIcons();
</script>

<div class="card" style="background: {bgColor} !important;" on:click={handleClick}>
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
</div>

<style>
	.card {
		width: 100%;
		height: 25em;
		border-radius: 12px;
		position: relative;
		box-shadow: 2px 2px 18px 4px rgba(0, 0, 0, 0.25);
		overflow: hidden;
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
		z-index: 50;
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
	}
</style>
