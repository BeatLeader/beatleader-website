<script>
	import {navigate} from 'svelte-routing';
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

	$: cinematicsCanvas && drawCinematics(cinematicsCanvas, '/assets/beatheat_bg.webp');
</script>

<ContentBox cls="event-banner" on:click={() => navigate('/event/79')}>
	<div class="cinematics">
		<div class="cinematics-canvas">
			<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
		</div>
	</div>

	<div class="event-container">
		{#await import('atropos/svelte').then(m => m.default)}
			<div class="loading-container">
				<div class="cover-bg" />
				<div class="cover-mg" />
				<div class="cover-girls" />
				<div class="cover-hands" />
			</div>
		{:then Atropos}
			<svelte:component this={Atropos} rotateXMax={1} rotateYMax={1} highlight="false" shadow="false" rotateTouch="scroll-y">
				<div class="cover-bg {wideScreen ? 'wide-screen' : ''}" data-atropos-offset="-2" />
				<div class="cover-mg {wideScreen ? 'wide-screen' : ''}" data-atropos-offset="-1" />
				<div class="cover-girls {wideScreen ? 'wide-screen' : ''}" data-atropos-offset="1" />
				<div class="cover-hands {wideScreen ? 'wide-screen' : ''}" data-atropos-offset="3" />
			</svelte:component>
		{/await}

		<div class="event-text-and-button">
			<div class="event-text-container">
				<span class="event-title"></span>
			</div>
			<div>
				<Button label="EVENT" cls="event-cover-btn" iconFa="fas fa-rocket" on:click={() => navigate('/event/79')} />
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
		margin-right: 2em;
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
		background: url(/assets/beatheat_bg.webp) !important;
		background-size: cover !important;
		bottom: -182%;
		left: -10%;
		width: 120%;
		aspect-ratio: 1;
	}
	.cover-mg {
		position: absolute;
		display: block;
		background: url(/assets/beatheat_mg.webp) !important;
		background-size: cover !important;
		width: 120%;
		left: -10%;
		aspect-ratio: 1;
		bottom: -22em;
	}
	.cover-girls {
		position: absolute;
		display: block;
		background: url(/assets/beatheat_girl.webp) !important;
		background-size: cover !important;
		background-position-y: 50% !important;
		bottom: -16em;
		left: -2em;
		width: 78%;
		aspect-ratio: 1;
	}

	.cover-hands {
		position: absolute;
		display: block;
		background: url(/assets/beatheat_numbers_big.webp) !important;
		background-size: cover !important;
		background-position-y: 50% !important;
		width: 43em;
		height: 22em;
		left: calc(50% - 23em);
		top: calc(50% - 8.5em);
		mix-blend-mode: plus-lighter;
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
	@media screen and (max-width: 512px) {
		.cover-hands {
			background-position-y: 0.2em !important;
		}
	}

	@media screen and (max-width: 760px) {
		.cover-hands {
			position: absolute;
			display: block;
			background-position-y: 50% !important;
			width: 27em;
			left: calc(50% - 14em);
			top: calc(50% - 10em);
		}

		.cover-bg {
			bottom: -7.2em;
		}

		.cover-mg {
			bottom: -8em;
		}

		.cover-girls {
			bottom: -6em;
			width: 100%;
			left: 0;
		}

		.event-title-desktop {
			display: none;
		}
		.event-title-mobile {
			display: block;
			color: #4caf50 !important;
		}
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}

		.event-text-container {
			margin-bottom: 1em;
			align-items: center;
			text-align: center;
		}

		.event-image {
			width: 10em;
			height: 10em;
			margin-right: 1em;
		}
	}

	@media screen and (min-width: 1276px) {
		.cover-bg.wide-screen {
			position: absolute;
			display: block;
			background: url(/assets/beatheat_bg.webp) !important;
			background-size: cover !important;
			bottom: -40em;
			left: -5%;
			width: 110%;
			aspect-ratio: 1;
		}

		.cover-mg.wide-screen {
			position: absolute;
			display: block;
			background: url(/assets/beatheat_mg.webp) !important;
			background-size: cover !important;
			width: 110%;
			left: -5%;
			aspect-ratio: 1;
			bottom: -42em;
		}

		.cover-girls.wide-screen {
			position: absolute;
			display: block;
			background: url(/assets/beatheat_girl.webp) !important;
			background-size: cover !important;
			background-position-y: 50% !important;
			bottom: -16em;
			left: -2em;
			width: 50%;
			aspect-ratio: 1;
		}

		.cover-hands.wide-screen {
			position: absolute;
			display: block;
			background: url(/assets/beatheat_numbers_big.webp) !important;
			background-size: cover !important;
			background-position-y: 50% !important;
			width: 43em;
			height: 22em;
			left: calc(50% - 18em);
			top: calc(50% - 6.5em);
			mix-blend-mode: plus-lighter;
		}
	}
</style>
