<script context="module">
	const EVENT_ID = 87;
	const END_DATE = 1794095999;

	export const eventBannerShown = () => Date.now() / 1000 < END_DATE;
</script>

<script>
	import {navigate} from 'svelte-routing';
	import Button from '../Common/Button.svelte';
	import ContentBox from '../Common/ContentBox.svelte';

	const shown = eventBannerShown();
</script>

<svelte:head>
	{#if shown}
		<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Creepster&display=swap" />
	{/if}
</svelte:head>

{#if shown}
	<ContentBox cls="event-banner" on:click={() => navigate(`/event/${EVENT_ID}`)}>
		<div class="event-container">
			{#await import('atropos/svelte').then(m => m.default)}
				<div class="cover-night" />
				<div class="cover-art" />
			{:then Atropos}
				<svelte:component this={Atropos} rotateXMax={1} rotateYMax={1} highlight="false" shadow="false" rotateTouch="scroll-y">
					<div class="cover-night" data-atropos-offset="-2" />
					<div class="cover-bats" data-atropos-offset="0">
						<span class="bat bat-1" />
						<span class="bat bat-2" />
					</div>
					<div class="cover-candles" data-atropos-offset="1">
						<img src="/assets/halloween/candle-tall.webp" alt="" />
						<img src="/assets/halloween/candle-short.webp" alt="" />
						<img src="/assets/halloween/candle-medium.webp" alt="" />
					</div>
					<div class="cover-art" data-atropos-offset="3" />
				</svelte:component>
			{/await}

			<div class="event-text-and-button">
				<span class="event-title">The ghosts are back!</span>
				<span class="event-text">Halloween event: dance your way to safety and profile badges.</span>
				<div>
					<Button label="JOIN THE EVENT" cls="dod-banner-btn" iconFa="fas fa-ghost" color="white" bgColor="#b83f00" />
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
		background: #17121c !important;
		box-shadow:
			0 0 0 1px rgba(255, 138, 0, 0.15),
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

	:global(.content-box.event-banner .atropos) {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	:global(.content-box.event-banner .atropos-highlight),
	:global(.content-box.event-banner .atropos-shadow) {
		display: none;
	}

	.cover-night {
		position: absolute;
		inset: -10%;
		background:
			url(/assets/halloween/web.webp) no-repeat left -2em top -2em / 12em auto,
			radial-gradient(60% 90% at 78% 100%, rgba(255, 85, 0, 0.35), transparent 70%),
			radial-gradient(50% 80% at 10% 0%, rgba(115, 64, 153, 0.5), transparent 70%),
			#17121c;
	}

	.cover-art {
		position: absolute;
		inset: 0.4em 0.5em 0 0;
		background: url(/assets/halloween/event-banner.webp) right bottom / auto 100% no-repeat;
		filter: drop-shadow(0 0 18px rgba(255, 138, 0, 0.35));
	}

	.cover-candles {
		position: absolute;
		right: 14.5em;
		bottom: -0.3em;
		display: flex;
		align-items: flex-end;
		gap: 0.1em;
		filter: drop-shadow(0 0 10px rgba(255, 154, 51, 0.6));
		animation: candle-flicker 3s ease-in-out infinite;
	}

	.cover-candles img {
		height: 4.5em;
	}

	.cover-candles img:nth-child(2) {
		height: 3.2em;
	}

	.cover-candles img:nth-child(3) {
		height: 3.8em;
	}

	@keyframes candle-flicker {
		0%,
		100% {
			filter: drop-shadow(0 0 10px rgba(255, 154, 51, 0.6));
		}
		40% {
			filter: drop-shadow(0 0 14px rgba(255, 154, 51, 0.8));
		}
		70% {
			filter: drop-shadow(0 0 8px rgba(255, 154, 51, 0.5));
		}
	}

	.cover-bats {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.bat {
		position: absolute;
		left: -3em;
		width: 2em;
		height: 1.25em;
		background: url(/assets/halloween/bat-up.webp) center / contain no-repeat;
		animation:
			bat-flap 0.3s steps(1) infinite,
			bat-fly 18s linear infinite;
		opacity: 0.7;
	}

	.bat-1 {
		top: 15%;
	}

	.bat-2 {
		top: 40%;
		width: 1.4em;
		animation-delay:
			0.1s,
			-9s;
		animation-duration: 0.25s, 24s;
	}

	@keyframes bat-flap {
		0% {
			background-image: url(/assets/halloween/bat-up.webp);
		}
		50% {
			background-image: url(/assets/halloween/bat-down.webp);
		}
	}

	@keyframes bat-fly {
		0% {
			transform: translate(0, 0);
		}
		33% {
			transform: translate(40vw, -1em);
		}
		66% {
			transform: translate(80vw, 1em);
		}
		100% {
			transform: translate(120vw, 0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bat {
			display: none;
		}

		.cover-candles {
			animation: none;
		}
	}

	.event-text-and-button {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3em;
		margin-left: 2em;
		margin-right: 18em;
	}

	.event-title {
		font-family: 'Creepster', 'Noto Sans', cursive;
		font-size: 2.6em;
		line-height: 1;
		letter-spacing: 0.05em;
		color: #ff9a1f;
		text-shadow: 0 0 24px rgba(255, 138, 0, 0.6);
	}

	.event-text {
		color: #efe6d2;
		font-size: 1.05em;
		text-shadow: 1px 1px 8px #000000e8;
	}

	:global(.dod-banner-btn) {
		box-shadow: 0 0 16px rgba(255, 85, 0, 0.45) !important;
		margin-top: 2em !important;
	}

	@media screen and (max-width: 760px) {
		.cover-art {
			opacity: 0.35;
		}

		.cover-candles {
			display: none;
		}

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
