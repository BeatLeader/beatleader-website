<script context="module">
	const EVENT_ID = 88;
	const END_DATE = 1795305599;

	export const EVENT_NAME = 'BFS & BSF event';
	export const eventBannerShown = () => Date.now() / 1000 < END_DATE;
</script>

<script>
	import {navigate} from 'svelte-routing';
	import Button from '../Common/Button.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import SpeedEventArt from './SpeedEventArt.svelte';

	const shown = eventBannerShown();
</script>

<svelte:head>
	{#if shown}
		<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@800&display=swap" />
	{/if}
</svelte:head>

{#if shown}
	<ContentBox cls="event-banner" on:click={() => navigate(`/event/${EVENT_ID}`)}>
		<div class="event-container">
			<SpeedEventArt />

			<div class="event-text-and-button">
				<span class="event-title">Better Speed!</span>
				<span class="event-text">Compete on custom speed modifiers with improved NJS</span>
				<div>
					<Button label="JOIN THE EVENT" cls="speed-banner-btn" iconFa="fas fa-bolt" color="white" bgColor="#d4144a" />
				</div>
			</div>
		</div>
	</ContentBox>
{/if}

<style>
	:global(.content-box.event-banner) {
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0.6em;
		padding: 0 !important;
		border-radius: 0.5em;
		cursor: pointer;
		background: #070a1f !important;
		box-shadow:
			0 0 0 1px rgba(90, 140, 255, 0.2),
			0 8px 24px rgba(0, 0, 0, 0.5) !important;
	}

	.event-container {
		width: 100%;
		display: flex;
		position: relative;
		height: 12em;
		align-items: center;
		overflow: hidden;
		border-radius: 0.5em;
	}

	.event-text-and-button {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3em;
		margin-left: 2em;
		margin-right: 50%;
	}

	.event-title {
		font-family: 'Orbitron', 'Noto Sans', sans-serif;
		font-weight: 800;
		font-size: 2.4em;
		line-height: 1;
		color: #fff;
		text-shadow:
			0 0 12px rgba(255, 40, 100, 0.8),
			0 0 28px rgba(60, 120, 255, 0.7);
	}

	.event-text {
		color: #e6ecff;
		font-size: 1.05em;
		text-shadow: 1px 1px 8px #000000e8;
	}

	:global(.speed-banner-btn) {
		box-shadow: 0 0 16px rgba(212, 20, 74, 0.55) !important;
		margin-top: 1.5em !important;
	}

	@media screen and (max-width: 760px) {
		.event-text-and-button {
			margin: 0 1em;
		}

		.event-title {
			font-size: 1.8em;
		}

		.event-text {
			display: none;
		}
	}
</style>
