<script>
	import {starsToBackgroundColor, starsToColor} from '../../utils/beatleader/format';
	import {configStore} from '../../stores/config';

	export let height = '2em';

	let canvas;
	let ctx;

	$: if (canvas) {
		if (!ctx) {
			ctx = canvas.getContext('2d');
			const dpr = window.devicePixelRatio || 1;
			const rect = canvas.getBoundingClientRect();

			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;
			ctx.scale(dpr, dpr);
		}
		drawColorRange($configStore);
	}

	function drawColorRange(config) {
		if (!ctx) return;

		const width = canvas.getBoundingClientRect().width;
		const height = canvas.getBoundingClientRect().height;
		const segments = 100;
		const starLimit = 20;

		for (let i = 0; i < segments; i++) {
			const stars = Math.max(0.01, (i / segments) * starLimit);
			const color = starsToBackgroundColor({stars}, config);

			ctx.fillStyle = color;
			ctx.fillRect((i / segments) * width, 0, width / segments + 1, canvas.height);
		}

		// Draw star markers
		ctx.font = '14px Arial';
		ctx.textAlign = 'center';

		for (let stars = 1; stars <= starLimit; stars += 1) {
			const x = (stars / starLimit) * width;
			const color = starsToColor({stars}, config);
			ctx.fillStyle = color;
			ctx.fillText(stars, x - 10, height / 2 + 4);
		}
	}
</script>

<div class="container" style="height: {height}">
	<canvas bind:this={canvas} width="800" height="40"> </canvas>
</div>

<style>
	.container {
		width: 100%;
		margin: 1em 0;
	}

	canvas {
		width: 100%;
		height: 100%;
	}
</style>
