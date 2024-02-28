<script>
	import {BS_CDN} from '../../network/queues/beatleader/page-queue';
	import {navigate} from 'svelte-routing';
	import Difficulty from '../Song/Difficulty.svelte';
	import MapTriangleSmall from '../Leaderboard/MapTriangleSmall.svelte';
	import {computeModifiedRating, computeStarRating} from '../../utils/beatleader/pp';

	export let leaderboard = null;
	export let mods = null;
	export let url = null;
	export let notClickable = false;
	export let starsKey = 'stars';
	export let triangle = true;

	const DEFAULT_IMG = '/assets/song-default.webp';

	let preloadCache = {};
	let loadedImages = [];

	function preloadImages(images) {
		if (!images.some(img => img?.url?.length)) return;

		loadedImages = [];
		images.forEach(imgObj => {
			if (!imgObj?.url?.length) return;
			if (preloadCache[imgObj?.url]) {
				loadedImages = [...loadedImages, imgObj];
				return;
			}

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
	$: ssCoverUrl = leaderboard?.song?.coverImage ?? (hash ? `${BS_CDN}/${encodeURIComponent(hash.toLowerCase())}.jpg` : null);
	$: beatSaverCoverUrl = leaderboard?.beatMaps?.versions?.[0]?.coverURL ?? null;
	
	$: preloadImages([
		{url: ssCoverUrl, priority: 10},
		{url: beatSaverCoverUrl, priority: 5},
	]);

	$: coverUrl = loadedImages.length ? loadedImages.sort((a, b) => a?.priority - b?.priority)[0].url : DEFAULT_IMG;

	$: modifiers = leaderboard?.difficultyBl?.modifierValues ?? null;
	$: modifiersRating = leaderboard?.difficultyBl?.modifiersRating ?? null;
	$: passRating = leaderboard?.difficultyBl?.passRating ?? null;
	$: accRating = leaderboard?.difficultyBl?.accRating ?? null;
	$: techRating = leaderboard?.difficultyBl?.techRating ?? null;
	$: actualModifiers = mods?.map(m => ({name: m, value: 0})) ?? null;
	$: modifiedPassRating = computeModifiedRating(passRating, 'PassRating', modifiersRating, actualModifiers);
	$: modifiedAccRating = computeModifiedRating(accRating, 'AccRating', modifiersRating, actualModifiers);
	$: modifiedTechRating = computeModifiedRating(techRating, 'TechRating', modifiersRating, actualModifiers);
	$: modifiedStars =
		mods?.length && (passRating !== modifiedPassRating || accRating !== modifiedAccRating || techRating !== modifiedTechRating)
			? computeStarRating(modifiedPassRating, modifiedAccRating, modifiedTechRating)
			: null;
</script>

<div class="cover-difficulty">
	{#if leaderboard}
		{#if notClickable}
			<img src={coverUrl} alt="" />
		{:else}
			<a href={url} on:click|preventDefault={() => navigate(url)}>
				<img src={coverUrl} alt="" />
			</a>
		{/if}

		{#if triangle && (leaderboard?.difficulty?.accRating || leaderboard?.difficultyBl?.accRating)}
			<div class="type">
				<MapTriangleSmall leaderboard={leaderboard?.difficulty?.accRating ? leaderboard?.difficulty : leaderboard?.difficultyBl} {mods} />
			</div>
		{/if}

		{#if leaderboard?.diffInfo?.type != 'Standard'}
			<div class="mode">
				<Difficulty diff={leaderboard.diffInfo} pointer={true} hideTitle={true} reverseColors={true} showDiffIcons={true} />
			</div>
		{/if}

		<div class="difficulty">
			<Difficulty
				diff={leaderboard.diffInfo}
				useShortName={true}
				reverseColors={true}
				stars={(leaderboard?.difficulty && leaderboard?.difficulty[starsKey]) ??
					(leaderboard?.difficultyBl && leaderboard?.difficultyBl[starsKey])}
				{modifiedStars}
				starsSuffix={leaderboard.complexity ? '' : '★'} />
		</div>
	{:else}
		<img src={DEFAULT_IMG} alt="" />
	{/if}
</div>

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
		right: -0.5em;
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
