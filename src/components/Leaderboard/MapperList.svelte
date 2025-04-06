<script>
	import Mapper from './Mapper.svelte';
	import {configStore} from '../../stores/config';

	/**
	 * @typedef {Object} Props
	 * @property {any} song
	 * @property {string} [maxHeight]
	 * @property {string} [maxWidth]
	 * @property {string} [fontSize]
	 * @property {boolean} [noArrow]
	 * @property {any} rootElement
	 * @property {boolean} [tooltip]
	 */

	/** @type {Props} */
	let {
		song,
		maxHeight = '4.5em',
		maxWidth = 'unset',
		fontSize = '1em',
		noArrow = false,
		rootElement = $bindable(),
		tooltip = false,
	} = $props();

	let lessInAuthorName = $state(false);
	let moreInAuthorName = $state(false);
	let isVariousMappers = $state(false);
	let authorNameMockMapper = $state(null);

	let badgeContainer = $state();
	let isExpanded = $state(false);
	let isOverflowing = $state(false);

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

	$effect(() => {
		determineMismatches(song.mapper ?? '');
	});
	$effect(() => {
		badgeContainer &&
			setTimeout(() => {
				checkOverflow(badgeContainer);
			}, 400);
	});
	$effect(() => {
		rootElement = badgeContainer;
	});
</script>

{#if song.mappers?.length}
	<div
		class="mappers-list"
		style="max-height: {maxHeight}; font-size: {fontSize}; max-width: {maxWidth}"
		bind:this={badgeContainer}
		class:expanded={isExpanded}
		class:expandable={isOverflowing && !isExpanded}
		class:no-arrow={noArrow}
		class:tooltip>
		{#if moreInAuthorName && authorNameMockMapper}
			<Mapper mapper={authorNameMockMapper} />
		{/if}
		{#each song.mappers as mapper}
			<Mapper {mapper} noPopover={noArrow} />
		{/each}
		{#if !tooltip && !moreInAuthorName && (lessInAuthorName || isVariousMappers || $configStore.leaderboardPreferences.alwaysShowAuthorHint)}
			<i
				class="fa-solid fa-circle-info map-name-info"
				class:higher-opacity={lessInAuthorName && !isVariousMappers}
				title="Mapped by: {song.mapper}"></i>
		{/if}
		{#if !noArrow && (isOverflowing || isExpanded)}
			<div class="expand-button" class:inverse={isExpanded} onclick={toggleExpansion}>
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
		overflow: hidden;
		padding-right: 1.25em;
	}

	.no-arrow {
		width: fit-content;
		padding-right: 0;
		white-space: nowrap;
		flex-wrap: nowrap;
	}

	.tooltip {
		flex-wrap: wrap;
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
		color: white;
		opacity: 0.8;
		font-size: 1.1em;
	}

	.map-name-info {
		color: white;
		opacity: 0.25;
		align-self: center;
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
