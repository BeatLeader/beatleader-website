<script>
	import {navigate} from 'svelte-routing';
	import Button from '../Common/Button.svelte';
	import ContentBox from '../Common/ContentBox.svelte';

	let cinematicsCanvas;

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

<ContentBox cls="event-banner" on:click={() => navigate('/event/73')}>
	<div class="cinematics">
		<div class="cinematics-canvas">
			<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
		</div>
	</div>

	<div class="event-container">
		{#await import('atropos/svelte').then(m => m.default)}
			<div class="loading-container">
				<div class="cover-bg" />
				<div class="cover-girls" />
				<div class="cover-hands" />
			</div>
		{:then Atropos}
			<svelte:component this={Atropos} rotateXMax={1} rotateYMax={1} highlight="false" shadow="false" rotateTouch="scroll-y">
				<div class="cover-bg" data-atropos-offset="-2" />
				<div class="cover-girls" data-atropos-offset="1" />
				<div class="cover-hands" data-atropos-offset="3" />
			</svelte:component>
		{/await}

		<div class="event-text-and-button">
			<div class="event-text-container">
				<span class="event-title"></span>
			</div>
			<div>
				<Button label="EVENT" cls="event-cover-btn" iconFa="fas fa-umbrella-beach" on:click={() => navigate('/event/73')} />
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
		background-position-y: 50% !important;
		bottom: -10%;
		left: -10%;
		height: 120%;
		width: 120%;
	}
	.cover-girls {
		position: absolute;
		display: block;
		background: url(/assets/beatheat_girl.webp) !important;
		background-size: cover !important;
		background-position-y: 50% !important;
		height: 23em;
		left: calc(50% - 10em);
		top: calc(50% - 8em);
		width: 23em;
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
			background: url(/assets/beatheat_numbers.webp) !important;
			background-size: cover !important;
			background-position-y: 50% !important;
			width: 27em;
			height: 22em;
			left: calc(50% - 14em);
			top: calc(50% - 7em);
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
</style>
