<script>
	import MapCardContent from './MapCardContent.svelte';

	export let map;
	export let starsKey = 'stars';
	export let currentFilters;
	export let idx;
	export let maps3D;
	export let viewType;
	export let nodetails = false;

	let hovered = false;
	let timeoutId = null;

	const atroposImport = () => import('atropos/svelte').then(m => m.default);

	function onEnter() {
		hovered = true;
		clearTimeout(timeoutId);
	}

	function onExit() {
		setTimeout(() => {
			hovered = false;
			timeoutId = null;
		}, 250);
	}
</script>

{#if maps3D}
	{#await atroposImport()}
		<div class="loading-container">
			<MapCardContent {map} {idx} {currentFilters} {starsKey} {viewType} {nodetails} />
		</div>
	{:then Atropos}
		<svelte:component
			this={Atropos}
			class="map-card-atropos {hovered ? 'card-hovered' : ''}"
			rotateXMax={5}
			rotateYMax={5}
			rotateTouch="scroll-y"
			on:enter={() => onEnter()}
			on:leave={() => onExit()}>
			<MapCardContent {map} {idx} {currentFilters} {starsKey} {viewType} {nodetails} />
		</svelte:component>
	{/await}
{:else}
	<MapCardContent {map} {idx} {currentFilters} {starsKey} {viewType} {nodetails} />
{/if}

<style>
	.loading-container {
		display: flex;
		border-radius: 0.4em;
	}

	:global(.map-card-atropos .atropos-inner) {
		display: flex !important;
		overflow: visible !important;
		border-radius: 0.4em;
	}
	:global(.map-card-atropos.card-hovered .atropos-inner) {
		overflow: hidden !important;
	}
	:global(.map-card-atropos:hover .atropos-inner) {
		overflow: hidden !important;
	}
	:global(.atropos-scale) {
		pointer-events: none;
	}

	:global(.atropos-rotate) {
		pointer-events: all;
	}
</style>
