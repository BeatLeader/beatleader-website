<script>
	import AchievementDetailsContent from './AchievementDetailsContent.svelte';
	import {dateFromUnix, formatDateRelative} from '../../../utils/date';
	import ContentBox from '../ContentBox.svelte';
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import {onDestroy} from 'svelte';
	import Spinner from '../Spinner.svelte';

	export let achievement;

	let showDetails = false;
	let playerName = null;

	// Love Live canvas state
	let loveLiveCanvas = null;
	let loveLiveStickers = [];

	const LOVE_LIVE_BASE_WIDTH = 1532;
	const LOVE_LIVE_BASE_HEIGHT = 400;

	let loveLiveCanvasDisplayEl;
	let loveLiveCanvasScale = 1;
	let loveLiveCanvasHeight = LOVE_LIVE_BASE_HEIGHT;
	let loveLiveCanvasResizeObserver;

	function updateLoveLiveCanvasLayout() {
		if (!loveLiveCanvasDisplayEl) return;
		const width = loveLiveCanvasDisplayEl.getBoundingClientRect().width;
		if (!width) return;
		loveLiveCanvasScale = width / LOVE_LIVE_BASE_WIDTH;
		loveLiveCanvasHeight = LOVE_LIVE_BASE_HEIGHT * loveLiveCanvasScale;
	}

	async function fetchLoveLiveCanvas(playerId) {
		if (!playerId) {
			loveLiveCanvas = null;
			loveLiveStickers = [];
			return;
		}

		try {
			const response = await fetch(`${BL_API_URL}event/lovelive/canvas/${playerId}`);
			if (!response.ok) {
				loveLiveCanvas = null;
				loveLiveStickers = [];
				return;
			}
			loveLiveCanvas = await response.json();

			// Parse canvasState JSON string
			if (loveLiveCanvas?.canvasState) {
				try {
					loveLiveStickers = JSON.parse(loveLiveCanvas.canvasState);
				} catch (e) {
					loveLiveStickers = [];
				}
			} else {
				loveLiveStickers = [];
			}
		} catch (err) {
			loveLiveCanvas = null;
			loveLiveStickers = [];
		}
	}

	function getLoveLiveStickerImage(sticker) {
		if (!loveLiveCanvas) return null;

		if (sticker.type === 'decoration' && loveLiveCanvas.decorations) {
			const decoration = loveLiveCanvas.decorations.find(s => s.id === sticker.stickerId);
			if (decoration?.bigPictureRegular) {
				return decoration.bigPictureRegular;
			}
		}

		// Search in songs (idol descriptions)
		if (loveLiveCanvas.songs) {
			const song = loveLiveCanvas.songs.find(s => s.idolDescription?.id === sticker.stickerId);
			if (song?.idolDescription?.bigPictureRegular) {
				return song.idolDescription.bigPictureRegular;
			}
		}

		// Search in bonus idols
		if (loveLiveCanvas.bonusIdols) {
			const bonusIdol = loveLiveCanvas.bonusIdols.find(s => s.id === sticker.stickerId);
			if (bonusIdol?.bigPictureRegular) {
				return bonusIdol.bigPictureRegular;
			}
		}

		// Search in decorations

		return null;
	}

	function getLoveLiveBackground() {
		if (!loveLiveCanvas?.backgrounds || !loveLiveCanvas?.backgroundId) return null;
		return loveLiveCanvas.backgrounds.find(bg => bg.id === loveLiveCanvas.backgroundId);
	}

	async function fetchPlayerName(playerId) {
		if (!playerId) return;
		try {
			const response = await fetch(`${BL_API_URL}player/${playerId}`);
			if (response.ok) {
				const data = await response.json();
				playerName = data?.name ?? null;
			}
		} catch (e) {
			playerName = null;
		}
	}

	$: achievement.playerId && fetchPlayerName(achievement.playerId);
	$: achievement.playerId && fetchLoveLiveCanvas(achievement.playerId);
	$: if (loveLiveCanvasDisplayEl) {
		updateLoveLiveCanvasLayout();
		if (!loveLiveCanvasResizeObserver && typeof ResizeObserver !== 'undefined') {
			loveLiveCanvasResizeObserver = new ResizeObserver(updateLoveLiveCanvasLayout);
			loveLiveCanvasResizeObserver.observe(loveLiveCanvasDisplayEl);
		}
	}

	onDestroy(() => {
		loveLiveCanvasResizeObserver?.disconnect();
		loveLiveCanvasResizeObserver = null;
	});
</script>

