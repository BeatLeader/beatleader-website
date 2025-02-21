<script>
	import Chart from 'chart.js/auto';
	import {formatNumber} from '../../utils/format';
	import {configStore} from '../../stores/config';
	import {BL_API_URL, BL_REPLAYS_URL, BL_ANALYZER_URL} from '../../network/queues/beatleader/api-queue';
	import {colorForEndType, endTypeForTitle, titleForEndType} from '../../utils/attempts';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import Spinner from '../Common/Spinner.svelte';

	export let leaderboard = null;
	export let page = 1;
	export let height = '30em';

	let canvas = null;
	let chart = null;
	let avatarContainer = null;

	let themeName = 'darkss';
	let theme = null;
	let textColor = '';

	if ($configStore.preferences.theme != 'flylight') {
		textColor = '#fff';
	} else {
		textColor = '#757575';
	}

	async function onLegendClick(event, legendItem, legend, justRefresh = false) {
		const ci = legend.chart;

		if (!justRefresh) {
			const idx = legendItem.datasetIndex;

			if (ci.isDatasetVisible(idx)) {
				legendItem.hidden = true;
				ci.hide(idx);
				// Hide corresponding avatar
				const avatar = avatarContainer.querySelector(`[data-dataset-index="${idx}"]`);
				if (avatar) {
					avatar.style.display = 'none';
				}
			} else {
				legendItem.hidden = false;
				ci.show(idx);
				// Show corresponding avatar
				const avatar = avatarContainer.querySelector(`[data-dataset-index="${idx}"]`);
				if (avatar) {
					avatar.style.display = 'block';
				}
			}
		}

		// Refresh all avatar y positions since scale bounds may have changed
		if (avatarContainer) {
			const avatars = avatarContainer.querySelectorAll('.player-avatar');
			avatars.forEach(avatar => {
				const datasetIndex = parseInt(avatar.dataset.datasetIndex);
				const score = data.scores[datasetIndex];
				if (score && score.notes.length) {
					const lastNote = score.notes[score.notes.length - 1];
					const finalY = 100 - lastNote.accuracy * 100;
					avatar.style.top = `${ci.scales.y.getPixelForValue(finalY)}px`;
				}
			});
		}
	}

	let data = null;
	function fetchData(leaderboard, page) {
		data = null;
		if (!leaderboard) return;
		fetch(`${BL_API_URL}map/scorestats/graph/top?leaderboardId=${leaderboard.leaderboardId}&page=${page}`, {
			credentials: 'include',
		})
			.then(r => r.json())
			.then(r => {
				data = r;
			});
	}

	function updateAvatars(chartData, maxTime) {
		if (!avatarContainer) return;

		// Clear existing avatars
		avatarContainer.innerHTML = '';

		for (let i = 0; i < chartData.scores.length; i++) {
			const score = chartData.scores[i];
			if (!score.notes.length) continue;

			// Get final y position from last note
			const lastNote = score.notes[score.notes.length - 1];
			const finalY = 100 - lastNote.accuracy * 100;

			// Create avatar element
			const avatar = document.createElement('img');
			avatar.src = score.playerAvatar;
			avatar.className = 'chart-player-avatar';
			avatar.style.top = `${chart.scales.y.getPixelForValue(finalY)}px`;
			avatar.style.left = `${chart.scales.x.getPixelForValue(maxTime)}px`;
			avatar.title = `#${score.rank} - ${score.playerName}`;
			avatar.dataset.datasetIndex = i;
			avatar.style.display = chart.isDatasetVisible(i) ? 'block' : 'none';

			avatarContainer.appendChild(avatar);
		}
	}

	function colorForModifiers(modifiers) {
		if (!modifiers || !modifiers.length) return 'rgba(255, 255, 255, 0.5)';

		const modList = modifiers.split(',');
		let colorShift = 0;

		for (const mod of modList) {
			switch (mod.trim()) {
				case 'FS':
					colorShift += 0.2;
					break;
				case 'SF':
					colorShift += 0.36;
					break;
				case 'SS':
					colorShift -= 0.3;
					break;
				case 'GN':
					colorShift += 0.04;
					break;
				case 'NA':
					colorShift -= 0.3;
					break;
				case 'NB':
					colorShift -= 0.2;
					break;
				case 'NF':
					colorShift -= 0.5;
					break;
				case 'NO':
					colorShift -= 0.2;
					break;
			}
		}

		// Base color is white (255, 255, 255)
		if (colorShift > 0) {
			// Shift towards red
			return `rgb(255, ${Math.max(0, Math.floor(255 * (1 - colorShift)))}, ${Math.max(0, Math.floor(255 * (1 - colorShift)))})`;
		} else if (colorShift < 0) {
			// Shift towards blue
			return `rgb(${Math.max(0, Math.floor(255 * (1 + colorShift)))}, ${Math.max(0, Math.floor(255 * (1 + colorShift)))}, 255)`;
		}

		return '#ffffff';
	}

	async function setupChart(canvas, chartData, scoreHistoryLegend) {
		if (!canvas || !chartData || !chartData.scores || !chartData.scores.length) return;

		var datasets = [];

		for (let i = 0; i < chartData.scores.length; i++) {
			const score = chartData.scores[i];
			const data = score.notes.map(note => ({
				x: note.spawnTime,
				y: 100 - note.accuracy * 100,
				score: note.score,
			}));

			datasets.push({
				label: `#${score.rank} - ${score.playerName}${score.modifiers ? ` [${score.modifiers}]` : ''}`,
				data: data,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				borderColor: colorForModifiers(score.modifiers),
				borderWidth: 2,
				pointRadius: ctx => {
					const point = ctx.raw;
					return point?.score < 0 ? 4 : 0;
				},
				pointBackgroundColor: ctx => {
					const point = ctx.raw;
					if (point?.score === -3) return '#ffa500'; // miss
					if (point?.score === -2) return '#ff0000'; // bad cut
					if (point?.score === -5) return '#800080'; // wall
					if (point?.score === -4) return '#000000'; // bomb
					return 'transparent';
				},
				type: 'line',
			});
		}

		const maxTime = Math.max(...chartData.scores.flatMap(score => score.notes.map(note => note.spawnTime)));

		if (!chart) {
			chart = new Chart(canvas, {
				type: 'line',
				data: {datasets},
				options: {
					responsive: true,
					animation: {
						duration: 0,
					},
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
							callbacks: {
								title(ctx) {
									return (
										Math.floor(ctx[0].raw?.x / 60) +
										':' +
										Math.round(ctx[0].raw?.x % 60)
											.toString()
											.padStart(2, '0')
									);
								},
								label(ctx) {
									const point = ctx.raw;
									let label = `${ctx.dataset.label}: ${formatNumber(100 - ctx.parsed.y)}%`;

									if (point?.score === -3) label += ' (Miss)';
									if (point?.score === -2) label += ' (Bad Cut)';
									if (point?.score === -5) label += ' (Wall Hit)';
									if (point?.score === -4) label += ' (Bomb Hit)';
									return label;
								},
							},
						},
					},
					scales: {
						x: {
							type: 'linear',
							position: 'bottom',
							min: 0,
							max: maxTime,
							ticks: {
								callback: function (value) {
									return (
										Math.floor(value / 60) +
										':' +
										Math.round(value % 60)
											.toString()
											.padStart(2, '0')
									);
								},
								color: textColor,
							},
						},
						y: {
							type: 'logarithmic',
							reverse: true,
							min: Math.min(...datasets.flatMap(d => d.data.map(p => p.y)).filter(y => y > 0)),
							ticks: {
								callback: function (val) {
									return 100 - val + '%';
								},
								color: textColor,
							},
						},
					},
					configStore,
				},
			});
		} else {
			chart.data = {datasets};
			chart.options.scales.x.max = maxTime;
			chart.options.scales.y.min = Math.min(...datasets.flatMap(d => d.data.map(p => p.y)).filter(y => y > 0));
			chart.update();
		}

		// Update avatars after chart is rendered
		setTimeout(() => updateAvatars(chartData, maxTime), 100);
	}

	$: fetchData(leaderboard, page);
	$: data && canvas && setupChart(canvas, data, $configStore.scoreHistoryLegend);
</script>

<section class="accuracy-chart" style="--height: {height}">
	<div class="chart-container">
		<canvas class="chartjs" bind:this={canvas} />
		<div class="avatar-container" bind:this={avatarContainer}></div>
	</div>
	{#if !data}
		<div class="loading-container">
			<Spinner />
			<span>Loading...</span>
		</div>
	{/if}
</section>

<style>
	.accuracy-chart {
		height: 100%;
		width: 100%;
		position: relative;
	}

	.chart-container {
		position: relative;
		width: 100%;
		height: var(--height);
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	canvas {
		width: 100% !important;
		height: 100%;
	}

	.avatar-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	:global(.chart-player-avatar) {
		position: absolute;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		border: 2px solid white;
	}
</style>
