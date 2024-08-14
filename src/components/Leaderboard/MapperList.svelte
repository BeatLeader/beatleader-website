<script>
	import Mapper from './Mapper.svelte';
	import {configStore} from '../../stores/config';

	export let song;
	let lessInAuthorName = false;
	let moreInAuthorName = false;
	let isVariousMappers = false;
	let authorNameMockMapper = null;

	let badgeContainer;
	let isExpanded = false;
	let isOverflowing = false;

	function checkOverflow(badgeContainer) {
		if (badgeContainer) {
			isOverflowing = badgeContainer.scrollHeight > badgeContainer.clientHeight + 10;
		}
	}

	function toggleExpansion() {
		isExpanded = !isExpanded;
	}

	function countEntries(string) {
		// Regular expression to match delimiters: comma, &, and vs.
		const delimiters = /,|&|vs\./;

		let totalEntries = 0;

		const entries = string
			.replaceAll(' ', '')
			.split(delimiters)
			.filter(m => m.length);

		totalEntries += entries.length;

		return totalEntries;
	}

	function determineMismatches(mappersString) {
		mappersString = mappersString.toLowerCase();
		isVariousMappers = mappersString.includes('various');
		isVariousMappers = mappersString.includes(' as ');
		let entriesCount = countEntries(mappersString);
		lessInAuthorName = entriesCount < (song.mappers?.length ?? 0);
		moreInAuthorName = entriesCount > (song.mappers?.length ?? 0);

		authorNameMockMapper = {
			authorName: true,
			name: song.mapper,
		};
	}

	$: determineMismatches(song.mapper);
	$: badgeContainer &&
		setTimeout(() => {
			checkOverflow(badgeContainer);
		}, 400);
</script>

{#if song.mappers?.length}
	<div class="mappers-list" bind:this={badgeContainer} class:expanded={isExpanded} class:expandable={isOverflowing && !isExpanded}>
		{#if moreInAuthorName && authorNameMockMapper}
			<Mapper mapper={authorNameMockMapper} />
		{/if}
		{#each song.mappers as mapper}
			<Mapper {mapper} />
		{/each}
		{#if !moreInAuthorName && (lessInAuthorName || isVariousMappers || $configStore.leaderboardPreferences.alwaysShowAuthorHint)}
			<i
				class="fa-solid fa-circle-info map-name-info"
				class:higher-opacity={lessInAuthorName && !isVariousMappers}
				title="Mapped by: {song.mapper}" />
		{/if}
		{#if isOverflowing || isExpanded}
			<div class="expand-button" class:inverse={isExpanded} on:click={toggleExpansion}>
				<i class="fa-solid fa-chevron-down"></i>
			</div>
		{/if}
	</div>
{:else}
	<small class="level-author" title="Mapper">{song.mapper}</small>
{/if}

<style>
	.mappers-list {
		position: relative;
		display: flex;
		flex-direction: row;
		width: 100%;
		height: 100%;
		gap: 0.3em;
		flex-wrap: wrap;
		max-height: 4.5em;
		overflow-y: hidden;
		padding-right: 1.25em;
	}

	.expanded {
		max-height: none;
	}

	.expandable {
		mask-image: linear-gradient(180deg, white, white 40%, rgb(255 255 255 / 40%)),
			radial-gradient(circle at bottom right, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 1.2em, rgba(0, 0, 0, 0) 1.2em);
		mask-composite: add;
	}

	.level-author {
		color: var(--alternate);
		font-size: 1.1em;
	}
	.mapper-title {
		color: rgba(255, 255, 255, 0.797);
		font-size: 1.1em;
	}

	.map-name-info {
		color: white;
		opacity: 0.25;
	}

	.higher-opacity {
		opacity: 0.65;
	}

	.expand-button {
		position: absolute;
		bottom: 0.15em;
		right: 0em;
		color: white;
		width: 1em;
		height: 1em;
		transform: rotateX(0deg);
	}

	.inverse {
		transform: rotateX(180deg);
	}
</style>
