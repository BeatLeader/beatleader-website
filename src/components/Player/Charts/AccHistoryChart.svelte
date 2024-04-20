<script>
	import Chart from 'chart.js/auto';
	import createStatsHistoryStore from '../../../stores/beatleader/stats-history';
	import {formatNumber} from '../../../utils/format';
	import {formatDate, formatDateWithOptions, toBlMidnight} from '../../../utils/date';
	import {debounce} from '../../../utils/debounce';
	import {onLegendClick} from './utils/legend-click-handler';
	import {getContext} from 'svelte';
	import {DateTime} from 'luxon';
	import stringify from 'json-stable-stringify';
	import {configStore} from '../../../stores/config';

	export let playerId = null;

	const CHART_DAYS = 50;
	const CHART_DEBOUNCE = 300;

	const pageContainer = getContext('pageContainer');
	const statsHistoryStore = createStatsHistoryStore();

	let canvas = null;
	let chart = null;

	let lastHistoryHash = null;

	const calcHistoryHash = accHistory => stringify(accHistory);

	async function setupChart(hash, canvas, statsHistory) {
		if (!hash || !canvas || chartHash === lastHistoryHash || !statsHistory?.averageAccuracy?.length) return;

		lastHistoryHash = chartHash;

		const firstNonNullIndex = statsHistory.averageAccuracy.findIndex(a => a !== null);
		const accHistory = statsHistory.averageAccuracy.slice(firstNonNullIndex);
		const CHART_DAYS = accHistory.length;

		if ($configStore.preferences.theme != 'flylight') {
			var gridColor = '#2a2a2a';
			var averageColor = '#3273dc';
			var averageRankedColor = '#3e95cd';
			var medianColor = '#8992e8';
			var medianRankedColor = '#565b92';

			Chart.defaults.color = '#fff';
		} else {
			var gridColor = '#dadadaaf';
			var averageColor = '#3273dc';
			var averageRankedColor = '#3e95cd';
			var medianColor = '#8992e8';
			var medianRankedColor = '#565b92';

			Chart.defaults.color = '#757575';
		}

		const datasets = [];

		const dtBlToday = DateTime.fromJSDate(toBlMidnight(new Date()));
		const dayTimestamps = accHistory.map((_, idx) => toBlMidnight(dtBlToday.minus({days: CHART_DAYS - 1 - idx}).toJSDate()).getTime());

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

		let yAxes = {
			y: {
				display: true,
				position: 'left',
				title: {
					display: $pageContainer.name !== 'phone',
					text: 'Acc',
				},
				ticks: {
					callback: val => formatNumber(val, 2) + '%',
					precision: 2,
				},
				grid: {
					color: gridColor,
				},
			},
		};

		const skipped = (ctx, value) => (ctx.p0.skip || ctx.p1.skip ? value : undefined);

		[
			{
				key: 'averageAccuracy',
				name: 'Average',
				borderColor: averageColor,
				round: 0,
				axisDisplay: false,
				precision: 0,
			},
			{
				key: 'averageRankedAccuracy',
				name: 'Average ranked',
				borderColor: averageRankedColor,
				round: 0,
				axisDisplay: false,
				precision: 0,
			},
			{
				key: 'medianAccuracy',
				name: 'Median',
				borderColor: medianColor,
				round: 0,
				axisDisplay: false,
				precision: 0,
			},
			{
				key: 'medianRankedAccuracy',
				name: 'Median ranked',
				borderColor: medianRankedColor,
				round: 0,
				axisDisplay: false,
				precision: 0,
			},
		].forEach(obj => {
			const {key, name, axisDisplay, usePrevAxis, precision, reverse, ...options} = obj;

			if (!statsHistory?.[key]) return;

			const fieldData = dayTimestamps
				.map((x, idx) => ({x, y: statsHistory?.[key]?.[idx + firstNonNullIndex] ?? null}))
				.map(v => ({...v, y: v.y === 0 ? null : v.y}));

			if (!fieldData.some(v => v.y)) return;

			datasets.push({
				...options,
				yAxisID: 'y',
				label: name,
				data: fieldData,
				round: 2,
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

		if (!chart) {
			chart = new Chart(canvas, {
				type: 'line',
				data: {datasets},
				options: {
					responsive: true,
					maintainAspectRatio: false,
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
						},
						tooltip: {
							position: 'nearest',
							callbacks: {
								title(ctx) {
									if (!ctx?.[0]?.raw) return '';

									const nextDayDate = DateTime.fromMillis(ctx[0].raw?.x).plus({days: 1}).toJSDate();
									const nextDayDateFormatted = nextDayDate > new Date() ? 'now' : formatDate(nextDayDate, 'short', 'short');

									return `${formatDate(new Date(ctx[0].raw?.x), 'short', 'short')} - ${nextDayDateFormatted}`;
								},
								label(ctx) {
									switch (ctx.dataset.label) {
										case 'SS+':
										case 'SS':
										case 'S+':
										case 'S':
										case 'A':
											return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;

										default:
											return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}%`;
									}
								},
							},
						},
					},
					scales: {
						x: xAxis,
						...yAxes,
					},
				},
			});
		} else {
			chart.data = {datasets};
			chart.options.scales = {x: xAxis, ...yAxes};
			chart.update();
		}
	}

	let debouncedChartHash = null;
	const debounceChartHash = debounce(chartHash => (debouncedChartHash = chartHash), CHART_DEBOUNCE);

	$: statsHistory = $statsHistoryStore[playerId];
	$: height = $configStore.preferences.graphHeight;
	$: chartHash = calcHistoryHash(statsHistory);
	$: debounceChartHash(chartHash);
	$: if (debouncedChartHash) setupChart(debouncedChartHash, canvas, statsHistory);
</script>

{#if statsHistory?.averageAccuracy?.length}
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
