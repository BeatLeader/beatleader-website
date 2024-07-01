<script>
	import {createEventDispatcher, getContext} from 'svelte';
	import Chart from 'chart.js/auto';
	import 'chartjs-adapter-luxon';
	import {DateTime} from 'luxon';
	import createAccSaberService from '../../../services/accsaber';
	import {formatNumber} from '../../../utils/format';
	import {addToDate, DAY, formatDate, formatDateWithOptions, toAccSaberMidnight} from '../../../utils/date';
	import {debounce} from '../../../utils/debounce';
	import {convertArrayToObjectByKey} from '../../../utils/js';
	import {capitalize} from '../../../utils/js';
	import Switcher from '../../Common/Switcher.svelte';
	import {onLegendClick} from './utils/legend-click-handler';
	import {configStore} from '../../../stores/config';

	const dispatch = createEventDispatcher();

	export let playerId = null;
	export let playerHistory = null;

	const CHART_DEBOUNCE = 300;
	const CHART_DAYS = 30;

	const pageContainer = getContext('pageContainer');

	const accSaberService = createAccSaberService();

	let canvas = null;
	let chart = null;

	let isLoading = false;
	let lastHistoryHash = null;
	let playerRankHistory = null;
	let availableCategories = null;
	let category = 'overall';

	const calcHistoryHash = (playerId, playerRankHistory, category) =>
		(playerId ?? '') +
		(playerRankHistory?.map(h => h?.accSaberDate?.getTime())?.join(':') ?? '') +
		(playerRankHistory?.map(h => Object.keys(h?.categories ?? {})?.length ?? 0)?.join(':') ?? '') +
		category;
	async function refreshPlayerRankHistory(playerId, playerHistory) {
		if (!playerId) return;

		isLoading = true;

		const playerHistoryPromises = await Promise.all([accSaberService.getPlayerHistory(playerId).catch(e => null), playerHistory]);

		const theOldestChartHistory = addToDate(-49 * DAY, toAccSaberMidnight(new Date()));
		const dbHistory = (playerHistoryPromises?.[1] ?? []).filter(h => h.accSaberDate >= theOldestChartHistory);

		const enhancedFetchedHistory = (playerHistoryPromises?.[0]?.history ?? []).map(h => {
			const dbItem = dbHistory.find(dbH => dbH?.accSaberDate?.getTime() === h?.date?.getTime());
			if (dbItem?.categories?.overall) dbItem.categories.overall.rank = h.rank;

			return (
				dbItem ?? {
					playerId: playerHistoryPromises?.[0]?.playerId ?? null,
					accSaberDate: h.date,
					categories: {overall: {rank: h.rank}},
				}
			);
		});

		const timestampsInEnhancedFetchedHistory = enhancedFetchedHistory.map(h => h?.accSaberDate?.getTime());

		playerRankHistory = enhancedFetchedHistory.concat(
			dbHistory.filter(dbH => !timestampsInEnhancedFetchedHistory.includes(dbH?.accSaberDate?.getTime()))
		);

		availableCategories = [
			...new Set(
				playerRankHistory.reduce((categories, h) => {
					if (h.accSaberDate && h.categories) categories = categories.concat(Object.keys(h.categories));

					return categories;
				}, [])
			),
		].map(c => ({label: capitalize(c)}));

		isLoading = false;

		dispatch('height-changed');
	}

	async function setupChart(hash, canvas) {
		if (!hash || !canvas || !playerRankHistory?.length || !selectedCategory?.label || chartHash === lastHistoryHash) return;

		lastHistoryHash = chartHash;

		const category = selectedCategory?.label?.toLowerCase();

		if ($configStore.preferences.theme != 'flylight') {
			var gridColor = '#2a2a2a';
			var rankColor = '#3e95cd';
			var ppColor = '#007100';
			var accColor = '#3273dc';
			var rankedPlayCountColor = '#3e3e3e';

			Chart.defaults.color = '#fff';
		} else {
			var gridColor = '#dadadaaf';
			var rankColor = '#3e95cd';
			var ppColor = '#007100';
			var accColor = '#3273dc';
			var rankedPlayCountColor = '#3e3e3e';

			Chart.defaults.color = '#757575';
		}

		const dtAccSaberToday = DateTime.fromJSDate(toAccSaberMidnight(new Date()));
		const dayTimestamps = Array(CHART_DAYS)
			.fill(0)
			.map((_, idx) => toAccSaberMidnight(dtAccSaberToday.minus({days: CHART_DAYS - 1 - idx}).toJSDate()).getTime());

		const playerRankHistoryByTimestamp = convertArrayToObjectByKey(
			playerRankHistory
				.filter(h => h.accSaberDate)
				.map(h => ({
					...h,
					timestamp: h.accSaberDate.getTime(),
				})),
			'timestamp'
		);

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

		const skipped = (ctx, value) => (ctx.p0.skip || ctx.p1.skip ? value : undefined);

		const datasets = [];

		[
			{key: 'rank', label: 'Rank', borderColor: rankColor, axis: 'y', round: 0, gridColor, precision: 0},
			{
				key: 'averageAcc',
				label: 'Acc',
				borderColor: accColor,
				axis: 'y2',
				round: 0,
				axisDisplay: true,
				valueMult: 100,
				tickSuffix: '%',
				precision: 2,
			},
			{key: 'ap', label: 'AP', borderColor: ppColor, axis: 'y3', round: 2, axisDisplay: false, precision: 0},
			{
				key: 'rankedPlays',
				label: 'Plays',
				backgroundColor: rankedPlayCountColor,
				borderColor: rankedPlayCountColor,
				axis: 'y4',
				round: 0,
				axisDisplay: false,
				type: 'bar',
				barThickness: 3,
				maxMult: 1.5,
				precision: 0,
			},
		].forEach(obj => {
			const {key, axis, axisDisplay, label, valueMult, tickSuffix, precision, type, max, maxMult, gridColor, ...options} = obj;

			const data = dayTimestamps.map(t => {
				const val = playerRankHistoryByTimestamp?.[t]?.categories?.[category]?.[key] ?? null;

				return {
					x: t,
					y: val ? val * (valueMult ?? 1) : type === 'bar' ? 0 : val,
				};
			});

			const dataExists = data.some(v => (type !== 'bar' && v.y !== null) || (type === 'bar' && v.y !== 0));
			if (!dataExists) return;

			const maxVal = data.reduce((max, v) => (v.y > max ? v.y : max), 0);

			if (!yAxes[axis])
				yAxes[axis] = {
					display: axisDisplay ?? false,
					position: 'right',
					title: {
						display: $pageContainer.name !== 'phone',
						text: label,
					},
					ticks: {
						callback: val => formatNumber(val, obj.precision ?? obj.round ?? 2) + (tickSuffix ?? ''),
						precision: precision ?? 2,
					},
					grid: {
						color: gridColor,
						drawOnChartArea: gridColor ? true : false,
					},
					max: max ? max : maxMult ? maxVal * maxMult : null,
				};

			datasets.push({
				yAxisID: axis,
				label,
				data,
				fill: false,
				borderWidth: 2,
				pointRadius: 1,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				type: type ?? 'line',
				spanGaps: true,
				segment: {
					borderWidth: ctx => skipped(ctx, 1),
					borderDash: ctx => skipped(ctx, [6, 6]),
				},
				...options,
			});
		});

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

		if (!chart) {
			chart = new Chart(canvas, {
				type: 'line',
				data: {datasets},
				options: {
					layout: {
						padding: {
							right: 0,
						},
					},
					spanGaps: DAY,
					responsive: true,
					maintainAspectRatio: false,
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
										case 'Rank':
											return ` ${ctx.dataset.label}: #${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
										case 'AP':
											return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}AP`;
										case 'Acc':
											return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}%`;
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

	// $: refreshPlayerRankHistory(playerId, playerHistory);

	$: selectedCategory = availableCategories?.find(c => c.label === capitalize(category)) ?? null;

	$: height = $configStore.preferences.graphHeight;
	$: chartHash = calcHistoryHash(playerId, playerRankHistory, category);
	$: debounceChartHash(chartHash);
	$: if (debouncedChartHash) setupChart(debouncedChartHash, canvas);
</script>

{#if playerRankHistory?.length}
	<section class="chart" style="--height: {height}px">
		<canvas class="chartjs" bind:this={canvas} {height} />
	</section>

	<div class="chart-switcher">
		<Switcher values={availableCategories} value={selectedCategory} on:change={e => (category = e?.detail?.label ?? 'overall')} />
	</div>
{/if}

<style>
	.chart {
		margin: 0.4em 0.4em 0.6em;
		padding: 0.4em;
		box-shadow: 0 2px 10px rgb(0 0 0 / 53%);
		border-radius: 0.4em;
		min-width: 29.6em;
		background: var(--graph-gradient);
		overflow: hidden;
	}

	canvas {
		width: 100% !important;
	}
</style>
