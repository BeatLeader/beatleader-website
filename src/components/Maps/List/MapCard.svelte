<script>
	import {createEventDispatcher, getContext, onMount} from 'svelte';
	import {crossfade, fade, fly, slide} from 'svelte/transition';

	import Value from '../../Common/Value.svelte';
	import Badge from '../../Common/Badge.svelte';
	import Icons from '../../Song/Icons.svelte';
	import {formatDiffStatus, DifficultyStatus, wrapBLStatus, getSongSortingValue} from '../../../utils/beatleader/format';
	import {configStore} from '../../../stores/config';
	import HashDisplay from '../../Common/HashDisplay.svelte';
	import SongStatus from './SongStatus.svelte';
	import MapperList from '../../Leaderboard/MapperList.svelte';
	import LeaderboardStats from '../../Leaderboard/LeaderboardStats.svelte';
	import ModesList from './ModesList.svelte';
	import SongPlayer from './SongPlayer.svelte';
	import {songPlayerStore} from '../../../stores/songPlayer';
	import {cinematicsStore} from '../../../stores/cinematics';
	import MapRequirements from './MapRequirements.svelte';

	export let map;
	export let sortBy = 'stars';
	export let forcePlaceholder = false;
	export let idx = 0;
	export let ratings = null;

	const dispatch = createEventDispatcher();
	const {open, close} = getContext('simple-modal');

	function onSelectedGroupEntryChanged() {
		dispatch('group-changed');
	}

	let status = null;
	let requirements = null;

	let isHovered = false;
	let isTopHovered = false;

	let mapCardElement;
	let mapCardWrapper;

	let bottomContainer;

	// data prep
	function calculateStatus(song) {
		for (const status of [
			DifficultyStatus.ranked,
			DifficultyStatus.qualified,
			DifficultyStatus.nominated,
			DifficultyStatus.inevent,
			DifficultyStatus.ost,
		]) {
			if (song.difficulties.find(difficulty => difficulty.status == status)) {
				return status;
			}
		}

		return song.difficulties[0].status;
	}

	function calculateRequirements(song) {
		var result = 0;
		for (const difficulty of song.difficulties) {
			result |= difficulty.requirements;
		}
		return result;
	}

	let song = null;
	let hash = null;
	let name = null;
	let sortValue = null;
	let coverUrl = null;

	function getSong(map) {
		if (!map) return;

		song = map;

		if (song.placeholder) {
			song.updateCallback = newMap => {
				getSong(newMap);
			};
		} else {
			if (song.difficulties) {
				status = calculateStatus(song);
				requirements = calculateRequirements(song);
			}
			hash = song.hash;
			name = song.name;
			coverUrl = song.coverImage;
			sortValue = getSongSortingValue(song, null, sortBy);
		}
	}

	$: getSong(map);

	let cinematicsCanvas;
	let rootcinematicsCanvas;

	$: if (cinematicsCanvas && coverUrl) cinematicsStore.drawCinematics(cinematicsCanvas, coverUrl);
	$: if (rootcinematicsCanvas && coverUrl) cinematicsStore.drawCinematics(rootcinematicsCanvas, coverUrl);

	let headerContainer;
	let headerContainerHeight = 0;

	function updateHeaderContainerHeight(headerContainer) {
		headerContainerHeight = headerContainer?.getBoundingClientRect().height ?? 0;
	}

	$: headerContainer && updateHeaderContainerHeight(headerContainer);

	// handle preview playing
	let playingSong = false;
	let mouseInside = false;

	let currentAnimation = null;

	function handlePlay(currentHash, songHash) {
		if (currentHash === songHash) {
			if (!isHovered) {
				handleHover(true);
			}
			playingSong = true;
		} else {
			playingSong = false;
			if (isHovered && !mouseInside) {
				handleHover(false);
			}
		}
	}

	$: hash && handlePlay($songPlayerStore?.currentHash, hash);

	// hover tooltip code
	let tooltipVisible = false;
	let tooltipX = 0;
	let tooltipY = 0;
	let tooltipType = '';
	let titleTextElement;
	let authorElement;
	let mappersElement;

	function showTooltip(type) {
		let element;
		let offset = 5;
		switch (type) {
			case 'title':
				element = titleTextElement;
				break;
			case 'author':
				element = authorElement;
				break;
			case 'mappers':
				element = mappersElement;
				offset = 0;
				break;
			default:
				element = titleTextElement;
				break;
		}

		// Only show tooltip if the content is overflowing
		if (element && element.scrollWidth > element.clientWidth) {
			const rect = element.getBoundingClientRect();

			tooltipX = rect.left + rect.width / 2;
			tooltipY = rect.top + offset;

			tooltipType = type;
			tooltipVisible = true;
		}
	}

	function hideTooltip() {
		tooltipVisible = false;
	}

	onMount(() => {
		// handle tooltip positioning on resize
		const updatePosition = () => {
			if (isHovered && mapCardWrapper) {
				const newRect = mapCardWrapper.getBoundingClientRect();
				mapCardElement.style.top = `${newRect.top}px`;
				mapCardElement.style.left = `${newRect.left}px`;
			}
		};

		window.addEventListener('resize', updatePosition);
		return () => window.removeEventListener('resize', updatePosition);
	});

	// isHovered handling
	function handleHover(bottom, hovering) {
		isHovered = hovering;
		isTopHovered = !bottom && hovering;
	}

	$: console.log('IT HAPPENED', isHovered);

	let isExpanded = false;
	let transitionInProgress = false;

	// Update the expanded state when hover state changes
	$: {
		if (isHovered && !isExpanded && !transitionInProgress) {
			isExpanded = true;
		} else if (!isHovered && isExpanded && !transitionInProgress) {
			isExpanded = false;
		}
	}

	// Function to handle transition start/end
	function handleTransition(event) {
		transitionInProgress = event.type === 'introstart' || event.type === 'outrostart';
	}
