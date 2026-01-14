<script>
	import {onMount, getContext} from 'svelte';
	import {fade} from 'svelte/transition';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import Button from '../components/Common/Button.svelte';
	import SongCard from '../components/LoveLive/SongCard.svelte';
	import LoveLiveCongratulation from '../components/LoveLive/LoveLiveCongratulation.svelte';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';
	import PlayerMention from '../components/Scores/PlayerMention.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../ssr-config';
	import {navigate} from 'svelte-routing';
	import PlaylistEventPlayers from '../components/Event/PlaylistEventPlayers.svelte';
	import createAccountStore from '../stores/beatleader/account';

	const {open, close} = getContext('simple-modal');

	let playerStatus = null;
	let error = null;
	let loading = true;
	let saving = false;

	// Canvas state
	let canvasElement;
	let canvasContainer;
	let placedStickers = [];
	let savedStickers = []; // Last saved state from server
	let selectedSticker = null;
	let selectedBackgroundId = 0; // 0 = None
	let savedBackgroundId = 0;
	let isDragging = false;
	let isRotating = false;
	let isScaling = false;
	let dragOffset = {x: 0, y: 0};
	let initialRotation = 0;
	let initialScale = 1;
	let initialMouseAngle = 0;
	let initialDistance = 0;

	// Available stickers (unlocked idols + decorations + bonus idols)
	let availableStickers = [];
	let sortedSongs = [];

	// Sticker being dragged from palette
	let draggingFromPalette = null;
	let paletteGhostPosition = {x: 0, y: 0};

	const account = createAccountStore();

	// Track if there are unsaved changes
	$: hasChanges = JSON.stringify(placedStickers) !== JSON.stringify(savedStickers) || selectedBackgroundId !== savedBackgroundId;

	// Get current background image URL
	$: currentBackground = playerStatus?.backgrounds?.find(bg => bg.id === selectedBackgroundId);

	async function loadStatus() {
		try {
			const response = await fetch(`${BL_API_URL}event/lovelive/status`, {credentials: 'include'});
			if (!response.ok) throw new Error('Failed to load Love Live! data');
			playerStatus = await response.json();

			// Build available stickers list
			buildAvailableStickers();
			sortedSongs = getSortedSongs();

			// Load saved canvas state if exists
			if (playerStatus.canvasState) {
				try {
					placedStickers = JSON.parse(playerStatus.canvasState);
				} catch (e) {
					placedStickers = [];
				}
			}
			// Load saved background
			selectedBackgroundId = playerStatus.backgroundId || 0;
			savedBackgroundId = selectedBackgroundId;
			// Store the saved state for change tracking
			savedStickers = JSON.parse(JSON.stringify(placedStickers));
			// Check for new idols and show congratulation popup
			checkForNewIdols();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function checkForNewIdols() {
		if (!playerStatus?.songs) return;

		const newIdols = playerStatus.songs.filter(song => song.isNew && song.score).map(song => song.idolDescription);

		if (newIdols.length > 0) {
			showCongratulationPopup(newIdols);
		}
	}

	function showCongratulationPopup(newIdols) {
		open(LoveLiveCongratulation, {
			newIdols,
			confirm: () => {
				close();
				markIdolsAsSeen();
			},
			cancel: () => {
				close();
				markIdolsAsSeen();
			},
		});
	}

	async function markIdolsAsSeen() {
		try {
			await fetch(`${BL_API_URL}event/lovelive/markseen`, {
				method: 'POST',
				credentials: 'include',
			});
		} catch (err) {
			console.error('Failed to mark idols as seen:', err);
		}
	}

	function buildAvailableStickers() {
		availableStickers = [];

		// Add unlocked idols from passed songs
		if (playerStatus?.songs) {
			playerStatus.songs.forEach(songStatus => {
				if (songStatus.score) {
					availableStickers.push({
						type: 'idol',
						...songStatus.idolDescription,
					});
				}
			});
		}

		// Add bonus idols
		if (playerStatus?.bonusIdols) {
			playerStatus.bonusIdols.forEach(idol => {
				availableStickers.push({
					type: 'bonus_idol',
					...idol,
				});
			});
		}

		// Add decorations
		if (playerStatus?.decorations) {
			playerStatus.decorations.forEach(decoration => {
				availableStickers.push({
					type: 'decoration',
					...decoration,
				});
			});
		}
	}

	// Sort songs by birthday for calendar layout
	function getSortedSongs() {
		if (!playerStatus?.songs) return [];
		return [...playerStatus.songs].sort((a, b) => a.idolDescription.birthday - b.idolDescription.birthday);
	}

	// Helper to convert mouse X to center-relative X
	function toCenterRelativeX(mouseX, canvasWidth) {
		return mouseX - canvasWidth / 2;
	}

	// Helper to get coordinates from mouse or touch event
	function getEventCoords(e) {
		if (e.touches && e.touches.length > 0) {
			return {clientX: e.touches[0].clientX, clientY: e.touches[0].clientY};
		}
		if (e.changedTouches && e.changedTouches.length > 0) {
			return {clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY};
		}
		return {clientX: e.clientX, clientY: e.clientY};
	}

	// Canvas interaction handlers
	function handleCanvasPointerDown(e) {
		if (!canvasElement) return;

		// Allow 2-finger scrolling - only handle single touch
		if (e.touches && e.touches.length > 1) return;

		const coords = getEventCoords(e);
		const rect = canvasElement.getBoundingClientRect();
		const mouseX = coords.clientX - rect.left;
		const y = coords.clientY - rect.top;
		const x = toCenterRelativeX(mouseX, rect.width);

		if (selectedSticker !== null) {
			const sticker = placedStickers[selectedSticker];
			if (isPointInRotationHandle(x, y, sticker)) {
				isRotating = true;
				initialRotation = sticker.rotation || 0;
				initialMouseAngle = Math.atan2(y - sticker.y, x - sticker.x);
				return;
			}
			// Check if clicking on scale handle
			else if (isPointInScaleHandle(x, y, sticker)) {
				isScaling = true;
				initialScale = sticker.scale || 1;
				initialDistance = Math.sqrt(Math.pow(x - sticker.x, 2) + Math.pow(y - sticker.y, 2));
				return;
			}
		}

		// Check if clicking on a sticker (check in z-index order, highest first)
		const sortedIndices = placedStickers
			.map((s, i) => ({index: i, layerIndex: s.layerIndex || 0}))
			.sort((a, b) => b.layerIndex - a.layerIndex)
			.map(s => s.index);

		for (const i of sortedIndices) {
			const sticker = placedStickers[i];
			if (isPointInSticker(x, y, sticker)) {
				selectedSticker = i;

				isDragging = true;
				dragOffset = {
					x: x - sticker.x,
					y: y - sticker.y,
				};
				return;
			}
		}

		selectedSticker = null;
	}

	function handleCanvasPointerMove(e) {
		if (!canvasElement) return;

		// Allow 2-finger scrolling - only handle single touch
		if (e.touches && e.touches.length > 1) {
			// Cancel any ongoing drag if user adds a second finger
			if (isDragging || isRotating || isScaling) {
				isDragging = false;
				isRotating = false;
				isScaling = false;
			}
			return;
		}

		const coords = getEventCoords(e);
		const rect = canvasElement.getBoundingClientRect();
		const mouseX = coords.clientX - rect.left;
		const y = coords.clientY - rect.top;
		const x = toCenterRelativeX(mouseX, rect.width);

		if (isDragging && selectedSticker !== null) {
			placedStickers[selectedSticker].x = x - dragOffset.x;
			placedStickers[selectedSticker].y = y - dragOffset.y;
			placedStickers = [...placedStickers];
		} else if (isRotating && selectedSticker !== null) {
			const sticker = placedStickers[selectedSticker];
			const currentAngle = Math.atan2(y - sticker.y, x - sticker.x);
			const angleDiff = currentAngle - initialMouseAngle;
			placedStickers[selectedSticker].rotation = initialRotation + (angleDiff * 180) / Math.PI;
			placedStickers = [...placedStickers];
		} else if (isScaling && selectedSticker !== null) {
			const sticker = placedStickers[selectedSticker];
			const currentDistance = Math.sqrt(Math.pow(x - sticker.x, 2) + Math.pow(y - sticker.y, 2));
			const scaleFactor = currentDistance / initialDistance;
			placedStickers[selectedSticker].scale = Math.max(0.2, Math.min(5, initialScale * scaleFactor));
			placedStickers = [...placedStickers];
		}

		// Handle palette drag ghost
		if (draggingFromPalette) {
			paletteGhostPosition = {x: coords.clientX, y: coords.clientY};
		}

		// Prevent scrolling while dragging
		if (isDragging || isRotating || isScaling || draggingFromPalette) {
			e.preventDefault();
		}
	}

	function handleCanvasPointerUp(e) {
		isDragging = false;
		isRotating = false;
		isScaling = false;

		// Handle drop from palette
		if (draggingFromPalette && canvasElement) {
			const coords = getEventCoords(e);
			const rect = canvasElement.getBoundingClientRect();
			const mouseX = coords.clientX - rect.left;
			const y = coords.clientY - rect.top;
			const x = toCenterRelativeX(mouseX, rect.width);

			if (mouseX >= 0 && mouseX <= rect.width && y >= 0 && y <= rect.height) {
				placedStickers = [
					...placedStickers,
					{
						...draggingFromPalette,
						x,
						y,
						rotation: 0,
						scale: 1,
						uid: Date.now() + Math.random(),
					},
				];
			}
		}
		draggingFromPalette = null;
	}

	const stickerSize = 80;
	const rotationHandleSize = 20;
	const scaleHandleSize = 20;

	function isPointInSticker(x, y, sticker) {
		const size = stickerSize * (sticker.scale || 1);
		const halfSize = size / 2;
		return x >= sticker.x - halfSize && x <= sticker.x + halfSize && y >= sticker.y - halfSize && y <= sticker.y + halfSize;
	}

	function isPointInRotationHandle(x, y, sticker) {
		const size = stickerSize * (sticker.scale || 1);
		const rotation = ((sticker.rotation || 0) * Math.PI) / 180;
		const scaledRotationHandleSize = rotationHandleSize * (sticker.scale || 1);
		const scaledRotationRadius = (scaledRotationHandleSize / 2) * Math.sqrt(2);

		// Handle position relative to sticker center (before rotation)
		const relX = 0;
		const relY = -size / 2 - scaledRotationHandleSize;

		// Apply rotation to get actual handle position
		const handleX = sticker.x + relX * Math.cos(rotation) - relY * Math.sin(rotation);
		const handleY = sticker.y + relX * Math.sin(rotation) + relY * Math.cos(rotation);

		return Math.sqrt(Math.pow(x - handleX, 2) + Math.pow(y - handleY, 2)) < scaledRotationRadius;
	}

	function isPointInScaleHandle(x, y, sticker) {
		const size = stickerSize * (sticker.scale || 1);
		const rotation = ((sticker.rotation || 0) * Math.PI) / 180;
		const scaledScaleHandleSize = scaleHandleSize * (sticker.scale || 1);
		const scaledScaleRadius = (scaledScaleHandleSize / 2) * Math.sqrt(2);

		// Handle position relative to sticker center (before rotation)
		const relX = size / 2 + scaledScaleHandleSize / 2;
		const relY = size / 2 + scaledScaleHandleSize / 2;

		// Apply rotation to get actual handle position
		const handleX = sticker.x + relX * Math.cos(rotation) - relY * Math.sin(rotation);
		const handleY = sticker.y + relX * Math.sin(rotation) + relY * Math.cos(rotation);

		return Math.sqrt(Math.pow(x - handleX, 2) + Math.pow(y - handleY, 2)) < scaledScaleRadius;
	}

	function startPaletteDrag(sticker, e) {
		const coords = getEventCoords(e);
		draggingFromPalette = {
			...sticker,
			stickerId: sticker.id,
			image: sticker.bigPictureRegular,
		};
		paletteGhostPosition = {x: coords.clientX, y: coords.clientY};
		e.preventDefault(); // Prevent scrolling on touch
	}

	function getStickerImage(sticker) {
		return sticker.type === 'decoration'
			? playerStatus.decorations.find(d => d.id === sticker.stickerId)?.bigPictureRegular
			: availableStickers.find(s => s.id === sticker.stickerId)?.bigPictureRegular;
	}

	function deleteSelectedSticker() {
		if (selectedSticker !== null) {
			placedStickers.splice(selectedSticker, 1);
			placedStickers = [...placedStickers];
			selectedSticker = null;
		}
	}

	function mirrorSelectedSticker() {
		if (selectedSticker !== null) {
			placedStickers[selectedSticker].mirrored = !placedStickers[selectedSticker].mirrored;
			placedStickers = [...placedStickers];
		}
	}

	function moveSelectedStickerUp() {
		if (selectedSticker !== null) {
			const currentZ = placedStickers[selectedSticker].layerIndex || 0;
			placedStickers[selectedSticker].layerIndex = currentZ + 1;
			placedStickers = [...placedStickers];
		}
	}

	function moveSelectedStickerDown() {
		if (selectedSticker !== null) {
			const currentZ = placedStickers[selectedSticker].layerIndex || 0;
			placedStickers[selectedSticker].layerIndex = currentZ - 1;
			placedStickers = [...placedStickers];
		}
	}

	async function saveCanvas() {
		saving = true;
		try {
			const canvasState = placedStickers.map(s => ({
				type: s.type,
				stickerId: s.stickerId,
				x: Math.round(s.x),
				y: Math.round(s.y),
				rotation: Math.round(s.rotation || 0),
				scale: Math.round((s.scale || 1) * 100) / 100,
				mirrored: s.mirrored || false,
				layerIndex: s.layerIndex || 0,
			}));

			const response = await fetch(`${BL_API_URL}event/lovelive/canvas`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({stickers: canvasState, backgroundId: selectedBackgroundId}),
			});

			if (!response.ok) throw new Error('Failed to save canvas');

			// Update saved state after successful save
			savedStickers = JSON.parse(JSON.stringify(placedStickers));
			savedBackgroundId = selectedBackgroundId;
		} catch (err) {
			console.error('Save error:', err);
		} finally {
			saving = false;
		}
	}

	function cancelChanges() {
		placedStickers = JSON.parse(JSON.stringify(savedStickers));
		selectedBackgroundId = savedBackgroundId;
		selectedSticker = null;
	}

	let modes = [
		{label: 'Board', value: 'board', iconFa: 'fas fa-palette'},
		{label: 'Maps', value: 'maps', iconFa: 'fas fa-list-ul'},
		{label: 'Leaderboard', value: 'leaderboard', iconFa: 'fas fa-trophy'},
		{label: 'FAQ', value: 'faq', iconFa: 'fas fa-question-circle'},
	];
	let currentMode = modes[0];

	function onTypeChange(e) {
		currentMode = e.detail;
	}

	let currentEvent = null;

	function loadEvent(eventId) {
		if (!currentEvent) {
			fetch(BL_API_URL + 'event/' + eventId)
				.then(response => response.json())
				.then(ev => {
					currentEvent = ev;
				});
		}
	}

	$: loadEvent(80);

	onMount(() => {
		loadStatus();

		// Global event listeners for dragging (mouse and touch)
		const handleGlobalMove = e => handleCanvasPointerMove(e);
		const handleGlobalUp = e => handleCanvasPointerUp(e);

		window.addEventListener('mousemove', handleGlobalMove);
		window.addEventListener('mouseup', handleGlobalUp);
		window.addEventListener('touchmove', handleGlobalMove, {passive: false});
		window.addEventListener('touchend', handleGlobalUp);
		window.addEventListener('touchcancel', handleGlobalUp);

		return () => {
			window.removeEventListener('mousemove', handleGlobalMove);
			window.removeEventListener('mouseup', handleGlobalUp);
			window.removeEventListener('touchmove', handleGlobalMove);
			window.removeEventListener('touchend', handleGlobalUp);
			window.removeEventListener('touchcancel', handleGlobalUp);
		};
	});

	let title = 'Love Live! Birthday Pack';
	let metaDescription = 'Collect idol stickers by passing maps and create your own idol board!';
</script>

<svelte:window on:keydown={e => e.key === 'Delete' && deleteSelectedSticker()} />

<div class="lovelive-page" transition:fade>
	{#if loading}
		<div class="loading-container">
			<Spinner />
		</div>
	{:else if error}
		<ContentBox>
			<p class="error">{error}</p>
			<p>Please sign in to participate in the Love Live! event.</p>
			<Button label="Sign In" on:click={() => navigate('/signin')} />
		</ContentBox>
	{:else}
		<div class="event-container">
			<span class="event-header">
				<div class="ado-header">
					<PlayerMention playerId="76561198048985769" /> presents:
				</div>
				<h1>💖 Love Live! Birthday Pack 💖</h1>
				<br />
				<div class="subtitle">
					A result of a year-long effort to highlight every idol in the "Love Live!" franchise. Symphonic has gathered an army of mappers to
					create maps featuring each of these idols individually on their birthdays!
				</div>
				<div class="subtitle">
					Pass maps to receive their idol stickers and create your own idol board. Compete on the maps to receive bonus idols and
					decorations, as well as special badges for the top 3 in the event!
				</div>
			</span>
		</div>
		<div class="event-container">
			<div class="switcher-container">
				<TabSwitcher class="event-type-switcher" values={modes} value={currentMode} on:change={onTypeChange} />
			</div>
			<div class="content-container">
				{#if currentMode.value == 'board'}
					<!-- Canvas in the middle -->
					<div class="canvas-section" bind:this={canvasContainer}>
						<div class="canvas-header">
							<h2>Your Idol Board</h2>
							<div class="canvas-actions">
								{#if selectedSticker !== null}
									<Button iconFa="fas fa-arrow-up" title="Bring Forward" on:click={moveSelectedStickerUp} />
									<Button iconFa="fas fa-arrow-down" title="Send Backward" on:click={moveSelectedStickerDown} />
									<Button iconFa="fas fa-arrows-left-right" title="Mirror" on:click={mirrorSelectedSticker} />
									<Button iconFa="fas fa-trash" title="Delete" on:click={deleteSelectedSticker} />
								{/if}
								{#if hasChanges}
									<Button iconFa="fas fa-undo" label="Cancel" on:click={cancelChanges} />
									{#if $account?.id}
										<Button iconFa="fas fa-save" label={saving ? 'Saving...' : 'Save Board'} disabled={saving} on:click={saveCanvas} />
									{:else}
										<Button iconFa="fas fa-arrow-right-to-bracket" label="Log In to Save" on:click={() => navigate('/signin')} />
									{/if}
								{/if}
							</div>
						</div>
						<div class="canvas-scroll-container">
							<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions -->
							<div
								class="sticker-canvas"
								bind:this={canvasElement}
								on:mousedown={handleCanvasPointerDown}
								on:touchstart={handleCanvasPointerDown}
								role="application"
								aria-label="Sticker canvas"
								tabindex="0">
								{#if currentBackground}
									<div class="canvas-background" style="background-image: url({currentBackground.imageUrl})" draggable="false" />
								{/if}
								<div class="canvas-grid"></div>
								{#each placedStickers as sticker, index}
									<div
										class="placed-sticker {selectedSticker === index ? 'selected' : ''}"
										style="
										left: calc(50% + {sticker.x}px);
										top: {sticker.y}px;
										z-index: {(sticker.layerIndex || 0) + 10};
										transform: translate(-50%, -50%) rotate({sticker.rotation || 0}deg) scale({sticker.mirrored ? -1 : 1}, 1) scale({sticker.scale || 1});
									">
										<img src={getStickerImage(sticker)} alt={sticker.name} draggable="false" />
										{#if selectedSticker === index}
											<div class="rotation-handle" title="Rotate"></div>
											<div class="scale-handle" title="Scale"></div>
										{/if}
									</div>
								{/each}
								{#if placedStickers.length === 0}
									<div class="canvas-placeholder">
										<p>Drag stickers here from your collection below!</p>
										<p class="scroll-hint">Use 2 fingers to scroll the canvas</p>
									</div>
								{/if}
							</div>
							<div class="scroll-hint-bar">
								<i class="fas fa-arrows-left-right"></i> Scroll to see more
							</div>
						</div>

						<!-- Background picker -->
						{#if playerStatus?.backgrounds?.length > 0}
							<div class="background-picker">
								<span class="background-label">Background:</span>
								<div class="background-options">
									<button
										class="background-option {selectedBackgroundId === 0 ? 'selected' : ''}"
										on:click={() => (selectedBackgroundId = 0)}
										title="None">
										<div class="no-background">✕</div>
									</button>
									{#each playerStatus.backgrounds as bg}
										<button
											class="background-option {selectedBackgroundId === bg.id ? 'selected' : ''}"
											on:click={() => (selectedBackgroundId = bg.id)}
											title={bg.name}>
											<img src={bg.thumbnailUrl} alt={bg.name} />
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- Sticker palette -->
					<div class="sticker-palette">
						<h3>Your Stickers</h3>
						{#if playerStatus.songs.filter(song => song.score).length === 0}
							<p class="no-stickers">
								Pass <a href="#" on:click|preventDefault|stopPropagation={() => onTypeChange({detail: modes[1]})}>maps</a> to unlock stickers!
							</p>
						{:else}
							<div class="sticker-grid">
								{#each playerStatus.songs.filter(song => song.score).map(song => song.idolDescription) as sticker}
									<div
										class="palette-sticker"
										on:mousedown={e => startPaletteDrag({type: 'idol', ...sticker}, e)}
										on:touchstart={e => startPaletteDrag({type: 'idol', ...sticker}, e)}
										role="button"
										tabindex="0"
										title={sticker.description}>
										<img src={sticker.smallPictureRegular} alt={sticker.name} draggable="false" />
										<span class="sticker-name">{sticker.name}</span>
									</div>
								{/each}
							</div>
						{/if}

						{#if playerStatus?.bonusIdols?.length > 0}
							<h3>Bonus Idols</h3>
							<div class="sticker-grid">
								{#each playerStatus.bonusIdols as idol}
									<div
										class="palette-sticker bonus"
										on:mousedown={e => startPaletteDrag({type: 'bonus_idol', ...idol}, e)}
										on:touchstart={e => startPaletteDrag({type: 'bonus_idol', ...idol}, e)}
										role="button"
										tabindex="0"
										title={idol.description}>
										<img src={idol.smallPictureRegular} alt={idol.name} draggable="false" />
										<span class="sticker-name">{idol.name}</span>
									</div>
								{/each}
							</div>
						{/if}

						{#if playerStatus?.decorations?.length > 0}
							<h3>Decorations</h3>
							<div class="sticker-grid">
								{#each playerStatus.decorations as decoration}
									<div
										class="palette-sticker decoration"
										on:mousedown={e => startPaletteDrag({type: 'decoration', ...decoration}, e)}
										on:touchstart={e => startPaletteDrag({type: 'decoration', ...decoration}, e)}
										role="button"
										tabindex="0"
										title={decoration.description}>
										<img src={decoration.smallPictureRegular} alt={decoration.name} draggable="false" />
										<span class="sticker-name">{decoration.name}</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
					<div class="sticker-palette">
						<span
							>Thanks to <a href="https://x.com/VanillaKunikida" target="_blank" rel="noreferrer">@VanillaKunikida</a> for the stickers art!</span>
					</div>
				{:else if currentMode.value == 'maps'}
					<div class="calendar-section">
						<div class="calendar-top">
							{#each sortedSongs as songStatus}
								<SongCard {songStatus} />
							{/each}
						</div>
					</div>
					<div class="playlist-button-container">
						<Button iconFa="fas fa-compact-disc" label="Complete Event Playlist" on:click={() => navigate('/playlist/101750')} />
					</div>
				{:else if currentMode.value == 'leaderboard'}
					<PlaylistEventPlayers {location} eventId={currentEvent.id} currentEvent={currentEvent} />
				{:else if currentMode.value == 'faq'}
					<div class="faq">
						<h2>FAQ</h2>
						<p>
							<b>When does the event end?</b> <br />
							The event ends on February 15th at 15:00 UTC.
						</p>
						<p>
							<b>What is the Love Live! Birthday Pack?</b> <br />
							The Love Live! Birthday Pack is a result of a year-long effort to highlight every idol in the "Love Live!" franchise, symphonic
							has gathered an army of mappers to create maps featuring each of these idols individually on their birthdays! Pass maps to receive
							their idol stickers and create your own idol board. Compete on the maps to receive bonus idols and decorations, as well as special
							badges for the top 3 in the event!
						</p>
						<p>
							<b>"Love Live!"?</b> <br />
							Each title in the Love Live! franchise focuses on groups of teenage schoolgirls who become "school idols" as an extracurricular
							activity, and their main activities involve singing and dancing to self-written songs they perform at concerts or other music events.
							Other activities include designing their own costumes, as well as filming promotional videos and music videos. Top-class groups
							are very popular among fans of school idols.
							<br /><br />
							<b>Love Live! School Idol Project</b> is the original series that started the franchise, being about the idol group "<i>μ's</i
							>" (pronounced <i>MYOOZE</i>). It's a genuine, grounded, humble-beginnings success story, and not one without struggle. Our
							main character is Honoka Kousaka: a girl who's a bit absent-minded and has trouble committing to things, but believes in her
							feelings with her whole heart. She forms the club in order to save her school from shutting down, because despite how mundane
							some may see it, Honoka loves her school and knows how special it could be, and wanted to <i>do</i> something special to draw
							more students in for enrollment.<br /><br />

							Despite being almost 15 years old, the anime adaptation of <i>School Idol Project</i> has a lot of highlights and charm, along
							with a very enjoyable cast to follow, all with unique voices and personalities. <i>μ's</i> left a MASSIVE impact on the world
							of idols not just in the story going forward, but also in the real world!
							<br /><br />

							<b>Love Live! Sunshine!!</b> is the direct sequel series to <i>School Idol Project</i>. It follows a cast of girls from an
							area of Japan that's kinda out in the middle of nowhere, namely Chika Takami, a girl so inspired by <i>μ's</i> that she
							decides to form her own school idol club when her school decides to close up shop, despite all of the odds seemingly being
							stacked against her to do so, with how remote and uninteresting her whole town is in comparison to a massively populated city
							like Tokyo. It's the anime series about "<i>Aqours</i>" (pronounced "<i>AH-kuu-wah</i>"), and the journey they all take
							following in the footsteps of the massive cultural force that was <i>μ's</i>, as well as the struggles that they face
							internally to save their school from closing down as the population of their entire town imminently dwindles.<br /><br />

							<i>Aqours</i> houses Love Live's biggest catalogue of music, with an extremely talented and diverse cast of characters. If
							<i>μ's</i>
							laid the groundwork for school idols, <i>Aqours</i> built the skyscrapers on top of it by experimenting in different genres
							and redefining the sounds and culture of idols altogether.
							<br /><br />

							<b>Love Live! Nijigasaki High School Club</b> is a completely separate series that focuses more on the general concepts of
							what a School Idol could be and how everyone's differences are what make them so unique and special. It's got everything a
							Love Live fan could ask for: gorgeous animation and background art, incredibly-animated performances, some of the best musical
							production the franchise has to offer, and a cast of all super diverse but insanely talented girls. They all use their
							differences to their strengths to push each other to become better, and has some genuinely compelling character drama and
							writing when they're faced with the challenges that this mindset brings them on their own personal journeys.
							<br /><br />

							<b>Love Live! Superstar!!</b> is another completely separate series from the rest, set in a time where School Idols and the
							Love Live competition have been thriving for years now. <i>Liella!</i> (pronounced "<i>lee-EL-uh</i>") has a musical catalogue
							that blends every best part of the previous groups' together, sporting a little something for everyone without losing their
							pinch of emotional catharsis in every track they release. <i>Superstar</i> has one of the most character-driven, mature, and
							emotional stories in the franchise, growing up with the audience that it's cultivated over the last 10-15 years. Our main
							character, Kanon Shibuya, spent her life being defined by the failure that prevented her from truly doing what she loved. When
							she becomes a school idol, she spends the rest of the series helping her friends to not let themselves be defined by their
							worst moments and failures either.
							<br /><br />

							<b>Link! Like! Love Live!</b> is once again its own situation separate from the rest of the franchise, centering around the
							<i>Hasunosora Girls' School Idol Club</i>. Unlike other groups, this group functions in a kind of "real-time" sense, similar
							to how VTubers function - as virtual idols. Members grow through their high school years and eventually graduate; this
							birthday pack focuses on the first full set of girls in their first, second, and third years, though some idols have now
							graduated and new ones have since joined. Most interactions with the group take place exclusively through a mobile app,
							including livestreams, concerts, and stories featuring the characters. No companion anime currently exists, but one is due to
							be released in Spring 2026.
							<br /><br />
							Thanks to <PlayerMention playerId="76561198177154246" /> and <PlayerMention playerId="76561198048985769" /> for the description
							of the titles!
						</p>
						<p>
							<b>How do I pass a map?</b> <br />
							Complete the map on any difficulty and any day. Don't worry about the score, just pass the map to receive their idol sticker. But
							don't use the "No Fail" modifier as it will not count for the event.
						</p>
						<p>
							<b>How do I create my own idol board?</b> <br />
							Create your own idol board by dragging and dropping the stickers onto the board. You can also rotate and scale the stickers to
							your liking.
						</p>
						<p>
							<b>How do I compete on the maps?</b> <br />
							Compete on the maps to receive bonus idols and decorations, as well as special badges for the top 3 in the event! Top 3 players
							are determined by the total PP you have at the end of the event.
						</p>
						<p>
							<b>What map counts for the event?</b> <br />
							All difficulties in a Standard mode map counts for the event. They will grant you PP.
						</p>
						<p>
							<b>How do I get the bonus idols?</b> <br />
							There is one already available: manager Yu! Always cheering for her idols! More bonus idols will be added throughout the event!
							(hopefully)
						</p>
						<p>
							<b>Where are all the old scores?</b> <br />
							Old scores are saved and will be restored after the event ends. Better event scores will override older scores.
						</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Drag ghost -->
	{#if draggingFromPalette}
		<div class="drag-ghost" style="left: {paletteGhostPosition.x}px; top: {paletteGhostPosition.y}px;">
			<img src={draggingFromPalette.image} alt={draggingFromPalette.name} />
		</div>
	{/if}
</div>

<MetaTags
	{title}
	description={metaDescription}
	openGraph={{
		title,
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/lovelive-event.webp'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary_large_image',
		title,
		description: metaDescription,
		image: CURRENT_URL + '/assets/lovelive-event.webp',
		imageAlt: metaDescription,
	}} />

<style>
	.lovelive-page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.switcher-container {
		display: flex;
		width: 100%;
		justify-content: center;
		align-items: center;
		margin-bottom: 0.6em;
	}

	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 50vh;
	}

	.event-container {
		max-width: 1600px;
		margin: 0 auto;
		background: linear-gradient(135deg, #1a0a1e 0%, #2d1b3d 50%, #1a0a1e 100%);
		padding: 1rem;
		border-radius: 22px;
		width: 100%;
	}

	.event-header {
		text-align: center;
		padding: 2rem 1rem;
	}

	.event-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		background: linear-gradient(90deg, #ff6b9d, #ffa8c9, #ff6b9d);
		background-size: 200% auto;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: gradient-shift 3s ease infinite;
		margin: 0;
	}

	@keyframes gradient-shift {
		0%,
		100% {
			background-position: 0% center;
		}
		50% {
			background-position: 200% center;
		}
	}

	.subtitle {
		color: #ffa8c9;
		font-size: 1.1rem;
		margin-top: 0.5rem;
		opacity: 0.9;
	}

	.main-layout {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.calendar-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.calendar-top,
	.calendar-bottom {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
	}

	/* Canvas section */
	.canvas-section {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 16px;
		padding: 1rem;
		border: 2px solid rgba(255, 107, 157, 0.3);
	}

	.canvas-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.canvas-header h2 {
		margin: 0;
		color: #ffa8c9;
		font-size: 1.3rem;
	}

	.canvas-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.canvas-scroll-container {
		max-width: calc(100vw - 4.5em);
		overflow: hidden;
		border-radius: 12px;
		-webkit-overflow-scrolling: touch;
		touch-action: pan-x;
	}

	.sticker-canvas {
		position: relative;
		min-width: 800px;
		width: 100%;
		height: 400px;
		background: linear-gradient(135deg, #2a1a3a 0%, #1a0a2a 100%);
		border-radius: 12px;
		overflow: visible;
		cursor: crosshair;
		user-select: none;
		touch-action: none;
		flex-shrink: 0;
		contain: none;
		transform: translateZ(0);
	}

	.canvas-background {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		background-repeat: repeat-x;
		background-size: contain;
	}

	.canvas-grid {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(rgba(255, 107, 157, 0.1) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 107, 157, 0.1) 1px, transparent 1px);
		background-size: 40px 40px;
		pointer-events: none;
	}

	.background-picker {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 107, 157, 0.2);
	}

	.background-label {
		color: #ffa8c9;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.background-options {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.background-option {
		width: 50px;
		height: 35px;
		border: 2px solid rgba(255, 107, 157, 0.3);
		border-radius: 6px;
		cursor: pointer;
		overflow: hidden;
		padding: 0;
		background: rgba(0, 0, 0, 0.3);
		transition:
			border-color 0.2s ease,
			transform 0.2s ease;
	}

	.background-option:hover {
		border-color: rgba(255, 107, 157, 0.6);
		transform: scale(1.05);
	}

	.background-option.selected {
		border-color: #ff6b9d;
		box-shadow: 0 0 8px rgba(255, 107, 157, 0.5);
	}

	.background-option img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-background {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 168, 201, 0.6);
		font-size: 1.2rem;
	}

	.canvas-placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: rgba(255, 168, 201, 0.5);
		font-size: 1.1rem;
		pointer-events: none;
	}

	.canvas-placeholder .scroll-hint {
		display: none;
		font-size: 0.85rem;
		margin-top: 0.5rem;
		opacity: 0.7;
	}

	.scroll-hint-bar {
		display: none;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		color: rgba(255, 168, 201, 0.6);
		font-size: 0.8rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0 0 12px 12px;
		margin-top: -12px;
	}

	.placed-sticker {
		position: absolute;
		cursor: move;
		transition: filter 0.2s ease;
		width: 80px;
		height: 80px;
		flex-shrink: 0;
	}

	.placed-sticker img {
		width: 80px;
		height: 80px;
		min-width: 80px;
		min-height: 80px;
		object-fit: contain;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
		flex-shrink: 0;
	}

	.placed-sticker.selected {
		filter: drop-shadow(0 0 10px #ff6b9d);
	}

	.placed-sticker.selected img {
		outline: 2px dashed #ff6b9d;
		outline-offset: 4px;
	}

	.rotation-handle {
		position: absolute;
		top: -30px;
		left: 50%;
		transform: translateX(-50%);
		width: 20px;
		height: 20px;
		background: #ff6b9d;
		border-radius: 50%;
		cursor: grab;
		border: 2px solid white;
	}

	.rotation-handle::before {
		content: '↻';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 12px;
		color: white;
	}

	.scale-handle {
		position: absolute;
		bottom: -15px;
		right: -15px;
		width: 20px;
		height: 20px;
		background: #4caf50;
		border-radius: 4px;
		cursor: nwse-resize;
		border: 2px solid white;
	}

	.scale-handle::before {
		content: '⤡';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 12px;
		color: white;
	}

	/* Sticker palette */
	.sticker-palette {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 16px;
		padding: 1rem;
		border: 2px solid rgba(255, 107, 157, 0.3);
		margin-top: 1em;
	}

	.sticker-palette h3 {
		color: #ffa8c9;
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
	}

	.no-stickers {
		color: rgba(255, 168, 201, 0.6);
		text-align: center;
		padding: 2rem;
	}

	.sticker-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.palette-sticker {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		cursor: grab;
		transition:
			transform 0.2s ease,
			background 0.2s ease;
		width: 80px;
		touch-action: none;
	}

	.palette-sticker:hover {
		transform: scale(1.05);
		background: rgba(255, 107, 157, 0.2);
	}

	.palette-sticker:active {
		cursor: grabbing;
	}

	.palette-sticker img {
		width: 50px;
		height: 50px;
		object-fit: contain;
		border-radius: 8px;
	}

	.palette-sticker.bonus img {
		border: 2px solid gold;
	}

	.palette-sticker.decoration img {
		border: 2px solid #9c27b0;
	}

	.sticker-name {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.8);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
	}

	/* Drag ghost */
	.drag-ghost {
		position: fixed;
		pointer-events: none;
		z-index: 1000;
		transform: translate(-50%, -50%);
		opacity: 0.8;
	}

	.drag-ghost img {
		width: 80px;
		height: 80px;
		object-fit: contain;
		filter: drop-shadow(0 4px 12px rgba(255, 107, 157, 0.6));
	}

	.error {
		color: #ff6b6b;
		text-align: center;
		font-size: 1.1rem;
		margin-bottom: 1rem;
	}

	.ado-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1em;
	}

	.faq {
		margin: 1em 20px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 15px;
		text-align: center;
	}

	.faq p {
		margin: 0;
	}

	.faq b {
		font-weight: bold;
	}

	.faq p:not(:last-child) {
		margin-bottom: 10px;
	}

	.playlist-button-container {
		display: flex;
		width: 100%;
		justify-content: center;
		align-items: center;
		margin-top: 2em;
	}

	:global(.event-type-switcher) {
		flex-wrap: wrap;
		justify-content: center !important;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.song-card {
			width: 150px;
			height: 200px;
		}

		.idol-avatar {
			width: 40px;
			height: 40px;
		}
	}

	@media (max-width: 768px) {
		.event-header h1 {
			font-size: 1.8rem;
		}

		.song-card {
			width: 140px;
			height: 180px;
		}

		.sticker-canvas {
			height: 300px;
		}

		.canvas-placeholder .scroll-hint {
			display: block;
		}

		.scroll-hint-bar {
			display: flex;
		}

		.palette-sticker {
			width: 70px;
		}

		.palette-sticker img {
			width: 40px;
			height: 40px;
		}

		.canvas-scroll-container {
			overflow-x: auto;
		}
	}

	@media (max-width: 480px) {
		.calendar-top,
		.calendar-bottom {
			justify-content: center;
		}

		.song-card {
			width: 120px;
			height: 160px;
			font-size: 0.85rem;
		}

		.idol-avatar {
			width: 35px;
			height: 35px;
		}

		.canvas-header {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
