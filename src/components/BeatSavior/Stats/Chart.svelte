<script>
	import Chart from 'chart.js/auto';
	import {formatNumber} from '../../../utils/format';
	import {opt} from '../../../utils/js';
	import {configStore} from '../../../stores/config';


	export let beatSavior = null;
	export let name = null;
	export let compareTo = null;
	export let compareToName = null;
	export let height = '12em';

	let canvas = null;
	let chart = null;

	let themeName = 'darkss';
	let theme = null;
	let textColor = ''
			
	if ($configStore.preferences.theme != 'flylight') {
			textColor = '#fff';
	} else {
			textColor = '#757575';
	}

	function average(arr) {
		return arr.reduce((p, c) => p + c, 0) / arr.length;
	}

	function removeTrailingOnes(arr) {
		var firstNonOneIndex = 0;
		var firstNonOneValue = 0;

		for (let index = 0; index < arr.length; index++) {
			const element = arr[index];
			if (element < 99.9999) {
				firstNonOneIndex = index;
				firstNonOneValue = element;
				break;
			}
		}

		for (let index = 0; index < firstNonOneIndex; index++) {
			arr[index] = firstNonOneValue;
		}

		return arr;
	}

	async function setupChart(canvas, chartData, compareChartData, name, compareToName) {
		if (!canvas || !chartData || !Object.keys(chartData).length) return;

		const accColor = theme && theme.alternate ? theme.alternate : '#72a8ff';
		const compareColor = theme && theme.dimmed ? theme.alternate : '#3e3e3e';

		let minValue = 100;
		let maxValue = 0;

		function updateMinMax(values) {
			if (!values) return;
			const minV = Math.floor(Math.max(Math.floor(values.reduce((min, cur) => (cur < min ? cur : min), 100)), 0) * 0.99);
			const maxV = Math.ceil(Math.min(Math.ceil(values.reduce((max, cur) => (cur > max ? cur : max), 0)), 100));
			if (minV < minValue) minValue = minV;
			if (maxV > maxValue) maxValue = maxV;
		}

		let data = Object.values(chartData).map(v => v * 100);
		if (average(data) < 99) {
			data = removeTrailingOnes(data);
		}

		updateMinMax(data);

		const compareData = compareChartData ? Object.values(compareChartData).map(v => v * 100) : null;
		updateMinMax(compareData);

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

		const labels = Object.keys(compareData && compareData.length > data.length ? compareChartData : chartData).map(
			v => Math.floor(v / 60) + ':' + (v % 60).toString().padStart(2, '0')
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
						},
						y: {
							min: minValue,
							max: maxValue,
							ticks: {
								callback: function (val) {
									return val + '%';
								},
								color: textColor,
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

	$: data = opt(beatSavior, 'trackers.scoreGraphTracker.graph', null);
	$: compareData =
		opt(beatSavior, 'beatSaviorId') !== opt(compareTo, 'beatSaviorId') ? opt(compareTo, 'trackers.scoreGraphTracker.graph', null) : null;
	$: setupChart(canvas, data, compareData, name, compareToName);
</script>

{#if data}
	<section class="accuracy-chart" style="--height: {height}">
		<canvas class="chartjs" bind:this={canvas} />
	</section>
{/if}

<style>
	.accuracy-chart {
		height: 100%;
		width: 100%;
	}

	canvas {
		width: 100% !important;
		height: var(--height);
	}
</style>
