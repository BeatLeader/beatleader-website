<script>
	import {navigate} from 'svelte-routing';
	import {onMount} from 'svelte';
	import Button from '../Common/Button.svelte';
	import ContentBox from '../Common/ContentBox.svelte';

	let cinematicsCanvas;
	export let wideScreen = false;

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

	$: cinematicsCanvas && drawCinematics(cinematicsCanvas, '/assets/rocket_league_bg.webp');
</script>

<ContentBox cls="event-banner" on:click={() => navigate('/event/rocketleaguevol2')}>
	<div class="cinematics">
		<div class="cinematics-canvas">
			<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
		</div>
	</div>

	<div class="event-container">
		{#await import('atropos/svelte').then(m => m.default)}
			<div class="loading-container">
				<div class="cover-bg" />
				<div class="cover-girl cover-girl1" />
				<div class="cover-logo" />
				<div class="cover-girl cover-girl3 cover-girl3-off" />
			</div>
		{:then Atropos}
			<div class="cover-bg {wideScreen ? 'wide-screen' : ''}" />
			<div class="cover-girl-flames-container">
				<svelte:component this={Atropos} rotateXMax={1} rotateYMax={1} highlight="false" shadow="false" rotateTouch="scroll-y">
					<div class="cover-girl-container" data-atropos-offset="3">
						<div class="cover-girl cover-girl-flames flames-1 cover-girl3-on {wideScreen ? 'wide-screen' : ''}" />
						<div class="cover-girl cover-girl-flames flames-2 cover-girl3-on {wideScreen ? 'wide-screen' : ''}" />
					</div>
				</svelte:component>
			</div>
			<svelte:component this={Atropos} rotateXMax={1} rotateYMax={1} highlight="false" shadow="false" rotateTouch="scroll-y">
				<div class="cover-girl-container" data-atropos-offset="3">
					<div class="cover-girl cover-girl3 cover-girl3-off {wideScreen ? 'wide-screen' : ''}" />

					<div class="cover-girl cover-girl3 cover-girl3-on {wideScreen ? 'wide-screen' : ''}" />
				</div>

				<div class="cover-logo {wideScreen ? 'wide-screen' : ''}" data-atropos-offset="1" />
				<div class="cover-girl-container" data-atropos-offset="-1">
					<div class="cover-girl cover-girl1 cover-girl1-off {wideScreen ? 'wide-screen' : ''}" />
					<div class="cover-girl cover-girl1 cover-girl1-on {wideScreen ? 'wide-screen' : ''}" />
				</div>
				<!-- <div class="event-text-and-button">
					<div class="event-text-container">
						<span class="event-title"></span>
					</div>
					<div>
						<Button label="JOIN!" cls="event-cover-btn" iconFa="fas fa-futbol" on:click={() => navigate('/event/lovelive')} />
					</div>
				</div> -->
			</svelte:component>
		{/await}
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
	}

	.event-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: end;
		position: relative;
		height: 12em;
		align-items: center;
		overflow: visible;
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
		background: url(/assets/rocket_league_bg.webp) !important;
		background-size: cover !important;
		background-position: center !important;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		filter: brightness(0.4);
		border-radius: 0.5em;
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

	.cover-girl-container {
		display: block;
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.cover-girl-flames-container {
		display: block;
		position: absolute;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	/* Girl 1 - far left */

	/* Girl 2 - left of center */
	.cover-girl2 {
		left: calc(50% - 20em);
	}

	/* Girl 3 - right of center */
	.cover-girl3 {
		right: calc(50% - 20em);
	}

	.cover-girl3-off {
		background-image: url(/assets/rocket_league_car_off.webp);
	}

	.cover-girl3-on {
		background-image: url(/assets/rocket_league_car_on.webp);
		opacity: 0;
		transition: opacity 0.2s ease-in-out;
	}

	.cover-girl1-off {
		background-image: url(/assets/rocket_league_ball_off.webp);
	}
	.cover-girl1-on {
		background-image: url(/assets/rocket_league_ball_on.webp);
		opacity: 0;
		transition: opacity 0.2s ease-in-out;
	}

	.cover-girl-flames {
		background-image: url(/assets/rocket_league_flames_opt.gif);
		opacity: 0;
		transition:
			opacity 1s ease-in,
			opacity 0.1s ease-out;
	}

	:global(.event-container:hover .cover-girl3-on) {
		opacity: 1;
	}

	:global(.event-container:hover .cover-girl1-on) {
		opacity: 1;
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

	/* Medium mobile - show 2 girls */
	@media screen and (max-width: 600px) {
		.cover-girl {
			height: 145%;
			top: -17%;
		}

		.cover-girl1 {
			right: -11.5em;
		}

		.cover-girl3 {
			left: -11.5em;
		}

		.cover-girl2 {
			display: none;
		}

		.cover-girl4 {
			right: -4.5em;
		}

		.event-container {
			overflow: hidden;
			border-radius: 0.5em;
		}

		.cover-logo {
			background-image: url(/assets/lovelive_logo_mobile.webp);
		}
	}


	@media screen and (min-width: 601px) and (max-width: 900px) {
		.cover-girl {
			height: 170%;
			top: -38%;
		}

		.cover-girl1 {
			height: 149%;
			top: -22%;
			right: -12%;
		}

		.cover-girl3 {
			left: -12%;
		}

		.cover-girl-flames {
			height: 80%;
		}

		.cover-girl-flames.flames-1 {
			top: 11%;
			left: -13%;
		}
		.cover-girl-flames.flames-2 {
			top: 32%;
			left: -16%;
		}

		.event-container {
			overflow: hidden;
			border-radius: 0.5em;
		}

		.cover-logo {
			background-image: url(/assets/lovelive_logo_mobile.webp);
		}
	}

	/* Wide screen - expanded layout */
	@media screen and (min-width: 901px) {
		.cover-girl {
			height: 170%;
			top: -38%;
		}

		.cover-girl1 {
			height: 149%;
			top: -22%;
			right: -3%;
		}

		.cover-girl3 {
			left: -4%;
		}

		.cover-girl-flames {
			height: 80%;
		}

		.cover-girl-flames.flames-1 {
			top: 11%;
			left: -5%;
		}
		.cover-girl-flames.flames-2 {
			top: 32%;
			left: -8%;
		}

		.cover-girl3.wide-screen {
			right: calc(50% - 42em);
		}

		.cover-bg.wide-screen {
			background: url(/assets/rocket_league_bg.webp) !important;
			background-size: cover !important;
			background-position: center !important;
		}
	}
</style>
