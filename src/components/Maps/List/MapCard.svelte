<script>
	import {createEventDispatcher, getContext, onMount} from 'svelte';
	import {fade, fly, slide} from 'svelte/transition';

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
	let isHovered = false;

	let mapCardElement;
	let mapCardWrapper;
	let mapCardRect;

	let bottomContainer;
	let bottomContainerHeight = 0;
	let bottomContainerObserver;

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

	let hoverTimeout;
	let dummyElement;
	let playingSong = false;
	let mouseInside = false;

	function handleHover(hovering, userHovering = false) {
		mouseInside = hovering && userHovering;
		if (!hovering && playingSong) {
			return;
		}
		clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			isHovered = hovering;
			if (hovering) {
				if (!mapCardWrapper) {
					return;
				}
				mapCardRect = mapCardWrapper.getBoundingClientRect();
				if (!dummyElement) {
					// Create and insert dummy element
					dummyElement = document.createElement('div');
					dummyElement.style.height = `${mapCardRect.height + 19}px`;
					dummyElement.style.width = `0px`;
					dummyElement.style.marginLeft = '-2em';
					mapCardWrapper.parentNode.insertBefore(dummyElement, mapCardWrapper.nextSibling);
				}

				// Start observing bottom container when hovered
				if (bottomContainer && bottomContainerObserver) {
					bottomContainerObserver.observe(bottomContainer);
				}

				setTimeout(() => {
					if (modesListContainer) {
						containerHeight = modesListContainer.clientHeight;
						contentHeight = modesListContainer.scrollHeight;
						updateMaskImage();
					}
				}, 0);
			} else {
				// Remove dummy element when not hovering
				if (dummyElement) {
					dummyElement.remove();
					dummyElement = null;
				}
				// Stop observing when not hovered
				if (bottomContainerObserver) {
					bottomContainerObserver.disconnect();
				}
			}
		}, 100);
	}

	onMount(() => {
		const updatePosition = () => {
			if (isHovered && mapCardWrapper) {
				const newRect = mapCardWrapper.getBoundingClientRect();
				mapCardElement.style.top = `${newRect.top}px`;
				mapCardElement.style.left = `${newRect.left}px`;
			}
		};

		// Create ResizeObserver for bottom container
		bottomContainerObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				bottomContainerHeight = entry.contentRect.height;
			}
		});

		window.addEventListener('scroll', updatePosition);
		window.addEventListener('resize', updatePosition);

		return () => {
			window.removeEventListener('scroll', updatePosition);
			window.removeEventListener('resize', updatePosition);
			if (dummyElement) {
				dummyElement.remove();
			}
			if (bottomContainerObserver) {
				bottomContainerObserver.disconnect();
			}
		};
	});

	let modesListContainer;
	let scrollPosition = 0;
	let containerHeight = 0;
	let contentHeight = 0;

	let currentGradient = {
		transparent: 0,
		whiteStart: 0,
		whiteEnd: 500,
		transparentEnd: 500,
	};

	// Define target gradient positions based on scroll
	let targetGradient = currentGradient;

	function lerp(start, end, t) {
		return start * (1 - t) + end * t;
	}

	let needsUpdate = false;

	function animateMask() {
		if (!modesListContainer) return;
		const easing = 0.15; // Controls animation speed (0-1)

		// Interpolate each value
		for (let key in currentGradient) {
			if (Math.abs(currentGradient[key] - targetGradient[key]) > 0.1) {
				currentGradient[key] = lerp(currentGradient[key], targetGradient[key], easing);
				needsUpdate = true;
			} else {
				currentGradient[key] = targetGradient[key];
			}
		}

		const maskImage = `linear-gradient(180deg, 
			transparent ${currentGradient.transparent}px, 
			white ${currentGradient.whiteStart}px, 
			white ${currentGradient.whiteEnd}px, 
			transparent ${currentGradient.transparentEnd}px)`;

		modesListContainer.style.maskImage = maskImage;
		modesListContainer.style.webkitMaskImage = maskImage;

		if (needsUpdate) {
			requestAnimationFrame(animateMask);
		}
	}

	function updateMaskImage() {
		if (!modesListContainer) return;

		if (Math.abs(contentHeight - containerHeight) < 1) {
			targetGradient = {
				transparent: 0,
				whiteStart: 0,
				whiteEnd: containerHeight,
				transparentEnd: containerHeight,
			};
		} else {
			const scrollPercentage = scrollPosition / (contentHeight - containerHeight);

			if (scrollPosition === 0) {
				targetGradient = {
					transparent: 0,
					whiteStart: 0,
					whiteEnd: 320,
					transparentEnd: containerHeight,
				};
			} else if (Math.abs(scrollPercentage - 1) <= 0.01) {
				targetGradient = {
					transparent: 0,
					whiteStart: 20,
					whiteEnd: containerHeight,
					transparentEnd: containerHeight,
				};
			} else {
				targetGradient = {
					transparent: 0,
					whiteStart: 20,
					whiteEnd: 320,
					transparentEnd: containerHeight,
				};
			}
		}

		// Animate the gradient positions

		if (!needsUpdate) {
			requestAnimationFrame(animateMask);
		}
	}

	function handleScroll(e) {
		scrollPosition = e.target.scrollTop;
		containerHeight = e.target.clientHeight;
		contentHeight = e.target.scrollHeight;
		updateMaskImage();
	}

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

	let tooltipVisible = false;
	let tooltipX = 0;
	let tooltipY = 0;
	let titleTextElement;

	function showTooltip() {
		// Only show tooltip if the content is overflowing
		if (titleTextElement && titleTextElement.scrollWidth > titleTextElement.clientWidth) {
			const rect = titleTextElement.getBoundingClientRect();

			// Position tooltip centered above the text
			tooltipX = rect.left + rect.width / 2;
			tooltipY = rect.top - 30; // 30px above the element

			tooltipVisible = true;
		}
	}

	function hideTooltip() {
		tooltipVisible = false;
	}
