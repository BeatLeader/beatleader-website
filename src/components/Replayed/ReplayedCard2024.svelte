<script>
	import {fade, fly, scale} from 'svelte/transition';
	import Button from '../Common/Button.svelte';
	import {navigate} from 'svelte-routing/src/history';
	import Reveal from '../Common/Reveal.svelte';
	import {cubicOut} from 'svelte/easing';
	import {onMount} from 'svelte';
	import Flag from '../Common/Flag.svelte';
	import createPlayerService from '../../services/beatleader/player';
	import {MetaTags} from 'svelte-meta-tags';
	import {CURRENT_URL} from '../../network/queues/beatleader/api-queue';
	import ssrConfig from '../../ssr-config';

	export let title = '';
	export let subText = '';
	export let contentSubText = '';
	export let stats;
	export let imageUrl = '';
	export let buttons = [];
	export let active = false;
	export let clickAction;
	export let nextAction;
	export let forcedColor = null;
	export let replayedType;
	export let frontCardId;
	export let cardId;
	export let frontTitle = '';
	export let frontStatTitle = '';

	let mainStat = stats?.entries[0];
	let revealed = false;
	let dominantColor = 'rgb(92, 120, 133)';
	let activeMounted = false;
	let activeReady = false;
	let countries = [];
	let gradientBg2024 = 'background: #4a4a4a';
	let frontStat = '';
	let statSubtext = '';

	buttons.push({
		text: 'Replay',
		type: 'default',
		function: resetReveal,
	});
	buttons.push({
		text: 'Next',
		type: 'primary',
		function: nextAction,
	});

	let cinematicsCanvas;

	const playerService = createPlayerService();

	async function retrievePlayerCountry(playerId) {
		if (playerId === undefined) return;
		let user = await playerService.fetchPlayerOrGetFromCache(playerId);
		countries.push({
			country: user.playerInfo.countries[0].country,
			playerId: playerId,
		});
	}

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

	function resetReveal() {
		revealed = false;
		interruptMotion();
		stopSong();
	}

	function reveal() {
		revealed = true;
		interruptMotion();
	}

	function retrieveBackgroundColor(img) {
		var context = document.createElement('canvas').getContext('2d');
		if (typeof img == 'string') {
			var src = cleanLinkOfCors(img);
			img = new Image();
			img.crossOrigin = 'anonymous';
			img.src = src;
		}
		img.onload = () => {
			context.imageSmoothingEnabled = true;
			context.drawImage(img, 0, 0, 1, 1);
			const imageData = context.getImageData(0, 0, 1, 1).data.slice(0, 3);

			if (imageData[0] > 229.5 && imageData[1] > 229.5 && imageData[2] > 229.5) {
				dominantColor = `rgb(${imageData[0] * 0.8},${imageData[1] * 0.8},${imageData[2] * 0.8})`;
			} else {
				dominantColor = `rgb(${imageData[0]},${imageData[1]},${imageData[2]})`;
			}
		};
	}

	function cleanLinkOfCors(link) {
		link = link.replace('https://cdn.assets.beatleader.xyz/', '/cors/cdn-assets-bl/');
		link = link.replace('https://cdn.beatsaver.com/', '/cors/cdnbeatsaver/');
		return link;
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
						previewLinks: [stats?.entries[0]?.previewLink],
					},
					bubbles: true,
				})
			);
	}

	function stopSong() {
		window.dispatchEvent(new CustomEvent('stopSong', {bubbles: true}));
	}

	function notifyReveal() {
		if (active)
			window.dispatchEvent(
				new CustomEvent('cardWasRevealed', {
					detail: {
						previewLinks: [
							stats?.entries[1]?.previewLink,
							stats?.entries[2]?.previewLink,
							stats?.entries[3]?.previewLink,
							stats?.entries[4]?.previewLink,
						],
					},
					bubbles: true,
				})
			);
	}

	onMount(() => (activeMounted = true));

	function getGradientBg2024(cardId) {
		let gradientBg = 'background: ';
		if (cardId == '0') {
			gradientBg += 'linear-gradient(332deg, ';
			gradientBg += '#D400F1 0%, ';
			gradientBg += '#D400F1 15%, ';
			gradientBg += '#0765C5 83%, ';
			gradientBg += '#0765C5 100%';
		} else if (cardId == '1') {
			gradientBg += 'linear-gradient(33deg, ';
			gradientBg += '#D62B54 0%, ';
			gradientBg += '#E6B749 100%';
		} else if (cardId == '2') {
			gradientBg += 'linear-gradient(332deg, ';
			gradientBg += '#9700F1 0%, ';
			gradientBg += '#9700F1 15%, ';
			gradientBg += '#E6B749 83%, ';
			gradientBg += '#E6B749 100%';
		} else if (cardId == '3') {
			gradientBg += 'linear-gradient(332deg, ';
			gradientBg += '#9700F1 0%, ';
			gradientBg += '#9700F1 15%, ';
			gradientBg += '#D62B54 83%, ';
			gradientBg += '#D62B54 100%';
		} else if (cardId == '4') {
			gradientBg += 'linear-gradient(332deg, ';
			gradientBg += '#36C790 0%, ';
			gradientBg += '#36C790 15%, ';
			gradientBg += '#3374DE 83%, ';
			gradientBg += '#3374DE 100%';
		} else if (cardId == '5') {
			gradientBg += 'linear-gradient(0deg, ';
			gradientBg += '#889DC1 0%, ';
			gradientBg += '#889DC1 15%, ';
			gradientBg += '#3374DF 83%, ';
			gradientBg += '#3374DF 100%';
		} else if (cardId == '6') {
			gradientBg += 'linear-gradient(332deg, ';
			gradientBg += '#0065FF 0%, ';
			gradientBg += '#b400a3 50%, ';
			gradientBg += '#D91041 100%';
		} else {
			gradientBg += 'linear-gradient(332deg, ';
			gradientBg += '#4a4a4a 0%, ';
			gradientBg += '#4a4a4a 15%, ';
			gradientBg += '#4a4a4a 83%, ';
			gradientBg += '#4a4a4a 100%';
		}
		gradientBg += ')';
		return gradientBg;
	}

	function getFrontStat(stats) {
		if (stats?.type === 'mapList') {
			return stats?.entries[0]?.count + ' times';
		} else if (stats?.type === 'playerList') {
			return stats?.entries[0]?.minutesPlayed.toFixed(0);
		} else if (stats?.type === 'statList') {
			return stats?.entries[0]?.value;
		}
	}

	function getStatSubtext(stats) {
		if (cardId == '0') {
			return 'Top ' + stats?.entries[0]?.percentPlayers.toFixed(2) + '% of players';
		} else {
			return '';
		}
	}

	$: revealed ? notifyReveal() : null;
	$: active ? null : stopSong();
	$: activeReady = activeMounted && active;
	$: drawCinematics(cinematicsCanvas, imageUrl);
	$: if (buttons?.length > 3) buttons = buttons.slice(0, 3);
	$: {
		mainStat = stats?.entries[0];
		switch (stats.type) {
			case 'mapList':
				imageUrl = mainStat.cover;
				break;
			case 'playerList':
				imageUrl = mainStat.avatar;
				break;
			default:
				imageUrl = imageUrl;
				break;
		}
		forcedColor ? (dominantColor = forcedColor) : retrieveBackgroundColor(imageUrl);

		if (stats?.type === 'playerList') {
			stats.entries.forEach(entry => {
				retrievePlayerCountry(entry?.beatLeaderId);
			});
		}
	}
	$: gradientBg2024 = getGradientBg2024(cardId);
	$: cardsHaveIds = frontCardId != undefined;
	$: frontStat = getFrontStat(stats);
	$: statSubtext = getStatSubtext(stats);
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="grid-item" class:active transition:fly|global={{y: '25%', duration: 900, easing: cubicOut, opacity: 0}}>
	<div class="card" on:click={handleCardClick} on:mouseenter class:active class:revealed style="--dominantColor: {dominantColor};">
		<div class="cinematics">
			<div class="cinematics-canvas" class:active={active && revealed}>
				<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0; left: 0;" />
			</div>
		</div>
		<div class="background-container">
			<div class="background2024" style={gradientBg2024} />
			{#if revealed}
				<!--<div class="background-solid-top" transition:fly={{y: '-100%', duration: 1800, easing: cubicOut, opacity: 0}} /> these can be reused to place the extra art bits-->
				<!--<div class="background-solid-bottom" transition:fly={{y: '100%', duration: 1800, easing: cubicOut, opacity: 0}} /> these can be reused to place the extra art bits-->
			{/if}
		</div>

		{#if activeReady && !revealed}
			{#if frontCardId == '1'}
				<!--general reveal card-->
				<div class="intro-card-container">
					<div class="intro-card" style={gradientBg2024} out:scale={{duration: 1000, start: 1.5, opacity: 0}}>
						<div class="intro-card-content">
							<div class="top-block">
								{#if stats?.type === 'mapList'}
									<img
										src={mainStat.cover}
										alt={mainStat.name}
										in:fly|global={{y: '2em', duration: 900, easing: cubicOut, opacity: 0, delay: 1750}}
										on:introend={startSong} />
								{:else if stats?.type === 'playerList'}
									<img
										src={mainStat.avatar}
										alt={mainStat.name}
										in:fly|global={{y: '2em', duration: 900, easing: cubicOut, opacity: 0, delay: 1750}} />
								{/if}
							</div>

							<div class="bottom-block">
								<div class="header">
									<h1 class="title" in:fly={{y: '2em', duration: 700, easing: cubicOut, opacity: 0}}>{frontTitle}</h1>
									<p class="name" in:fly={{y: '2em', duration: 700, easing: cubicOut, opacity: 0, delay: 400}}>{mainStat.name}</p>
									<p class="subtext" in:fly={{y: '2em', duration: 700, easing: cubicOut, opacity: 0, delay: 400}}>{subText}</p>
								</div>

								<div class="stat-body">
									<h2 class="stat-title" in:fly={{y: '2em', duration: 700, easing: cubicOut, opacity: 0, delay: 600}}>{frontStatTitle}</h2>
									<p class="stat-number" in:fly={{y: '2em', duration: 700, easing: cubicOut, opacity: 0, delay: 400}}>{frontStat}</p>
									<p
										class="stat-subtext"
										in:fly={{y: '2em', duration: 700, easing: cubicOut, opacity: 0, delay: 400}}
										on:introend={startAutoRevealCount}>
										{statSubtext}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/if}

		{#if revealed}
			<div class="content">
				<div class={cardsHaveIds ? 'header2024' : 'header'}>
					<h1 in:fly|global={{y: '2em', duration: 700, easing: cubicOut, opacity: 0, delay: 400}}>{title}</h1>
					<p in:fly|global={{y: '2em', duration: 700, easing: cubicOut, opacity: 0, delay: 600}}>{contentSubText}</p>
				</div>

				<div class="data">
					{#if stats?.type === 'mapList'}
						{#each stats?.entries.slice(0, 5) as stat, index}
							<div class="stat" transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * index + 500}}>
								<h2 class="stat-number">{index + 1}</h2>
								<img src={stat.cover} alt={stat.name} />

								<div class="stat-stacked-info">
									<h2 class="truncated">{stat.name}</h2>

									<div class="stat-stacked-subinfo">
										<h3 class="truncated">{stat.mapper}</h3>
										<i class="fa-solid fa-minus" />
										<h3 class="minutes">{stat?.minutes ? stat.minutes.toFixed(2) + ' min' : stat.count + ' times'}</h3>
									</div>
								</div>
							</div>
						{/each}
					{:else if stats?.type === 'playerList'}
						{#each stats?.entries.slice(0, 5) as stat, index}
							<div class="stat" transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * index + 500}}>
								<h2 class="stat-number">{index + 1}</h2>
								<img src={stat.avatar} alt={stat.name} />
								<div class="stat-stacked-info">
									<div style="display: flex;">
										<h2 class="truncated">{stat.name}</h2>
										{#if title
											.toLowerCase()
											.includes('play') && countries.some(country => country.playerId === stat.beatLeaderId) && countries
												.find(country => country.playerId === stat.beatLeaderId)
												.country.toLowerCase() !== 'not set'}
											<img
												class="flag"
												alt={`${countries.find(country => country.playerId === stat.beatLeaderId).country.toLowerCase()} flag`}
												src={`/assets/flags/${countries.find(country => country.playerId === stat.beatLeaderId).country.toLowerCase()}.png`}
												loading="lazy" />
										{/if}
									</div>
									<h3 class="minutes">
										{stat.minutesPlayed.toFixed(2)} min{stat?.percentPlayers
											? ', ' + 'top ' + stat.percentPlayers.toFixed(2) + '% of players'
											: ''}
									</h3>
								</div>
							</div>
						{/each}
					{:else if stats?.type === 'statList'}
						<div class="data-columns">
							<div class="data data-small" style={stats.entries.slice(5, 10).length ? 'width: 40%' : 'width: 100%'}>
								{#each stats.entries.slice(0, 5) as stat, index}
									<div
										class="stat"
										transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * index + 500}}>
										<div class="stat-stacked-info">
											<h2 class="truncated">{stat.name}</h2>
											<h3 class="minutes">{stat.value}</h3>
										</div>
									</div>
								{/each}
							</div>
							{#if stats.entries.slice(5, 10).length}
								<div class="data data-small" style="width: 60%">
									{#each stats.entries.slice(5, 10) as stat, index}
										<div
											class="stat"
											transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 200 * index + 500}}>
											<div class="stat-stacked-info">
												<h2 class="truncated">{stat.name}</h2>
												<h3 class="minutes">{stat.value}</h3>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<div
					class="buttons"
					class:active
					transition:fly={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 2500}}
					on:introend={startAutoNextCount}>
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

				<div class="bottom-container" transition:fly={{y: '100%', duration: 900, easing: cubicOut, opacity: 0, delay: 400}}>
					<img class="bottom-icon" src="/assets/favicon.svg" />
					<span>beatleader.xyz/replayed</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<MetaTags
	title="BeatLeader rePlayed 2023"
	description="View your BeatLeader player rePlayed 2023"
	openGraph={{
		title: 'BeatLeader rePlayed 2023',
		description: 'View your BeatLeader player rePlayed 2023',
		images: CURRENT_URL + '/assets/logo-small.png',
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: 'BeatLeader rePlayed 2023',
		description: 'View your BeatLeader player rePlayed 2023',
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: 'BeatLeader rePlayed 2023',
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
	}

	.data-small {
		font-size: 1.75vh;
		gap: 1.5em;
	}

	.stat {
		display: flex;
		overflow: visible;
		flex-direction: row;
		align-items: center;
		gap: 0.5em;
		font-size: 2.5vh;
		color: white;
		height: 2em;
	}

	.stat-small {
		font-size: 1.75vh;
		gap: 0.35em;
	}

	@media screen and (max-height: 780px) {
		.stat {
			font-size: 2vh;
		}

		.data-small {
			font-size: 1.5vh;
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
		min-height: 20%;
	}

	.header2024 {
		display: flex;
		flex-direction: column;
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

	.title {
		font-size: 50%;
		font-weight: 600;
		margin-bottom: 0.5em;
		color: white !important;
	}

	.name {
		font-size: 100%;
		font-weight: 700;
	}

	.subtext {
		font-size: 45%;
		font-weight: 400;
		margin-top: 0.5em;
	}

	.stat-title {
		font-size: 45%;
		font-weight: 400;
	}

	.stat-number {
		font-size: 90%;
		font-weight: 700;
	}

	.stat-subtext {
		font-size: 40%;
		font-weight: 400;
		margin-top: 1.5em;
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
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center;
		width: 100%;
		height: 100%;
		transition: transform 2500ms ease-out;
		z-index: 0;
		pointer-events: none;
		filter: brightness(85%) blur(0.6vh);
		transform: scale(1.01);
	}

	.background2024 {
		position: absolute;
		top: 0;
		left: 0;
		background-color: #4a4a4a;
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
		top: -5%;
		left: -10%;
		width: 120%;
		height: 20%;
		background-color: var(--dominantColor);
		opacity: 0.95;
		transform: rotate(-10deg);
		border-radius: 12px;
		box-shadow: 2px 2px 1.5em rgba(0, 0, 0, 0.45);
	}

	.background-solid-bottom {
		position: absolute;
		bottom: -5%;
		left: -10%;
		width: 120%;
		height: 20%;
		background-color: var(--dominantColor);
		opacity: 0.95;
		transform: rotate(-10deg);
		border-radius: 12px;
		box-shadow: -2px -2px 1.5em rgba(0, 0, 0, 0.45);
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

	.bottom-container span {
		color: white;
		font-size: 1.25vh;
	}

	.bottom-icon {
		width: 2vh;
	}

	@media screen and (max-height: 780px) {
		.bottom-container {
			display: flex;
			position: absolute;
			bottom: 0.3em;
			left: 0.3em;
		}
	}

	.flag {
		width: 1.2em !important;
		height: 50% !important;
		vertical-align: middle;
		align-self: center !important;
		justify-content: center !important;
		border-radius: 0px !important;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.85) !important;
	}
</style>
