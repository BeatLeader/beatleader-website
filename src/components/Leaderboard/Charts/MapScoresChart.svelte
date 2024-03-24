<script>
	import Chart from 'chart.js/auto';
	import zoomPlugin from 'chartjs-plugin-zoom';
	import {formatNumber, roundToPrecision} from '../../../utils/format';
	import {formatDateRelative, getTimeStringColor} from '../../../utils/date';
	import {debounce} from '../../../utils/debounce';
	import Spinner from '../../Common/Spinner.svelte';
	import {configStore} from '../../../stores/config';
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';

	export let leaderboardId = null;
	export let currentPlayerId = null;
	export let type = 'accuracy'; // or percentage

	Chart.register(zoomPlugin);

	const CHART_DEBOUNCE = 300;

	let canvas = null;
	let chart = null;

	let lastHistoryHash = null;
	let leaderboardScores = null;

	let isLoading = false;

	const calcleaderboardScoresHash = (leaderboardScores, currentPlayerId) => {
		return leaderboardScores?.length ?? 0 + currentPlayerId?.length ?? 0;
	};

	async function setupChart(hash, canvas) {
		if (!hash || !canvas || !leaderboardScores?.length || chartHash === lastHistoryHash) return;

		const mapBorderColor = '#003e54';

		lastHistoryHash = chartHash;

		let maxStars = 0;
		let minAcc = 100;
		const chartData = leaderboardScores
			.filter(s => !!s?.weight && !!s?.rank)
			.map(s => {
				const weight = s.weight;

				if (s.rank > maxStars) maxStars = s.rank;
				if (weight < minAcc) minAcc = weight;

				var result = {
					x: s.rank,
					y: weight,
					playerId: s.playerId ?? null,
					avatar: s.avatar,
					timeSet: s.timeset,
					acc: s.acc,
					name: s.name,
					mods: s?.modifiers?.length ? s.modifiers.split(',') : null,
				};

				return result;
			});

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

		maxStars = roundToPrecision(maxStars, 0.5) + 0.5;
		minAcc = Math.floor(minAcc - 1);
		if (minAcc < 0) minAcc = 0;

		const datasets = [
			{
				label: '',
				borderColor: mapBorderColor,
				backgroundColor: element => {
					const item = element.raw;
					return currentPlayerId && item.playerId == currentPlayerId ? 'yellow' : getTimeStringColor(item.timeSet);
				},
				fill: false,
				pointRadius: 3,
				pointHoverRadius: 4,
				data: chartData,
				order: 4,
			},
		];

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
								ret.push(formatDateRelative(song.timeSet));
								ret.push(`${song.name} - #${formatNumber(song.x, 0)}`);
							}

							return ret;
						},
						title: function (ctx) {
							if (!ctx?.[0]?.raw) return '';

							const mods = ctx[0].raw?.mods ?? null;
							const acc = formatNumber(ctx[0].raw?.acc ?? 0, 2);
							const weight = formatNumber(ctx[0].raw?.y ?? 0, 0);

							return `Weight: ${weight}% | Acc: ${acc}% ${mods?.length ? ' (' + mods.join(', ') + ')' : ''}`;
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
					limits: {
						x: {min: 0, max: maxStars},
						y: {min: minAcc, max: 100},
					},
				},
			},
			scales: {
				x: {
					type: 'logarithmic',
					title: {
						display: true,
						text: 'Player Rank',
					},
					ticks: {
						min: 0,
						stepSize: 1000,
						callback: val => '#' + formatNumber(val, 0),
					},
					max: maxStars,
				},
				y: {
					type: 'linear',
					title: {
						display: true,
						text: 'PP Weight',
					},
					ticks: {
						max: 100,
						callback: val => formatNumber(val, 0) + '%',
					},
					grid: {
						color: 'rgba(0,0,0,0.1)',
						display: true,
						drawBorder: true,
						drawOnChartArea: true,
					},
					min: minAcc,
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
				data: {
					datasets,
				},
				options,
				plugins: [],
			});
		} else {
			chart.data = {datasets};
			chart.update();
		}
	}

	let debouncedChartHash = null;
	const debounceChartHash = debounce(chartHash => (debouncedChartHash = chartHash), CHART_DEBOUNCE);

	async function fetchScores(leaderboardId) {
		if (!leaderboardId?.length) return;

		try {
			isLoading = true;
			fetch(BL_API_URL + `leaderboard/${leaderboardId}/scoregraph`)
				.then(d => d.json())
				.then(g => {
					leaderboardScores = g
						.map(m => {
							const timeset = m?.timepost;

							return {
								...m,
								weight: m.weight * 100,
								acc: m.accuracy * 100,
								timeset: new Date(timeset * 1000),
							};
						})
						.filter(m => m);
				});
		} finally {
			isLoading = false;
		}
	}

	$: fetchScores(leaderboardId);

	$: height = $configStore.preferences.graphHeight;
	$: currentPlayerId && chart && chart.update();
	$: chartHash = calcleaderboardScoresHash(leaderboardScores, currentPlayerId);
	$: debounceChartHash(chartHash);
	$: if (debouncedChartHash) setupChart(debouncedChartHash, canvas);
</script>

<section class="chart" style="--height: {height}px">
	<canvas class="chartjs" bind:this={canvas} {height} />
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
