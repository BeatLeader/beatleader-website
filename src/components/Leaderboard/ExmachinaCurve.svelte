<script>
	import {fade, fly} from 'svelte/transition';
	import Chart from 'chart.js/auto';
	import {formatNumber} from '../../utils/format';
	import RangeSlider from 'svelte-range-slider-pips';
	import {createEventDispatcher} from 'svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {createDistanceWeightFunction, createMinMaxCounter} from '../../utils/math';
	import {configStore} from '../../stores/config';

	export let notes;
	export let height = '12em';
	export let speed;
	export let selectedModifiers;

	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;

	let themeName = 'darkss';
	let theme = null;

	function processChartData(chartData, resolution, smoothPeriodPercentage, weightFunctionSteepness) {
		var data = [];
		if (chartData.length === 0 || resolution === 0) return data;

		var songDuration = chartData[chartData.length - 1][1];
		const distanceWeightFunction = createDistanceWeightFunction(songDuration * smoothPeriodPercentage, weightFunctionSteepness);

		for (let i = 0.0; i < resolution; i += 1.0) {
			const songTime = (songDuration * i) / (resolution - 1);

			var sum = 0;
			var divider = 0;

			for (let j = 0.0; j < chartData.length; j += 1.0) {
				const item = chartData[j];
				const weight = distanceWeightFunction.getWeight(item[1] - songTime);

				sum += item[0] * weight;
				divider += weight;
			}

			if (divider === 0) continue;
			const value = (100 + (sum / divider) * 15) / 1.15;
			data.push([songTime, value]);
		}

		return data;
	}

	async function setupChart(canvas, chartData) {
		if (!canvas || !chartData || !Object.keys(chartData).length) return;

		const accColor = '#72a8ff';
		const gridColor = '#2a2a2a';
		var textColor = '#fff';

		if ($configStore.preferences.apriltheme == 'paradise' || $configStore.preferences.apriltheme == 'flylight') {
			textColor = '#000';
		}

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
								color: textColor,
							},
							grid: {
								color: gridColor,
							},
						},
						y: {
							min: minMaxCounter.minValue,
							max: minMaxCounter.maxValue,
							ticks: {
								callback: function (val) {
									return val + '%';
								},
								color: textColor,
							},
							grid: {
								color: gridColor,
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
	$: average = (notes && notes.AIacc * 100) ?? 0;
	$: loading = false;
</script>

<article class="graph-container">
	<div class="graph-title">
		<span>Predicted Accability:</span>
		<span class="predicted-accability">{average.toFixed(2)}%</span>
		{#if selectedModifiers?.length}
			<div class="modifiers-container" title="Speed: {speed}x">
				<span>({selectedModifiers.map(m => m.name).join(', ')})</span>
			</div>
		{/if}
	</div>
	<section class="accuracy-chart" style="--height: {height}">
		<canvas class="chartjs" bind:this={canvas} />
	</section>
	{#if loading}
		<div class="spinner-container">
			<Spinner />
		</div>
	{/if}
</article>

<style>
	.graph-container {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		align-items: center;
		gap: 0.3em;
	}

	.graph-title {
		font-size: 1.25rem;
		display: inline-flex;
		gap: 0.4em;
	}

	.modifiers-container {
		font-weight: bold;
	}

	.predicted-accability {
		font-weight: bold;
	}

	.speed-slider {
		width: 100%;
	}
	.spinner-container {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.accuracy-chart {
		height: 100%;
		width: 100%;
	}

	canvas {
		width: 100% !important;
		height: var(--height);
	}
</style>
