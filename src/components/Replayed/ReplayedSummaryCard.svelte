<script>
	import {fade, fly, scale} from 'svelte/transition';
	import Button from '../Common/Button.svelte';
	import {navigate} from 'svelte-routing/src/history';
	import Reveal from '../Common/Reveal.svelte';
	import {cubicOut} from 'svelte/easing';
	import {onMount} from 'svelte';

	export let title = 'Your 2023 in Beat Saber';
	export let subText = 'Summarized';
	export let contentSubText = '';
	export let stats = {};
	export let imageUrl = '';
	export let active = false;
	export let clickAction;
	export let nextAction;
	export let summaryType;
	export let colorStartIndex = 0;

	let revealed = false;
	let dominantColor = 'rgb(92, 120, 133)';
	let activeMounted = false;
	let activeReady = false;
	const colors = ['rgb(92, 120, 133)', 'rgb(139, 52, 145)', 'rgb(200, 112, 207)', 'rgb(89, 111, 255)', 'rgb(108, 205, 248)', 'rgb(39, 39, 39)', 'rgb(235, 91, 91)'];

	let cinematicsCanvas;

	function handleCardClick() {
		if (active) {
			reveal();
		} else {
			clickAction();
		}
	}

	function reveal() {
		revealed = true;
		interruptMotion();
	}

	function setBackgroundColor(index) {
		dominantColor = colors[index];
	}

	async function takeScreenshot() {
		//not implemented
	}

	function startAutoRevealCount() {
		if (active) window.dispatchEvent(
			new CustomEvent('startAutoRevealCount', {
				detail: {
					reveal: reveal,
				},
				bubbles: true
			})
		);
  }

	function startAutoNextCount() {
		if (active) window.dispatchEvent(
			new CustomEvent('startAutoNextCount', {
				detail: {
					next: nextAction,
				},
				bubbles: true
			})
		);
	}

	function interruptMotion() {
    	if (active) window.dispatchEvent(
			new CustomEvent('interruptMotion', {
				bubbles: true,
			})
		);
	}

  function startSong() {
		if (active) window.dispatchEvent(
			new CustomEvent('startSong', {
				detail: {
					previewLinks: [
						stats.topMaps[0].previewLink,
						stats.topMaps[1].previewLink,
						stats.topMaps[2].previewLink,
						stats.topMaps[3].previewLink,
						stats.topMaps[4].previewLink,
					],
				},
				bubbles: true,
			})
		);
  }

  function stopSong() {
		window.dispatchEvent(
			new CustomEvent('stopSong', { bubbles: true })
		);
  }

	function notifyReveal() {
		if (active) window.dispatchEvent(
			new CustomEvent('cardWasRevealed', { bubbles: true })
		);
	}


	onMount(() => (activeMounted = true));
	setBackgroundColor(colorStartIndex);

	$: revealed ? notifyReveal() : null;
  $: active? null : stopSong();
	$: activeReady = activeMounted && active;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="grid-item" class:active transition:fly|global={{y: '25%', duration: 900, easing: cubicOut, opacity: 0}}>
	<div class="card" on:click={handleCardClick} on:mouseenter class:active class:revealed style="--dominantColor: {dominantColor};">
		<div class="cinematics">
			<div class="cinematics-canvas" class:active={revealed}>
				<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
			</div>
		</div>
		<div class="background-container">
			<div class="background" />
			{#if revealed}
				<div class="background-solid-top" transition:fly={{y: '-100%', duration: 1800, easing: cubicOut, opacity: 0}} />
				<div class="background-solid-bottom" transition:fly={{y: '100%', duration: 1800, easing: cubicOut, opacity: 0}} />
			{/if}
		</div>

		{#if activeReady && !revealed}
			<div class="intro-card-container">
				<div class="intro-card" out:scale={{duration: 1000, start: 1.5, opacity: 0}}>
					<div class="intro-card-content">
						<div class="header">
							<h1 in:fly={{y: '2em', duration: 1000, easing: cubicOut, opacity: 0}}>{title}</h1>
							<p in:fly={{y: '2em', duration: 800, easing: cubicOut, opacity: 0, delay: 1100}} on:introend={startAutoRevealCount}>{subText}</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if revealed}
			<div class="content">
				<div class="header">
					<h1 in:fly|global={{y: '2em', duration: 700, easing: cubicOut, opacity: 0, delay: 400}}>{title}</h1>
					<p in:fly|global={{y: '2em', duration: 700, easing: cubicOut, opacity: 0, delay: 600}}>{contentSubText}</p>
				</div>

				{#if summaryType === 'player'}
				<div class="data-columns">
					<div class="data" style="width: 40%">
						<h2 transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 500}}>Top Mappers</h2>
						{#each stats.topMappers.slice(0, 5) as stat, index}
							<div
								class="stat"
								transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * index + 700}}>
								<h2 class="stat-number">{index + 1}</h2>
								<div class="stat-stacked-info">
									<h2 class="truncated">{stat.name}</h2>
								</div>
							</div>
						{/each}
					</div>
					<div class="data" style="width: 60%">
						<h2 transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 500}} on:introend={startSong}>Top Maps</h2>
						{#each stats.topMaps.slice(0, 5) as stat, index}
							<div
								class="stat"
								transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * index + 700}}>
								<h2 class="stat-number">{index + 1}</h2>
								<img src={stat.cover} alt={stat.name} />

								<div class="stat-stacked-info">
									<h2 class="truncated">{stat.name}</h2>

									<div class="stat-stacked-subinfo">
										<h3 class="truncated">{stat.mapper}</h3>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
				<div class="data-columns">
					<div class="data data-small" style="width: 40%">
						{#each stats.extraStats.slice(0, 3) as stat, index}
							<div class="stat stat-small" transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * (index + 6) + 500}}>
								<div class="stat-stacked-info">
									<h3 class="truncated">{stat.name}</h3>
									<h2 class="other-stats">{stat.value}</h2>
								</div>
							</div>
						{/each}
					</div>
					<div class="data data-small" style="width: 60%">
						{#each stats.extraStats.slice(3, 5) as stat, index}
							<div class="stat stat-small" transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * (index + 6) + 500}}>
								<div class="stat-stacked-info">
									<h3 class="truncated">{stat.name}</h3>
									<h2 class="other-stats">{stat.value}</h2>
								</div>
							</div>
						{/each}
					</div>

				</div>
				{:else if summaryType === 'mapper'}
				<div class="data-columns">
					<div class="data" style="width: 100%">
						<h2 transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 500}} on:introend={startSong}>Top Maps</h2>
						{#each stats.topMaps.slice(0, 5) as stat, index}
							<div
								class="stat"
								transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * index + 700}}>
								<h2 class="stat-number">{index + 1}</h2>
								<img src={stat.cover} alt={stat.name} />

								<div class="stat-stacked-info">
									<h2 class="truncated">{stat.name}</h2>

									<div class="stat-stacked-subinfo">
										<h3 class="truncated">{stat.mapper}</h3>
										<i class="fa-solid fa-minus" />
										<h3 class="minutes">{stat.minutes.toFixed(2)  + ' min'}</h3>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
				<div class="data-columns">
					<div class="data data-small" style="width: 40%">
						{#each stats.extraStats.slice(0, 3) as stat, index}
							<div class="stat stat-small" transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * (index + 6) + 500}}>
								<div class="stat-stacked-info">
									<h3 class="truncated">{stat.name}</h3>
									<h2 class="other-stats">{stat.value}</h2>
								</div>
							</div>
						{/each}
					</div>
					<div class="data data-small" style="width: 60%">
						{#each stats.extraStats.slice(3, 5) as stat, index}
							<div class="stat stat-small" transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * (index + 6) + 500}}>
								<div class="stat-stacked-info">
									<h3 class="truncated">{stat.name}</h3>
									<h2 class="other-stats">{stat.value}</h2>
								</div>
							</div>
						{/each}
					</div>

				</div>
				{/if}

				<div class="bottom-container" transition:fly={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 400}}>
					<img class="bottom-icon" src="/assets/favicon.svg" />
					<span>beatleader.xyz/replayed</span>
				</div>
				<div class="bottom-container-right" transition:fly={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 400}}>
					<div style="display: flex; justify-content: flex-end;">
						<img class="bottom-icon" src="/assets/favicon.svg" />
						<span on:click={takeScreenshot}>share</span>
					</div>
					<div class="bullets">
						{#each colors as color, index}
							<span class:active={color === dominantColor} style="background-color: {color};" on:click={() => setBackgroundColor(index)} />
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.data-columns {
		display: flex;
		flex-direction: row;
		gap: 0.25em;
		justify-content: space-evenly;
	}

	.data {
		position: relative;
		margin-top: 2em;
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		margin-top: 1em;
		font-size: 2vh;
	}

	.data-small {
		margin-top: 2em;
		font-size: 2vh;
		gap: 0.8em;
	}

	.data h2 {
		font-size: 100%;
		font-weight: 700;
		margin: 0px;
	}

	.stat {
		display: flex;
		overflow: visible;
		flex-direction: row;
		align-items: center;
		gap: 0.5em;
		font-size: 2vh;
		color: white;
		height: 2em;
	}

	.stat-small {
		font-size: 1.75vh;
		gap: 0.35em;
	}

	@media screen and (max-height: 860px) {
		.stat {
			font-size: 1.85vh;
		}

		.data {
			font-size: 1.85vh;
		}

		.data-small {
			margin-top: 1.7em;
			font-size: 1.85vh;
		}

		.stat-small {
			font-size: 1.85vh;
		}
	}

	@media screen and (max-height: 780px) {
		.stat {
			font-size: 1.75vh;
		}

		.data {
			font-size: 1.75vh;
		}

		.data-small {
			margin-top: 1.5em;
			font-size: 1.75vh;
		}

		.stat-small {
			font-size: 1.5vh;
		}
	}

	.stat img {
		height: 1.75em;
		width: 1.75em;
		justify-content: center;
		align-self: center;
		border-radius: 0.5em;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.85);
	}

	.stat h2 {
		font-size: 80%;
		font-weight: 700;
		margin: 0px;
	}

	.stat h3 {
		font-size: 60%;
		font-weight: 600;
		margin: 0px;
	}

	.stat .minutes {
		width: max-content;
		white-space: nowrap;
		padding-right: 0.5em;
		line-height: 1.3em !important;
	}

	.stat .other-stats {
		width: max-content;
		white-space: nowrap;
		padding-right: 0.5em;
		line-height: 1.3em !important;
		font-size: 120%;
		font-weight: 700;
		margin: 0px;
	}

	.truncated {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		box-sizing: border-box;
		line-height: 1.3em !important;
		padding-right: 0.5em;
	}

	.stat-number {
		min-width: 0.6em !important;
	}

	.stat i {
		font-size: 60%;
		color: rgb(190, 190, 190);
		padding-right: 0.5em;
	}

	.stat-stacked-info {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		gap: 0.2em;
	}

	.stat-stacked-subinfo {
		display: flex;
		gap: 0.2em;
		align-items: center;
	}

	.header {
		display: flex;
		flex-direction: column;
		min-height: 17%;
	}

	.grid-item {
		box-sizing: border-box;
		display: flex;
		width: 100%;
		padding: 1.9em;
		position: relative;
		transition: padding 300ms ease;
		-webkit-tap-highlight-color: transparent;
	}

	.grid-item.active {
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
		z-index: 20;
		background-color: var(--dominantColor);

		color: white;
		user-select: none;
		text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.85);
		font-size: 3.5vh;

		font-family: Noto Sans SC;
		font-style: normal;
		line-height: normal;
		text-align: center;
	}

	.intro-card-container {
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		position: absolute;
		overflow: hidden;
		border-radius: 12px;
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

	.intro-card h4 {
		font-size: 50%;
		font-weight: 500;
		color: white !important;
		margin-top: 0.5em;
	}

	.intro-card p {
		margin-top: 0.5em;
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
		background-color: var(--dominantColor);
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
		transform: scale(1.01);
		transition: background-color cubic-bezier(0.215, 0.61, 0.355, 1) 1800ms;
		filter: brightness(85%);
	}

	.card.revealed .background {
		transform: scale(1.1);
	}

	.card:hover .background {
		transform: scale(1.115);
	}

	.background-solid-top {
		position: absolute;
		top: -5%;
		left: -10%;
		width: 120%;
		height: 20%;
		background-color: var(--dominantColor);
		transform: rotate(-10deg);
		border-radius: 12px;
		transition: background-color cubic-bezier(0.215, 0.61, 0.355, 1) 1800ms;
		box-shadow: 2px 2px 1.5em rgba(0, 0, 0, 0.45);
	}

	.background-solid-bottom {
		position: absolute;
		bottom: -5%;
		left: -10%;
		width: 120%;
		height: 20%;
		background-color: var(--dominantColor);
		transform: rotate(-10deg);
		border-radius: 12px;
		transition: background-color cubic-bezier(0.215, 0.61, 0.355, 1) 1800ms;
		box-shadow: -2px -2px 1.5em rgba(0, 0, 0, 0.45)
	}

	.content {
		padding: 0.5em;
		text-align: left;
		max-width: 100%;
		height: 100%;
		overflow: hidden;
		text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.85);
		border-radius: 12px;
		position: relative;
		font-size: 3.5vh;
		cursor: default;
	}

	@media screen and (max-height: 780px) {
		.content {
      padding: 0.3em;
    }
	}

	.content h1 {
		font-size: 80%;
		font-weight: 700;
		user-select: none;
	}

	.content p {
		font-size: 50%;
		font-weight: 400;
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
		bottom: 2.5%;
		left: 1.25em;
		width: calc(100% - 2.5em);
		pointer-events: none;
		text-shadow: none;
		font-size: 40%;
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
		transition: cubic-bezier(0.215, 0.61, 0.355, 1) 1800ms;
		background-color: var(--dominantColor);
	}

	.cinematics-canvas.active {
		transform: scale(1.05) translateZ(0);
		filter: blur(5em) opacity(0.5) saturate(250%);
	}

	.card:hover .cinematics-canvas.active {
		transform: scale(1.125);
		filter: blur(5em) opacity(0.5) saturate(250%) brightness(120%);
	}

	.bottom-container {
		display: flex;
		position: absolute;
		bottom: 0.5em;
		left: 0.5em;
	}

	.bottom-container-right {
		display: flex;
		flex-direction: column;
		position: absolute;
		bottom: 0.5em;
		right: 0.5em;
		gap: 0.25em;
	}

	.bottom-container span {
		color: white;
		font-size: 1.25vh;
	}

	.bottom-container-right span {
		color: white;
		font-size: 1.25vh;
	}

	.bottom-icon {
		width: 2vh;
	}

	.bullets {
		display: flex;
		text-align: end;
	}

	.bullets > span {
		display: inline-block;
		width: 1em;
		height: 1em;
		border-radius: 50%;
		cursor: pointer;
		margin: 0 0.25em;
	}

	@media screen and (max-height: 780px) {
		.bottom-container {
      display: flex;
      position: absolute;
      bottom: 0.3em;
      left: 0.3em;
    }

		.bottom-container-right {
			bottom: 0.3em;
			right: 0.3em;
			gap: 0.25em;
		}
	}
</style>
