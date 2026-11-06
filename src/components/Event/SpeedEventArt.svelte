<script>
	const LAYERS = [
		{name: 'bg', offset: -2},
		{name: 'character', offset: 0},
		{name: 'stars-1', offset: 1, twinkle: '0s'},
		{name: 'cubes', offset: 3},
		{name: 'stars-2', offset: 4, twinkle: '-2s'},
	];

	const layerStyle = layer =>
		`background-image: url(/assets/speed-event/banner-${layer.name}.webp);` + (layer.twinkle ? ` animation-delay: ${layer.twinkle};` : '');
</script>

<div class="speed-art">
	{#await import('atropos/svelte').then(m => m.default)}
		{#each LAYERS as layer}
			<div class="cover" class:twinkle={layer.twinkle} style={layerStyle(layer)} />
		{/each}
	{:then Atropos}
		<svelte:component this={Atropos} rotateXMax={1} rotateYMax={1} highlight="false" shadow="false" rotateTouch="scroll-y">
			{#each LAYERS as layer}
				<div class="cover" class:twinkle={layer.twinkle} style={layerStyle(layer)} data-atropos-offset={layer.offset} />
			{/each}
		</svelte:component>
	{/await}
	<div class="shade" />
</div>

<style>
	.speed-art {
		--art-width: calc(var(--speed-art-height, 12em) * 4.427);
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
		background-position: right 30%;
		background-size: auto 140%;
		background-repeat: no-repeat;
		-webkit-mask-image: linear-gradient(90deg, transparent calc(100% - var(--art-width)), #000 calc(100% - var(--art-width) * 0.87));
		mask-image: linear-gradient(90deg, transparent calc(100% - var(--art-width)), #000 calc(100% - var(--art-width) * 0.87));
	}

	.twinkle {
		animation: twinkle 4s ease-in-out infinite;
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.35;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.twinkle {
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
