<script>
	import {createEventDispatcher, getContext, onMount} from 'svelte';
	import {fade, fly, slide} from 'svelte/transition';

	import Value from '../../Common/Value.svelte';
	import Badge from '../../Common/Badge.svelte';
	import Icons from '../../Song/Icons.svelte';
	import {formatDiffStatus, DifficultyStatus, wrapBLStatus} from '../../../utils/beatleader/format';
	import {configStore} from '../../../stores/config';
	import HashDisplay from '../../Common/HashDisplay.svelte';
	import SongStatus from '../../Leaderboard/SongStatus.svelte';
	import MapperList from '../../Leaderboard/MapperList.svelte';
	import LeaderboardStats from '../../Leaderboard/LeaderboardStats.svelte';
	import ModesList from './ModesList.svelte';
	import SongPlayer from './SongPlayer.svelte';

	export let song;
	export let idx = 0;
	export let ratings = null;

	const dispatch = createEventDispatcher();
	const {open, close} = getContext('simple-modal');

	function onSelectedGroupEntryChanged() {
		dispatch('group-changed');
	}

	let leaderboard = null;
	let isHovered = false;
	let mapCardElement;
	let mapCardWrapper;
	let mapCardRect;

	let bottomContainer;
	let bottomContainerHeight = 0;

	function selectMostRepresentitiveDiff(song) {
		leaderboard = song.difficulties[0];
	}

	$: song?.difficulties && selectMostRepresentitiveDiff(song);
	let cinematicsCanvas;
	let rootcinematicsCanvas;

	function drawCinematics(cinematicsCanvas, coverUrl) {
		if (coverUrl && cinematicsCanvas) {
			cinematicsCanvas.style.opacity = 1;
			const context = cinematicsCanvas.getContext('2d');

			const cover = new Image();
			cover.onload = function () {
				context.drawImage(cover, 0, 0, cinematicsCanvas.width, cinematicsCanvas.height);
			};
			cover.src = coverUrl;
		}
	}

	$: coverUrl = song?.coverImage;

	$: drawCinematics(cinematicsCanvas, coverUrl);
	$: drawCinematics(rootcinematicsCanvas, coverUrl);

	let headerContainer;
	let headerContainerHeight = 0;

	function updateHeaderContainerHeight(headerContainer) {
		headerContainerHeight = headerContainer?.getBoundingClientRect().height ?? 0;
		console.log(headerContainerHeight);
	}

	$: headerContainer && updateHeaderContainerHeight(headerContainer);

	$: hash = song?.hash;
	$: name = song?.name;
	$: diffInfo = leaderboard?.diffInfo;

	let hoverTimeout;
	let dummyElement;

	function handleHover(hovering) {
		clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			isHovered = hovering;
			if (hovering) {
				mapCardRect = mapCardWrapper.getBoundingClientRect();
				if (!dummyElement) {
					// Create and insert dummy element
					dummyElement = document.createElement('div');
					dummyElement.style.height = `${mapCardRect.height + 19}px`;
					dummyElement.style.width = `0px`;
					dummyElement.style.marginLeft = '-2em';
					mapCardWrapper.parentNode.insertBefore(dummyElement, mapCardWrapper.nextSibling);
				}

				setTimeout(() => {
					bottomContainerHeight = (bottomContainer?.getBoundingClientRect().height ?? 0) + 3;
				}, 50);
			} else {
				// Remove dummy element when not hovering
				if (dummyElement) {
					dummyElement.remove();
					dummyElement = null;
				}
			}
		}, 300);
	}

	onMount(() => {
		const updatePosition = () => {
			if (isHovered && mapCardWrapper) {
				const newRect = mapCardWrapper.getBoundingClientRect();
				mapCardElement.style.top = `${newRect.top}px`;
				mapCardElement.style.left = `${newRect.left}px`;
			}
		};

		window.addEventListener('scroll', updatePosition);
		window.addEventListener('resize', updatePosition);

		return () => {
			window.removeEventListener('scroll', updatePosition);
			window.removeEventListener('resize', updatePosition);
			if (dummyElement) {
				dummyElement.remove();
			}
		};
	});

	let modesListContainer;
	let scrollPosition = 0;
	let containerHeight = 0;
	let contentHeight = 0;

	function updateMaskImage() {
		if (!modesListContainer) return;

		const scrollPercentage = scrollPosition / (contentHeight - containerHeight);
		let maskImage;

		if (scrollPosition === 0) {
			maskImage = 'linear-gradient(180deg, white 0%, white 20em, transparent)';
		} else if (scrollPercentage >= 1) {
			maskImage = 'linear-gradient(180deg, transparent 0%, white 2em, white)';
		} else {
			// const middlePosition = 10 + scrollPercentage * 80;
			maskImage = `linear-gradient(180deg, transparent 0%, white 2em, white 20em, transparent 100%)`;
		}

		modesListContainer.style.maskImage = maskImage;
		modesListContainer.style.webkitMaskImage = maskImage;
	}

	function handleScroll(e) {
		scrollPosition = e.target.scrollTop;
		containerHeight = e.target.clientHeight;
		contentHeight = e.target.scrollHeight;
		updateMaskImage();
	}

	$: if (isHovered) {
		setTimeout(() => {
			if (modesListContainer) {
				containerHeight = modesListContainer.clientHeight;
				contentHeight = modesListContainer.scrollHeight;
				updateMaskImage();
			}
		}, 0);
	}
