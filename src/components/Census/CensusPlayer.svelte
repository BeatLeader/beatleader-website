<script>
	import {onMount, afterUpdate} from 'svelte';

	export let height = 200;
	export let armsLength = 50;
	export let handsLength = 30;

	let canvas;

	function drawEllipse(ctx, x, y, width, height) {
		ctx.beginPath();
		ctx.moveTo(x, y - height / 2);

		ctx.bezierCurveTo(x + width / 2, y - height / 2, x + width / 2, y + height / 2, x, y + height / 2);

		ctx.bezierCurveTo(x - width / 2, y + height / 2, x - width / 2, y - height / 2, x, y - height / 2);

		ctx.stroke();
	}

	function drawFigure() {
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.lineWidth = 2;

		const headRadius = height * 0.1;
		const neckHeight = height * 0.05;
		const bodyHeight = height * 0.45;
		const legsHeight = height * 0.4;

		// Draw head
		ctx.beginPath();
		ctx.arc(canvas.width / 2, headRadius, headRadius, 0, Math.PI * 2, false);
		ctx.stroke();

		// Draw neck
		ctx.beginPath();
		ctx.moveTo(canvas.width / 2, headRadius * 2);
		ctx.lineTo(canvas.width / 2, headRadius * 2 + neckHeight);
		ctx.stroke();

		// Draw body
		const bodyTop = headRadius * 2 + neckHeight;
		drawEllipse(ctx, canvas.width / 2, bodyTop + bodyHeight / 2, headRadius * 1.5, bodyHeight);

		// Draw legs
		const hipX = canvas.width / 2;
		const hipY = bodyTop + bodyHeight;
		const footY = hipY + legsHeight;
		ctx.beginPath();
		ctx.lineWidth = 5;
		ctx.moveTo(hipX, hipY);
		ctx.lineTo(hipX - armsLength / 2, footY);
		ctx.moveTo(hipX, hipY);
		ctx.lineTo(hipX + armsLength / 2, footY);
		ctx.stroke();

		// Draw arms
		const shoulderY = bodyTop + bodyHeight * 0.25;
		ctx.beginPath();
		ctx.moveTo(canvas.width / 2, shoulderY);
		ctx.lineTo(canvas.width / 2 - armsLength, shoulderY);
		ctx.lineTo(canvas.width / 2 - armsLength - handsLength, shoulderY - handsLength);
		ctx.moveTo(canvas.width / 2, shoulderY);
		ctx.lineTo(canvas.width / 2 + armsLength, shoulderY);
		ctx.lineTo(canvas.width / 2 + armsLength + handsLength, shoulderY - handsLength);
		ctx.stroke();
	}

	onMount(drawFigure);
	afterUpdate(drawFigure);
</script>

<canvas bind:this={canvas} width={height * 1.5} height={height * 1.5} />

<style>
	canvas {
		border: 1px solid #000;
	}
</style>
