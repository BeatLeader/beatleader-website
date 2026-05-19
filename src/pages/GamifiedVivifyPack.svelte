<script>
	import {onMount, getContext} from 'svelte';
	import {fade} from 'svelte/transition';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import Button from '../components/Common/Button.svelte';
	import SongCard from '../components/GamifiedVivify/SongCard.svelte';
	import LoveLiveCongratulation from '../components/LoveLive/LoveLiveCongratulation.svelte';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';
	import PlayerMention from '../components/Scores/PlayerMention.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../ssr-config';
	import {navigate} from 'svelte-routing';
	import PlaylistEventPlayers from '../components/Event/PlaylistEventPlayers.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import FaSvgIcon from '../components/Common/FaSvgIcon.svelte';
	import { dateFromUnix, formatDate } from '../utils/date';

	const {open, close} = getContext('simple-modal');

	export let location;

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
			const response = await fetch(`${BL_API_URL}event/gamifiedvivify/status`, {credentials: 'include'});
			if (!response.ok) throw new Error('Failed to load Gamified Vivify data');
			playerStatus = await response.json();

			sortedSongs = getSortedSongs();
			checkForNewIdols();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function checkForNewIdols() {
		if (!playerStatus?.songs) return;

		const newIdols = playerStatus.songs.filter(song => song.isNew).map(song => song.idolDescription);

		if (newIdols.length > 0) {
			showCongratulationPopup(newIdols);
		}
	}

	function showCongratulationPopup(newIdols) {
		// open(LoveLiveCongratulation, {
		// 	newIdols,
		// 	confirm: () => {
		// 		close();
		// 		markIdolsAsSeen();
		// 	},
		// 	cancel: () => {
		// 		close();
		// 		markIdolsAsSeen();
		// 	},
		// });
	}

	// Sort songs by birthday for calendar layout
	function getSortedSongs() {
		if (!playerStatus?.songs) return [];
		var sortedSongs = [...playerStatus.songs];
		sortedSongs = sortedSongs.filter(song => song.song);
		return sortedSongs.sort((a, b) => a.id - b.id);
	}

	// Helper to convert mouse X to center-relative X

	let modes = [
		{label: 'Maps', value: 'maps', iconFa: 'fas fa-list-ul'},
		{label: 'Leaderboards', value: 'leaderboard', iconFa: 'fas fa-trophy'},
		{label: 'FAQ', value: 'faq', iconFa: 'fas fa-question-circle'},
	];
	let currentMode = modes[0];

	function onTypeChange(e) {
		currentMode = e.detail;
	}

	let leaderboardModes = [
		{label: 'Cubes', value: 'cubes', iconSvg: '/assets/block-icon.svg'},
		{label: 'Poodles', value: 'poodles', iconSvg: '/assets/poodle-icon.svg'},
	];
	let currentLeaderboardMode = leaderboardModes[0];

	function onLeaderboardTypeChange(e) {
		currentLeaderboardMode = e.detail;
	}

	let blocksEvent = null;
	let poodlesEvent = null;

	function loadBlocksEvent(eventId) {
		if (!blocksEvent) {
			fetch(BL_API_URL + 'event/' + eventId)
				.then(response => response.json())
				.then(ev => {
					blocksEvent = ev;
				});
		}
	}

	function loadPoodlesEvent(eventId) {
		if (!poodlesEvent) {
			fetch(BL_API_URL + 'event/' + eventId)
				.then(response => response.json())
				.then(ev => {
					poodlesEvent = ev;
				});
		}
	}

	function scrollToFaq() {
		currentMode = modes[2];
	}

	$: loadStatus();

	$: loadBlocksEvent(83);
	$: loadPoodlesEvent(84);

	let faqItems = [
		{
			question: 'What is Gamified Vivify?',
			answer: 'Gamified Vivify is an event where you can compete on the maps to receive badges and game licenses.',
		},
		{
			question: 'What are the categories?',
			answer: 'There are two playlists with the maps with highlighted difficulties: cubes and poodles. They have 2 separate leaderboards on the corresponding tab.',
		},
		{
			question: 'What are the prizes?',
			answer: 'License to any of the games featured in the pack and profile badges.',
		},
		{
			question: 'How do I get the badge and license?',
			answer: 'Get into the global top 5 of either category',
		},
		{
			question: 'How do game licenses will be distributed?',
			answer: 'After the event ends, players will have an option to choose a game license from the list of available games. \
			For every game, we will have 2 total licenses available. Players will go from the top 1 to the top 5 in order.\
			All licenses will be digital. Depending on the game, it will be possible to gift the game to someone else directly or by making a request.',
		},
		{
			question: 'There are games that are free to play?',
			answer: 'For the Genshin Impact and Arknights Endfield we will have 2 packs of premium currency worth roughly $30 each.',
		},
		{
			question: 'Can I play this on Quest Standalone?',
			answer: 'No, the official version of the Vivify mod is not yet available on Quest, and the one floating around is not suitable for competitive events.',
		},
		{
			question: 'What is the Vivify mod?',
			answer: 'Mod created by Aeroluna, available in BSManager and on TotalBS website.',
		},
		{
			question: 'Can I use modifiers in the event?',
			answer: 'Yes, except for the speed modifiers, that are all reduced to -50% of the score.',
		},
		{
			question: 'Will there be profile achievements?',
			answer: 'Not planned for this event',
		},
		{
			question: 'When the event ends?',
			answer: `The event ends on ${formatDate(dateFromUnix(1780437600))}.`,
		},
	];

	let title = 'Gamified Vivify';
	let metaDescription = 'Compete on the maps to receive badges and game licenses.';