<div class="main-container">
	<div class="achievement-descriptions-container">
		<div class="achievement-description-name">
			<a href={achievement.achievementDescription.link}>{achievement.achievementDescription.name}</a>
		</div>
		<div class="achievement-description-description">
			{achievement.achievementDescription.description}
		</div>
	</div>

	{#each achievement.achievementDescription.levels as level}
		<AchievementDetailsContent {achievement} {showDetails} {level} grey={level.level != achievement.level.level} />
	{/each}
</div>

<div class="lovelive-canvas-box">
	{#if loveLiveStickers?.length > 0}
		<div class="lovelive-canvas-header">
			<h3>{playerName ?? 'Player'}'s final Idol Board</h3>
			<div class="timeset">{formatDateRelative(dateFromUnix(achievement.timeset))}</div>
		</div>
		<div class="lovelive-scroll-container">
			<div class="lovelive-canvas-display" bind:this={loveLiveCanvasDisplayEl} style="height: {loveLiveCanvasHeight}px;">
				{#if getLoveLiveBackground()}
					<div class="lovelive-canvas-bg" style="background-image: url({getLoveLiveBackground().imageUrl})" />
				{/if}
				<div class="lovelive-canvas-grid"></div>
				{#each loveLiveStickers as sticker}
					<div
						class="lovelive-placed-sticker"
						style="
								left: calc(50% + {sticker.x * loveLiveCanvasScale}px);
								top: {sticker.y * loveLiveCanvasScale}px;
								z-index: {(sticker.layerIndex || 0) + 10};
								transform: translate(-50%, -50%) rotate({sticker.rotation || 0}deg) scale({sticker.mirrored ? -1 : 1}, 1) scale({(sticker.scale || 1) *
							loveLiveCanvasScale});
							">
						<img src={getLoveLiveStickerImage(sticker)} alt="Sticker" />
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<Spinner />
	{/if}
</div>

<style>
	.main-container {
		display: flex;
		gap: 1em;
		flex-direction: column;
		padding: 2em;
		color: var(--textColor) !important;
	}
	.achievement-descriptions-container {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		margin-bottom: 1em;
	}
	.achievement-description-name {
		font-size: larger;
		font-weight: bold;
	}
	.achievement-description-description {
		font-size: small;
		color: #666;
		text-decoration: underline;
	}
	.timeset {
		color: white;
		padding-right: 0.5em;
	}
	:global(.atropos-inner) {
		overflow: visible !important;
	}
	:global(.atropos-scale) {
		pointer-events: none;
	}

	:global(.atropos-rotate) {
		pointer-events: all;
	}

	@media screen and (max-width: 767px) {
		.lovelive-scroll-container {
			overflow-x: auto;
		}

		.lovelive-canvas-display {
			min-width: 560px !important;
		}
	}

	/* Love Live Canvas Styles */
	.lovelive-canvas-box {
		border-radius: 12px !important;
		padding: 0.4em !important;
		background-color: #a42587;
		margin: -1.5em 1.5em 2em 1.5em;
	}

	.lovelive-canvas-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.4rem;
	}

	.lovelive-canvas-header h3 {
		margin: 0;
		font-size: 1.1rem;
		background: linear-gradient(90deg, #ff6b9d, #ffa8c9);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.lovelive-link {
		background: rgba(255, 107, 157, 0.2);
		border: 1px solid rgba(255, 107, 157, 0.4);
		color: #ffa8c9;
		padding: 0.4em 0.8em;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.85rem;
		transition: all 0.2s ease;
	}

	.lovelive-link:hover {
		background: rgba(255, 107, 157, 0.3);
		border-color: rgba(255, 107, 157, 0.6);
	}

	.lovelive-link i {
		margin-left: 0.4em;
		font-size: 0.8em;
	}

	.lovelive-scroll-container {
		max-width: calc(100vw - 0.8em);
		overflow: hidden;
		border-radius: 10px;
		-webkit-overflow-scrolling: touch;
		touch-action: pan-x;
		display: flex;
		justify-content: center;
	}

	.lovelive-canvas-display {
		position: relative;
		min-width: 800px;
		width: 100%;
		background: linear-gradient(135deg, #2a1a3a 0%, #1a0a2a 100%);
		border-radius: 10px;
		overflow: visible;
		contain: none;
		transform: translateZ(0);
	}

	.lovelive-canvas-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		background-repeat: repeat-x;
		background-size: contain;
	}

	.lovelive-canvas-grid {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(rgba(255, 107, 157, 0.08) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 107, 157, 0.08) 1px, transparent 1px);
		background-size: 40px 40px;
		pointer-events: none;
	}

	.lovelive-placed-sticker {
		position: absolute;
		width: 80px;
		height: 80px;
		flex-shrink: 0;
	}

	.lovelive-placed-sticker img {
		width: 80px;
		height: 80px;
		min-width: 80px;
		min-height: 80px;
		object-fit: contain;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
		flex-shrink: 0;
	}
</style>
