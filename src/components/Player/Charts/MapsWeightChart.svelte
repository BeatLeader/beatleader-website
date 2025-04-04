<script>
	import Chart from 'chart.js/auto';
	import zoomPlugin from 'chartjs-plugin-zoom';
	import annotationPlugin from 'chartjs-plugin-annotation';
	import {formatNumber, roundToPrecision} from '../../../utils/format';
	import {formatDateRelative, getTimeStringColor} from '../../../utils/date';
	import {debounce} from '../../../utils/debounce';
	import {deepClone, capitalize} from '../../../utils/js';
	import createPlayerService from '../../../services/beatleader/player';
	import Spinner from '../../Common/Spinner.svelte';

	import createPlaylistStore from '../../../stores/playlists';
	import {configStore} from '../../../stores/config';
	import deepEqual from 'deep-equal';
	import Button from '../../Common/Button.svelte';
	import {getNotificationsContext} from 'svelte-notifications';

	export let playerId = null;
	export let type = 'accuracy'; // or percentage

	Chart.register(zoomPlugin);
	Chart.register(annotationPlugin);

	const playerService = createPlayerService();
	const playlists = createPlaylistStore();
	const {addNotification} = getNotificationsContext();

	const CHART_DEBOUNCE = 300;

	let canvas = null;
	let chart = null;

	let lastHistoryHash = null;
	let lastPlaylist = null;
	let playerScores = null;

	let isLoading = false;

	const calcPlayerScoresHash = playerScores => playerScores?.length ?? 0;
	function decapitalizeFirstLetter(string) {
		return string.charAt(0).toLowerCase() + string.slice(1);
	}

	async function setupChart(hash, canvas, selectedPlaylist) {
		if (!hash || !canvas || !playerScores?.length || (chartHash === lastHistoryHash && deepEqual(selectedPlaylist, lastPlaylist))) return;

		const mapBorderColor = '#003e54';

		lastHistoryHash = chartHash;
		const refreshOptions = (!selectedPlaylist && lastPlaylist) || (selectedPlaylist && !lastPlaylist);
		lastPlaylist = selectedPlaylist ? deepClone(selectedPlaylist) : null;

		const chartData = playerScores
			.filter(s => !!s?.pp && s.weight * s.pp > 0.1)
			.map(s => {
				var result = {
					x: s.weight * s.pp,
					y: s.pp,
					leaderboardId: s?.leaderboardId ?? null,
					name: s?.songName ?? '',
					songAuthor: '',
					levelAuthor: s?.mapper ?? '',
					diff: `${s?.diff ?? ''}${s?.mode?.length && s.mode !== 'Standard' ? ' ' + s.mode : ''}`,
					timeSet: s.timeset,
					mods: s?.modifiers?.length ? s.modifiers.split(',') : null,
					hash: s?.hash,
				};

				if (selectedPlaylist) {
					const playlistSongs = selectedPlaylist?.songs?.filter(el => el.hash == s?.hash);
					const playlistSong = playlistSongs?.length ? playlistSongs[0] : null;
					const difficulties = playlistSong?.difficulties?.map(el => capitalize(el.name));
					const diffInfo = {
						diff: s?.diff ?? '',
						type: s.mode,
					};
					const songInfo = {
						hash: s?.hash,
						songName: s?.songName ?? '',
						difficulties: [{name: decapitalizeFirstLetter(diffInfo.diff), characteristic: diffInfo.type}],
						levelAuthorName: s?.mapper ?? '',
					};

					result = {...result, playlistSongs, playlistSong, difficulties, songInfo, diffInfo};
				}

				return result;
			});

		const sortedChartData = chartData.sort((a, b) => b.y - a.y);
		const currentWeightedSum = sortedChartData.reduce((sum, point, index) => sum + point.x, 0);
		const interpolatePoints = [1, 10, 100]
			.map(targetIncrease => {
				let newY = 0;
				let index = 0;
				let newWeightedSum;

				do {
					newY += 0.1;
					const newDataPoint = {y: newY};
					const newSortedData = [...sortedChartData, newDataPoint].sort((a, b) => b.y - a.y);
					index = newSortedData.indexOf(newDataPoint);

					newWeightedSum = newSortedData.reduce((sum, point, i) => {
						const weight = Math.pow(0.965, i);
						return sum + point.y * weight;
					}, 0);
				} while (newWeightedSum - currentWeightedSum < targetIncrease);

				return {x: targetIncrease, y: newY};
			})
			.filter(point => point !== null);

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
				label: 'Maps',
				borderColor: mapBorderColor,
				backgroundColor: element => {
					const item = element.raw;
					if (selectedPlaylist) {
						if (item.playlistSong) {
							if (item.difficulties.length == 1 && item.difficulties[0] == item.diff) {
								return 'red';
							} else if (item.difficulties.length == 1 || !item.difficulties.includes(item.diff)) {
								return 'blue';
							} else {
								return 'yellow';
							}
						} else {
							return 'grey';
						}
					} else {
						return getTimeStringColor(item.timeSet);
					}
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

							switch (ctx?.dataset?.label) {
								case 'Maps':
									const song = ctx.dataset.data[ctx.dataIndex];
									if (song) {
										ret.push(formatDateRelative(song.timeSet));
										ret.push(`${song.name} (${capitalize(song?.diff?.replace('Plus', '+' ?? ''))})`);
										ret.push(`${song.levelAuthor}`);
									}
									if (selectedPlaylist) {
										const item = ctx.raw;
										if (item.playlistSong) {
											if (item.difficulties.length == 1 && item.difficulties[0] == item.diff) {
												ret.push(`Click to remove from the ${selectedPlaylist.playlistTitle}`);
											} else if (item.difficulties.length == 1 || !item.difficulties.includes(item.diff)) {
												ret.push(`Click to add this diff to the ${selectedPlaylist.playlistTitle}`);
											} else {
												ret.push(`Click to remove this diff from the ${selectedPlaylist.playlistTitle}`);
											}
										} else {
											ret.push(`Click to add to the ${selectedPlaylist.playlistTitle}`);
										}
									}
									break;
							}

							return ret;
						},
						title: function (ctx) {
							if (!ctx?.[0]?.raw) return '';

							switch (ctx?.[0].dataset?.label) {
								case 'Maps':
									const mods = ctx[0].raw?.mods ?? null;
									const weight = formatNumber(ctx[0].raw?.x ?? 0, 2);
									const pp = formatNumber(ctx[0].raw?.y ?? 0, 2);

									return `${pp}pp${mods?.length ? ' (' + mods.join(', ') + ')' : ''} | Weight: ${weight}`;

								default:
									if (ctx && Array.isArray(ctx))
										return [`Stars: ${ctx?.[0]?.raw?.x}★`].concat(
											ctx.map(d => `${d?.dataset?.label ?? ''}: ${formatNumber(d?.raw?.y ?? 0)}%`)
										);
							}

							return '';
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
				annotation: {
					annotations: Object.assign(
						{},
						...interpolatePoints.map((point, index) => ({
							[`line${index + 1}`]: {
								type: 'line',
								yMin: point.y,
								yMax: point.y,
								borderColor: 'grey',
								borderWidth: 2,
								label: {
									content: `new ${formatNumber(point.y, 2)}pp score to get +${point.x}pp`,
									display: true,
									backgroundColor: 'transparent',
								},
							},
						}))
					),
				},
			},
			scales: {
				x: {
					type: 'logarithmic',
					title: {
						display: true,
						text: 'Weighted PP',
					},
					ticks: {
						max: 100,
						callback: val => formatNumber(val, 1) + 'pp',
					},
				},
				y: {
					type: 'linear',
					title: {
						display: false,
					},
					ticks: {
						max: 100,
						callback: val => formatNumber(val, 0) + 'pp',
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
				if (!element?.leaderboardId) {
					e.native.target.style.cursor = 'default';
				} else {
					e.native.target.style.cursor = 'pointer';
				}
			},
			onClick(e, item, chart) {
				const element = item?.[0]?.element?.$context?.raw;
				if (!element?.leaderboardId) return;

				if (selectedPlaylist != null) {
					if (element?.playlistSong) {
						if (element.difficulties.length == 1 && element.difficulties[0] == element.diff) {
							playlists.remove(element.hash);
						} else if (element.difficulties.length == 1 || !element.difficulties.includes(element.diff)) {
							playlists.addDiff(element.hash, element.diffInfo);
						} else {
							playlists.removeDiff(element.hash, element.diffInfo);
						}
					} else {
						playlists.add(element.songInfo);
					}
				} else {
					window.open(`/leaderboard/global/${element.leaderboardId}`, '_blank');
				}
			},
		};
		if (selectedPlaylist) {
			options.animation = {
				duration: 0, // general animation time
			};
		}

		if (!chart) {
			chart = new Chart(canvas, {
				type: 'scatter',
				data: {
					datasets,
				},
				options,
			});
		} else {
			chart.data = {datasets};
			if (refreshOptions) {
				chart.options = options;
			}
			chart.update();
		}
	}

	let debouncedChartHash = null;
	const debounceChartHash = debounce(chartHash => (debouncedChartHash = chartHash), CHART_DEBOUNCE);

	async function fetchPlayerScores(playerId) {
		if (!playerId?.length) return;

		try {
			isLoading = true;

			playerScores = await playerService.fetchAccGraph(playerId, 'weight');
		} finally {
			isLoading = false;
		}
	}

	$: fetchPlayerScores(playerId);

	$: height = $configStore.preferences.graphHeight;
	$: chartHash = calcPlayerScoresHash(playerScores);
	$: debounceChartHash(chartHash);
	$: selectedPlaylistIndex = $configStore?.selectedPlaylist;
	$: selectedPlaylist = $playlists[selectedPlaylistIndex];
	$: if (debouncedChartHash) setupChart(debouncedChartHash, canvas, selectedPlaylist);
</script>

<section class="chart" style="--height: {height}px">
	<canvas class="chartjs" bind:this={canvas} {height} />
	{#if isLoading}
		<Spinner width="10em" height="10em" />
	{:else if !selectedPlaylist}
		<Button
			cls="chart-new-playlist-weight"
			iconFa="fas fa-plus-square"
			label="Playlist"
			on:click={() => {
				playlists.create();
				addNotification({
					text: 'Click on dots to add maps to the playlist!',
					position: 'top-right',
					type: 'success',
					removeAfter: 3000,
				});
			}} />
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

	.chartjs {
		margin-top: 2em;
	}

	canvas {
		width: 100% !important;
	}

	:global(.chart-new-playlist-weight) {
		top: -1.6em;
		right: 2%;
		position: absolute !important;
		font-size: 0.8em !important;
		height: 1.5em;
	}

	@media screen and (max-width: 650px) {
		:global(.chart-new-playlist-weight) {
			display: none !important;
		}
	}
</style>
