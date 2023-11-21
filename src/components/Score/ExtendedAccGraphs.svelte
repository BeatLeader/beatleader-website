<script>
	import Chart from 'chart.js/auto';
	import {formatNumber} from '../../utils/format';
	import {createMinMaxCounter, createDistanceWeightFunction} from '../../utils/math';

	export let replayAccGraphs = null;
	export let underswingsData = null;
	export let height = '12em';
	export let beatSavior = null;
	export let notes = null;

	let canvas = null;
	let chart = null;

	function timeToLabel(time) {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return minutes + ':' + seconds.toString().padStart(2, '0');
	}

	function processChartData(chartData, resolution, smoothPeriodPercentage, weightFunctionSteepness) {
		var data = [];
		if (chartData.length === 0 || resolution === 0) return data;

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
			const value = 100 + (sum / divider) * 15;
			data.push(value);
		}

		return data;
	}

	async function setupChart(canvas, chartData, underswingsData, notes) {
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

		var hands = [];
		if (beatSavior?.stats?.accLeft) {
			hands.push('red');
		}
		if (beatSavior?.stats?.accRight) {
			hands.push('blue');
		}
		if (hands.length == 2) {
			hands.push('total');
		}

		for (let i = 0; i < chartData.times.length; i++) {
			hands.forEach(saberType => {
				minMaxCounter.update(chartData.realScoreBySaber[saberType][i]);
				minMaxCounter.update(chartData.fullSwingBySaber[saberType][i]);
			});
		}

		var datasets = [];

		if (notes) {
			var notesData = processChartData(notes.rows, 100, 0.02, 3);

			for (let i = 0; i < notesData.length; i++) {
				minMaxCounter.update(notesData[i]);
			}

			datasets.push({
				yAxisID: 'score',
				label: 'Predicted',
				data: notesData,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				borderColor: '#fe4dfe',
				borderWidth: 1,
				pointRadius: 0,
				type: 'line',
				borderDash: [3, 3],
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

		if (beatSavior?.stats?.accLeft) {
			datasets.push({
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
			});
			datasets.push({
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
			});
		}

		if (beatSavior?.stats?.accRight) {
			datasets.push({
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
			});
			datasets.push({
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
			});
		}

		datasets = datasets.concat([
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
		]);

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
			if (chart.options.scales.y) {
				chart.options.scales.y.min = minMaxCounter.minValue;
				chart.options.scales.y.max = minMaxCounter.maxValue;
			}
			if (chart.plugins.title) {
				chart.plugins.title.text = title;
			}
			chart.update();
		}
	}

	$: setupChart(canvas, replayAccGraphs, underswingsData, notes);
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