</script>

{#if song}
	{#if !forcePlaceholder && !song.placeholder}
		{#if tooltipVisible}
			<div class="title-tooltip" style="left: {tooltipX}px; bottom: calc(100vh - {tooltipY}px + 5px);">
				{#if tooltipType === 'title'}
					{name}
					{#if $configStore?.leaderboardPreferences?.showSubtitleInHeader && song.subName}
						<span class="tooltip-subname">{song.subName}</span>
					{/if}
				{:else if tooltipType === 'author'}
					<span class="tooltip-author">{song.author}</span>
				{:else if tooltipType === 'mappers'}
					<MapperList {song} maxHeight="7em" fontSize="0.9em" noArrow={true} tooltip={true} />
				{/if}
			</div>
		{/if}
		<div class="map-card-wrapper" class:transparent={song.transparent} class:is-hovered={isHovered} bind:this={mapCardWrapper}>
			<div class="cinematics root-cinematics" class:is-hovered={isHovered}>
				<div class="cinematics-canvas root-canvas">
					<canvas bind:this={rootcinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
				</div>
			</div>
			<div
				class="map-card"
				class:is-hovered={isHovered || currentAnimation}
				style={isHovered || currentAnimation ? `position: absolute;` : ''}
				bind:this={mapCardElement}
				tabindex="-1"
				role="button"
				on:mouseenter={() => handleHover(false, true)}
				on:mouseleave={() => handleHover(false, false)}>
				<div class="cinematics">
					<div class="cinematics-canvas">
						<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
					</div>
				</div>
				<a class="header-link" href={`/leaderboard/global/${song.difficulties?.[0]?.leaderboardId ?? song.id}`}></a>
				<div class="header" style="height: {headerContainerHeight < 150 ? '100%' : 'unset'};" class:is-hovered={isHovered}>
					<div
						class="map-cover"
						style={coverUrl
							? `background: url(${coverUrl}); background-repeat: no-repeat; background-size: cover; background-position: center;`
							: ''}>
						<div class="sort-value-background" class:is-hovered={sortValue && isHovered}></div>
					</div>
					{#if requirements && isHovered}
						<div transition:fly|local={{duration: 300, x: -40, y: 0}} class="requirements-icons">
							<MapRequirements type={requirements} />
						</div>
					{/if}

					<a class="main-container" href={`/leaderboard/global/${song.difficulties?.[0]?.leaderboardId ?? song.id}`}>
						<div class="header-container" bind:this={headerContainer}>
							<div class="header-top-part">
								<h1 class="song-title">
									<div
										class="title-text"
										on:mouseenter={() => showTooltip('title')}
										on:mouseleave={hideTooltip}
										bind:this={titleTextElement}>
										<span class="name">{name}</span>
										{#if $configStore?.leaderboardPreferences?.showSubtitleInHeader && song.subName}
											<span class="subname">{song.subName}</span>
										{/if}
									</div>
								</h1>

								<div class="title-container">
									<span class="author" on:mouseenter={() => showTooltip('author')} on:mouseleave={hideTooltip} bind:this={authorElement}
										>{song.author}</span>
								</div>
							</div>

							<div class="mapper-container" on:mouseenter={() => showTooltip('mappers')} on:mouseleave={hideTooltip}>
								<MapperList {song} maxHeight="2.2em" fontSize="0.9em" noArrow={true} bind:rootElement={mappersElement} />
							</div>
							<div class="status-container" class:is-hovered={isHovered}>
								{#if status && status != DifficultyStatus.unranked && status != DifficultyStatus.unrankable}
									<SongStatus songStatus={wrapBLStatus(status)} />
								{/if}
								{#if song.externalStatuses}
									{#each song.externalStatuses as songStatus}
										<SongStatus {songStatus} />
									{/each}
								{/if}
							</div>
						</div>
					</a>
					{#if isHovered}
						<div class="icons-container" transition:fly|local={{duration: 300, x: 50, y: 0}}>
							<Icons {song} icons={['preview', 'bsr', 'bs', 'oneclick']} />
						</div>
					{/if}
				</div>
				<div class="bottom-container-background" class:is-hovered={isHovered}></div>
				<div
					class="bottom-container"
					class:has-sort-value={!!sortValue}
					class:is-hovered={isHovered}
					bind:this={bottomContainer}
					style="--margin-top-value: -{headerContainerHeight < 150 ? 2.4 : 0}em;">
					<div class="top-row">
						<div class="placeholder">
							{#if sortValue}
								<div class="sort-value">
									{sortValue}
								</div>
							{/if}
						</div>

						{#if !isHovered}
							<div class="modes-list-container" class:is-hovered={false}>
								<ModesList {song} isHovered={false} {sortValue} {sortBy} />
							</div>
							<div
								class="mobile-chevron-container mobile-only"
								on:click={() => handleHover(true, true)}
								on:keydown={() => handleHover(true, true)}
								tabindex="-1"
								role="button">
								<i class="fas fa-chevron-down"></i>
							</div>
						{:else}
							<div class="song-player">
								<SongPlayer {song} />
							</div>
							<div
								class="mobile-chevron-container hovered mobile-only"
								on:click={() => handleHover(true, false)}
								on:keydown={() => handleHover(true, false)}
								tabindex="-1"
								role="button">
								<i class="fas fa-chevron-up"></i>
							</div>
						{/if}
					</div>

					{#if isHovered}
						<div class="modes-list-container" class:is-hovered={true} transition:slide|local={{duration: 300}}>
							<ModesList {song} isHovered={true} {sortValue} {sortBy} />
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="map-card-wrapper">
			<div class="map-card-placeholder">
				<div class="map-card-loading">Loading...</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.map-card-wrapper {
		position: relative;
		width: 32em;
		height: 10em;
		margin-bottom: 1.2em;
		overflow: visible;
		background-color: #000000;
		border-radius: 12px;
	}

	.map-card-wrapper.is-hovered {
		border-radius: 12px 12px 16px 16px;
	}

	.map-card-wrapper.transparent {
		opacity: 0;
		pointer-events: none;
	}

	/* .map-card-wrapper:hover .root-cinematics {
		opacity: 0.2;
	} */

	/* .map-card-wrapper:hover .icons-container {
		display: block;
	} */

	.map-card {
		position: relative;
		border-radius: 0.4em;
		overflow: hidden;
		width: 100%;
		border-radius: 12px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
		transition: box-shadow 0.3s ease;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.map-card.is-hovered {
		z-index: 3;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.7);
		background-color: #141414;
		height: unset;
		border-radius: 12px 12px 16px 16px;
	}

	.map-card-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		background-color: #1c1c1c;
		border-radius: 12px;
	}

	.root-cinematics {
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: -1;
	}

	.root-cinematics.is-hovered {
		opacity: 0.9;
	}

	.song-player {
		flex: 1;
	}
	.header {
		padding: 0.5em;
		color: var(--alternate);
		display: flex;
		align-items: flex-start;
		justify-content: start !important;
		gap: 0.8em;
		width: 32em;
		flex: 1;
	}

	.header.is-hovered {
		height: unset;
	}

	.bottom-container {
		display: flex;
		flex-wrap: wrap;
		padding: 0.3em;
		z-index: 1;
		position: relative;
		background-color: #0000004f;
		border-radius: 0 0 12px 12px;
		margin-top: var(--margin-top-value);
		align-items: center;
	}

	.bottom-container.has-sort-value {
		z-index: 2;
	}

	.bottom-container.is-hovered {
		background-color: transparent;
	}

	.bottom-container-background {
		display: none;
		z-index: -2;
	}

	.bottom-container-background.is-hovered {
		display: block;
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		background-color: black;
	}

	.requirements-icons {
		position: absolute;
		top: 0em;
		width: 2em;
		display: flex;
		flex-wrap: wrap;
		justify-content: start;
		align-items: center;
		gap: 0.2em;
		z-index: 2;
		padding-top: 0.7em;
	}

	:global(.requirements-icons:has(> :nth-child(4))) {
		width: 4em;
	}

	.sort-value {
		z-index: 2;
		font-weight: 600;
		font-size: 0.9em;
	}

	.sort-value-background {
		height: 32px;
		position: absolute;
		display: block;
		bottom: 0;
		background-color: transparent;
		width: 100%;
		border-radius: 0 0 8px 8px;
		transition: all 0.3s ease-in-out;
	}

	.sort-value-background.is-hovered {
		background-color: #0000004f;
	}

	.top-row {
		display: flex;
		width: 100%;
	}

	.modes-list-container {
		overflow: scroll;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.modes-list-container::-webkit-scrollbar {
		display: none;
	}

	.modes-list-container.is-hovered {
		max-height: 22em;
		width: 100%;
		margin-top: 0.1em;
	}

	.header-link {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	:global(.map-card-wrapper .icons-container .buttons-container.flat) {
		flex-direction: column;
	}

	.header:before {
		position: absolute;
		content: ' ';
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0.1;
		background-repeat: no-repeat;
		background-size: cover;
		pointer-events: none;
	}

	.main-container {
		display: flex;
		justify-content: space-between;
		flex: 1;
		z-index: 1;
		user-select: text;
		-webkit-user-select: text;
		-webkit-user-drag: none;
		overflow: hidden;
	}

	.mobile-chevron-container {
		cursor: pointer;
		pointer-events: auto;
		color: #ffffffa1;
	}

	.mobile-chevron-container.hovered {
		margin-left: 1em;
		margin-top: -0.6em;
	}

	.icons-container {
		width: fit-content;
		margin-top: 0.25em;
		transform: scale(1.1);
	}

	.header .song-title {
		color: inherit !important;
		margin-bottom: 0;
		width: 100%;
	}

	.header .song-title .title-text {
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
		color: #ffffff93 !important;
	}

	.header h1 {
		margin-bottom: 0.2em;
		max-width: 100%;
		overflow: hidden;
	}

	.header h1 span.name {
		color: #ffffffcc !important;
		font-size: 1.3em;
		font-weight: 600;
		margin-top: -0.2em;
	}

	.subname {
		color: #ffffff93;
		font-size: 0.8em;
	}

	.map-cover {
		position: relative;
		width: 9em;
		aspect-ratio: 1;
		border-radius: 8px;
		z-index: 2;
		pointer-events: none;
	}

	.placeholder {
		width: 9.7em;
		display: flex;
		justify-content: center;
	}

	.author {
		color: #ffffffa3;
		font-size: 1em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.header-container {
		display: flex;
		justify-content: start;
		flex-direction: column;
		gap: 0.2em;
		width: 100%;
		overflow: hidden;
		height: 7em;
	}

	.header-top-part {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		z-index: 1;
		width: 100%;
		overflow: hidden;
	}

	.title-container {
		display: flex;
		justify-content: center;
		flex-direction: column;
		grid-gap: 0.2em;
		width: 100%;
		overflow: hidden;
	}

	.mapper-container {
		display: flex;
		font-size: 0.9em;
		white-space: nowrap;
		overflow: hidden;
		width: 100%;
		margin-top: -0.1em;
		mask-image: linear-gradient(90deg, white 0%, white 80%, transparent 100%);
	}

	.status-container {
		display: flex;
		gap: 0.3em;
		font-size: 0.9em;
		justify-content: flex-start;
		margin-top: 0.1em;
		white-space: nowrap;
		overflow: hidden;
		width: 100%;
	}

	.title-tooltip {
		position: fixed;
		z-index: 100;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 0.3em 0.5em;
		border-radius: 0.6em;
		pointer-events: none;
		white-space: normal;
		width: max-content;
		max-width: 24vw;
		transform: translateX(-50%);
	}

	.tooltip-subname {
		opacity: 0.8;
		font-size: 0.9em;
		margin-left: 0.05em;
	}

	.tooltip-author {
		color: #ffffffee;
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
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.1) translateZ(0);
		width: 100%;
		height: 100%;
	}

	.root-canvas {
		transform: scale(0.9) translateZ(0);
	}

	:global(.title-container .stats) {
		justify-content: start !important;
		color: #ffffffa3;
		max-width: 35em;
	}

	:global(.voter-feedback-button) {
		height: 1.8em;
	}

	:global(.battleroyalebtn) {
		margin-left: 1em;
		margin-bottom: 0.5em;
	}

	.mobile-only {
		display: none;
	}

	:global(.voteButton) {
		margin-top: 0 !important;
		height: 1.8em;
	}

	@media screen and (max-width: 1024px) {
		.header {
			margin-inline: 0;
		}
	}

	@media screen and (max-width: 767px) {
		.map-card-wrapper {
			width: 100%;
			margin-bottom: 0.2em;
			height: 7.2em;
		}

		.bottom-container {
			padding: 0.2em;
			margin-top: calc(var(--margin-top-value) + 0.8em);
		}

		.header {
			margin-inline: 0;
			padding: 0.4em 0.4em 0.15em 0.4em;
			gap: 0.5em;
			width: 100%;
		}

		.song-player {
			width: calc(100vw - 9.7em);
			flex: unset;
		}

		.sort-value {
			font-size: 0.8em;
		}

		.desktop-only {
			display: none;
		}

		.mobile-only {
			display: flex;
		}

		.cinematics-canvas {
			transform: scaleY(1.2) translateZ(0);
		}

		.icons-container {
			margin-left: unset;
		}

		:global(.player .clan-badges) {
			display: none;
		}

		.main-container {
			min-height: unset;
		}

		.header .song-title {
			margin-left: unset;
		}

		.header {
			border-radius: 0;
			margin-bottom: 0;
		}

		.author {
			font-size: 0.9em;
			margin-top: -0.2em;
		}

		.map-cover {
			width: 6.4em;
		}

		.placeholder {
			width: 6.8em;
			height: 1em;
		}

		.icons-container {
			transform: scale(0.75);
			margin-top: -0.8em;
			margin-right: -0.2em;
		}

		.main-container {
			font-size: 0.8em;
			max-width: calc(100vw - 10em);
		}

		.requirements-icons {
			padding-top: 0.5em;
			left: 0.5em;
		}

		.header h1 span.name {
			font-size: 1.1em;
		}

		:global(.song-statuses .song-status) {
			font-size: 0.6em;
		}

		:global(.leaderboard-header-box) {
			margin: 0.6em 0 0 !important;
			border-radius: 0 !important;
		}
	}
</style>
