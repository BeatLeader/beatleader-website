<script>
	import {fade, fly, scale} from 'svelte/transition';
	import Button from '../Common/Button.svelte';
	import {navigate} from 'svelte-routing/src/history';
	import Reveal from '../Common/Reveal.svelte';
	import {cubicOut} from 'svelte/easing';
	import {onMount} from 'svelte';
	import {getNotificationsContext} from 'svelte-notifications';
	import Spinner from '../Common/Spinner.svelte';
	import {BL_RENDERER_API_URL, CURRENT_URL} from '../../network/queues/beatleader/api-queue';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';

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
	export let frontCardId;
	export let cardId;
	export let playerId;

	let revealed = false;
	let dominantColor = 'rgb(92, 120, 133)';
	let activeMounted = false;
	let activeReady = false;
	const colors = [
		'rgb(92, 120, 133)',
		'rgb(139, 52, 145)',
		'rgb(200, 112, 207)',
		'rgb(89, 111, 255)',
		'rgb(108, 205, 248)',
		'rgb(39, 39, 39)',
		'rgb(235, 91, 91)',
	];

	let cinematicsCanvas;
	let screenshoting = false;
	let gradientBg2024 = 'background: #4a4a4a';
	let gradientBtmBg2024 = '';

	const {addNotification} = getNotificationsContext();

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
		colorStartIndex = index;
		dominantColor = colors[index];
	}

	function successToast(text) {
		addNotification({
			text: text,
			position: 'top-right',
			type: 'success',
			removeAfter: 2000,
		});
	}

	async function takeScreenshot() {
		try {
			screenshoting = true;
			const blob = await fetch(
				`${BL_RENDERER_API_URL}screenshot/cropped/464x1050/10x10x444x780/replayed-2024-${playerId}-${summaryType}/general/replayed${
					summaryType === 'mapper' ? '/mapper' : ''
				}?color=${colorStartIndex}`,
				{credentials: 'include'}
			).then(response => response.blob());

			const fallback = () => {
				const anchor = document.createElement('a');
				const objURL = URL.createObjectURL(blob);
				anchor.href = objURL;
				anchor.style.display = 'none';
				anchor.download = 'replayed.png';
				document.body.appendChild(anchor);
				anchor.click();
				document.body.removeChild(anchor);
				URL.revokeObjectURL(objURL);
				successToast('Screenshot Saved');
			};

			if (navigator.userAgent.match(/SamsungBrowser/i)) {
				fallback();
			} else {
				navigator.permissions
					.query({name: 'clipboard-write'})
					.then(async result => {
						if (result.state === 'granted' || result.state === 'prompt') {
							window.focus();
							await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
							successToast('Screenshot Copied to Clipboard');
						} else {
							fallback();
						}
					})
					.catch(() => fallback());
			}
		} catch (e) {
			addNotification({
				text: 'Screenshot Failed',
				position: 'top-right',
				type: 'error',
				removeAfter: 4000,
			});
		} finally {
			screenshoting = false;
		}
	}

	function startAutoRevealCount() {
		if (active)
			window.dispatchEvent(
				new CustomEvent('startAutoRevealCount', {
					detail: {
						reveal: reveal,
					},
					bubbles: true,
				})
			);
	}

	function startAutoNextCount() {
		if (active)
			window.dispatchEvent(
				new CustomEvent('startAutoNextCount', {
					detail: {
						next: nextAction,
					},
					bubbles: true,
				})
			);
	}

	function interruptMotion() {
		if (active)
			window.dispatchEvent(
				new CustomEvent('interruptMotion', {
					bubbles: true,
				})
			);
	}

	function startSong() {
		if (active)
			window.dispatchEvent(
				new CustomEvent('startSong', {
					detail: {
						previewLinks: [
							stats?.topMaps[0]?.previewLink,
							stats?.topMaps[1]?.previewLink,
							stats?.topMaps[2]?.previewLink,
							stats?.topMaps[3]?.previewLink,
							stats?.topMaps[4]?.previewLink,
						],
					},
					bubbles: true,
				})
			);
	}

	function stopSong() {
		window.dispatchEvent(new CustomEvent('stopSong', {bubbles: true}));
	}

	function notifyReveal() {
		if (active) window.dispatchEvent(new CustomEvent('cardWasRevealed', {bubbles: true}));
	}

	onMount(() => (activeMounted = true));
	setBackgroundColor(colorStartIndex);

	function getGradientBg2024(cardId) {
		let gradientBg = 'background: ';
		let gradientBtmBg = 'background: linear-gradient(0deg, ';
		if (cardId == '6') {
			gradientBg += 'linear-gradient(332deg, ';
			gradientBg += '#0065FF 0%, ';
			gradientBg += '#b400a3 50%, ';
			gradientBg += '#D91041 100%';

			gradientBtmBg += '#0065FF 0%, ';
			gradientBtmBg += '#0065FF00 15%';
		} else if (cardId == '11') {
			gradientBg += 'linear-gradient(332deg, ';
			gradientBg += '#F84B48 0%, ';
			gradientBg += '#FA9E5D 50%, ';
			gradientBg += '#50A8F7 100%';

			gradientBtmBg += '#F84B48 0%, ';
			gradientBtmBg += '#F84B4800 15%';
		} else {
			gradientBg += 'linear-gradient(332deg, ';
			gradientBg += '#4a4a4a 0%, ';
			gradientBg += '#4a4a4a 15%, ';
			gradientBg += '#4a4a4a 83%, ';
			gradientBg += '#4a4a4a 100%';

			gradientBtmBg += '#4a4a4a 0%, ';
			gradientBtmBg += '#4a4a4a00 15%';
		}
		gradientBg += ')';
		gradientBtmBg += ')';
		gradientBg2024 = gradientBg;
		gradientBtmBg2024 = gradientBtmBg;
		return gradientBg;
	}

	$: revealed ? notifyReveal() : null;
	$: active ? null : stopSong();
	$: activeReady = activeMounted && active;
	$: gradientBg2024 = getGradientBg2024(cardId);
	$: cardsHaveIds = frontCardId != undefined;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="grid-item" class:active transition:fly|global={{y: '25%', duration: 900, easing: cubicOut, opacity: 0}}>
	<div class="card" on:click={handleCardClick} on:mouseenter class:active class:revealed style="--dominantColor: {dominantColor};">
		<div class="cinematics">
			<div class="cinematics-canvas" class:active={active && revealed && false}>
				<!--disabled this year-->
				<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0; left: 0;" />
			</div>
		</div>
		<div class="background-container">
			<div class="background2024" style={gradientBg2024} />
			{#if revealed}
				<div class="background-solid-top" transition:fly={{y: '-100%', duration: 1800, easing: cubicOut, opacity: 0}}></div>
				<div class="background-solid-bottom" transition:fly={{y: '100%', duration: 1800, easing: cubicOut, opacity: 0}}>
					<img src="/assets/replayed2024/summary.webp" alt="" style="position: absolute; width: 35%; right: 10%; bottom: 30%;" />
					<img
						src="/assets/replayed2024/topMapper.webp"
						alt=""
						class="flipped"
						style="position: absolute; width: 30%; left: 14%; bottom: 17%;" />
				</div>
			{/if}
			<div class="btm-background2024" style={gradientBtmBg2024} />
		</div>

		{#if activeReady && !revealed}
			<!--reveal card for summary-->
			<div class="intro-card-container">
				<div class="intro-card" style={gradientBg2024} out:scale|global={{duration: 1000, start: 1.5, opacity: 0}}>
					<div class="intro-card-content">
						<div class="top-block">
							<div class="header" style="align-self: flex-end;">
								<h1 class="title2" in:fly|global={{y: '2em', duration: 700, easing: cubicOut, opacity: 0, delay: 600}}>
									Your 2024 in Beat Saber
								</h1>
								<p class="title2" in:fly|global={{y: '2em', duration: 700, easing: cubicOut, opacity: 0, delay: 1200}}>Summarized</p>
							</div>
						</div>

						<div class="bottom-block">
							<img
								src="/assets/replayed2024/summary.webp"
								alt="Praise mapper"
								style="width: 70%;"
								in:fly|global={{y: '2em', duration: 900, easing: cubicOut, opacity: 0, delay: 1800}}
								on:introend={startAutoRevealCount} />
							<!--set this to the bl chan emoji-->
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
							<h2 transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 500}} on:introend={startSong}>
								Top Maps
							</h2>
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
								<div
									class="stat stat-small"
									transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * (index + 6) + 500}}>
									<div class="stat-stacked-info">
										<h3 class="truncated">{stat.name}</h3>
										<h2 class="other-stats">{stat.value}</h2>
									</div>
								</div>
							{/each}
						</div>
						<div class="data data-small" style="width: 60%">
							{#each stats.extraStats.slice(3, 5) as stat, index}
								<div
									class="stat stat-small"
									transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * (index + 6) + 500}}>
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
							<h2 transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 500}} on:introend={startSong}>
								Top Maps
							</h2>
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
											<h3 class="minutes">{stat.minutes.toFixed(2) + ' min'}</h3>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
					<div class="data-columns">
						<div class="data data-small" style="width: 40%">
							{#each stats.extraStats.slice(0, 3) as stat, index}
								<div
									class="stat stat-small"
									transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * (index + 6) + 500}}>
									<div class="stat-stacked-info">
										<h3 class="truncated">{stat.name}</h3>
										<h2 class="other-stats">{stat.value}</h2>
									</div>
								</div>
							{/each}
						</div>
						<div class="data data-small" style="width: 60%">
							{#each stats.extraStats.slice(3, 5) as stat, index}
								<div
									class="stat stat-small"
									transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * (index + 6) + 500}}>
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
					<div class="share-button" on:click={takeScreenshot}>
						<div>
							{#if screenshoting}
								<Spinner />
							{:else}
								<i class="fa-solid fa-share-from-square" />
							{/if}
							share
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<MetaTags
	title="BeatLeader rePlayed 2024"
	description="View your BeatLeader mapper rePlayed 2024"
	openGraph={{
		title: 'BeatLeader rePlayed 2024',
		description: 'View your BeatLeader mapper rePlayed 2024',
		images: CURRENT_URL + '/assets/logo-small.png',
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: 'BeatLeader rePlayed 2024',
		description: 'View your BeatLeader mapper rePlayed 2024',
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: 'BeatLeader rePlayed 2024',
	}} />

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
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
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
		z-index: 20;

		color: white;
		user-select: none;
		font-size: 3.5vh;

		font-style: normal;
		line-height: normal;
		text-align: center;
		font-family: Arial, Helvetica, sans-serif;
		padding: 0 0.25em;
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

	.title2 {
		font-size: 75%;
		font-weight: 700;
		margin-bottom: 0.5em;
		color: white !important;
	}

	.top-block {
		width: 100%;
		height: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.bottom-block {
		width: 100%;
		height: 50%;
	}

	.intro-card img {
		width: 45%;
		border-radius: 12px;
		margin-bottom: 0.5em;
	}

	.intro-card-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
	}

	.intro-card .header {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin-bottom: 0.7em;
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

	.background2024 {
		position: absolute;
		top: 0;
		left: 0;
		background-color: #4a4a4a;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
	}

	.btm-background2024 {
		position: absolute;
		top: 0;
		left: 0;
		background-color: #ffffff00;
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center;
		width: 100%;
		height: 100%;
		transition: transform 2500ms ease-out;
		z-index: 0;
		pointer-events: none;
	}

	.card.revealed .background {
		transform: scale(1.1);
	}

	.card:hover .background {
		transform: scale(1.115);
	}

	.background-solid-top {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 20%;
		background-color: #ffffff00;
	}

	.background-solid-bottom {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 20%;
		background-color: #ffffff00;
	}

	.content {
		padding: 0.5em;
		text-align: left;
		max-width: 100%;
		height: 100%;
		overflow: hidden;
		text-shadow: 2px 2px 6px rgb(0 0 0 / 50%);
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
		justify-content: flex-end;
		align-items: flex-end;
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

	.share-button {
		display: flex;
		justify-content: flex-end;
		background-color: #3273db;
		padding: 0.125em;
		border-radius: 8px;
		width: min-content;
		cursor: pointer;
	}

	.share-button div {
		display: flex;
		width: max-content;
		margin: 0 0.25em;
		color: white;
		font-size: 1.25vh;
		gap: 0.3em;
		align-items: center;
	}

	.flipped {
		-webkit-transform: scaleX(-1);
		transform: scaleX(-1);
	}
</style>
