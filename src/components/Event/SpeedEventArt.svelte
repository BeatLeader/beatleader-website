<div class="speed-art">
	{#await import('atropos/svelte').then(m => m.default)}
		<div class="cover" />
	{:then Atropos}
		<svelte:component this={Atropos} rotateXMax={1} rotateYMax={1} highlight="false" shadow="false" rotateTouch="scroll-y">
			<div class="cover" data-atropos-offset="-1" />
			<div class="sparkles" data-atropos-offset="2">
				<span /><span /><span /><span /><span />
			</div>
		</svelte:component>
	{/await}
	<div class="shade" />
</div>

<style>
	.speed-art {
		--u: calc(var(--speed-art-height, 12em) / 12);
		--art-width: calc(var(--u) * 47.3);
		position: absolute;
		inset: 0;
		overflow: hidden;
		border-radius: inherit;
	}

	.speed-art :global(.atropos) {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.speed-art :global(.atropos-highlight),
	.speed-art :global(.atropos-shadow) {
		display: none;
	}

	.cover {
		position: absolute;
		inset: -6%;
		background: url(/assets/speed-event/cover.webp) right 30% / auto 140% no-repeat;
		-webkit-mask-image: linear-gradient(90deg, transparent calc(100% - var(--art-width)), #000 calc(100% - var(--art-width) * 0.87));
		mask-image: linear-gradient(90deg, transparent calc(100% - var(--art-width)), #000 calc(100% - var(--art-width) * 0.87));
	}

	.sparkles {
		position: absolute;
		inset: 0;
		filter: drop-shadow(0 0 3px #9fd0ff);
	}

	.sparkles span {
		position: absolute;
		width: calc(var(--u) * 1);
		height: calc(var(--u) * 1);
		background: #fff;
		clip-path: polygon(50% 0, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0 50%, 42% 42%);
		animation: twinkle 2.8s ease-in-out infinite;
	}

	.sparkles span:nth-child(1) {
		right: calc(var(--u) * 31);
		top: 22%;
	}

	.sparkles span:nth-child(2) {
		right: calc(var(--u) * 17);
		top: 30%;
		scale: 0.7;
		animation-delay: -0.9s;
	}

	.sparkles span:nth-child(3) {
		right: calc(var(--u) * 3);
		top: 48%;
		animation-delay: -1.7s;
	}

	.sparkles span:nth-child(4) {
		right: calc(var(--u) * 24);
		top: 66%;
		scale: 0.6;
		animation-delay: -2.3s;
	}

	.sparkles span:nth-child(5) {
		right: calc(var(--u) * 11);
		top: 12%;
		scale: 0.8;
		animation-delay: -0.4s;
	}

	@keyframes twinkle {
		0%,
		100% {
			transform: scale(0.3) rotate(0deg);
			opacity: 0.2;
		}
		50% {
			transform: scale(1) rotate(45deg);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sparkles span {
			animation: none;
		}
	}

	.shade {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(90deg, rgba(7, 10, 31, 0.92) 0%, rgba(7, 10, 31, 0.6) 30%, transparent 55%);
	}

	@media screen and (max-width: 760px) {
		.cover {
			background-position: 60% 35%;
			-webkit-mask-image: none;
			mask-image: none;
		}

		.shade {
			background: linear-gradient(90deg, rgba(7, 10, 31, 0.85) 0%, rgba(7, 10, 31, 0.4) 50%, transparent 75%);
		}
	}
</style>
