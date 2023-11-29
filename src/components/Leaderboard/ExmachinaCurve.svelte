<script>
	import {fade, fly} from 'svelte/transition';
	import Chart from 'chart.js/auto';
	import {formatNumber} from '../../utils/format';
	import RangeSlider from 'svelte-range-slider-pips';
	import {createEventDispatcher} from 'svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {createDistanceWeightFunction, createMinMaxCounter} from '../../utils/math';

	export let notes;
	export let height = '12em';
	export let speed;

	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;

	let themeName = 'darkss';
	let theme = null;

	let average = 0;

	function processChartData(chartData, resolution, smoothPeriodPercentage, weightFunctionSteepness) {
		var data = [];
		if (chartData.length === 0 || resolution === 0) return data;
		average = 0;

		var songDuration = chartData[chartData.length - 1][4];
		const distanceWeightFunction = createDistanceWeightFunction(songDuration * smoothPeriodPercentage, weightFunctionSteepness);

		for (let i = 0.0; i < resolution; i += 1.0) {
			const songTime = (songDuration * i) / (resolution - 1);

			var sum = 0;
			var divider = 0;

			for (let j = 0.0; j < chartData.length; j += 1.0) {
				const item = chartData[j];
				const weight = distanceWeightFunction.getWeight(item[4] - songTime);

				sum += item[0] * weight;
				divider += weight;
			}

			if (divider === 0) continue;
			const value = (100 + (sum / divider) * 15) / 1.15;
			average += value;
			data.push([songTime, value]);
		}

		if (data.length) {
			average /= data.length;
		}

		return data;
	}

	async function setupChart(canvas, chartData) {
		if (!canvas || !chartData || !Object.keys(chartData).length) return;

		const accColor = theme && theme.alternate ? theme.alternate : '#72a8ff';

		var data = processChartData(chartData, 200, 0.02, 3);

		const minMaxCounter = createMinMaxCounter(0, 100, 1.0);
		for (let i = 0; i < data.length; i++) {
			minMaxCounter.update(data[i][1]);
		}

		const datasets = [
			{
				label: name ? name : 'Selected',
				data,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				borderColor: accColor,
				borderWidth: 2,
				pointRadius: 0,
				type: 'line',
			},
		];

		const labels = data.map(
			v =>
				Math.floor(v[0] / 60) +
				':' +
				Math.round(v[0] % 60, 2)
					.toString()
					.padStart(2, '0')
		);

		if (!chart) {
			chart = new Chart(canvas, {
				data: {labels, datasets},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: {
						mode: 'index',
						intersect: false,
					},
					plugins: {
						legend: {
							display: false,
						},
						tooltip: {
							callbacks: {
								label(ctx) {
									return formatNumber(ctx.parsed.y) + '%';
								},
							},
						},
					},
					scales: {
						x: {
							scaleLabel: {
								display: false,
							},
							ticks: {
								autoSkip: true,
								autoSkipPadding: 4,
								color: 'white',
							},
						},
						y: {
							min: minMaxCounter.minValue,
							max: minMaxCounter.maxValue,
							ticks: {
								callback: function (val) {
									return val + '%';
								},
								color: 'white',
							},
						},
					},
				},
			});
		} else {
			chart.data = {labels, datasets};
			chart.options.scales.y.min = minMaxCounter.minValue;
			chart.options.scales.y.max = minMaxCounter.maxValue;
			chart.update();
		}
	}
	let start = 0;

	$: notes && setupChart(canvas, notes.rows);
	$: loading = false;
</script>

<article>
	<span>Predicted accability (avg {average.toFixed(2)}%):</span>
	<section class="accuracy-chart" style="--height: {height}">
		<canvas class="chartjs" bind:this={canvas} />
	</section>
	{#if loading}
		<div class="spinner-container">
			<Spinner />
		</div>
	{/if}

	<span>At speed:</span>
	<RangeSlider
		min={0.5}
		max={2}
		step={0.05}
		values={[speed]}
		float
		hoverable
		pips
		pipstep={10}
		all="label"
		suffix="x"
		on:change={event => {
			speed = event.detail.values[0];
			start = new Date().getTime();
			loading = true;
			setTimeout(() => {
				if (new Date().getTime() - start > 799) {
					dispatch('speed-changed', speed);
					loading = false;
				}
			}, 800);
		}} />
</article>

<style>
	.spinner-container {
	}

	.accuracy-chart {
		height: 100%;
	}

	canvas {
		width: 100% !important;
		height: var(--height);
	}
</style>
