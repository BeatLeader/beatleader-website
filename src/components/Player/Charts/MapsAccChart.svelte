<script>
	import Chart from 'chart.js/auto';
	import zoomPlugin from 'chartjs-plugin-zoom';
	import {formatNumber, roundToPrecision} from '../../../utils/format';
	import {formatDateRelative, getTimeStringColor} from '../../../utils/date';
	import {createEventDispatcher, getContext} from 'svelte';
	import {debounce} from '../../../utils/debounce';
	import regionsPlugin from './utils/regions-plugin';
	import {deepClone, capitalize} from '../../../utils/js';
	import createPlayerService from '../../../services/beatleader/player';
	import Spinner from '../../Common/Spinner.svelte';

	import createPlaylistStore from '../../../stores/playlists';
	import createAccountStore from '../../../stores/beatleader/account';
	import {configStore} from '../../../stores/config';
	import deepEqual from 'deep-equal';
	import produce from 'immer';
	import Button from '../../Common/Button.svelte';
	import {getNotificationsContext} from 'svelte-notifications';
	import Switch from '../../Common/Switch.svelte';
	import {isAnySupporter} from '../Overlay/overlay';

	export let playerId = null;
	export let averageAcc = null;
	export let medianAcc = null;
	export let type = 'accuracy'; // or percentage

	Chart.register(zoomPlugin);

	const playerService = createPlayerService();
	const playlists = createPlaylistStore();
	const {addNotification} = getNotificationsContext();
	const dispatch = createEventDispatcher();
	const account = createAccountStore();

	const CHART_DEBOUNCE = 300;

	let canvas = null;
	let chart = null;

	let lastHistoryHash = null;
	let lastPlaylist = null;
	let playerScores = null;

	let isLoading = false;

	const calcPlayerScoresHash = playerScores => (playerScores?.length ?? 0) + averageAcc + medianAcc;
	function decapitalizeFirstLetter(string) {
		return string.charAt(0).toLowerCase() + string.slice(1);
	}

	async function setupChart(hash, canvas, selectedPlaylist) {
		if (!hash || !canvas || !playerScores?.length || (chartHash === lastHistoryHash && deepEqual(selectedPlaylist, lastPlaylist))) return;
		
		if ($configStore.preferences.theme != 'flylight') {
			var mapBorderColor = '#003e54';
			var ssPlusColor = 'rgba(143,72,219, .4)';
			var ssColor = 'rgba(190,42,66, .4)';
			var sPlusColor = 'rgba(255,99,71, .4)';
			var sColor = 'rgba(89,176,244, .4)';
			var aColor = 'rgba(60,179,113, .4)';
			var averageLinesColor = 'rgba(255,255,255,.35)';

			Chart.defaults.color = '#fff';
		} else {
			var mapBorderColor = '#dadadaaf';
			var ssPlusColor = 'rgba(143,72,219, .4)';
			var ssColor = 'rgba(190,42,66, .4)';
			var sPlusColor = 'rgba(255,99,71, .4)';
			var sColor = 'rgba(89,176,244, .4)';
			var aColor = 'rgba(60,179,113, .4)';
			var averageLinesColor = 'rgba(255,255,255,.35)';

			Chart.defaults.color = '#757575';
		}

		lastHistoryHash = chartHash;
		const refreshOptions = (!selectedPlaylist && lastPlaylist) || (selectedPlaylist && !lastPlaylist);
		lastPlaylist = selectedPlaylist ? deepClone(selectedPlaylist) : null;

		const skipped = (ctx, value) => (ctx.p0.skip || ctx.p1.skip ? value : undefined);

		let maxStars = 0;
		let minAcc = 100;
		const chartData = playerScores
			.filter(s => !!s?.acc && !!s?.stars)
			.map(s => {
				const acc = s.acc;

				if (s.stars > maxStars) maxStars = s.stars;
				if (acc < minAcc) minAcc = acc;

				var result = {
					x: s.stars,
					y: acc,
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

		let averageLines = [];
		if (averageAcc)
			averageLines.push({
				min: averageAcc,
				max: averageAcc,
				color: averageLinesColor,
				label: 'Average',
				position: {vertical: 'bottom'},
			});
		if (medianAcc)
			averageLines.push({
				min: medianAcc,
				max: medianAcc,
				color: averageLinesColor,
				label: 'Median',
				position: {horizontal: 'right'},
			});

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

			{
				yAxisID: 'y',
				label: 'Best',
				borderColor: 'rgba(60,179,113, .75)',
				data: avgData.best,
				fill: false,
				borderWidth: 2,
				pointRadius: 2,
				pointHoverRadius: 4,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				type: 'line',
				spanGaps: true,
				segment: {
					borderWidth: ctx => skipped(ctx, 1),
					borderDash: ctx => skipped(ctx, [6, 6]),
				},
			},

			{
				yAxisID: 'y',
				label: 'Average',
				borderColor: '#3273dc',
				data: avgData.avg,
				fill: false,
				borderWidth: 2,
				pointRadius: 2,
				pointHoverRadius: 4,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				type: 'line',
				spanGaps: true,
				segment: {
					borderWidth: ctx => skipped(ctx, 1),
					borderDash: ctx => skipped(ctx, [6, 6]),
				},
			},

			{
				yAxisID: 'y',
				label: 'Median',
				borderColor: '#8992e8',
				data: avgData.median,
				fill: false,
				borderWidth: 2,
				pointRadius: 2,
				pointHoverRadius: 4,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				type: 'line',
				spanGaps: true,
				segment: {
					borderWidth: ctx => skipped(ctx, 1),
					borderDash: ctx => skipped(ctx, [6, 6]),
				},
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
					display: true,
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
									const stars = formatNumber(ctx[0].raw?.x ?? 0, 2);
									const acc = formatNumber(ctx[0].raw?.y ?? 0, 2);

									return type === 'percentage'
										? `Percentage: ${acc}%${mods?.length ? ' (' + mods.join(', ') + ')' : ''} | Stars: ${stars}★`
										: `Accuracy: ${acc}%${mods?.length ? ' (' + mods.join(', ') + ')' : ''} | Stars: ${stars}★`;

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
						x: {min: 0, max: maxStars},
						y: {min: minAcc, max: 100},
					},
				},
				regions: {
					regions: [
						{min: 95, max: 100, color: ssPlusColor},
						{min: 90, max: 95, color: ssColor},
						{min: 85, max: 90, color: sPlusColor},
						{min: 80, max: 85, color: sColor},
						{min: 0, max: 80, color: aColor},
					].concat(averageLines),
				},
			},
			scales: {
				x: {
					type: 'linear',
					scaleLabel: {
						display: false,
						labelString: 'Stars',
					},
					ticks: {
						min: 0,
						stepSize: 0.5,
						callback: val => formatNumber(val, 1) + '★',
					},
					max: maxStars,
				},
				y: {
					type: 'linear',
					scaleLabel: {
						display: true,
						labelString: 'Acc',
					},
					ticks: {
						max: 100,
						callback: val => formatNumber(val, 2) + '%',
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
				plugins: [regionsPlugin],
			});
		} else {
			chart.data = {datasets};
			if (refreshOptions) {
				chart.options = options;
			}
			chart.update();
		}

		dispatch('height-changed');
	}

	let debouncedChartHash = null;
	const debounceChartHash = debounce(chartHash => (debouncedChartHash = chartHash), CHART_DEBOUNCE);

	async function fetchPlayerScores(playerId, showUnrankedMapsOnGraph) {
		if (!playerId?.length) return;

		try {
			isLoading = true;
			playerScores = await playerService.fetchAccGraph(playerId, 'acc', !showUnrankedMapsOnGraph);
		} finally {
			isLoading = false;
		}
	}

	function boolflip(name) {
		$configStore = produce($configStore, draft => {
			draft.preferences[name] = !draft.preferences[name];
		});
	}

	$: role = $account?.player?.playerInfo.role ?? '';
	$: supporter = isAnySupporter(role);
	$: showUnrankedMapsOnGraph = supporter && $configStore?.preferences?.showUnrankedMapsOnGraph;
	$: fetchPlayerScores(playerId, showUnrankedMapsOnGraph);

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
		<div class="chart-toggle-unranked {supporter ? '' : 'disabled-toggle'}">
			<Switch
				value={showUnrankedMapsOnGraph}
				label="Show unranked"
				title={supporter ? 'Show all maps with stars on them' : 'Subscribe to BeatLeader Patreon to have ratings on all maps'}
				fontSize={12}
				design="slider"
				on:click={() => {
					if (supporter) boolflip('showUnrankedMapsOnGraph');
				}} />
		</div>
		<Button
			cls="chart-new-playlist"
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

	canvas {
		width: 100% !important;
	}

	:global(.chart-new-playlist) {
		top: 0.3em;
		right: 2.2%;
		position: absolute !important;
		font-size: 0.8em !important;
		height: 1.5em;
	}

	.disabled-toggle {
		opacity: 0.6;
	}

	.chart-toggle-unranked {
		top: 0;
		left: 0.4em;
		position: absolute !important;
		font-size: 0.8em !important;
		height: 1.5em;
	}

	@media screen and (max-width: 650px) {
		:global(.chart-new-playlist) {
			display: none !important;
		}

		.chart-toggle-unranked {
			display: none !important;
		}
	}
</style>
