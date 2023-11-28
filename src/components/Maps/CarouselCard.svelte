<script>
	import Button from '../Common/Button.svelte';
	import {navigate} from 'svelte-routing/src/history';

	export let title = '';
	export let body = '';
	export let imageUrl = '';
	export let buttons = [];
	export let active = false;
	export let clickAction;

	let cinematicsCanvas;

	function handleCardClick() {
		clickAction();
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

	$: drawCinematics(cinematicsCanvas, imageUrl);
	$: if (buttons.length > 3) buttons = buttons.slice(0, 3);
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="grid-item">
	<div class="card" on:click={handleCardClick} on:mouseenter class:active>
		<div class="cinematics">
			<div class="cinematics-canvas" class:active>
				<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
			</div>
		</div>
		<div class="background-container">
			<div class="background" style="background-image: url({imageUrl});" />
		</div>

		<div class="content">
			<h1>{title}</h1>
			<p>{body}</p>

			<div class="buttons" class:active>
				{#each buttons as button}
					<Button
						label={button.text}
						url={button.url}
						type={button.type}
						on:click={() => {
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
		padding: 1em;
		position: relative;
	}

	.card {
		width: 100%;
		height: 100%;
		background-color: rgb(21, 38, 29) !important;
		position: relative;
		overflow: visible;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		border-radius: 12px;
		cursor: pointer;
		transition: transform 300ms ease;
	}

	.card.active {
		transform: scale(1.1);
		z-index: 2;
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
		z-index: 1;
	}

	.card:hover .background {
		transform: scale(1.1);
	}
	.card:hover .cinematics-canvas {
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
		z-index: 1;
	}

	.content h1 {
	}

	.content p {
		color: white;
	}

	.buttons {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap-reverse;
		justify-content: flex-end;
		overflow: hidden;
		row-gap: -0.25em;
		column-gap: 0.5em;
		position: absolute;
		bottom: 1.85em;
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
		z-index: 0;
	}

	.cinematics-canvas {
		filter: blur(5em) opacity(0) saturate(250%);
		left: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.05) translateZ(0);
		width: 100%;
		height: 100%;
		transition: ease-in-out 300ms;
	}

	.cinematics-canvas.active {
		filter: blur(5em) opacity(0.5) saturate(250%);
	}
</style>
