<script>
	import Chart from 'chart.js/auto';
	Chart.defaults.color = '#fff';
	import 'chartjs-adapter-luxon';
	import {createEventDispatcher, getContext} from 'svelte';
	import {formatNumber} from '../../../utils/format';
	import {formatDate, dateFromUnix} from '../../../utils/date';
	import {configStore} from '../../../stores/config';
	import {ATTEMPT_END_TYPE, colorForEndType, titleForEndType} from '../../../utils/attempts';
	import About from '../../../pages/About.svelte';

	export let history = null;
	export let leaderboard = null;
	export let hoveredAttempt = null;
	export let height = '12em';

	const pageContainer = getContext('pageContainer');
	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;

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

	async function setupChart(canvas, currentHistory, scoreHistoryLegend, currentHoveredAttempt) {
		if (!canvas) return;

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

		let textColor = '';

		if ($configStore.preferences.apriltheme != 'flylight' && $configStore.preferences.apriltheme != 'paradise') {
			textColor = '#fff';
		} else {
			textColor = '#757575';
		}

		const pointList = currentHistory
			.filter(h => h.type == 1)
			.map((h, idx) => ({
				x: dateFromUnix(h.timeset),
				y: h.accuracy * 100,
				id: h.id,
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
				data.push({x: null, y: element.y, id: element.id});
				data.push({x: null, y: element.y, id: element.id});
			}
			data.push(element);
			if (accGoesUp) {
				data.push({x: null, y: element.y, id: element.id});
				data.push({x: null, y: element.y, id: element.id});
			}
		});

		var attempts = [];
		var attemptCounter = 0;
		currentHistory
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
			ticks: {
				color: textColor,
			},

			grid: {
				color: gridColor,
			},
		};

		const min = Math.min(...data.map(item => (item ? item.y : 0))) - 0.1;
		const max = Math.max(...data.map(item => (item ? item.y : 0))) + 0.1;

		const yAxes = {
			y: {
				display: true,
				position: 'left',
				title: {
					display: $pageContainer.name !== 'phone',
					text: 'Accuracy',
					color: textColor,
				},
				min,
				max,
				grid: {
					color: gridColor,
				},
				ticks: {
					color: textColor,
				},
			},

			a: {
				display: true,
				position: 'right',
				title: {
					display: $pageContainer.name !== 'phone',
					text: 'Attempts',
					color: textColor,
				},
				ticks: {
					callback: val => (val === Math.floor(val) ? val : null),
					precision: 0,
					color: textColor,
				},
				grid: {
					color: gridColor,
					drawOnChartArea: false,
				},
			},
		};

		let lastYIdx = 0;

		const datasets = [
			{
				label: titleForEndType(ATTEMPT_END_TYPE.Clear),
				data,
				fill: false,
				spanGaps: false,
				borderColor: element => {
					if (element.raw) {
						let opacity = 1;
						if (currentHoveredAttempt) {
							if (currentHoveredAttempt.id == element.raw.id) {
								opacity = 1;
							} else {
								opacity = 0.4;
							}
						}

						return colorForEndType(ATTEMPT_END_TYPE.Clear, opacity);
					} else {
						return colorForEndType(ATTEMPT_END_TYPE.Clear, currentHoveredAttempt ? 0.4 : 1);
					}
				},
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

		[ATTEMPT_END_TYPE.Fail, ATTEMPT_END_TYPE.Restart, ATTEMPT_END_TYPE.Quit, ATTEMPT_END_TYPE.Practice].forEach(type => {
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
				label: titleForEndType(type),
				data: currentHistory
					.filter(h => h.type == type)
					.map((h, idx) => ({
						x: dateFromUnix(h.timeset),
						y: h.accuracy * 100 <= min ? min : h.accuracy * 100 >= max ? max : h.accuracy * 100,
						id: h.id,
						time: h.time,
						endType: type,
						accuracy: h.accuracy * 100,
					})),
				borderColor: element => {
					if (element.raw) {
						let opacity = element.raw.time / songDuration;
						if (currentHoveredAttempt) {
							if (currentHoveredAttempt.id == element.raw.id) {
								opacity = 1;
							} else {
								opacity = 0.4;
							}
						}

						return colorForEndType(element.raw.endType, opacity);
					} else {
						return colorForEndType(element.dataset.endType, currentHoveredAttempt ? 0.4 : 1);
					}
				},
				borderWidth: 2,
				pointRadius: 1,
				round: 2,
				type: 'line',
				yAxisID: 'y',
				showLine: false,
				endType: type,
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
							labels: {
								color: textColor,
							},
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
					onHover: (event, activeElements) => {
						if (activeElements.length > 0) {
							const datasetIndex = activeElements[0].datasetIndex;
							const index = activeElements[0].index;
							const hoveredData = chart.data.datasets[datasetIndex].data[index];
							hoveredAttempt = history.find(h => h.id === hoveredData.id);
						} else {
							hoveredAttempt = null;
						}
					},
				},
			});
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
		} else {
			chart.data = {datasets};
			chart.options.scales = {x: xAxis, ...yAxes};
			chart.update();
		}
	}

	$: height = $configStore.preferences.graphHeight;
	$: if (height) setupChart(canvas, history, $configStore.scoreHistoryLegend, hoveredAttempt);
	$: if ($configStore.chartLegendVisible && chart) chart.update();
</script>

<section class="chart" style="--height: {height}; width: 100%;">
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
