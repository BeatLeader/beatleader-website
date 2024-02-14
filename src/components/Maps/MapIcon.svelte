<script>
	import {fly} from 'svelte/transition';

	export let left = null;
	export let right = null;
	export let top = null;
	export let bottom = null;
	export let width = '7em';
	export let height = null;
	export let image = null;

	let style = '';

	function setStyle() {
		style = '';

		if (width) style += `width: ${width}; `;
		if (height) style += `height: ${height}; `;

		if (left) style += `left: ${left}; `;
		if (right) style += `right: ${right}; `;
		if (top) style += `top: ${top}; `;
		if (bottom) style += `bottom: ${bottom}; `;
	}

	setStyle();

	$: left, right, top, bottom, width && setStyle();
</script>

<div class="map-icon" {style} transition:fly|global>
	{#if image}<img src={image} alt="Map Icon" />{/if}
</div>

<style>
	.map-icon {
		aspect-ratio: 1/1;
		border-radius: 15%;
		position: absolute;
		overflow: hidden;
		box-shadow: 2px 2px 13px 4px rgba(0, 0, 0, 0.25);
	}

	.map-icon img {
		width: 100%;
		height: 100%;
	}
</style>
