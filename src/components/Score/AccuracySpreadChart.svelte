<script>
	import Chart from 'chart.js/auto';
	import {formatNumber} from '../../utils/format';

	export let accSpreadData = null;
	export let height = '12em';

	let canvas = null;
	let chart = null;

	async function setupChart(canvas, chartData) {
		if (!canvas || !chartData || !Object.keys(chartData).length) return;

		let labels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

		let startIndex;
		for (startIndex = 0; startIndex <= 15; ) {
			if (chartData.leftCount[startIndex] !== 0 || chartData.rightCount[startIndex] !== 0) break;
			startIndex += 1;
		}

		labels = labels.slice(startIndex, 16);
		chartData.leftCount = chartData.leftCount.slice(startIndex, 16);
		chartData.leftTD = chartData.leftTD.slice(startIndex, 16);
		chartData.rightCount = chartData.rightCount.slice(startIndex, 16);
		chartData.rightTD = chartData.rightTD.slice(startIndex, 16);
		chartData.timeDeviation = chartData.timeDeviation.slice(startIndex, 16);

		const minCount = 0;
		const maxCount = chartData.maxCount;
		const minTD = 0.0;
		const maxTD = Math.ceil(chartData.maxTD / 0.05) * 0.05;
		const minTimeDeviation = 0.0;
		const maxTimeDeviation = Math.max(Math.ceil(chartData.maxTimeDeviation / 0.01) * 0.01, 0.02);

		const xAxis = {
			display: false,
			scaleLabel: {
				display: true,
			},
			grid: {
				drawTicks: false,
			},
			ticks: {
				autoSkip: true,
				autoSkipPadding: 4,
				color: 'white',
			},
			offset: true, // Add offset to prevent bar clipping
		};

		const yAxes = {
			count: {
				display: true,
				min: minCount,
				max: maxCount,
				position: 'right',
				ticks: {
					callback: function (val) {
						return `${formatNumber(val * 100, 1)}%`;
					},
					autoSkipPadding: 12,
				},
			},
			td: {
				display: true,
				min: minTD,
				max: maxTD,
				position: 'left',
				grid: {
					drawOnChartArea: false,
				},
				ticks: {
					autoSkipPadding: 14,
				},
			},
			timeDeviation: {
				display: false,
				min: minTimeDeviation,
				max: maxTimeDeviation,
				position: 'left',
			},
		};

		const datasets = [
			{
				yAxisID: 'count',
				label: 'Left count',
				data: chartData.leftCount,
				round: 2,
				type: 'bar',
				backgroundColor: '#ee5555',
				order: 4,
				barPercentage: 0.9, // Adjust bar width
				categoryPercentage: 0.8, // Adjust spacing between bars
			},
			{
				yAxisID: 'count',
				label: 'Right count',
				data: chartData.rightCount,
				round: 2,
				type: 'bar',
				backgroundColor: '#5555ee',
				order: 5,
				barPercentage: 0.9, // Adjust bar width
				categoryPercentage: 0.8, // Adjust spacing between bars
			},
			{
				yAxisID: 'td',
				label: 'Left TD',
				data: chartData.leftTD,
				round: 3,
				type: 'line',
				borderColor: '#ff8888',
				backgroundColor: '#ff8888',
				borderWidth: 2,
				pointRadius: 2,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 0,
			},
			{
				yAxisID: 'td',
				label: 'Right TD',
				data: chartData.rightTD,
				round: 3,
				type: 'line',
				borderColor: '#8888ff',
				backgroundColor: '#8888ff',
				borderWidth: 2,
				pointRadius: 2,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 1,
			},
			{
				yAxisID: 'timeDeviation',
				label: 'Timing',
				data: chartData.timeDeviation,
				round: 1,
				type: 'line',
				borderColor: '#ffffff88',
				backgroundColor: '#ffffff88',
				borderWidth: 2,
				pointRadius: 2,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 2,
			},
		];

		if (!chart) {
			chart = new Chart(canvas, {
				data: {labels, datasets},
				options: {
					responsive: true,
					animation: {
						duration: 0,
					},
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
									let count;
									switch (ctx.dataset.label) {
										case 'Timing':
											return `${ctx.dataset.label}: ${formatNumber(ctx.raw * 1000, ctx.dataset.round)} ms`;
										case 'Left count':
											count = Math.round(chartData.totalLeftCount * ctx.raw);
											return `${ctx.dataset.label}: ${count} (${formatNumber(ctx.raw * 100, ctx.dataset.round)}%)`;
										case 'Right count':
											count = Math.round(chartData.totalRightCount * ctx.raw);
											return `${ctx.dataset.label}: ${count} (${formatNumber(ctx.raw * 100, ctx.dataset.round)}%)`;
										default:
											return `${ctx.dataset.label}: ${formatNumber(ctx.raw, ctx.dataset.round)}`;
									}
								},
							},
						},
					},
					scales: {
						xAxis,
						...yAxes,
					},
				},
			});
		} else {
			chart.data = {labels, datasets};
			chart.options.plugins.legend.display = true;
			chart.options.scales.y.min = minCount;
			chart.options.scales.y.max = maxCount;
			chart.update();
		}
	}

	$: setupChart(canvas, accSpreadData);
</script>

{#if accSpreadData}
	<section class="accuracy-spread-chart" style="--height: {height}">
		<canvas class="chartjs" bind:this={canvas} />
	</section>
{/if}

<style>
	.accuracy-spread-chart {
		height: 100%;
	}

	canvas {
		width: 100% !important;
		height: var(--height);
	}
</style>
