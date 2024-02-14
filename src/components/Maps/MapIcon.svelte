<script>
	export let left = null;
	export let right = null;
	export let top = null;
	export let bottom = null;
	export let width = '7em';
	export let height = null;

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

<div class="map-icon" {style} />

<style>
	.map-icon {
		aspect-ratio: 1/1;
		background-color: #000;
		border-radius: 15%;
		position: absolute;
	}
</style>
