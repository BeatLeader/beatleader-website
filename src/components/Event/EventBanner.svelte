<script>
	import {navigate} from 'svelte-routing';
	import {onMount} from 'svelte';
	import Button from '../Common/Button.svelte';
	import ContentBox from '../Common/ContentBox.svelte';

	let cinematicsCanvas;
	export let wideScreen = false;

	// All available character images, grouped by game
	const charactersByName = {
		'portal2': ['portal2_1.webp', 'portal2_2.webp', 'portal2_3.webp'],
		'lethalcompany': ['lethalcompany_1.webp', 'lethalcompany_2.webp', 'lethalcompany_3.webp'],
		'expedition33': ['expedition33_1.webp', 'expedition33_2.webp', 'expedition33_3.webp'],
		'skyrim': ['skyrim_1.webp', 'skyrim_2.webp', 'skyrim_3.webp'],
		'minecraft': ['minecraft_1.webp', 'minecraft_2.webp', 'minecraft_3.webp'],
		'zelda': ['zelda_1.webp', 'zelda_2.webp', 'zelda_3.webp'],
		'genshin': ['genshin_1.webp', 'genshin_2.webp', 'genshin_3.webp'],
		'callofduty': ['callofduty_1.webp', 'callofduty_2.webp', 'callofduty_3.webp'],
		'mariocart': ['mariocart_1.webp', 'mariocart_2.webp', 'mariocart_3.webp'],
		'mariogalaxy': ['mariogalaxy_1.webp', 'mariogalaxy_2.webp', 'mariogalaxy_3.webp'],
		'arknights': ['arknights_1.webp', 'arknights_2.webp', 'arknights_3.webp'],
	};

	// Randomly selected characters for this load
	let selectedCharacters = [];

	function shuffleArray(array) {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	function pickRandomVariant(variants) {
		return variants[Math.floor(Math.random() * variants.length)];
	}

	onMount(() => {
		// Get all character names and shuffle them
		const characterNames = shuffleArray(Object.keys(charactersByName));
		// Pick 4 unique characters, then select a random variant for each
		selectedCharacters = characterNames.slice(0, 4).map(name => pickRandomVariant(charactersByName[name]));
		
	});

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

	$: cinematicsCanvas && drawCinematics(cinematicsCanvas, '/assets/lovelive_bg.webp');
</script>

<ContentBox cls="event-banner" on:click={() => navigate('/event/gamifiedvivify')}>
	<div class="cinematics">
		<div class="cinematics-canvas">
			<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
		</div>
	</div>

	<div class="event-container">
		{#await import('atropos/svelte').then(m => m.default)}
			<div class="loading-container">
				<div class="cover-bg" />
				{#if selectedCharacters.length === 4}
					<div class="cover-girl cover-girl1" style="background-image: url(/assets/gamifyvivify/{selectedCharacters[0]})" />
					<div class="cover-girl cover-girl2" style="background-image: url(/assets/gamifyvivify/{selectedCharacters[1]})" />
						<div class="cover-logo" />
					<div class="cover-girl cover-girl3" style="background-image: url(/assets/gamifyvivify/{selectedCharacters[2]})" />
					<div class="cover-girl cover-girl4" style="background-image: url(/assets/gamifyvivify/{selectedCharacters[3]})" />
				{/if}
			</div>
		{:then Atropos}
			<svelte:component this={Atropos} rotateXMax={1} rotateYMax={1} highlight="false" shadow="false" rotateTouch="scroll-y">
				<div class="cover-bg {wideScreen ? 'wide-screen' : ''}" data-atropos-offset="0" />
				{#if selectedCharacters.length === 4}
					<div 
						class="cover-girl cover-girl1 {wideScreen ? 'wide-screen' : ''}" 
						style="background-image: url(/assets/gamifyvivify/{selectedCharacters[0]})"
						data-atropos-offset="-2" 
					/>
					<div 
						class="cover-girl cover-girl2 {wideScreen ? 'wide-screen' : ''}" 
						style="background-image: url(/assets/gamifyvivify/{selectedCharacters[1]})"
						data-atropos-offset="-1" 
					/>
					<div class="cover-logo {wideScreen ? 'wide-screen' : ''}" data-atropos-offset="1" />
					<div 
						class="cover-girl cover-girl3 {wideScreen ? 'wide-screen' : ''}" 
						style="background-image: url(/assets/gamifyvivify/{selectedCharacters[2]})"
						data-atropos-offset="2" 
					/>
					<div 
						class="cover-girl cover-girl4 {wideScreen ? 'wide-screen' : ''}" 
						style="background-image: url(/assets/gamifyvivify/{selectedCharacters[3]})"
						data-atropos-offset="3" 
					/>
				{/if}
			</svelte:component>
		{/await}

		<div class="event-text-and-button">
			<div class="event-text-container">
				<span class="event-title"></span>
			</div>
			<div>
				<Button label="EVENT" cls="event-cover-btn" iconFa="fas fa-gamepad" on:click={() => navigate('/event/gamifiedvivify')} />
			</div>
		</div>
	</div>
</ContentBox>

<style>
	:global(.content-box.event-banner) {
		display: flex;
		align-items: center;
		grid-gap: 1em;
		justify-content: center;
		margin: 0.6em;
		padding: 0 !important;
		border-radius: 0.5em;
		cursor: pointer;
		z-index: 0 !important;
	}

	.event-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: end;
		position: relative;
		height: 12em;
		align-items: center;
		overflow: hidden;
		border-radius: 0.5em;
		flex-direction: column;
	}

	.loading-container {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	:global(.content-box.event-banner .atropos) {
		width: 100%;
		position: absolute;
		width: 100%;
		height: 100%;
	}
	:global(.content-box.event-banner .atropos-highlight) {
		display: none;
	}
	:global(.content-box.event-banner .atropos-shadow) {
		display: none;
	}
	.event-title-mobile {
		display: none;
	}
	.event-title-desktop {
		color: #4caf50 !important;
	}
	.event-text-and-button {
		display: flex;
		flex-direction: column;
		z-index: 2;
		align-items: center;
		gap: 0.5em;
	}

	.event-text-container {
		display: flex;
		flex-direction: column;
	}

	.event-image {
		width: 7em;
		height: 7em;
		margin-right: 1em;
		border-radius: 18px;
	}

	:global(.event-cover-btn) {
		box-shadow: 1px 1px black !important;
	}

	.cover-bg {
		position: absolute;
		display: block;
		background: url(/assets/lovelive_bg.webp) !important;
		background-size: cover !important;
		background-position: center !important;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		filter: brightness(0.4);
	}

	/* Character girl styles - showing middle third of 2800x2000 images */
	.cover-girl {
		position: absolute;
		height: 140%;
		aspect-ratio: 1.4;
        background-size: 100%;
		background-position: center center;
		background-repeat: no-repeat;
		top: -20%; /* vertically center 140% height element */
	}

	/* Girl 1 - far left */
	.cover-girl1 {
		left: -1em;
	}

	/* Girl 2 - left of center */
	.cover-girl2 {
		left: calc(50% - 20em);
	}

	/* Girl 3 - right of center */
	.cover-girl3 {
		right: calc(50% - 20em);
	}

	/* Girl 4 - far right */
	.cover-girl4 {
		right: -1em;
	}

	/* Logo in the center */
	.cover-logo {
		position: absolute;
		width: 15em;
		height: 15em;
		left: calc(50% - 7.5em);
		top: calc(50% - 7.5em);
		background-repeat: no-repeat;
		background-position: center center;
		background-size: contain;
		z-index: 5;
		background-image: url(/assets/lovelive_logo.webp);
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
		opacity: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.1) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
		transition: opacity 0.2s ease-in-out;
	}

	:global(.content-box.event-banner:hover .cinematics-canvas) {
		opacity: 1;
	}

	.event-title {
		color: var(--text-color);
		font-size: x-large;
		font-weight: 800;
		text-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
		text-shadow: 1px 1px 11px #000000e8;
	}

	.event-text {
		color: var(--text-color);
		font-size: larger;
		text-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
	}

	/* Mobile styles - small screens */
	@media screen and (max-width: 512px) {
		.cover-girl {
			height: 164%;
        	top: -15%;
		}

		.cover-girl1 {
			left: -11.5em;
		}

		.cover-girl2 {
			display: none;
		}

		.cover-girl3 {
			display: none;
		}

		.cover-girl4 {
			right: -11.5em;
		}

		.cover-logo {
			background-image: url(/assets/gamifiedvivify_logo_mobile.webp);
		}
	}

	/* Medium mobile - show 2 girls */
	@media screen and (min-width: 513px) and (max-width: 760px) {
		.cover-girl {
			height: 144%;
            top: -11%;
		}

		.cover-girl1 {
			left: -4.5em;
		}

		.cover-girl2 {
			display: none;
		}

		.cover-girl3 {
			display: none;
		}

		.cover-girl4 {
			right: -4.5em;
		}
	}

	/* Tablet - show 3-4 girls with adjusted spacing */
	@media screen and (min-width: 761px) and (max-width: 1024px) {
		.cover-girl {
			height: 135%;
			top: -17.5%;
		}

		.cover-girl1 {
			left: -7em;
		}

		.cover-girl2 {
			left: calc(50% + 7em);
		}

		.cover-girl3 {
			right: calc(50% + 7em);
		}

		.cover-girl4 {
			right: -7em;
		}
	}

	/* Desktop - standard layout */
	@media screen and (min-width: 1025px) and (max-width: 1275px) {
		.cover-girl {
			height: 160%;
			top: -10%;
		}

		.cover-girl1 {
			left: -10em;
		}

		.cover-girl2 {
			left: calc(50% - 32em);
		}

		.cover-girl3 {
			right: calc(50% - 32em);
		}

		.cover-girl4 {
			right: -10em;
		}
	}

	/* Wide screen - expanded layout */
	@media screen and (min-width: 1276px) {
		.cover-girl {
			height: 160%;
			top: -10%;
		}

		.cover-girl1 {
			left: -6em;
		}

		.cover-girl2 {
			left: calc(50% - 27em);
		}

		.cover-girl3 {
			right: calc(50% - 27em);
		}

		.cover-girl4 {
			right: -6em;
		}

		.cover-girl2.wide-screen {
			left: calc(50% - 42em);
		}

		.cover-girl3.wide-screen {
			right: calc(50% - 42em);
		}

		.cover-bg.wide-screen {
			background: url(/assets/lovelive_bg.webp) !important;
			background-size: cover !important;
			background-position: center !important;
		}
	}
</style>
