<script>
	import Chart from 'chart.js/auto';
	import {formatNumber} from '../../utils/format';

	export let replayAccGraphs = null;
	export let underswingsData = null;
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
			},
		};
	}

	function timeToLabel(time) {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return minutes + ':' + seconds.toString().padStart(2, '0');
	}

	async function setupChart(canvas, chartData) {
		if (!canvas || !chartData || !Object.keys(chartData).length) return;

		const title =
			underswingsData?.noUnderswingsScore > underswingsData?.score
				? `Lost by underswings: ${formatNumber(underswingsData.noUnderswingsScore - underswingsData.score, 0)}pts, ${formatNumber(
						underswingsData.noUnderswingsAcc - underswingsData.acc,
						2
				  )}% acc` +
				  (underswingsData?.noUnderswingsPp && underswingsData?.noUnderswingsPp > underswingsData?.pp
						? `, ${formatNumber(underswingsData.noUnderswingsPp - underswingsData.pp, 2)}pp`
						: '')
				: null;

		let labels = chartData.times.map(timeToLabel);

		const minMaxCounter = createMinMaxCounter(0, 115, 1.0);

		for (let i = 0; i < chartData.times.length; i++) {
			['red', 'blue', 'total'].forEach(saberType => {
				minMaxCounter.update(chartData.realScoreBySaber[saberType][i]);
				minMaxCounter.update(chartData.fullSwingBySaber[saberType][i]);
			});
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
					color: 'white',
				},
			},
		};

		const datasets = [
			{
				yAxisID: 'score',
				label: 'Accuracy (left)',
				data: chartData.fullSwingBySaber.red,
				type: 'line',
				borderColor: '#ee5555',
				backgroundColor: '#ee5555',
				borderWidth: 2,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 3,
			},
			{
				yAxisID: 'score',
				label: 'Underswing (left)',
				data: chartData.realScoreBySaber.red,
				type: 'line',
				fill: '-1',
				borderColor: '#ee555555',
				backgroundColor: '#ee555555',
				borderWidth: 0,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 4,
			},
			{
				yAxisID: 'score',
				label: 'Accuracy (right)',
				data: chartData.fullSwingBySaber.blue,
				type: 'line',
				borderColor: '#5555ee',
				backgroundColor: '#5555ee',
				borderWidth: 2,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 5,
			},
			{
				yAxisID: 'score',
				label: 'Underswing (right)',
				data: chartData.realScoreBySaber.blue,
				type: 'line',
				fill: '-1',
				borderColor: '#5555ee55',
				backgroundColor: '#5555ee55',
				borderWidth: 0,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 6,
			},
			{
				yAxisID: 'score',
				label: 'Accuracy',
				data: chartData.fullSwingBySaber.total,
				type: 'line',
				borderColor: 'white',
				backgroundColor: 'white',
				borderWidth: 2,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 1,
			},
			{
				yAxisID: 'score',
				label: 'Underswing',
				data: chartData.realScoreBySaber.total,
				type: 'line',
				fill: '-1',
				borderColor: '#aaaaaa55',
				backgroundColor: '#aaaaaa55',
				borderWidth: 0,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 2,
			},
			{
				yAxisID: 'score',
				label: 'Score',
				data: chartData.realScoreBySaber.total,
				type: 'line',
				borderColor: '#aaaaaa',
				backgroundColor: '#aaaaaa',
				borderWidth: 1,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				spanGaps: true,
				order: 0,
			},
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
						title: {
							display: !!title?.length,
							text: title,
							color: 'white',
							font: {weight: 'normal'},
							position: 'bottom',
							padding: {top: 5, bottom: 0},
						},
						tooltip: {
							callbacks: {
								title(tooltipItems) {
									const item = tooltipItems[0];
									const labels = item.chart.data.labels;
									return labels[item.dataIndex] + ' (10 seconds average)';
								},
								label(ctx) {
									const datasetLabel = ctx.dataset.label;

									let percentage;
									let value;

									switch (datasetLabel) {
										case 'Underswing (left)':
											value = ctx.raw - chartData.fullSwingBySaber.red[ctx.dataIndex];
											percentage = value / 115.0;
											return `${datasetLabel}: ${formatNumber(value, 1)} (${formatNumber(percentage * 100, 2)}%)`;
										case 'Underswing (right)':
											value = ctx.raw - chartData.fullSwingBySaber.blue[ctx.dataIndex];
											percentage = value / 115.0;
											return `${datasetLabel}: ${formatNumber(value, 1)} (${formatNumber(percentage * 100, 2)}%)`;
										case 'Underswing':
											value = ctx.raw - chartData.fullSwingBySaber.total[ctx.dataIndex];
											percentage = value / 115.0;
											return `${datasetLabel}: ${formatNumber(value, 1)} (${formatNumber(percentage * 100, 2)}%)`;
										case 'Score':
											value = ctx.raw;
											percentage = value / 115.0;
											return `${datasetLabel}: ${formatNumber(value, 1)} (${formatNumber(percentage * 100, 2)}%)`;
										default:
											value = ctx.raw;
											percentage = value / 115.0;
											return `${datasetLabel}: ${formatNumber(value - 100.0, 1)} (${formatNumber(percentage * 100, 2)}%)`;
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
			chart.plugins.title.text = title;
			chart.update();
		}
	}

	$: setupChart(canvas, replayAccGraphs, underswingsData);
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
