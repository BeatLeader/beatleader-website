<script>
	import {createEventDispatcher, getContext, onMount} from 'svelte';
	import {fade, fly, slide} from 'svelte/transition';
	import {isSelectionInsideElement} from '../../../utils/js';

	import Value from '../../Common/Value.svelte';
	import Badge from '../../Common/Badge.svelte';
	import Icons from '../../Song/Icons.svelte';
	import {formatDiffStatus, DifficultyStatus, wrapBLStatus, getSongSortingValue, isReadyToRank} from '../../../utils/beatleader/format';
	import {configStore} from '../../../stores/config';
	import HashDisplay from '../../Common/HashDisplay.svelte';
	import SongStatus from './SongStatus.svelte';
	import MapperList from '../../Leaderboard/MapperList.svelte';
	import LeaderboardStats from '../../Leaderboard/LeaderboardStats.svelte';
	import ModesList from './ModesList.svelte';
	import SongPlayer from './SongPlayer.svelte';
	import {songPlayerStore} from '../../../stores/songPlayer';
	import MapRequirements from './MapRequirements.svelte';
	import Popover from '../../Common/Popover.svelte';
	import {navigate} from 'svelte-routing';
	import MapTypeDescription from './MapTypeDescription.svelte';

	export let map;
	export let sortBy = 'stars';
	export let forcePlaceholder = false;
	export let dateType = 'ranked';

	const dispatch = createEventDispatcher();
	const {open, close} = getContext('simple-modal');

	function onSelectedGroupEntryChanged() {
		dispatch('group-changed');
	}

	let status = null;
	let requirements = null;

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

		return song.difficulties.length > 0 ? song.difficulties[0].status : null;
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
	let applicableDifficulty = null;
	let mapType = null;
	let readyToRank = false;

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
				applicableDifficulty = song.difficulties?.filter(d => d.value && d.applicable).sort((a, b) => b.value - a.value)?.[0];
				mapType = applicableDifficulty?.type;
			}
			hash = song.hash;
			name = song.name;
			coverUrl = song.coverImage;

			sortValue = getSongSortingValue(song, null, sortBy, status);
			readyToRank = isReadyToRank(song, null, sortBy, status);
		}
	}

	$: getSong(map);

	let cinematicsCanvas;
	let rootcinematicsCanvas;

	let headerContainer;
	let headerContainerHeight = 0;

	function updateHeaderContainerHeight(headerContainer) {
		headerContainerHeight = headerContainer?.getBoundingClientRect().height ?? 0;
	}

	$: headerContainer && updateHeaderContainerHeight(headerContainer);

	let hoverTimeout;
	let playingSong = false;
	let mouseInside = false;

	let modesListContainer;
	let scrollPosition = 0;
	let containerHeight = 0;
	let contentHeight = 0;
	let currentHeight = 0;
	let currentTargetHeight = 0;

	let currentAnimation = null;
	let scheduledAnimation = null;

	function lerp(start, end, t) {
		return start * (1 - t) + end * t;
	}

	function animateHeight(targetHeight, callback) {
		if (!modesListContainer) return;

		// Cancel any ongoing animation
		if (currentAnimation) {
			cancelAnimationFrame(currentAnimation);
		}

		function update(currentTime) {
			if (!modesListContainer) return;

			currentHeight = lerp(currentHeight, targetHeight, targetHeight > 0 ? 0.3 : 0.6);
			modesListContainer.style.height = `${currentHeight}px`;

			containerHeight = modesListContainer.clientHeight;
			contentHeight = modesListContainer.scrollHeight;

			if (Math.abs(currentHeight - targetHeight) > 1) {
				currentAnimation = requestAnimationFrame(update);
				if (contentHeight > 350 && Math.abs(currentHeight - targetHeight) < 50) {
					callback?.();
				}
			} else {
				currentAnimation = null;
				if (targetHeight > 0) {
					currentHeight = modesListContainer.scrollHeight;
				} else {
					currentHeight = 0;
				}
				callback?.();
				modesListContainer.style.height = 'auto';
			}
		}

		currentTargetHeight = targetHeight;
		currentAnimation = requestAnimationFrame(update);
	}

	var shouldInit = false;

	function handleHover(hovering, userHovering = false) {
		mouseInside = hovering && userHovering;
		if (!hovering && playingSong) {
			return;
		}
		clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			if (isHovered == hovering) return;

			clearTimeout(scheduledAnimation);
			isHovered = hovering;
			if (hovering) {
				if (!mapCardWrapper) {
					return;
				}
				mapCardRect = mapCardWrapper.getBoundingClientRect();

				// Start observing bottom container when hovered
				if (bottomContainer && bottomContainerObserver) {
					bottomContainerObserver.observe(bottomContainer);
				}
				modesListContainer.style.height = `${currentHeight}px`;

				scheduledAnimation = setTimeout(() => {
					if (modesListContainer) {
						shouldInit = true;
						animateHeight(modesListContainer.scrollHeight, () => {
							if (shouldInit) {
								updateMaskImage(true);
								shouldInit = false;
							}
						});
					}
				}, 0);
			} else {
				if (modesListContainer) {
					let callback = () => {
						// Stop observing when not hovered
						if (bottomContainerObserver) {
							bottomContainerObserver.disconnect();
						}
					};

					if (currentHeight > 0) {
						animateHeight(0, callback);
					} else {
						callback();
						if (currentAnimation) {
							cancelAnimationFrame(currentAnimation);
						}
						currentAnimation = null;
						currentHeight = 0;
						modesListContainer.style.height = 'auto';
					}
				}
			}
		}, 0);
	}

	onMount(() => {
		bottomContainerObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				bottomContainerHeight = entry.contentRect.height;
			}
		});

		return () => {
			if (bottomContainerObserver) {
				bottomContainerObserver.disconnect();
			}
			if (currentAnimation) {
				cancelAnimationFrame(currentAnimation);
			}
		};
	});

	let currentGradient = {
		transparent: 0,
		whiteStart: 0,
		whiteEnd: 345,
		transparentEnd: 345,
	};

	// Define target gradient positions based on scroll
	let targetGradient = currentGradient;

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

	function updateMaskImage(initial = false) {
		if (!modesListContainer) return;

		if (Math.abs(contentHeight - containerHeight) < 5) {
			targetGradient = {
				transparent: 0,
				whiteStart: 0,
				whiteEnd: containerHeight + 5,
				transparentEnd: containerHeight + 5,
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
			} else if (Math.abs(scrollPercentage - 1) <= 0.05) {
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

		if (initial) {
			currentGradient = {...targetGradient};
			const maskImage = `linear-gradient(180deg, 
			transparent ${currentGradient.transparent}px, 
			white ${currentGradient.whiteStart}px, 
			white ${currentGradient.whiteEnd}px, 
			transparent ${currentGradient.transparentEnd}px)`;

			modesListContainer.style.maskImage = maskImage;
			modesListContainer.style.webkitMaskImage = maskImage;
		} else {
			// Animate the gradient positions

			if (!needsUpdate) {
				requestAnimationFrame(animateMask);
			}
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

	let mapLink = null;

	function getMapLink(song) {
		if (song.difficulties) {
			mapLink = `/leaderboard/global/${song.difficulties?.filter(d => d.value && d.applicable).sort((a, b) => b.value - a.value)?.[0]?.leaderboardId}`;
		} else {
			mapLink = `/leaderboard/global/${song.id}`;
		}
	}

	$: getMapLink(song);

	let titleTextElement;
	let authorElement;
	let mappersElement;

	$: hash && handlePlay($songPlayerStore?.currentHash, hash);
</script>

{#if song}
	{#if !forcePlaceholder && !song.placeholder}
		<Popover triggerEvents={['hover', 'focus']} placement="top" referenceElement={titleTextElement} forOverflow={true} hoverDelay={200}>
			<div class="title-tooltip">
				{name}
				{#if $configStore?.leaderboardPreferences?.showSubtitleInHeader && song.subName}
					<span class="tooltip-subname">{song.subName}</span>
				{/if}
			</div>
		</Popover>
		<Popover triggerEvents={['hover', 'focus']} placement="top" referenceElement={authorElement} forOverflow={true} hoverDelay={200}>
			<div class="title-tooltip">
				<span class="tooltip-author">{song.author}</span>
			</div>
		</Popover>
		<Popover
			triggerEvents={['hover', 'focus']}
			placement="top"
			referenceElement={mappersElement}
			forOverflow={true}
			spaceAway={4}
			hoverDelay={200}>
			<div class="title-tooltip">
				<MapperList {song} maxHeight="unset" maxWidth="25em" fontSize="0.9em" noArrow={true} tooltip={true} />
			</div>
		</Popover>
		<div
			class="map-card-wrapper"
			class:transparent={song.transparent}
			class:is-hovered={isHovered}
			class:long={$configStore.mapCards.wideCards}
			bind:this={mapCardWrapper}>
			{#if isHovered}
				<div
					transition:fade={{duration: 150}}
					class="cinematics root-cinematics"
					style={isHovered ? `height: ${mapCardRect.height}px;` : ''}>
					<div class="cinematics-canvas root-canvas">
						<div
							style="position: absolute; background-size: cover;
			background-position: center; background-image: url({coverUrl}); width: 100%; height: 100%" />
					</div>
				</div>
			{/if}
			<div
				class="map-card"
				class:is-hovered={isHovered || currentAnimation}
				class:expanding={currentAnimation && currentTargetHeight > 0}
				class:player-hovered={isHovered && mouseInside}
				style={isHovered || currentAnimation ? `position: absolute;` : ''}
				bind:this={mapCardElement}
				tabindex="-1"
				role="button"
				on:mouseover={() => handleHover(true, true)}
				on:mouseout={() => handleHover(false, true)}
				on:focus={() => handleHover(true, true)}
				on:blur={() => handleHover(false, true)}>
				<div class="cinematics">
					<div class="cinematics-canvas">
						{#if $configStore.mapCards.cinematics}
							<div
								style="position: absolute; background-size: cover; background-position: center; background-image: url({coverUrl}); width: 100%; height: 100%" />
						{:else}
							<div
								style="position: absolute; background-size: cover; background-position: center; background-color: #777777; width: 100%; height: 100%" />
						{/if}
					</div>
				</div>

				<a on:click|preventDefault|stopPropagation={() => navigate(mapLink)} class="header-link" href={mapLink}></a>
				<div class="header" style="height: {headerContainerHeight < 150 ? '100%' : 'unset'};" class:is-hovered={isHovered}>
					<div class="map-cover">
						{#if coverUrl}
							<a
								on:click|preventDefault|stopPropagation={() => {
									if (isSelectionInsideElement(mapCardElement, window.getSelection())) return;
									navigate(mapLink);
								}}
								href={mapLink}
								class="cover-link"
								style="display: block; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 2;"
								tabindex="0"
								aria-label="Open map page">
								<img
									src={coverUrl}
									alt="map cover"
									style="width: 100%; height: 100%; object-fit: cover; object-position: center; background: #222;" />
								{#if isHovered && sortValue}
									<div class="hover-overlay"></div>
								{/if}
							</a>
						{/if}
						<div class="sort-value-background" class:with-value={sortValue} class:is-hovered={sortValue && isHovered}></div>
					</div>

					{#if requirements && isHovered && $configStore.mapCards.requirements}
						<div transition:fly|local={{x: -40, duration: 300, y: 0}} class="requirements-icons">
							<MapRequirements type={requirements} />
						</div>
					{/if}

					<a
						on:click|preventDefault|stopPropagation={() => {
							if (isSelectionInsideElement(mapCardElement, window.getSelection())) return;
							navigate(mapLink);
						}}
						class="main-container"
						href={mapLink}>
						<div class="header-container" bind:this={headerContainer}>
							<div class="header-top-part">
								<h1 class="song-title">
									<div class="title-text" bind:this={titleTextElement}>
										<span class="name">{name}</span>
										{#if $configStore?.leaderboardPreferences?.showSubtitleInHeader && song.subName}
											<span class="subname">{song.subName}</span>
										{/if}
									</div>
								</h1>

								<div class="title-container">
									<span class="author" bind:this={authorElement}>{song.author}</span>
								</div>
							</div>

							<div class="mapper-container">
								<MapperList {song} maxHeight="2.2em" fontSize="0.9em" noArrow={true} bind:rootElement={mappersElement} />
							</div>
							<div class="status-container" class:is-hovered={isHovered}>
								{#if status && status != DifficultyStatus.unranked && status != DifficultyStatus.unrankable}
									<SongStatus songStatus={wrapBLStatus(status)} difficulty={applicableDifficulty} />
								{/if}
								{#if song.externalStatuses}
									{#each song.externalStatuses as songStatus}
										<SongStatus {songStatus} />
									{/each}
								{/if}
								{#if mapType && $configStore.mapCards.mapType}
									<MapTypeDescription type={mapType} />
								{/if}
							</div>
						</div>
					</a>
					{#if status != DifficultyStatus.ost}
						<div class="icons-container" class:is-hovered={isHovered}>
							<Icons {song} icons={['preview', 'bsr', 'bs', 'oneclick']} />
						</div>
					{/if}
				</div>
				<div class="bottom-container-background" class:is-hovered={isHovered} style="--bottom-container-height: {bottomContainerHeight}px;">
				</div>
				<div
					class="bottom-container"
					class:has-sort-value={!!sortValue}
					class:is-hovered={isHovered}
					bind:this={bottomContainer}
					style="--margin-top-value: -{headerContainerHeight < 150 ? 2.4 : 0}em;">
					<div class="placeholder">
						{#if sortValue}
							<div
								class="sort-value"
								class:is-hovered={isHovered || currentAnimation}
								class:ready-to-rank={readyToRank}
								class:is-qualified={status == DifficultyStatus.qualified && sortBy == 'timestamp'}>
								{sortValue}
							</div>
						{/if}
					</div>

					{#if isHovered || currentAnimation}
						<div class="song-player">
							<SongPlayer {song} />
						</div>
						<div
							class="mobile-chevron-container hovered mobile-only"
							on:click={() => handleHover(false, true)}
							on:keydown={() => handleHover(false, true)}
							tabindex="-1"
							role="button">
							<i class="fas fa-chevron-up"></i>
						</div>
					{/if}
					<div
						class="modes-list-container"
						class:is-hovered={isHovered || currentAnimation}
						on:scroll={handleScroll}
						bind:this={modesListContainer}>
						<ModesList {song} isHovered={isHovered || currentAnimation} {sortValue} {sortBy} {dateType} />
					</div>
					{#if !isHovered && !currentAnimation}
						<div class="mobile-chevron-container mobile-only">
							<i class="fas fa-chevron-down"></i>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="map-card-wrapper" class:long={$configStore.mapCards.wideCards}>
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

	.map-card-wrapper.long {
		width: 40em;
	}

	.map-card-wrapper.is-hovered {
		border-radius: 12px 12px 16px 16px;
	}

	.map-card-wrapper.transparent {
		opacity: 0;
		pointer-events: none;
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
		background-color: #141414;
		height: unset;
		border-radius: 12px 12px 16px 16px;
	}

	.map-card.player-hovered {
		z-index: 5;
	}

	.map-card.expanding {
		z-index: 4;
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
		opacity: 0.9;
		z-index: -1;
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
		width: 100%;
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
		height: calc(var(--bottom-container-height) + 9px);
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
		padding-top: 0.6em;
		padding-left: 0.13em;
	}

	:global(.requirements-icons:has(> :nth-child(4))) {
		width: 4em;
	}

	.sort-value {
		z-index: 2;
		font-weight: 600;
		font-size: 0.9em;
		margin-bottom: 0.4em;
		margin-right: 0.5em;
	}

	.sort-value.is-hovered {
		margin-bottom: 0.49em;
	}

	.sort-value-background {
		height: 1.88em;
		position: absolute;
		display: block;
		bottom: 0;
		background-color: transparent;
		width: 100%;
		border-radius: 0 0 8px 8px;
	}

	.sort-value-background.is-hovered {
		background-color: #00000066 !important;
	}

	.sort-value-background.with-value {
		background-color: #0000004a;
	}

	.sort-value.is-qualified:not(.ready-to-rank) {
		font-size: 0.8em;
		color: #ffffffd6;
	}

	.modes-list-container {
		overflow: scroll;
		-ms-overflow-style: none;
		scrollbar-width: none;
		width: calc(100% - 10.5em);
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
		margin-right: -2em;
		transition: margin-right 0.15s;
	}

	.icons-container.is-hovered {
		margin-right: 0;
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
		overflow: hidden;
	}

	.hover-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 1.87em;
		background-color: #00000099;
		z-index: 3;
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

	:global(.map-card-wrapper.long) {
		.header-top-part {
			flex-direction: row;
			gap: 0.5em;
		}

		.author {
			margin-top: unset;
		}

		.title-container {
			width: unset;
		}

		.song-title {
			width: unset;
		}
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
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 0.3em 0.5em;
		border-radius: 0.6em;
		pointer-events: none;
		white-space: normal;
		width: max-content;
		max-width: 24vw;
		z-index: 8;
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

		.map-card-wrapper.long {
			width: 100%;
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
			margin-top: -0.2em;
			margin-right: 0.2em;
		}

		.sort-value.is-qualified:not(.ready-to-rank) {
			font-size: 0.7em;
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
			margin-right: -2.2em;
			transition:
				margin-right 0.15s,
				margin-left 0.15s;
		}

		.icons-container.is-hovered {
			margin-left: 0;
		}

		.main-container {
			font-size: 0.8em;
			max-width: calc(100vw - 9.5em);
		}

		.requirements-icons {
			padding-top: 0.5em;
			left: 0.4em;
		}

		.header h1 span.name {
			font-size: 1.1em;
		}

		.bottom-container-background {
			height: calc(var(--bottom-container-height) + 7px);
		}

		.modes-list-container {
			width: calc(100vw - 8.3em);
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
