<script>
	import {fade} from 'svelte/transition';
	import Button from '../Common/Button.svelte';
	import {navigate} from 'svelte-routing/src/history';
	import Reveal from '../Common/Reveal.svelte';

	export let title = '';
	export let subText = '';
	export let stats;
	export let imageUrl = '';
	export let targetUrl;
	export let buttons = [];
	export let active = false;
	export let clickAction;
	export let nextAction;
	export let introBgColor = 'rgba(201, 52, 157, 1)';

	let mainStat = stats?.entries[0];
	let revealed = false;

	buttons.push({
		text: 'Next',
		type: 'primary',
		function: nextAction,
	});

	let cinematicsCanvas;

	function handleCardClick() {
		if (active) {
			reveal();
		} else {
			clickAction();
		}
	}

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

	function reveal() {
		revealed = true;
	}

	$: drawCinematics(cinematicsCanvas, imageUrl);
	$: if (buttons.length > 3) buttons = buttons.slice(0, 3);
	$: {
		stats?.entries.sort((a, b) => a.index - b.index);
		mainStat = stats?.entries[0];
		imageUrl = mainStat?.imageUrl;
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="grid-item" class:active>
	<div class="card" on:click={handleCardClick} on:mouseenter class:active>
		<div class="cinematics">
			<div class="cinematics-canvas" class:active={revealed}>
				<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
			</div>
		</div>
		<div class="background-container">
			<div class="background" style="background-image: url({imageUrl});" />
		</div>

		<div class="intro-card" style="background-color:{introBgColor};" class:inactive={revealed}>
			<div class="intro-card-content">
				<div class="header">
					<h1>{title}</h1>
					<p>{subText}</p>
				</div>

				{#if stats?.type === 'mapList'}
					<img src={mainStat.imageUrl} alt={mainStat.title} />
					<h2>{mainStat.title}</h2>
					<h3>{mainStat.mapper}</h3>
				{/if}
			</div>
		</div>

		<div class="content">
			<div class="buttons" class:active>
				{#each buttons as button}
					<Button
						label={button.text}
						url={button.url}
						type={button.type}
						on:click={() => {
							if (button.function) button.function();
							if (button.url) navigate(button.url);
						}} />
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.grid-item {
		box-sizing: border-box;
		display: flex;
		width: 100%;
		padding: 0.5em;
		position: relative;
		transition: padding 300ms ease;
	}

	.grid-item.active {
		padding: 0.5em;
	}

	.intro-card {
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		position: absolute;
		overflow: hidden;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
		border-radius: 12px;
		padding: 1em;
		backdrop-filter: blur(1em);
		z-index: 20;

		color: white;
		user-select: none;
		text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.85);
		font-size: 3.5vh;

		font-family: Noto Sans SC;
		font-style: normal;
		line-height: normal;
		text-align: center;

		transition: transform 300ms ease-in-out, opacity 300ms ease-in-out, backdrop-filter 300ms ease-in-out;
	}

	.intro-card::before {
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		position: absolute;
		overflow: hidden;
		border-radius: 12px;
	}

	.intro-card.inactive {
		pointer-events: none;
		opacity: 0;
		backdrop-filter: blur(1em) opacity(0);
		transform: translateX(-100%);
	}

	.intro-card h1 {
		font-size: 100%;
		font-weight: 700;
	}

	.intro-card h2 {
		font-size: 80%;
		font-weight: 700;
	}

	.intro-card h3 {
		font-size: 60%;
		font-weight: 600;
	}

	.intro-card p {
		font-size: 50%;
		font-weight: 400;
	}

	.intro-card img {
		width: 50%;
		justify-content: center;
		align-self: center;
		border-radius: 12px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.85);
		margin-bottom: 0.5em;
	}

	.intro-card-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.intro-card .header {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin-bottom: 1em;
	}

	.card {
		width: 100%;
		height: 100%;
		background-color: rgb(32, 32, 32) !important;
		position: relative;
		overflow: visible;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		border-radius: 12px;
		cursor: pointer;
	}

	.background-container {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		overflow: hidden;
		border-radius: 12px;
	}

	.background {
		position: absolute;
		top: 0;
		left: 0;
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center;
		width: 100%;
		height: 100%;
		transition: transform 600ms ease;
		z-index: 0;
		pointer-events: none;
		filter: blur(0.25em);
	}

	.background::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(0.25em);
	}

	.card.active .background {
		transform: scale(1);
	}

	.card:hover .background {
		transform: scale(1.025);
	}
	.card:hover .cinematics-canvas.active {
		transform: scale(1.125);
		filter: blur(5em) opacity(0.5) saturate(250%) brightness(120%);
	}

	.content {
		padding: 1em;
		padding-left: 1.25em;
		text-align: left;
		max-width: 100%;
		height: 100%;
		overflow: hidden;
		text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.85);
		border-radius: 12px;
		position: relative;
	}

	.content h1 {
		user-select: none;
	}

	.content p {
		color: white;
		user-select: none;
	}

	.buttons {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap-reverse;
		justify-content: center;
		overflow: hidden;
		row-gap: -0.25em;
		column-gap: 0.5em;
		position: absolute;
		bottom: 1.6em;
		left: 1.25em;
		width: calc(100% - 2.5em);
		pointer-events: none;
		text-shadow: none;
	}

	.buttons.active {
		pointer-events: all;
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
		filter: blur(5em) opacity(0) saturate(250%);
		left: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(0) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
		transition: ease-in-out 300ms;
	}

	.cinematics-canvas.active {
		transform: scale(1.05) translateZ(0);
		filter: blur(5em) opacity(0.5) saturate(250%);
	}
</style>
