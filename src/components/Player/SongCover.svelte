<script>
	import {BS_CDN} from '../../network/queues/beatleader/page-queue';
	import {navigate} from 'svelte-routing';
	import Difficulty from '../Song/Difficulty.svelte';
	import MapTriangleSmall from '../Leaderboard/MapTriangleSmall.svelte';

	export let leaderboard = null;
	export let capturedLeaderboard = null;
	export let url = null;
	export let notClickable = false;
	export let starsKey = 'stars';

	const DEFAULT_IMG = '/assets/song-default.png';

	let preloadCache = {};
	let loadedImages = [];

	function preloadImages(images) {
		if (!images.some(img => img?.url?.length)) return;

		images.forEach(imgObj => {
			if (!imgObj?.url?.length || preloadCache[imgObj?.url]) return;

			const url = imgObj.url;

			preloadCache[url] = imgObj;

			const img = new Image();
			img.src = url;
			img.onload = e => {
				if (preloadCache[url]) loadedImages = [...loadedImages, imgObj];
			};
		});
	}

	$: hash = leaderboard?.song?.hash ?? null;
	$: ssCoverUrl = leaderboard?.song?.coverImage ?? (hash ? `${BS_CDN}/${encodeURIComponent(hash)}.jpg` : null);
	$: beatSaverCoverUrl = leaderboard?.beatMaps?.versions?.[0]?.coverURL ?? null;

	$: clHash = capturedLeaderboard?.song?.hash ?? null;
	$: clSSCoverUrl = capturedLeaderboard?.song?.imageUrl ?? (clHash ? `${BS_CDN}/${encodeURIComponent(clHash)}.jpg` : null);
	$: clBeatSaverCoverUrl = capturedLeaderboard?.beatMaps?.versions?.[0]?.coverURL ?? null;

	$: preloadImages(leaderboard ? 
		[{url: ssCoverUrl, priority: 10}, {url: beatSaverCoverUrl, priority: 5}] : 
		[{url: clSSCoverUrl, priority: 10}, {url: clBeatSaverCoverUrl, priority: 5}]);

	$: coverUrl = loadedImages.length ? loadedImages.sort((a, b) => a?.priority - b?.priority)[0].url : DEFAULT_IMG;
</script>

{#if !capturedLeaderboard}
	<div class="cover-difficulty">
		{#if leaderboard}
			{#if notClickable}
				<img src={coverUrl} alt="" />
			{:else}
				<a href={url} on:click|preventDefault={() => navigate(url)}>
					<img src={coverUrl} alt="" />
				</a>
			{/if}
			{#if leaderboard?.diffInfo?.type != 'Standard'}
				<div class="mode">
					<Difficulty diff={leaderboard.diffInfo} pointer={true} hideTitle={true} reverseColors={true} showDiffIcons={true} />
				</div>
			{/if}
			{#if leaderboard?.difficulty?.accRating || leaderboard?.difficultyBl?.accRating}
				<div class="type">
					<MapTriangleSmall leaderboard={leaderboard?.difficulty?.accRating ? leaderboard?.difficulty : leaderboard?.difficultyBl} />
				</div>
			{/if}
			<div class="difficulty">
				<Difficulty
					diff={leaderboard.diffInfo}
					useShortName={true}
					reverseColors={true}
					stars={(leaderboard?.difficulty && leaderboard?.difficulty[starsKey]) ??
						(leaderboard?.difficultyBl && leaderboard?.difficultyBl[starsKey])}
					starsSuffix={leaderboard.complexity ? '' : '★'} />
			</div>
		{:else}
			<img src={DEFAULT_IMG} alt="" />
		{/if}
	</div>
{:else if !leaderboard}
	<div class="cover-difficulty">
		{#if notClickable}
			<img src={coverUrl} alt="" />
		{:else}
			<a href={url} on:click|preventDefault={() => navigate(url)}>
				<img src={coverUrl} alt="" />
			</a>
		{/if}

		{#if capturedLeaderboard.diffInfo.type != 'Standard'}
			<div class="mode">
				<Difficulty diff={capturedLeaderboard.diffInfo} pointer={true} hideTitle={true} reverseColors={true} showDiffIcons={true} />
			</div>
		{/if}

		{#if capturedLeaderboard?.difficulty?.accRating || capturedLeaderboard?.difficultyBl?.accRating}
			<div class="type">
				<MapTriangleSmall leaderboard={capturedLeaderboard?.difficulty?.accRating ? capturedLeaderboard?.difficulty : capturedLeaderboard?.difficultyBl} />
			</div>
		{/if}

		<div class="difficulty">
			<Difficulty
				diff={capturedLeaderboard.diffInfo}
				useShortName={true}
				reverseColors={true}
				stars={(capturedLeaderboard?.difficulty && capturedLeaderboard?.difficulty[starsKey]) ??
					(capturedLeaderboard?.difficultyBl && capturedLeaderboard?.difficultyBl[starsKey])}
				starsSuffix={capturedLeaderboard.complexity ? '' : '★'} />
		</div>
	</div>
{/if}

<style>
	.cover-difficulty {
		position: relative;
		min-width: 4em;
		width: 4em;
	}

	.difficulty {
		display: flex;
		align-items: center;
		position: absolute;
		bottom: 0.8em;
		right: -0.5em;
		font-size: 0.75em;
	}

	.mode {
		display: flex;
		align-items: center;
		position: absolute;
		top: 0.8em;
		right: 0;
		font-size: 0.75em;
	}

	.type {
		display: flex;
		align-items: center;
		position: absolute;
		top: -0.5em;
		right: -0.5em;
		font-size: 0.75em;
	}

	img {
		width: 3.5em;
		height: 3.5em;
		border-radius: 15%;
	}
</style>
