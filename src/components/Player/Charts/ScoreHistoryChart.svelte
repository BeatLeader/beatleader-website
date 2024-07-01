<script>
	import Chart from 'chart.js/auto';
	Chart.defaults.color = '#fff';
	import 'chartjs-adapter-luxon';
	import {createEventDispatcher, getContext} from 'svelte';
	import {formatNumber} from '../../../utils/format';
	import createStatsHistoryStore from '../../../stores/beatleader/stats-history';
	import {formatDate, formatDateWithOptions, toBlMidnight, dateFromUnix} from '../../../utils/date';
	import {debounce} from '../../../utils/debounce';
	import stringify from 'json-stable-stringify';
	import {configStore} from '../../../stores/config';

	export let history = null;
	export let leaderboard = null;
	export let height = '12em';

	const CHART_DEBOUNCE = 300;
	const MAGIC_INACTIVITY_RANK = 999999;

	const pageContainer = getContext('pageContainer');
	const statsHistoryStore = createStatsHistoryStore();
	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;

	let lastHistoryHash = null;
	let activityHistory = null;

	const calcHistoryHash = statsHistory => stringify(statsHistory);

	function timeToLabel(time) {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return minutes + ':' + seconds.toString().padStart(2, '0');
	}

	async function onLegendClick(event, legendItem, legend, justRefresh = false) {
		const ci = legend.chart;

		const scales = legend?.chart?.config?.options?.scales;
		if (!scales) return;

		const configStore = legend?.chart?.config?.options?.configStore;

		const {x: xAxis, ...yAxes} = scales;

		if (!justRefresh) {
			const idx = legendItem.datasetIndex;
			if (ci.isDatasetVisible(idx)) {
				ci.hide(idx);
				legendItem.hidden = true;
			} else {
				ci.show(idx);
				legendItem.hidden = false;
			}

			var chartLegend = configStore ? configStore.get('scoreHistoryLegend') : null;
			if (chartLegend) {
				chartLegend['y' + (idx ? '' + idx : '')] = !legendItem.hidden;
				await configStore.setForKey('scoreHistoryLegend', chartLegend);
			}
		}

		// if (legend?.chart) {
		// 	const yAxisIdsToShow = (legend?.legendItems ?? [])
		// 		.sort(
		// 			(a, b) =>
		// 				(ci?.config?.data?.datasets?.[a?.datasetIndex]?.axisOrder ?? a?.datasetIndex) -
		// 				(ci?.config?.data?.datasets?.[b?.datasetIndex]?.axisOrder ?? b?.datasetIndex)
		// 		)
		// 		.reduce(
		// 			(cum, legendItem) => {
		// 				// done
		// 				if (cum.second) return cum;

		// 				// skip hidden legend items
		// 				if (legendItem?.hidden) return cum;

		// 				const yAxisId = ci?.getDatasetMeta(legendItem?.datasetIndex)?.yAxisID ?? null;
		// 				if (!yAxisId) return cum;

		// 				if (!cum.first) {
		// 					cum.first = yAxisId;
		// 				} else if (yAxisId !== cum.first) {
		// 					cum.second = yAxisId;
		// 				}

		// 				return cum;
		// 			},
		// 			{first: null, second: null}
		// 		);

		// 	Object.keys(yAxes).forEach(currentAxisKey => {
		// 		if (![yAxisIdsToShow.first, yAxisIdsToShow.second].includes(currentAxisKey)) {
		// 			yAxes[currentAxisKey].display = false;
		// 			return;
		// 		}

		// 		yAxes[currentAxisKey].display = true;
		// 		if (yAxisIdsToShow.first === currentAxisKey) yAxes[currentAxisKey].position = 'left';
		// 		if (yAxisIdsToShow.second === currentAxisKey) yAxes[currentAxisKey].position = 'right';
		// 	});

		// 	legend.chart.options.scales = {x: xAxis, ...yAxes};
		// 	legend.chart.update();
		// }
	}

	async function setupChart(hash, canvas, history, scoreHistoryLegend) {
		if (!hash || !canvas || chartHash === lastHistoryHash) return;

		lastHistoryHash = chartHash;

		const gridColor = '#2a2a2a';
		const rankColor = '#3e95cd';
		const countryRankColor = '#8992e8';
		const ppColor = '#007100';
		const rankedPlayCountColor = '#3e3e3e';
		const totalPlayCountColor = '#fff';

		const activityColor = '#333';
		const rankedActivityColor = '#eb008c';
		const improvementsColor = '#474747';
		const rankedImprovementsColor = '#f04dae';

		const songDuration = leaderboard.song.duration;

		const pointList = history
			.filter(h => h.type == 1)
			.map((h, idx) => ({
				x: dateFromUnix(h.timeset),
				y: h.accuracy * 100,
			}));

		const data = [];
		const detached = [];
		var maxAcc = -1;
		var accGoesUp = false;
		pointList.reverse().forEach(element => {
			if (element.y > maxAcc) {
				data.push(element);
				if (maxAcc != -1) {
					accGoesUp = true;
				}
				maxAcc = element.y;
			} else {
				detached.push(element);
			}
		});
		detached.forEach(element => {
			if (accGoesUp) {
				data.push({x: null, y: element.y});
				data.push({x: null, y: element.y});
			}
			data.push(element);
			if (accGoesUp) {
				data.push({x: null, y: element.y});
				data.push({x: null, y: element.y});
			}
		});

		var attempts = [];
		var attemptCounter = 0;
		history
			.sort((a, b) => a.timeset - b.timeset)
			.filter(s => {
				return scoreHistoryLegend['y' + (s.type > 1 ? s.type - 1 : '')];
			})
			.forEach(h => {
				attemptCounter++;
				attempts.push({
					x: dateFromUnix(h.timeset),
					y: attemptCounter,
				});
			});

		const xAxis = {
			type: 'time',
			display: true,
			offset: true,
			scaleLabel: {
				display: false,
			},

			grid: {
				color: gridColor,
			},
		};

		const datasets = [
			{
				label: 'Clear',
				data,
				fill: false,
				spanGaps: false,
				borderColor: rankColor,
				borderWidth: 3,
				pointRadius: 2,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				round: 2,
				type: 'line',
				yAxisID: 'y',
				hidden: !$configStore.scoreHistoryLegend.y,
			},
		];

		const min = Math.min(...data.map(item => (item ? item.y : 0))) - 0.1;
		const max = Math.max(...data.map(item => (item ? item.y : 0))) + 0.1;

		const yAxes = {
			y: {
				display: true,
				position: 'left',
				title: {
					display: $pageContainer.name !== 'phone',
					text: 'Accuracy',
				},
				min,
				max,
				grid: {
					color: gridColor,
				},
			},

			a: {
				display: true,
				position: 'right',
				title: {
					display: $pageContainer.name !== 'phone',
					text: 'Attempts',
				},
				ticks: {
					callback: val => (val === Math.floor(val) ? val : null),
					precision: 0,
				},
				grid: {
					color: gridColor,
				},
			},
		};

		let lastYIdx = 0;

		[
			{key: 2, label: 'Fail', borderColor: 'rgba(255, 0, 0, '},
			{key: 3, label: 'Restart', borderColor: 'rgba(255, 137, 10, '},
			{key: 4, label: 'Quit', borderColor: 'rgba(255, 255, 255, '},
			{key: 5, label: 'Practice', borderColor: 'rgba(255, 243, 10, '},
		].forEach(obj => {
			const {key, label, borderColor} = obj;

			lastYIdx++;
			const axisKey = `y${lastYIdx}`;
			// yAxes[axisKey] = {
			// 	position: 'right',
			// 	title: {
			// 		display: $pageContainer.name !== 'phone',
			// 		text: label,
			// 	},
			// 	ticks: {
			// 		callback: val => (val === Math.floor(val) ? val : null),
			// 		precision: 2,
			// 	},
			// 	grid: {
			// 		drawOnChartArea: false,
			// 	},
			// };

			datasets.push({
				label: label,
				data: history
					.filter(h => h.type == key)
					.map((h, idx) => ({
						x: dateFromUnix(h.timeset),
						y: h.accuracy * 100 <= min ? min : h.accuracy * 100 >= max ? max : h.accuracy * 100,
						time: h.time,
						borderColor,
						accuracy: h.accuracy * 100,
					})),
				borderColor: element => {
					if (element.raw) {
						return element.raw.borderColor + element.raw.time / songDuration + ')';
					} else {
						return element.dataset.labelBorderColor + '1)';
					}
				},
				borderWidth: 2,
				pointRadius: 1,
				labelBorderColor: borderColor,
				round: 2,
				type: 'line',
				yAxisID: 'y',
				showLine: false,
				hidden: !$configStore.scoreHistoryLegend[axisKey],
			});
		});

		datasets.push({
			label: 'Attempts',
			data: attempts,
			fill: false,
			borderColor: 'purple',
			cubicInterpolationMode: 'default',
			borderWidth: 3,
			pointRadius: 2,
			tension: 0.2,
			round: 2,
			type: 'line',
			yAxisID: 'a',
		});

		if (!chart) {
			chart = new Chart(canvas, {
				type: 'line',
				data: {datasets},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					animation: false,
					layout: {
						padding: {
							right: 0,
						},
					},
					plugins: {
						legend: {
							display: true,
							onClick: onLegendClick,
						},
						tooltip: {
							callbacks: {
								title(ctx) {
									if (!ctx?.[0]?.raw) return '';

									return formatDate(new Date(ctx[0].raw?.x), 'short', 'short');
								},
								label(ctx) {
									switch (ctx.dataset.label) {
										case 'Clear':
											return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, 2)}%`;
										case 'Attempts':
											return ` Attempt #${ctx.parsed.y}`;
										default:
											return ` ${ctx.dataset.label}: ${formatNumber(ctx.raw.accuracy, 2)}% at ${timeToLabel(ctx.raw.time)} of ${timeToLabel(
												songDuration
											)}`;
									}
								},
							},
						},
					},
					scales: {
						x: xAxis,
						...yAxes,
					},
					configStore,
				},
			});
		} else {
			chart.data = {datasets};
			chart.options.scales = {x: xAxis, ...yAxes};
			chart.update();
		}

		dispatch('height-changed');

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

		onLegendClick(null, null, chart.legend, true);
	}

	let debouncedChartHash = null;
	const debounceChartHash = debounce(chartHash => (debouncedChartHash = chartHash), CHART_DEBOUNCE);

	$: chartHash = calcHistoryHash(history);
	$: debounceChartHash(chartHash);
	$: height = $configStore.preferences.graphHeight;
	$: if (debouncedChartHash || height) setupChart(debouncedChartHash, canvas, history, $configStore.scoreHistoryLegend);
	$: if ($configStore.chartLegendVisible && chart) chart.update();
</script>

<section class="chart" style="--height: {height}">
	<canvas class="chartjs" bind:this={canvas} {height} />
</section>

<style>
	section {
		position: relative;
		margin: 1rem auto 0 auto;
		height: var(--height, 300px);
	}

	canvas {
		width: 100% !important;
	}
</style>
