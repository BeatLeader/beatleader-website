<script>
	import Atropos from 'atropos/svelte';
	import MapCardContent from './MapCardContent.svelte';

	export let map;
	export let starsKey;
	export let currentFilters;
	export let idx;
	export let maps3D;
	export let viewType;
</script>

{#if maps3D}
	<Atropos
		class="map-card-atropos"
		rotateXMax={5}
		rotateYMax={5}
		rotateTouch="scroll-y">
		<MapCardContent {map} {idx} {currentFilters} {starsKey} {viewType} />
	</Atropos>
{:else}
	<MapCardContent {map} {idx} {currentFilters} {starsKey} {viewType} />
{/if}

<style>
	:global(.map-card-atropos .atropos-inner) {
		display: flex !important;
		overflow: visible !important;
	}
	:global(.atropos-scale) {
		pointer-events: none;
	}

	:global(.atropos-rotate) {
		pointer-events: all;
	}
</style>
