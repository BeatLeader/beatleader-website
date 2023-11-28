<script>
	import Button from '../Common/Button.svelte';
	import {navigate} from 'svelte-routing/src/history';

	export let title = '';
	export let body = '';
	export let imageUrl = '';
	export let buttons = [];
	export let active = false;

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

	$: drawCinematics(cinematicsCanvas, imageUrl);
	$: if (buttons.length > 3) buttons = buttons.slice(0, 3);
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="grid-item" on:click|preventDefault>
	<div class="card" style="background-image: url({imageUrl});">
		<div class="cinematics">
			<div class="cinematics-canvas" class:active>
				<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
			</div>
		</div>

		<div class="content">
			<h1>{title}</h1>
			<p>{body}</p>

			<div class="buttons">
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
	}

	.card {
		width: 100%;
		height: 100%;
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center;
		background-color: rgb(21, 38, 29) !important;
		position: relative;
		overflow: visible;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		border-radius: 12px;
		cursor: pointer;
	}

	.content {
		padding: 1em;
		padding-left: 1.25em;
		text-align: left;
		max-width: 100%;
		overflow: hidden;
	}

	.content h1 {
	}

	.content p {
		color: white;
	}

	.buttons {
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		row-gap: -0.25em;
		column-gap: 0.5em;
		position: absolute;
		bottom: 1.85em;
		left: 1.25em;
		width: calc(100% - 2.5em);
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
		transform: scale(1.05) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
		transition: filter ease-in-out 300ms;
	}

	.cinematics-canvas.active {
		filter: blur(5em) opacity(0.5) saturate(250%);
	}
</style>
