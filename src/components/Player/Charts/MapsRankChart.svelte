<script>
	import Chart from 'chart.js/auto';
	import zoomPlugin from 'chartjs-plugin-zoom';
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

		if ($configStore.preferences.theme != 'flylight') {
			var mapBorderColor = '#003e54';

			Chart.defaults.color = '#fff';
		} else {
			var mapBorderColor = '#dadadaaf';

			Chart.defaults.color = '#757575';
		}

		lastHistoryHash = chartHash;
		const refreshOptions = (!selectedPlaylist && lastPlaylist) || (selectedPlaylist && !lastPlaylist);
		lastPlaylist = selectedPlaylist ? deepClone(selectedPlaylist) : null;

		const skipped = (ctx, value) => (ctx.p0.skip || ctx.p1.skip ? value : undefined);

		let maxPp = 0;
		const chartData = playerScores
			.filter(s => !!s?.rank && s.weight > 0.01)
			.map(s => {
				const value = s.rank;
				if (value > maxPp) maxPp = value;

				var result = {
					x: s.weight,
					y: value,
					leaderboardId: s?.leaderboardId ?? null,
					name: s?.songName ?? '',
					songAuthor: '',
					levelAuthor: s?.mapper ?? '',
					diff: `${s?.diff ?? ''}${s?.mode?.length && s.mode !== 'Standard' ? ' ' + s.mode : ''}`,
					timeSet: s.timeset,
					mods: s?.modifiers?.length ? s.modifiers.split(',') : null,
					hash: s?.hash,
					rank: s.rank,
					scoreCount: s.scoreCount,
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

		maxPp = roundToPrecision(maxPp, 0.01) + 0.01;

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
									const rank = formatNumber(ctx[0].raw?.rank ?? 0, 2);
									const scoreCount = formatNumber(ctx[0].raw?.scoreCount ?? 0, 2);

									return `#${rank} out of ${scoreCount} scores ${mods?.length ? ' (' + mods.join(', ') + ')' : ''} | Weight: ${weight}`;

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
					limits: {
						x: {min: 0, max: 1},
						y: {min: 0, max: maxPp},
					},
				},
			},
			scales: {
				x: {
					type: 'linear',
					title: {
						display: true,
						text: 'Weight',
					},
					ticks: {
						min: 0,
						stepSize: 0.1,
						callback: val => formatNumber(val, 1),
					},
				},
				y: {
					type: 'linear',
					reverse: true,
					title: {
						display: true,
						text: 'Rank',
					},
					ticks: {
						max: 100,
						callback: val => '#' + formatNumber(val, 0),
					},
					grid: {
						color: 'rgba(0,0,0,0.1)',
						display: true,
						drawBorder: true,
						drawOnChartArea: true,
					},
					max: maxPp,
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

			playerScores = await playerService.fetchAccGraph(playerId, 'rank');
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
