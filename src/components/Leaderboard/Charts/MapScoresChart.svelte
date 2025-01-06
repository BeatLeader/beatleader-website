<script>
	import Chart from 'chart.js/auto';
	import zoomPlugin from 'chartjs-plugin-zoom';
	// import chartTrendline from 'chartjs-plugin-trendline';

	import {formatNumber, roundToPrecision} from '../../../utils/format';
	import {formatDate, formatDateRelative, getTimeStringColor} from '../../../utils/date';
	import Spinner from '../../Common/Spinner.svelte';
	import {configStore} from '../../../stores/config';
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import Select from '../../Settings/Select.svelte';

	export let leaderboardId = null;
	export let sortBy = null;
	export let order = null;
	export let leaderboard = null;

	export let currentPlayerId = null;

	Chart.register(zoomPlugin);
	// Chart.register(chartTrendline);

	let canvas = null;
	let chart = null;

	function sortByToAxisName(sortBy) {
		switch (sortBy) {
			case 'date':
				return 'Date';
			case 'pp':
				return 'Pp';
			case 'acc':
				return 'Accuracy';
			case 'pauses':
				return 'Pause Count';
			case 'rank':
				return 'Leaderboard Rank';
			case 'maxStreak':
				return 'Streak length';
			case 'mistakes':
				return 'Mistake Count';
			case 'weight':
				return 'PP Weight';
			case 'weightedPp':
				return 'Weighted PP';
			case 'playerRank':
				return 'Player Rank';
		}
		return null;
	}

	let availableXKeys = ['playerRank'].map(id => {
		return {id, name: sortByToAxisName(id)};
	});
	let currentXKey = availableXKeys[0];

	let leaderboardScores = null;
	let isLoading = false;

	function updateAvailableXKeys(leaderboard) {
		if (leaderboard.difficultyBl.status == 3) {
			availableXKeys = ['playerRank', 'date', 'pp', 'acc', 'pauses', 'rank', 'maxStreak', 'mistakes', 'weight', 'weightedPp'].map(id => {
				return {id, name: sortByToAxisName(id)};
			});
		} else {
			availableXKeys = ['playerRank', 'date', 'acc', 'pauses', 'rank', 'maxStreak', 'mistakes'].map(id => {
				return {id, name: sortByToAxisName(id)};
			});
		}

		currentXKey = availableXKeys[0];
	}

	function valueFromSortBy(score, sortBy) {
		if (!score) return null;
		switch (sortBy) {
			case 'date':
				return score.timepost ? new Date(score.timepost * 1000) : null;
			case 'pp':
				return score.pp;
			case 'acc':
				return 100 - score.acc;
			case 'pauses':
				return score.pauses;
			case 'rank':
				return score.rank;
			case 'maxStreak':
				return score.maxStreak;
			case 'mistakes':
				return score.mistakes;
			case 'weight':
				return score.weight * 100;
			case 'weightedPp':
				return score.weight * score.pp;
			case 'playerRank':
				return score.playerRank;
		}
		return null;
	}

	function sortByToNullable(sortBy) {
		switch (sortBy) {
			case 'date':
			case 'pp':
			case 'acc':
			case 'rank':
			case 'weight':
			case 'weightedPp':
				return false;
		}
		return true;
	}

	function sortByToTicks(sortBy) {
		switch (sortBy) {
			case 'date':
				return {
					autoSkip: true,
					major: {
						enabled: true,
					},
					timecallback: val => formatDate(val),
				};
			case 'pp':
				return {
					callback: val => formatNumber(val, 2) + 'pp',
				};
			case 'acc':
				return {
					max: 100,
					callback: val => formatNumber(100 - val, 2) + '%',
				};
			case 'rank':
				return {
					callback: val => '#' + formatNumber(val, 0),
				};
			case 'pauses':
			case 'maxStreak':
			case 'mistakes':
				return {
					callback: val => formatNumber(val, 0),
				};

			case 'weight':
				return {
					max: 100,
					callback: val => formatNumber(val, 0) + '%',
				};
			case 'weightedPp':
				return {
					max: 100,
					callback: val => formatNumber(val, 2) + 'pp',
				};
			case 'playerRank':
				return {
					min: 0,
					stepSize: 1000,
					callback: val => '#' + formatNumber(val, 0),
				};
		}
		return null;
	}

	async function setupChart(scores, canvas, sortBy, order, xkey) {
		if (!canvas || !scores?.length) return;

		const mapBorderColor = '#003e54';

		const isNullable = sortByToNullable(sortBy);
		const chartData = scores
			.filter(s => !!s?.playerRank)
			.map(s => {
				const yValue = valueFromSortBy(s, sortBy);
				if (!yValue && !isNullable) return null;

				const xValue = valueFromSortBy(s, xkey);
				if (!xValue && !isNullable) return null;

				var result = {
					x: xValue,
					y: yValue,
					mods: s?.modifiers?.length ? s.modifiers.split(',') : null,
					...s,
				};

				return result;
			})
			.filter(s => s !== null);

		const avgData = Object.entries(
			chartData.reduce((cum, point) => {
				const roundedStars = roundToPrecision(point.x, 0.5);
				if (!cum[roundedStars]) cum[roundedStars] = [];

				cum[roundedStars].push(point.y);

				return cum;
			}, {})
		).reduce(
			(cum, [stars, points]) => {
				const sum = points.reduce((sum, point) => sum + point, 0);
				const best = points.reduce((max, point) => (point > max ? point : max), 0);

				const x = parseFloat(stars);

				const median = points.length > 1 ? points.sort((a, b) => a - b)[Math.ceil(points.length / 2)] : sum;

				cum.best.push({x, y: best});
				cum.avg.push({x, y: sum / points.length});
				cum.median.push({x, y: median});

				return cum;
			},
			{avg: [], best: [], median: []}
		);

		Object.keys(avgData).forEach(key => (avgData[key] = avgData[key].sort((a, b) => a.x - b.x)));

		const datasets = [
			{
				label: '',
				borderColor: mapBorderColor,
				backgroundColor: element => {
					const item = element.raw;
					return currentPlayerId && item.playerId == currentPlayerId ? 'yellow' : getTimeStringColor(new Date(item.timepost * 1000));
				},

				fill: false,
				pointRadius: 3,
				pointHoverRadius: 4,
				data: chartData,
				order: 4,
			},
		];

		if (sortBy != 'date' && sortBy != 'maxStreak') {
			datasets[0].trendlineLinear = {
				colorMin: 'red',
				colorMax: 'green',
				lineStyle: 'dotted',
				width: 2,
				projection: true,
			};
		}

		const options = {
			responsive: true,
			maintainAspectRatio: false,
			layout: {
				padding: {
					right: 0,
				},
			},
			interaction: {
				mode: 'nearest',
				intersect: true,
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					displayColors: false,
					position: 'nearest',
					title: {
						display: true,
					},
					callbacks: {
						label: function (ctx) {
							if (!ctx || !ctx?.dataset?.data[ctx?.dataIndex]) return '';

							const ret = [];

							const song = ctx.dataset.data[ctx.dataIndex];

							if (song) {
								ret.push(formatDateRelative(new Date(song.timepost * 1000)));
								ret.push(`${song.playerName} - #${formatNumber(song.playerRank, 0)}`);
							}

							return ret;
						},
						title: function (ctx) {
							if (!ctx?.[0]?.raw) return '';

							const mods = ctx[0].raw?.mods ?? null;
							const acc = formatNumber(ctx[0].raw?.acc ?? 0, 2);
							const weight = ctx[0].raw?.y ?? 0;

							return `${sortByToAxisName(sortBy)}: ${(sortByToTicks(sortBy).callback ?? sortByToTicks(sortBy).timecallback)(
								weight
							)} | Acc: ${acc}% ${mods?.length ? ' (' + mods.join(', ') + ')' : ''}`;
						},
					},
				},
				zoom: {
					pan: {
						enabled: true,
						mode: 'xy',
					},
					zoom: {
						wheel: {
							enabled: true,
						},
						pinch: {
							enabled: true,
						},
						mode: 'xy',
					},
				},
			},
			scales: {
				x: {
					type: xkey == 'date' ? 'time' : 'logarithmic',
					title: {
						display: true,
						text: '',
					},
					ticks: sortByToTicks(xkey),
				},
				y: {
					type: sortBy == 'date' ? 'time' : sortBy == 'acc' ? 'logarithmic' : 'linear',
					reverse: order == 'asc' || sortBy == 'acc',
					title: {
						display: true,
						text: sortByToAxisName(sortBy),
					},
					ticks: {
						...sortByToTicks(sortBy),
						precision: ['rank', 'pauses', 'maxStreak', 'mistakes', 'playerRank'].includes(sortBy) ? 0 : undefined,
					},
					grid: {
						color: 'rgba(0,0,0,0.1)',
						display: true,
						drawBorder: true,
						drawOnChartArea: true,
					},
				},
			},
			onHover(e, item, chart) {
				const element = item?.[0]?.element?.$context?.raw;
				if (!element?.playerId) {
					e.native.target.style.cursor = 'default';
				} else {
					e.native.target.style.cursor = 'pointer';
				}
			},
			onClick(e, item, chart) {
				const element = item?.[0]?.element?.$context?.raw;
				if (!element?.playerId) return;
				window.open(`/u/${element.playerId}`, '_blank');
			},
		};

		if (!chart) {
			chart = new Chart(canvas, {
				type: 'scatter',
				animation: {
					duration: 0,
				},
				data: {
					datasets,
				},
				options,
				plugins: [],
			});
		} else {
			chart.data = {datasets};
			chart.options = options;
			chart.update();
		}
	}

	async function fetchScores(leaderboardId) {
		if (!leaderboardId?.length) return;

		try {
			isLoading = true;
			fetch(`${BL_API_URL}leaderboard/${leaderboardId}/scoregraph`)
				.then(d => d.json())
				.then(g => {
					leaderboardScores = g
						.map(m => {
							return {
								...m,
								acc: m.accuracy,
							};
						})
						.filter(m => m);
				});
		} finally {
			isLoading = false;
		}
	}

	$: fetchScores(leaderboardId);
	$: updateAvailableXKeys(leaderboard);

	$: height = $configStore.preferences.graphHeight;
	$: currentPlayerId && chart && chart.update();
	$: setupChart(leaderboardScores, canvas, sortBy, order, currentXKey.id);
</script>

<section class="chart" style="--height: {height}px">
	<canvas class="chartjs" bind:this={canvas} {height} />
	<div class="x-selector">
		<Select bind:value={currentXKey} options={availableXKeys} valueSelector={x => x} fontSize={0.8} fontPadding={0.2} />
	</div>
	{#if isLoading}
		<Spinner width="10em" height="10em" />
	{/if}
</section>

<style>
	section {
		position: relative;
		margin: 1rem auto 0 auto;
		height: var(--height, 300px);
	}

	section :global(svg) {
		position: absolute;
		top: calc((100% - 10em) / 2);
		left: calc((100% - 10em) / 2);
	}

	canvas {
		width: 100% !important;
	}

	.x-selector {
		position: absolute;
		width: 100%;
		display: flex;
		justify-content: center;
		left: 1.5em;
		bottom: 0;
	}

	:global(.chart-new-playlist) {
		top: 0.4em;
		right: 2%;
		position: absolute !important;
		font-size: 0.8em !important;
		height: 1.5em;
	}

	@media screen and (max-width: 650px) {
		:global(.chart-new-playlist) {
			display: none !important;
		}
	}
</style>
