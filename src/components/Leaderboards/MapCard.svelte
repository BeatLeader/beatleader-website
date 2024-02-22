<script>
	import Atropos from 'atropos/svelte';
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
	<Atropos
		class="map-card-atropos {hovered ? 'card-hovered' : ''}"
		rotateXMax={5}
		rotateYMax={5}
		rotateTouch="scroll-y"
		on:enter={() => onEnter()}
		on:leave={() => onExit()}>
		<MapCardContent {map} {idx} {currentFilters} {starsKey} {viewType} {nodetails} />
	</Atropos>
{:else}
	<MapCardContent {map} {idx} {currentFilters} {starsKey} {viewType} {nodetails} />
{/if}

<style>
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
