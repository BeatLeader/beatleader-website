<script>
	import {fade, fly} from 'svelte/transition';
	import Chart from 'chart.js/auto';
	import {formatNumber} from '../../utils/format';
	import RangeSlider from 'svelte-range-slider-pips';
	import {createEventDispatcher} from 'svelte';
	import Spinner from '../Common/Spinner.svelte';

	export let notes;
	export let height = '12em';

	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;

	let themeName = 'darkss';
	let theme = null;

	async function setupChart(canvas, chartData, compareChartData, name, compareToName) {
		if (!canvas || !chartData || !Object.keys(chartData).length) return;

		const accColor = theme && theme.alternate ? theme.alternate : '#72a8ff';
		const compareColor = theme && theme.dimmed ? theme.alternate : '#3e3e3e';
		var windowSize = chartData.length / chartData[chartData.length - 1][4];
		if (windowSize < 1) {
			windowSize = 1;
		}
		windowSize = Math.round(windowSize);

		var data = [];
		for (let i = 0; i < chartData.length; i++) {
			var accumulator = chartData[i][0];
			var counter = 1;

			for (let j = 1; j < windowSize; j++) {
				if (i + j < chartData.length) {
					accumulator += chartData[i + j][0];
					counter++;
				}
			}
			for (let j = 1; j < windowSize; j++) {
				if (i - j >= 0) {
					accumulator += chartData[i - j][0];
					counter++;
				}
			}

			data.push((100 + (accumulator / counter) * 15) / 1.15);
		}

		const mainMinValue = Math.floor(Math.max(Math.floor(data.reduce((min, cur) => (cur < min ? cur : min), 100)), 0) * 0.99);
		const mainMaxValue = Math.ceil(Math.min(Math.ceil(data.reduce((max, cur) => (cur > max ? cur : max), 0)), 100));

		const compareData = compareChartData ? Object.values(compareChartData).map(v => v * 100) : null;
		const compareMinValue = compareChartData
			? Math.floor(Math.max(Math.floor(compareData.reduce((min, cur) => (cur < min ? cur : min), 100)), 0) * 0.99)
			: 100;
		const compareMaxValue = compareChartData
			? Math.ceil(Math.min(Math.ceil(compareData.reduce((max, cur) => (cur > max ? cur : max), 0)), 100))
			: 0;

		const minValue = Math.min(mainMinValue, compareMinValue);
		const maxValue = Math.max(mainMaxValue, compareMaxValue);

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

		if (compareData)
			datasets.push({
				label: compareToName ? compareToName : 'Compared',
				data: compareData,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				borderColor: compareColor,
				borderWidth: 2,
				pointRadius: 0,
				type: 'line',
			});

		const labels = (compareData && compareData.length > data.length ? compareChartData : chartData).map(
			v =>
				Math.floor(v[4] / 60) +
				':' +
				Math.round(v[4] % 60, 2)
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
							min: minValue,
							max: maxValue,
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
			chart.options.plugins.legend.display = !!compareData;
			chart.options.scales.y.min = minValue;
			chart.options.scales.y.max = maxValue;
			chart.update();
		}
	}

	let speed = 1;
	let start = 0;

	$: notes && setupChart(canvas, notes.rows, null, null, null);
	$: loading = false;
</script>

<article transition:fade|global>
	<span>Predicted accability:</span>
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
