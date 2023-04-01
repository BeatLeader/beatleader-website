<script>
	import Atropos from 'atropos/svelte';
	export let box = null;
	export let background = 'var(--foreground)';
	export let cls = null;
	export let zIndex = 1;
	export let no3d = false;
</script>

{#if navigator.userAgent
	.toLowerCase()
	.indexOf('firefox') > -1 || no3d || 'ontouchstart' in window || navigator.MaxTouchPoints > 0 || navigator.msMaxTouchPoints > 0}
	<div
		class="content-box {cls ?? ''}"
		bind:this={box}
		style="--box-background: {background}; {zIndex != 1 ? 'z-index: ' + zIndex : ''}"
		on:click>
		<slot />
	</div>
{:else}
	<Atropos activeOffset={10} rotateXMax={2} rotateYMax={2} class="my-atropos">
		<div
			class="content-box {cls ?? ''}"
			bind:this={box}
			style="--box-background: {background}; {zIndex != 1 ? 'z-index: ' + zIndex : ''}"
			on:click>
			<slot />
		</div>
	</Atropos>
{/if}

<style>
	.content-box {
		background-color: var(--box-background, var(--foreground));

		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
		margin: 4px 10px 18px;
		border-radius: 6px;
		padding: 1rem;
		position: relative;
		z-index: var(--z-index);
	}

	.content-box:hover {
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
	}

	@media screen and (max-width: 767px) {
		.content-box {
			margin: 4px 0 18px;
			border-radius: 0;
			padding: 1rem 0.8rem;
		}
	}
</style>
