<script>
	import Chart from 'chart.js/auto';
	import {formatNumber} from '../../utils/format';

	export let replayAccGraphs;
	export let height = '12em';

	let canvas = null;
	let chart = null;

	function createMinMaxCounter(clampMin, clampMax, step) {
		return {
			minValue: 1e10,
			maxValue: -1e10,
			clampMin: clampMin,
			clampMax: clampMax,
			step: step,
			update: function (value) {
				let tmp = Math.floor(value / this.step) * this.step;
				if (tmp < this.minValue) this.minValue = tmp;
				tmp = Math.ceil(value / this.step) * this.step;
				if (tmp > this.maxValue) this.maxValue = tmp;

				if (this.minValue < this.clampMin) this.minValue = this.clampMin;
				if (this.maxValue > this.clampMax) this.maxValue = this.clampMax;
			}
		}
	}

	function timeToLabel(time) {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return minutes + ':' + seconds.toString().padStart(2, '0')
	}

	async function setupChart(canvas, chartData) {
		if (!canvas || !chartData || !Object.keys(chartData).length) return;

		let labels = chartData.times.map(timeToLabel);

		const minMaxCounter = createMinMaxCounter(0, 115, 1.0);

		for (let i = 0; i < chartData.times.length; i++) {
			minMaxCounter.update(chartData.realScore[i]);
			minMaxCounter.update(chartData.fullSwing[i]);
		}

		const xAxis = {
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
		};

		const yAxes = {
			score: {
				display: true,
				min: minMaxCounter.minValue,
				max: minMaxCounter.maxValue,
				position: 'left',
				ticks: {
					autoSkipPadding: 12,
				},
			}
		};

		const datasets = [
			{
				yAxisID: 'score',
				label: 'Accuracy',
				data: chartData.fullSwing,
				type: 'line',
				borderColor: '#72a8ff',
				backgroundColor: '#72a8ff',
				borderWidth: 2,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 0,
			},
			{
				yAxisID: 'score',
				label: 'Underswing',
				data: chartData.realScore,
				type: 'line',
				fill: '-1',
				borderColor: '#ff000055',
				backgroundColor: '#ff000055',
				borderWidth: 0,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 1,
			},
			{
				yAxisID: 'score',
				label: 'Total',
				data: chartData.realScore,
				type: 'line',
				fill: 'origin',
				borderColor: '#00000000',
				backgroundColor: '#00000000',
				borderWidth: 0,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 2,
			}
		];

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
								title(tooltipItems) {
									const item = tooltipItems[0];
									const labels = item.chart.data.labels;
									return labels[item.dataIndex] + " (10 seconds average)";
								},
								label(ctx) {
									const datasetLabel = ctx.dataset.label;

									let percentage;
									let value;

									switch (datasetLabel) {
										case 'Accuracy':
											value = ctx.raw;
											percentage = value / 115.0;
											return `${datasetLabel}: ${formatNumber(value - 100.0, 1)} (${formatNumber(percentage * 100, 2)}%)`;
										case 'Underswing':
											value = chartData.fullSwing[ctx.dataIndex] - ctx.raw;
											percentage = value / 115.0;
											return `${datasetLabel}: ${formatNumber(value, 1)} (-${formatNumber(percentage * 100, 2)}%)`;
										case 'Total':
											value = ctx.raw;
											percentage = value / 115.0;
											return `${datasetLabel}: ${formatNumber(value, 1)} (${formatNumber(percentage * 100, 2)}%)`;
										default: return '-';
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
			chart.options.scales.y.min = minMaxCounter.minValue;
			chart.options.scales.y.max = minMaxCounter.maxValue;
			chart.update();
		}
	}

	$: setupChart(canvas, replayAccGraphs);
</script>

{#if replayAccGraphs}
	<section class="accuracy-spread-chart" style="--height: {height}">
		<canvas class="chartjs" bind:this={canvas} />
	</section>
{/if}

<style>
	.accuracy-spread-chart {
		display: grid;
		justify-items: center;
		height: 100%;
		width: 100%;
	}

	canvas {
		width: 100% !important;
		height: var(--height);
	}
</style>