</script>

{#if song}
	{#if !forcePlaceholder && !song.placeholder}
		{#if tooltipVisible}
			<div class="title-tooltip" style="left: {tooltipX}px; top: {tooltipY}px;">
				{name}
				{#if $configStore?.leaderboardPreferences?.showSubtitleInHeader && song.subName}
					<span class="tooltip-subname">{song.subName}</span>
				{/if}
			</div>
		{/if}
		<div
			class="map-card-wrapper"
			class:transparent={song.transparent}
			class:is-hovered={isHovered}
			bind:this={mapCardWrapper}
			tabindex="-1"
			role="button"
			on:mouseover={() => handleHover(true, true)}
			on:mouseout={() => handleHover(false, true)}
			on:focus={() => handleHover(true, true)}
			on:blur={() => handleHover(false, true)}>
			<div class="cinematics root-cinematics" style={isHovered ? `height: ${mapCardRect.height}px;` : ''} class:is-hovered={isHovered}>
				<div class="cinematics-canvas root-canvas">
					<canvas bind:this={rootcinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
				</div>
			</div>
			<div class="map-card" class:is-hovered={isHovered} style={isHovered ? `position: absolute;` : ''} bind:this={mapCardElement}>
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

					<a class="main-container" href={`/leaderboard/global/${song.difficulties?.[0]?.leaderboardId ?? song.id}`}>
						<div class="header-container" bind:this={headerContainer}>
							<div class="header-top-part">
								<h1 class="song-title">
									<div class="title-text" on:mouseenter={showTooltip} on:mouseleave={hideTooltip} bind:this={titleTextElement}>
										<span class="name">{name}</span>
										{#if $configStore?.leaderboardPreferences?.showSubtitleInHeader && song.subName}
											<span class="subname">{song.subName}</span>
										{/if}
									</div>
								</h1>

								<div class="title-container">
									<span class="author" title="Song author name">{song.author}</span>
								</div>
							</div>

							<div class="mapper-container">
								<MapperList {song} maxHeight="2.2em" fontSize="0.9em" noArrow={true} />
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
					<div class="icons-container" class:is-hovered={isHovered}>
						<Icons {song} icons={['playlist', 'bsr', 'bs', 'oneclick']} />
					</div>
				</div>
				<div class="bottom-container-background" class:is-hovered={isHovered} style="height: {bottomContainerHeight + 15}px;"></div>
				<div
					class="bottom-container"
					class:has-sort-value={!!sortValue}
					class:is-hovered={isHovered}
					bind:this={bottomContainer}
					style="--margin-top-value: -{headerContainerHeight < 150 ? (isHovered ? 2.25 : 2.4) : 0}em;">
					<div class="placeholder">
						{#if sortValue}
							<div class="sort-value">
								{sortValue}
							</div>
						{/if}
					</div>

					{#if isHovered}
						<div class="song-player">
							<SongPlayer {song} />
						</div>
						<div class="preview-icon-container-hovered">
							<Icons {song} icons={['preview']} />
						</div>
					{/if}
					<div class="modes-list-container" class:is-hovered={isHovered} on:scroll={handleScroll} bind:this={modesListContainer}>
						<ModesList {song} {isHovered} {sortValue} {sortBy} />
					</div>
					{#if !isHovered}
						<div class="preview-icon-container">
							<Icons {song} icons={['preview']} />
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
		width: 19em;
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
		padding: 0.4em;
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

	.sort-value {
		z-index: 2;
		font-weight: 600;
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

	.preview-icon-container-hovered {
		margin-left: 1em;
		margin-top: -0.6em;
	}

	.buttons-container {
		position: absolute;
		bottom: 0;
		height: 2.7em;
		margin-left: -0.6em;
		width: 100%;
		display: flex;
		justify-content: space-between;
		background-color: #0000004f;
		padding: 0.6em;
		border-radius: 0 0 12px 12px;
	}

	.icons-container {
		width: fit-content;
		margin-top: 0.25em;
		transform: scale(1.1);
		display: none;
	}

	.icons-container.is-hovered {
		display: block;
	}

	.version-selector-container {
		transform: scale(1.15);
		margin-bottom: -0.5em;
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

	.diff-status {
		color: white;
	}

	.capture-status {
		position: absolute;
		top: 0;
		left: 0;
		height: 6em;
		overflow: hidden;
		z-index: 2;
	}

	.header h2.song-title {
		font-size: 1em !important;
		color: var(--increase, #42b129) !important;
		margin-top: 0.5em;
		margin-bottom: 0.5em;
	}

	.header-container {
		display: flex;
		justify-content: start;
		flex-direction: column;
		gap: 0.2em;
		mask-image: linear-gradient(180deg, white 0%, white 6.5em, transparent 7.5em);
		width: 100%;
		overflow: hidden;
	}

	.header-top-part {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		z-index: 1;
		width: 100%;
		overflow: hidden;
	}

	.header-bottom-part {
		z-index: 1;
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
	}

	.status-container {
		display: flex;
		gap: 0.3em;
		font-size: 0.9em;
		justify-content: flex-start;
		margin-top: 0.2em;
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
		max-width: 90vw;
		transform: translateX(-50%);
	}

	.tooltip-subname {
		opacity: 0.8;
		font-size: 0.9em;
		margin-left: 0.05em;
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

	.status-and-type {
		display: flex;
		gap: 0.6em;
		overflow: hidden;
		white-space: nowrap;
	}

	:global(.title-container .stats) {
		justify-content: start !important;
		color: #ffffffa3;
		max-width: 35em;
	}

	.group-select {
		height: fit-content;
		padding: 0.175rem;
		text-align: center;
		text-align-last: center;
		white-space: nowrap;
		border: 0;
		border-radius: 6px;
		cursor: pointer;
		color: #363636;
		background-color: #dbdbdb;
		box-shadow: none;
		opacity: 0.35;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		width: 100%;
		margin-bottom: -0.6em;
	}

	.group-option {
		color: black;
		font-family: inherit;
	}

	.requirements {
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		align-items: center;
		gap: 0.2em;
		row-gap: 0.5em;
		padding-top: 0.7em;
		padding-bottom: 0.7em;
		overflow: hidden;
	}

	.header small {
		font-size: 0.75em;
		color: var(--ppColour);
	}

	.header .diff :global(.reversed) {
		display: inline-block;
		padding: 0.1em 0.25em 0.25em 0.25em;
		margin-left: 0.5em;
		margin-right: 0.5em;
		border-radius: 0.25em;
	}

	:global(.voter-feedback-button) {
		height: 1.8em;
	}

	:global(.battleroyalebtn) {
		margin-left: 1em;
		margin-bottom: 0.5em;
	}

	.title-and-buttons {
		display: flex;
		align-items: center;
		align-self: stretch;
		justify-content: center;
		flex-wrap: nowrap;
		flex-direction: column;
		padding: 0.5em;
		min-width: fit-content;
		overflow: hidden;
	}

	.mobile-triangle {
		position: absolute;
		left: 8em;
		top: 8.4em;
		z-index: 2;
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
		}

		.desktop-only {
			display: none;
		}

		.mobile-only {
			display: flex;
		}

		.buttons-container {
			position: relative;
			margin-left: 0;
			border-radius: 0;
			justify-content: flex-start;
			gap: 0.6em;
			height: unset;
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

		.header-container {
			height: 7em;
			mask-image: linear-gradient(180deg, white 0%, white 5.5em, transparent 6.5em);
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

		.song-statuses {
			flex-wrap: nowrap;
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
