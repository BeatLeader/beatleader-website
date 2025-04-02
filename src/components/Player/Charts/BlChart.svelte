<script>
	import Chart from 'chart.js/auto';
	import 'chartjs-adapter-luxon';
	import {createEventDispatcher, getContext} from 'svelte';
	import {formatNumber} from '../../../utils/format';
	import createStatsHistoryStore from '../../../stores/beatleader/stats-history';
	import {formatDate, formatDateWithOptions, toBlMidnight, dateFromUnix} from '../../../utils/date';
	import {debounce} from '../../../utils/debounce';
	import {onLegendClick} from './utils/legend-click-handler';
	import stringify from 'json-stable-stringify';
	import {configStore} from '../../../stores/config';

	export let playerId = null;

	const CHART_DEBOUNCE = 300;
	const MAGIC_INACTIVITY_RANK = 999999;

	const pageContainer = getContext('pageContainer');
	const statsHistoryStore = createStatsHistoryStore();
	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;

	let lastHistoryHash = null;
	let activityHistory = null;

	let timeout = null;

	let markers = [
		{
			time: 1737763200,
			color: '#777777',
			label: 'PPv3.5 reweight',
			link: 'https://beatleader.wiki/en/ranking/update3-5',
			marker: 'R',
		},
	];

	const calcHistoryHash = statsHistory => stringify(statsHistory);

	async function setupChart(hash, canvas, statsHistory, height) {
		if (!hash || !canvas || !statsHistory?.rank?.length || chartHash === lastHistoryHash) return;

		let rankHistory = statsHistory.rank;
		const CHART_DAYS = rankHistory.length;

		lastHistoryHash = chartHash;

		var gridColor = '#2a2a2a';
		var rankColor = '#3e95cd';
		var countryRankColor = '#8992e8';
		var ppColor = '#007100';
		var rankedPlayCountColor = '#3e3e3e';
		var totalPlayCountColor = '#fff';

		var activityColor = '#333';
		var rankedActivityColor = '#eb008c';
		var improvementsColor = '#474747';
		var rankedImprovementsColor = '#f04dae';

		Chart.defaults.color = '#fff';

		if ($configStore.preferences.theme == 'flylight') {
			gridColor = '#dadadaaf';
			rankColor = '#3e95cd';
			countryRankColor = '#8992e8';
			ppColor = '#007100';
			rankedPlayCountColor = '#3e3e3e';
			totalPlayCountColor = '#fff';

			activityColor = '#333';
			rankedActivityColor = '#eb008c';
			improvementsColor = '#474747';
			rankedImprovementsColor = '#f04dae';

			Chart.defaults.color = '#757575';
		}

		const dayTimestamps = statsHistory.timestamp.map(unix => dateFromUnix(unix).getTime());

		const nomTimestamp = dayTimestamps[dayTimestamps.length - 1];
		const data = rankHistory.map((h, idx) => ({
			x: dayTimestamps[idx],
			y: h === MAGIC_INACTIVITY_RANK ? null : h,
		}));

		const datasets = [
			{
				yAxisID: 'y',
				label: 'Rank',
				data,
				fill: false,
				borderColor: rankColor,
				borderWidth: 3,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				round: 0,
				type: 'line',
				hidden: !$configStore.chartLegend.y,
			},
		];

		const xAxis = {
			type: 'time',
			display: true,
			offset: true,
			time: {
				unit: 'day',
			},
			scaleLabel: {
				display: false,
			},
			ticks: {
				autoSkip: false,
				major: {
					enabled: true,
				},
				font: function (context) {
					if (context.tick && context.tick.major) {
						return {
							weight: 'bold',
						};
					}
				},
				callback: (val, idx, ticks) => {
					if (!ticks?.[idx]) return '';

					return formatDateWithOptions(new Date(ticks[idx]?.value), {
						localeMatcher: 'best fit',
						day: '2-digit',
						month: 'short',
					});
				},
			},
			grid: {
				color: gridColor,
			},
		};

		const yAxes = {
			y: {
				display: true,
				position: 'left',
				reverse: true,
				title: {
					display: $pageContainer.name !== 'phone',
					text: 'Rank',
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

		const skipped = (ctx, value) => (ctx.p0.skip || ctx.p1.skip ? value : undefined);

		[
			{key: 'pp', name: 'PP', borderColor: ppColor, round: 2, precision: 0},
			{
				key: 'countryRank',
				name: 'Country rank',
				borderColor: countryRankColor,
				round: 0,
				axisDisplay: false,
				precision: 0,
				reverse: true,
			},
			{
				key: 'rankedPlayCount',
				name: 'Ranked play count',
				borderColor: rankedPlayCountColor,
				round: 0,
				axisDisplay: false,
				precision: 0,
			},
			{
				key: 'totalPlayCount',
				name: 'Total play count',
				borderColor: totalPlayCountColor,
				round: 0,
				axisDisplay: false,
				precision: 0,
			},
		].forEach(obj => {
			const {key, name, usePrevAxis, precision, reverse, ...options} = obj;

			if (!statsHistory?.[key]) return;

			const fieldData = dayTimestamps.map((x, idx) => ({x, y: statsHistory?.[key]?.[idx] ?? null}));

			if (!usePrevAxis) lastYIdx++;
			const axisKey = `y${lastYIdx}`;
			yAxes[axisKey] = {
				position: 'right',
				title: {
					display: $pageContainer.name !== 'phone',
					text: name,
				},
				ticks: {
					callback: val => (val === Math.floor(val) ? val : null),
					precision,
				},
				grid: {
					drawOnChartArea: false,
				},
				reverse: reverse === true,
			};

			datasets.push({
				...options,
				hidden: !$configStore.chartLegend[axisKey],
				yAxisID: axisKey,
				label: name,
				data: fieldData,
				fill: false,
				borderWidth: 2,
				pointRadius: 1,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				type: 'line',
				spanGaps: true,
				segment: {
					borderWidth: ctx => skipped(ctx, 1),
					borderDash: ctx => skipped(ctx, [6, 6]),
				},
			});
		});

		if (
			statsHistory?.rankedPlayCountDaily?.length ||
			statsHistory?.unrankedPlayCountDaily?.length ||
			statsHistory?.rankedImprovementsCountDaily?.length ||
			statsHistory?.unrankedImprovementsCountDaily?.length
		) {
			lastYIdx++;
			const scoresAxisKey = `y${lastYIdx}`;

			yAxes[scoresAxisKey] = {
				display: false,
				position: 'right',
				title: {
					display: $pageContainer.name !== 'phone',
					text: 'Daily scores',
				},
				ticks: {
					callback: val => val,
					precision: 0,
				},
				grid: {
					drawOnChartArea: false,
				},
			};

			if (statsHistory?.rankedPlayCountDaily?.length) {
				datasets.push({
					yAxisID: scoresAxisKey,
					label: 'Ranked scores',
					data: dayTimestamps.map((x, idx) => ({x, y: statsHistory.rankedPlayCountDaily?.[idx] ?? null})),
					fill: false,
					borderColor: rankedActivityColor,
					backgroundColor: rankedActivityColor,
					round: 0,
					type: 'bar',
					maxBarThickness: 25,
					stack: 'daily-scores',
					order: 0,
					hidden: !$configStore.chartLegend[scoresAxisKey],
				});
			}

			if (statsHistory?.unrankedPlayCountDaily?.length) {
				datasets.push({
					yAxisID: scoresAxisKey,
					label: 'Unranked scores',
					data: dayTimestamps.map((x, idx) => ({x, y: statsHistory.unrankedPlayCountDaily?.[idx] ?? null})),
					fill: false,
					borderColor: activityColor,
					backgroundColor: activityColor,
					round: 0,
					type: 'bar',
					maxBarThickness: 25,
					stack: 'daily-scores',
					order: 1,
					hidden: !$configStore.chartLegend[scoresAxisKey],
				});
			}

			if (statsHistory?.rankedImprovementsCountDaily?.length) {
				datasets.push({
					yAxisID: scoresAxisKey,
					label: 'Ranked improved',
					data: dayTimestamps.map((x, idx) => ({x, y: statsHistory.rankedImprovementsCountDaily?.[idx] ?? null})),
					fill: false,
					borderColor: rankedImprovementsColor,
					backgroundColor: rankedImprovementsColor,
					round: 0,
					type: 'bar',
					maxBarThickness: 25,
					stack: 'daily-scores',
					order: 0,
					hidden: !$configStore.chartLegend[scoresAxisKey],
				});
			}

			if (statsHistory?.unrankedImprovementsCountDaily?.length) {
				datasets.push({
					yAxisID: scoresAxisKey,
					label: 'Unranked improved',
					data: dayTimestamps.map((x, idx) => ({x, y: statsHistory.unrankedImprovementsCountDaily?.[idx] ?? null})),
					fill: false,
					borderColor: improvementsColor,
					backgroundColor: improvementsColor,
					round: 0,
					type: 'bar',
					maxBarThickness: 25,
					stack: 'daily-scores',
					order: 1,
					hidden: !$configStore.chartLegend[scoresAxisKey],
				});
			}
		}

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
					interaction: {
						mode: 'index',
						intersect: false,
					},
					plugins: {
						legend: {
							display: true,
							onClick: onLegendClick,
							labels: {
								filter: item => $configStore.chartLegendVisible['y' + item.datasetIndex],
							},
						},
						tooltip: {
							position: 'nearest',
							callbacks: {
								title(ctx) {
									if (!ctx?.[0]?.raw) return '';

									return ctx[0].raw?.x == nomTimestamp ? 'Now' : formatDate(new Date(ctx[0].raw?.x), 'short', 'short');
								},
								label(ctx) {
									switch (ctx.dataset.label) {
										case 'Rank':
											return ` ${ctx.dataset.label}: #${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
										case 'Country rank':
											return ` ${ctx.dataset.label}: #${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
										case 'PP':
											return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}pp`;
										default:
											return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
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
				plugins: [
					{
						id: 'markers',
						afterDraw: chart => {
							const ctx = chart.ctx;
							const xAxis = chart.scales.x;
							const yAxis = chart.scales.y;

							markers
								.filter(m => m.time >= statsHistory.timestamp[0])
								.forEach(marker => {
									const x = xAxis.getPixelForValue(marker.time * 1000);

									// Draw vertical line
									ctx.beginPath();
									ctx.strokeStyle = marker.color;
									ctx.lineWidth = 2;
									ctx.moveTo(x, yAxis.top);
									ctx.lineTo(x, yAxis.top + yAxis.height);
									ctx.stroke();

									// Draw marker letter
									ctx.font = '15px Arial';
									ctx.fillStyle = marker.color;
									ctx.textAlign = 'center';
									ctx.fillText(marker.marker, x, yAxis.top - 8);
								});
						},
					},
				],
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

		clearTimeout(timeout);
		timeout = setTimeout(() => {
			// Draw markers
			const ctx = chart.ctx;
			const xAxisScale = chart.scales.x;
			const yAxisScale = chart.scales.y;

			markers
				.filter(m => m.time >= statsHistory.timestamp[0])
				.forEach(marker => {
					const x = xAxisScale.getPixelForValue(marker.time * 1000);

					const hitArea = {
						x: x - 10,
						y: yAxisScale.top - 20,
						width: 20,
						height: yAxisScale.height + 20,
					};

					canvas.addEventListener('mousemove', e => {
						const rect = canvas.getBoundingClientRect();
						const mouseX = e.clientX - rect.left;
						const mouseY = e.clientY - rect.top;

						chart.draw();

						if (mouseX >= hitArea.x && mouseX <= hitArea.x + hitArea.width && mouseY >= hitArea.y && mouseY <= hitArea.y + hitArea.height) {
							ctx.beginPath();
							ctx.strokeStyle = '#999999';
							ctx.lineWidth = 2;
							ctx.moveTo(x, yAxisScale.top);
							ctx.lineTo(x, yAxisScale.top + yAxisScale.height);
							ctx.stroke();

							const textMetrics = ctx.measureText(marker.marker);
							const padding = 3;
							const rectWidth = textMetrics.width + padding * 2;
							const rectHeight = 20;
							const rectX = x - rectWidth / 2;
							const rectY = yAxisScale.top - rectHeight;

							ctx.beginPath();
							ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 4);
							ctx.strokeStyle = marker.color + '80';
							ctx.lineWidth = 1;
							ctx.stroke();

							const tooltipPadding = 6;
							const tooltipHeight = 24;
							const tooltipText = marker.label;
							ctx.font = '14px Arial';
							const tooltipWidth = ctx.measureText(tooltipText).width + tooltipPadding * 2;

							const tooltipX = x - tooltipWidth / 2;
							const tooltipY = mouseY - tooltipHeight - 10;

							ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
							ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

							// Draw tooltip text
							ctx.fillStyle = '#fff';
							ctx.textAlign = 'center';
							ctx.textBaseline = 'middle';
							ctx.fillText(tooltipText, tooltipX + tooltipWidth / 2, tooltipY + tooltipHeight / 2);

							document.body.style.cursor = 'pointer';
						}
					});

					canvas.addEventListener('click', e => {
						const rect = canvas.getBoundingClientRect();
						const mouseX = e.clientX - rect.left;
						const mouseY = e.clientY - rect.top;

						console.log(mouseX, mouseY);

						if (mouseX >= hitArea.x && mouseX <= hitArea.x + hitArea.width && mouseY >= hitArea.y && mouseY <= hitArea.y + hitArea.height) {
							if (marker.link) {
								window.open(marker.link, '_blank');
							}
						}
					});
				});
		}, 1000);

		onLegendClick(null, null, chart.legend, true);
	}

	let debouncedChartHash = null;
	const debounceChartHash = debounce(chartHash => (debouncedChartHash = chartHash), CHART_DEBOUNCE);

	$: statsHistory = $statsHistoryStore[playerId];
	$: chartHash = calcHistoryHash(statsHistory);
	$: debounceChartHash(chartHash);
	$: height = $configStore.preferences.graphHeight;
	$: if (debouncedChartHash || height) setupChart(debouncedChartHash, canvas, statsHistory, height);
	$: if ($configStore.chartLegendVisible && chart) chart.update();
</script>

{#if statsHistory?.rank?.length}
	<section class="chart" style="--height: {height}px">
		<canvas class="chartjs" bind:this={canvas} {height} />
	</section>
{/if}

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