</script>

{#if song}
	<div
		class="map-card-wrapper"
		bind:this={mapCardWrapper}
		tabindex="-1"
		role="button"
		on:mouseover={() => handleHover(true)}
		on:mouseout={() => handleHover(false)}
		on:focus={() => handleHover(true)}
		on:blur={() => handleHover(false)}>
		<div class="cinematics root-cinematics" style={isHovered ? `height: ${mapCardRect.height}px;` : ''} class:is-hovered={isHovered}>
			<div class="cinematics-canvas">
				<canvas bind:this={rootcinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
			</div>
		</div>
		<div class="map-card" class:is-hovered={isHovered} style={isHovered ? `position: absolute;` : ''} bind:this={mapCardElement}>
			<div class="cinematics">
				<div class="cinematics-canvas">
					<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
				</div>
			</div>
			<div class="header" style="height: {headerContainerHeight < 150 ? '100%' : 'unset'};" class:is-hovered={isHovered}>
				<div
					class="map-cover"
					style={coverUrl
						? `background: url(${coverUrl}); background-repeat: no-repeat; background-size: cover; background-position: center;`
						: ''}>
				</div>

				<div class="main-container">
					<div class="header-container" bind:this={headerContainer}>
						<div class="header-top-part">
							<h1 class="title is-4">
								<span class="name {name.length > 40 ? 'name-long' : 'name-short'}" title="Song name">{name} </span>
								{#if $configStore?.leaderboardPreferences?.showSubtitleInHeader && song.subName}
									<span class="subname">{song.subName}</span>
								{/if}
							</h1>

							<div class="title-container">
								<span class="author" title="Song author name">{song.author}</span>

								{#if leaderboard}
									{#if $configStore?.leaderboardPreferences?.showHashInHeader}
										<HashDisplay {song} />
									{/if}
								{/if}
							</div>
						</div>

						<div class="song-statuses">
							<MapperList {song} maxHeight="2.2em" fontSize="0.9em" />
							{#if leaderboard && leaderboard.status != DifficultyStatus.unranked}
								<SongStatus songStatus={wrapBLStatus(leaderboard.status)} />
							{/if}
							{#if song.externalStatuses}
								{#each song.externalStatuses as songStatus}
									<SongStatus {songStatus} />
								{/each}
							{/if}
						</div>
					</div>
				</div>
				{#if leaderboard}
					<div class="icons-container">
						<Icons {song} {diffInfo} />
					</div>
				{/if}
			</div>
			<div class="bottom-container-background" class:is-hovered={isHovered} style="height: {bottomContainerHeight}px;"></div>
			<div
				class="bottom-container"
				class:is-hovered={isHovered}
				bind:this={bottomContainer}
				style="margin-top: -{headerContainerHeight < 150 ? 2.8 : 0}em;">
				<div class="placeholder"></div>
				{#if isHovered}
					<div class="song-player">
						<SongPlayer {song} />
					</div>
				{/if}
				{#if leaderboard}
					<div class="modes-list-container" class:is-hovered={isHovered} bind:this={modesListContainer}>
						<ModesList {song} {isHovered} />
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if leaderboard}
		<div class="buttons-container mobile-only">
			<div class="icons-container">
				<Icons {song} {diffInfo} />
			</div>
		</div>
	{/if}
{/if}

<style>
	.map-card-wrapper {
		position: relative;
		width: 32em;
		margin-bottom: 1.2em;
		overflow: visible;
	}

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
		height: unset;
	}

	.root-cinematics {
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.root-cinematics.is-hovered {
		opacity: 0.9;
	}

	.song-player {
		width: 19em;
	}
	.header {
		padding: 0.6em;

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
		transition: all 0.3s ease-in-out;
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

	:global(.icons-container .buttons-container.flat) {
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
		min-height: 11em;
		z-index: 1;
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
		margin-top: 0.1em;
		transform: scale(1.1);
	}

	.version-selector-container {
		transform: scale(1.15);
		margin-bottom: -0.5em;
	}

	.header .title {
		color: inherit !important;
		margin-bottom: 0;
	}

	.header h1 {
		margin-bottom: 0.2em;
	}

	.header h1 span.name {
		color: #ffffffcc !important;
	}

	.map-cover {
		width: 11em;
		aspect-ratio: 1;
		border-radius: 8px;
		z-index: 2;
	}

	.placeholder {
		width: 11.9em;
		height: 2em;
	}

	.name-long {
		font-size: 0.8em;
	}

	.name-short {
		font-size: 1em;
	}

	.subname {
		color: #ffffff93;
		font-size: 0.8em;
	}

	.author {
		color: #ffffffa3;
		font-size: 1em;
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

	.header h2.title {
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
		height: fit-content;
	}

	.header-top-part {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		z-index: 1;
	}

	.header-bottom-part {
		z-index: 1;
	}

	.title-container {
		display: flex;
		justify-content: center;
		flex-direction: column;
		grid-gap: 0.2em;
	}

	.song-statuses {
		color: #ffffffab;
		display: flex;
		gap: 0.25em;
		flex-wrap: wrap;
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

	.status-and-type {
		display: flex;
		gap: 0.6em;
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
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.2em;
		row-gap: 0.5em;
		padding-top: 0.7em;
		padding-bottom: 0.7em;
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
		flex-wrap: wrap;
		flex-direction: column;
		padding: 0.5em;
		min-width: fit-content;
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
		.header {
			margin-inline: 0;
			max-width: 100vw;
			padding: 0.4em 0.4em 0.15em 0.4em;
			gap: 0.5em;
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
			min-height: 11.2em;
			gap: 0.3em;
		}

		.main-container {
			min-height: unset;
		}

		.header .title {
			margin-left: unset;
		}

		.header {
			border-radius: 0;
			margin-bottom: 0;
		}

		.name-long {
			font-size: 0.8em;
		}

		.song-statuses {
			flex-wrap: wrap;
		}

		.name-short {
			font-size: 0.9em;
		}

		.author {
			font-size: 1em;
		}

		.map-cover {
			width: 11em;
		}

		.icons-container {
			transform: scale(1);
		}

		.version-selector-container {
			transform: scale(1);
		}

		:global(.leaderboard-header-box) {
			margin: 0.6em 0 0 !important;
			border-radius: 0 !important;
		}
	}
</style>
