<script>
	import {onMount, onDestroy} from 'svelte';
	import {navigate} from 'svelte-routing';
	import Button from '../Common/Button.svelte';
	import ContentBox from '../Common/ContentBox.svelte';

	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	let cinematicsCanvas;

	var eventStatus = null;

	let now = Date.now();
	let timerId;
	let endTimeMs = null;
	let timeLeftMs = 0;

	// GIF play/pause control
	let gifSrc = '';
	let stillDataUrl = '';

	async function generateStillFromGif() {
		try {
			const response = await fetch('/assets/adovent_girl.gif', {credentials: 'omit'});
			const blob = await response.blob();
			const bitmap = await createImageBitmap(blob);
			const canvas = document.createElement('canvas');
			canvas.width = bitmap.width;
			canvas.height = bitmap.height;
			const ctx = canvas.getContext('2d');
			ctx.drawImage(bitmap, 0, 0);
			stillDataUrl = canvas.toDataURL('image/png');
		} catch (e) {
			// Fallback to existing PNG if anything goes wrong
			stillDataUrl = '/assets/adovent_girl.png';
		}
	}

	function handleMouseEnter() {
		gifSrc = `/assets/adovent_girl.gif?ts=${Date.now()}`;
	}

	function handleMouseLeave() {
		gifSrc = '';
	}

	function formatDuration(ms) {
		const totalSeconds = Math.floor(ms / 1000);
		const days = Math.floor(totalSeconds / 86400);
		const hours = Math.floor((totalSeconds % 86400) / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
		if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
		return `${minutes}m ${seconds}s`;
	}

	function fetchEventStatus() {
		fetch(`${BL_API_URL}event/motd/77/status/today`, {credentials: 'include'})
			.then(response => response.json())
			.then(data => {
				eventStatus = data;
			});
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

	$: cinematicsCanvas && drawCinematics(cinematicsCanvas, '/assets/AdoBGBlurSQ.jpg');
	$: endTimeMs = eventStatus?.today?.endTime ? eventStatus.today.endTime * 1000 : null;
	$: timeLeftMs = endTimeMs ? Math.max(endTimeMs - now, 0) : 0;

	onMount(() => {
		fetchEventStatus();
		generateStillFromGif();
		timerId = setInterval(() => {
			now = Date.now();
		}, 1000);
	});

	onDestroy(() => {
		if (timerId) clearInterval(timerId);
	});
</script>

{#if eventStatus?.today}
	<ContentBox cls="event-banner" on:click={() => navigate('/event/adovent-calendar')}>
		<div class="cinematics">
			<div class="cinematics-canvas">
				<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
			</div>
		</div>

		<div class="event-container" role="group" on:mouseenter={handleMouseEnter} on:mouseleave={handleMouseLeave}>
			{#await import('atropos/svelte').then(m => m.default)}
				<div class="loading-container">
					<div class="cover-bg" />

					{#if gifSrc}
						<img class="cover-girls-gif" src={gifSrc} alt="" />
					{:else}
						<div class="cover-girls" style="background-image: url({stillDataUrl || '/assets/adovent_girl.png'}) !important;" />
					{/if}
					<div class="cover-hands" style="--background-image: url({eventStatus.today.song.coverImage}) !important;" />
				</div>
			{:then Atropos}
				<svelte:component this={Atropos} rotateXMax={1} rotateYMax={1} highlight="false" shadow="false" rotateTouch="scroll-y">
					<div class="cover-bg" data-atropos-offset="-2" />
					<img class="cover-girls-gif" data-atropos-offset="1" src={gifSrc || stillDataUrl} alt="" />
					<div
						class="cover-hands"
						data-atropos-offset="3"
						style="--background-image: url({eventStatus.today.song.coverImage}) !important;" />
				</svelte:component>
			{/await}

			<div class="event-text-and-button">
				<div class="event-text-container desktop-only">
					<span class="event-title">ADOvent Calendar: day #{eventStatus.today.day} - {eventStatus.today.song.name}</span>
				</div>
				<div class="event-text-container mobile-only">
					<span class="event-title">ADOvent - day #{eventStatus.today.day}</span>
					<span class="event-text">{eventStatus.today.song.name}</span>
				</div>
				<div>
					<Button
						label="PLAY"
						cls="event-cover-btn"
						iconFa="fas fa-wand-magic-sparkles"
						on:click={() => navigate('/event/adovent-calendar')} />
				</div>
				<div>
					<span class="time-left">Time left: {formatDuration(timeLeftMs)}</span>
				</div>
			</div>
		</div>
	</ContentBox>
{/if}

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
		justify-content: center;
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
		background: url(/assets/AdoBGBlurSQ.jpg) !important;
		background-size: cover !important;
		background-position-y: 67% !important;
		bottom: -10%;
		left: -10%;
		height: 120%;
		width: 120%;
	}
	.cover-girls {
		position: absolute;
		display: block;
		background: url(/assets/adovent_girl.png) !important;
		background-size: cover !important;
		background-position-y: 50% !important;
		height: 16em;
		left: calc(50% - -10em);
		top: calc(50% - 8em);
		width: 16em;
	}

	.cover-hands {
		position: absolute;
		display: block;
		background-image: var(--background-image) !important;
		background-size: cover !important;
		background-position-y: 50% !important;
		width: 10em;
		height: 10em;
		left: calc(50% - 25em);
		top: calc(50% - 5em);
		border-radius: 15%;
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

	.cover-girls-gif {
		position: absolute;
		height: 16em;
		left: calc(50% - -10em);
		top: calc(50% - 8em);
		width: 16em;
		object-fit: cover;
		object-position: 50% 50%;
		pointer-events: none;
	}

	.event-title {
		color: var(--text-color);
		font-size: x-large;
		font-weight: 800;
		text-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
		text-shadow: 1px 1px 11px #000000e8;
		max-width: 25em;
		text-align: center;
	}

	.event-text {
		color: var(--text-color);
		font-size: larger;
		text-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
	}

	.time-left {
		color: grey;
	}

	.mobile-only {
		display: none;
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
			background-size: cover !important;
			background-position-y: 50% !important;
			width: 7em;
			height: 7em;
			left: calc(50% - 11em);
			top: calc(50% - 4em);
		}

		.cover-girls-gif {
			left: calc(50% - -2em);
			top: calc(50% - 6em);
		}

		.event-title-desktop {
			display: none;
		}
		.event-title-mobile {
			display: block;
			color: #4caf50 !important;
		}

		.mobile-only {
			display: flex;
			margin-top: 2.5em;
		}

		.desktop-only {
			display: none;
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