</script>


<div class="lovelive-page" transition:fade>
	{#if loading}
		<div class="loading-container">
			<Spinner />
		</div>
	{:else if error}
		<ContentBox>
			<p class="error">{error}</p>
			<p>Please sign in to participate in the Gamified Vivify event.</p>
			<Button label="Sign In" on:click={() => navigate('/signin')} />
		</ContentBox>
	{:else}
		<div class="event-container">
			<span class="event-header">
				<div class="ado-header">
					<PlayerMention playerId="76561198136260562" /> and <PlayerMention playerId="76561198042059768" /> presents:
				</div>
				<h1><span class="gamepad-icon">🕹️</span> Gamified Vivify <span class="gamepad-icon">🕹️</span></h1>
				<br />
				<div class="subtitle">
					<b>Award winning mappers come together to bring 12 popular games into Beat Saber!</b><br /><br />
					Sing together with Portal 2 turrets (so they don't shoot you), slide poodles like you're having an Elytra, cut cubes with your FUS RO DAH! and much more!<br />
					Mappers brought the next level of creativity to Beat Saber with the power of Vivify and their relentless work and passion.<br />
					Join us on the adventure through the cosmic darkness of Lethal Company to the green tranquility of Zelda!<br />
				</div>
				<div class="subtitle description-subtitle">
					Compete on the maps to receive badges and game licenses.
					The event is split into two categories:
					<ul>
						<li><b>Cubes:</b> good old Beat Saber blocks</li>
						<li><b>Poodles:</b> sustained, sliding notes</li>
					</ul><br />
					Get into the top 5 in each category to win a game license and profile badge! Check <a href="#" on:click|preventDefault|stopPropagation={() => scrollToFaq()} target="_blank">the FAQ</a> for more information.<br /><br />
					The event ends on {formatDate(dateFromUnix(1780437600))}.
				</div>
			</span>
		</div>
		<div class="event-container-main">
			<div class="switcher-container">
				<TabSwitcher class="event-type-switcher" values={modes} value={currentMode} on:change={onTypeChange} />
			</div>
			<div class="content-container">
				{#if currentMode.value == 'maps'}
					<div class="calendar-section">
						<div class="calendar-top">
							{#each sortedSongs as songStatus}
								<SongCard {songStatus} />
							{/each}
						</div>
					</div>
					<div class="playlist-button-container">
						<Button iconFa="fas fa-compact-disc" label="Cubes Playlist" on:click={() => navigate('/playlist/106659')} />
						<Button iconFa="fas fa-compact-disc" label="Poodles Playlist" on:click={() => navigate('/playlist/106662')} />
					</div>
				{:else if currentMode.value == 'leaderboard'}
				<div class="switcher-container">
					<TabSwitcher class="leaderboard-type-switcher" values={leaderboardModes} value={currentLeaderboardMode} on:change={onLeaderboardTypeChange} />
				</div>
				<div class="leaderboard-container">
					{#if currentLeaderboardMode.value == 'cubes'}
						<PlaylistEventPlayers {location} eventId={blocksEvent.id} {blocksEvent} />
					{:else if currentLeaderboardMode.value == 'poodles'}
						<PlaylistEventPlayers {location} eventId={poodlesEvent.id} {poodlesEvent} />
					{/if}
				</div>
				{:else if currentMode.value == 'faq'}
					<div class="faq-container">
						<h2>FAQ</h2>
						{#each faqItems as item}
							<div class="faq-item">
								<p class="faq-question">{item.question}</p>
								<p class="faq-answer">{@html item.answer}</p>
								{#if item.list}
									<ul>
										{#each item.list as listItem}
											<li>{@html listItem}</li>
										{/each}
									</ul>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<MetaTags
	{title}
	description={metaDescription}
	openGraph={{
		title,
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/gamifyvivify-event.jpg'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary_large_image',
		title,
		description: metaDescription,
		image: CURRENT_URL + '/assets/gamifyvivify-event.jpg',
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
		background: linear-gradient(135deg, #1a0a1e 0%, #402333 50%, #000000 100%);
		padding: 1rem;
		border-radius: 22px;
		width: 100%;
	}

	.event-container-main {
		max-width: 1600px;
		margin: 0 auto;
		background: linear-gradient(rgb(0 0 0 / 19%), rgba(0, 0, 0, 0.5)), #3e2131;
		background-position: center top;
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
		background: linear-gradient(90deg, #ffee28, #ff9d24, #fff688);
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

	.gamepad-icon {
		-webkit-text-fill-color: white;
		text-fill-color: white;
	}

	.subtitle {
		color: white;
		font-size: 1.1rem;
		margin-top: 0.5rem;
		opacity: 0.9;
	}

	.description-subtitle {
		font-size: 0.9em;
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

	.palette-sticker.special {
		box-shadow: #fffc27 0px 0px 10px;
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

	.faq-container {
		margin: 1em 20px;
		text-align: center;
	}

	.faq-item {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 1em;
	}

	.faq-question {
		font-weight: bold;
		margin: 0 0 0.5em 0;
		font-size: 1.1em;
	}

	.faq-answer {
		margin: 0;
	}

	.playlist-button-container {
		display: flex;
		width: 100%;
		justify-content: center;
		align-items: center;
		margin-top: 2em;
		gap: 1em;
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
