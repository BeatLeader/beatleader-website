<script>
	import Chart from 'chart.js/auto';
	import 'chartjs-adapter-luxon';
	import {onDestroy} from 'svelte';
	import Spinner from '../Common/Spinner.svelte';

	export let config = null;
	export let loading = false;
	export let error = false;
	export let height = 280;
	export let chart = null;

	let canvas;

	function draw(canvas, config) {
		chart?.destroy();
		chart = canvas && config ? new Chart(canvas, config) : null;
	}

	$: draw(canvas, config);

	onDestroy(() => chart?.destroy());
</script>

<div class="chart" style="--height: {height}px">
	<canvas bind:this={canvas}></canvas>
	<slot />
	{#if loading}
		<div class="status"><Spinner /></div>
	{:else if error}
		<div class="status">Failed to load the stats</div>
	{:else if !config}
		<div class="status">No data yet</div>
	{/if}
</div>

<style>
	.chart {
		position: relative;
		height: var(--height);
	}

	canvas {
		width: 100% !important;
	}

	.status {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--faded);
	}
</style>
