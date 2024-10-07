<script>
	import Chart from 'chart.js/auto';
	import {formatNumber} from '../../utils/format';
	import {configStore} from '../../stores/config';
	import {BL_API_URL, BL_REPLAYS_URL, BL_ANALYZER_URL} from '../../network/queues/beatleader/api-queue';
	import {colorForEndType, endTypeForTitle, titleForEndType} from '../../utils/attempts';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import Spinner from '../Common/Spinner.svelte';

	export let score = null;
	export let leaderboard = null;
	export let history = null;
	export let hoveredAttempt = null;
	export let height = '12em';

	let canvas = null;
	let chart = null;

	let themeName = 'darkss';
	let theme = null;
	let textColor = '';

	if ($configStore.preferences.theme != 'flylight') {
		textColor = '#fff';
	} else {
		textColor = '#757575';
	}

	async function onLegendClick(event, legendItem, legend, justRefresh = false) {
		const ci = legend.chart;

		const scales = legend?.chart?.config?.options?.scales;
		if (!scales) return;

		const configStore = legend?.chart?.config?.options?.configStore;

		const {x: xAxis, ...yAxes} = scales;

		const endType = legendItem.scoreEndType;

		if (!justRefresh) {
			const idx = legendItem.datasetIndex;

			if (ci.isDatasetVisible(idx)) {
				legendItem.hidden = true;
			} else {
				legendItem.hidden = false;
			}

			var chartLegend = configStore ? configStore.get('scoreHistoryLegend') : null;
			if (chartLegend) {
				chartLegend['y' + (endType > 1 ? endType - 1 : '')] = !legendItem.hidden;
				await configStore.setForKey('scoreHistoryLegend', chartLegend);
			}
		}
	}

	let data = null;
	function fetchData(score, leaderboard) {
		data = null;
		if (!score || !leaderboard) return;
		fetch(`${BL_API_URL}map/scorestats/graph?playerId=${score.playerId}&leaderboardId=${leaderboard.leaderboardId}`, {
			credentials: 'include',
		})
			.then(r => r.json())
			.then(r => {
				data = r;
			});
	}

	async function setupChart(canvas, chartData, scoreHistoryLegend, hoveredAttempt) {
		if (!canvas || !chartData || !chartData.scores || !chartData.scores.length) return;

		let minValue = 100;
		let maxValue = 0;

		function updateMinMax(values) {
			if (!values) return;
			const minV = Math.floor(Math.max(Math.floor(values.reduce((min, cur) => (cur < min ? cur : min), 100)), 0));
			const maxV = Math.ceil(Math.min(Math.ceil(values.reduce((max, cur) => (cur > max ? cur : max), 0)), 100));
			if (minV < minValue) minValue = minV;
			if (maxV > maxValue) maxValue = maxV;
		}

		const datasets = [];
		const types = new Set();

		chartData.scores.forEach((score, index) => {
			const scoreAttempt = history.find(h => h.id === score.attemptId);
			score.type = scoreAttempt?.type ?? 1;
			score.timeset = scoreAttempt?.timeset ?? 0;
			const data = score.notes.map(note => ({
				x: note.spawnTime,
				y: 100 - note.accuracy * 100,
			}));

			const hidden = !scoreHistoryLegend['y' + (score.type > 1 ? score.type - 1 : '')];
			if (!hidden) {
				updateMinMax(data.map(d => d.y));
			}

			datasets.push({
				label: `${titleForEndType(score.type)} - ${formatDateRelative(dateFromUnix(score.timeset))}`,
				data: data,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				borderColor: colorForEndType(
					score.type,
					hoveredAttempt == null
						? index / (chartData.scores.length - 1)
						: hoveredAttempt.id == score.attemptId
							? 1
							: (index / (chartData.scores.length - 1)) * 0.6
				),
				borderWidth: hoveredAttempt?.id == score.attemptId ? 3 : 2,
				pointRadius: 0,
				hidden,
				type: 'line',
			});
		});

		const maxTime = Math.max(...chartData.scores.flatMap(score => score.notes.map(note => note.spawnTime)));

		if (!chart) {
			chart = new Chart(canvas, {
				type: 'line',
				data: {datasets},
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
							display: true,
							onClick: onLegendClick,
							labels: {
								generateLabels: function (chart) {
									var labels = Chart.defaults.plugins.legend.labels
										.generateLabels(chart)
										.filter((label, index, self) => index === self.findIndex(t => t.text.split(' - ')[0] === label.text.split(' - ')[0]));

									labels.forEach(label => {
										label.text = label.text.split(' - ')[0];
										label.scoreEndType = endTypeForTitle(label.text);
										label.strokeStyle = colorForEndType(label.scoreEndType);
									});

									return labels;
								},
							},
						},
						tooltip: {
							callbacks: {
								title(ctx) {
									return (
										Math.floor(ctx[0].raw?.x / 60) +
										':' +
										Math.round(ctx[0].raw?.x % 60)
											.toString()
											.padStart(2, '0')
									);
								},
								label(ctx) {
									return `${ctx.dataset.label}: ${formatNumber(100 - ctx.parsed.y)}%`;
								},
							},
						},
					},
					scales: {
						x: {
							type: 'linear',
							position: 'bottom',
							min: 0,
							max: maxTime,
							ticks: {
								callback: function (value) {
									return (
										Math.floor(value / 60) +
										':' +
										Math.round(value % 60)
											.toString()
											.padStart(2, '0')
									);
								},
								color: textColor,
							},
						},
						y: {
							type: 'logarithmic',
							reverse: true,
							ticks: {
								callback: function (val) {
									return 100 - val + '%';
								},
								color: textColor,
							},
						},
					},
					configStore,
				},
			});
		} else {
			chart.data = {datasets};
			chart.options.scales.x.max = maxTime;
			chart.update();
		}

		canvas.addEventListener('mousemove', function (e) {
			var rect = e.target.getBoundingClientRect();
			var y = e.clientY - rect.top; //y position within the element.
			if (y < 30) {
				document.body.style.cursor = 'pointer';
			} else {
				document.body.style.cursor = 'default';
			}
		});

		canvas.addEventListener('mouseout', function (e) {
			document.body.style.cursor = 'default';
		});
	}

	$: fetchData(score, leaderboard);
	$: data && canvas && setupChart(canvas, data, $configStore.scoreHistoryLegend, hoveredAttempt);
</script>

<section class="accuracy-chart" style="--height: {height}">
	{#if data}
		<canvas class="chartjs" bind:this={canvas} />
	{:else}
		<Spinner />
		<span>Loading...</span>
	{/if}
</section>

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
