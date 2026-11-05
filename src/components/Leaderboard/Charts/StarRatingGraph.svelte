<script>
	import {onDestroy} from 'svelte';
	import Spinner from '../../Common/Spinner.svelte';
	import Chart from 'chart.js/auto';
	import {configStore} from '../../../stores/config';
	import {formatNumber} from '../../../utils/format';
	import {diffForDiffName} from '../../../utils/beatleader/format';
	import {effectiveStars} from '../../../utils/beatleader/map-breakdown';
	import {buildAccCurve, getPpParts, STAR_ACCURACY} from '../../../utils/beatleader/rebalanced-pp';

	export let leaderboard;
	export let selectedModifiers;
	// Optional per-part curves fitted like portaBLe's EffectiveStars: {speed, tech, acc}, each [[raw, stars], ...].
	// Without them a part's line is raw / mean(raw) × rating.
	export let curves = null;

	export let height = '17em';

	let canvas = null;
	let chart = null;

	let data = null;
	let subtitle = '';
	let loading = false;
	let lastFetchKey = '';

	async function getData(leaderboard, selectedModifiers, curves) {
		const hash = leaderboard?.song?.hash;
		const downloadUrl = leaderboard?.song?.downloadUrl;
		const diffInfo = leaderboard?.diffInfo;

		if (!diffInfo?.diff || !diffInfo?.type || (!hash && !downloadUrl)) {
			data = null;
			return;
		}

		const diffValue = diffForDiffName(diffInfo.diff);
		const mode = diffInfo.type;

		const fetchKey = `${hash}_${downloadUrl}_${mode}_${diffValue}`;
		if (fetchKey === lastFetchKey) {
			if (data?._rawJson) {
				processData(data._rawJson, selectedModifiers);
			}
			return;
		}
		lastFetchKey = fetchKey;

		loading = true;

		try {
			let url;
			if (hash && hash.length >= 40) {
				url = `https://stage.api.beatleader.net/ppai2/${hash}/${mode}/${diffValue}`;
			} else {
				url = `https://stage.api.beatleader.net/ppai2/link/${mode}/${diffValue}?link=${encodeURIComponent(downloadUrl)}`;
			}

			const response = await fetch(url);
			if (!response.ok) {
				data = null;
				return;
			}

			const json = await response.json();
			processData(json, selectedModifiers);
		} catch (e) {
			console.error('Failed to fetch rating graph data', e);
			data = null;
		} finally {
			loading = false;
		}
	}

	function processData(json, selectedModifiers) {
		if (!json) {
			data = null;
			return;
		}

		let key = 'none';
		if (selectedModifiers && Array.isArray(selectedModifiers)) {
			if (selectedModifiers.some(m => m.name === 'SS' || m.id === 'SS') && json['SS']) {
				key = 'SS';
			} else if (selectedModifiers.some(m => m.name === 'SF' || m.id === 'SF')) {
				key = json['SFS'] ? 'SFS' : json['SF'] ? 'SF' : 'none';
			} else if (selectedModifiers.some(m => m.name === 'FS' || m.id === 'FS') && json['FS']) {
				key = 'FS';
			}
		}

		const selectedItem = json[key] || json['none'] || Object.values(json)[0];
		if (!selectedItem || !selectedItem.breakdown) {
			data = null;
			return;
		}

		const breakdown = selectedItem.breakdown;
		const start = breakdown.start ?? 0;
		const rawSpeed = breakdown.speed ?? [];
		const rawAcc = breakdown.acc ?? [];
		const rawTech = breakdown.tech ?? [];
		const length = Math.max(rawSpeed.length, rawAcc.length, rawTech.length);

		const time = [];
		for (let i = 0; i < length; i++) {
			time.push(start + i);
		}

		// The shown modifier's ratings
		const accRating = selectedItem.acc_rating ?? 0;
		const passRating = selectedItem.lack_map_calculation?.balanced_pass_diff ?? 0;
		const techRating = selectedItem.lack_map_calculation?.balanced_tech ?? 0;
		const predictedAcc = selectedItem.predicted_acc > 0 ? selectedItem.predicted_acc : STAR_ACCURACY;

		// Effective stars: the curve gives the shape, each line averages to its part's rating
		// (speed: pass rating, tech: tech rating, acc: acc rating)
		const speed = effectiveStars(rawSpeed, passRating, curves?.speed);
		const tech = effectiveStars(rawTech, techRating, curves?.tech);
		const acc = effectiveStars(rawAcc, accRating, curves?.acc);

		// Each part's pp at the predicted acc, for the tooltip's pp rate
		const [passPp, accPp, techPp] = getPpParts(
			predictedAcc,
			accRating,
			passRating,
			techRating,
			buildAccCurve(predictedAcc),
			undefined,
			predictedAcc
		);

		data = {
			_rawJson: json,
			time,
			speed,
			acc,
			tech,
			stars: {
				speed: passRating,
				acc: accRating,
				tech: techRating,
			},
			pp: {
				speed: Math.max(0, passPp),
				acc: Math.max(0, accPp),
				tech: Math.max(0, techPp),
			},
		};
	}

	$: getData(leaderboard, selectedModifiers, curves);
	$: if (canvas && data) {
		setupChart(canvas, data);
	}

	onDestroy(() => {
		if (chart) {
			chart.destroy();
			chart = null;
		}
	});

	async function setupChart(canvas, chartData) {
		if (!canvas || !chartData || !Object.keys(chartData).length) return;

		var gridColor = '#2a2a2a';
		Chart.defaults.color = '#fff';

		if ($configStore.preferences.theme == 'flylight') {
			gridColor = '#dadadaaf';
			Chart.defaults.color = '#757575';
		}

		const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
		const parts = [
			{ key: 'speed', label: 'Speed', color: 'rgb(54, 162, 235)' },
			{ key: 'acc', label: 'Acc', color: 'rgb(153, 102, 255)' },
			{ key: 'tech', label: 'Tech', color: 'rgb(255, 99, 132)' },
		];

		parts.forEach(p => {
			const values = chartData[p.key] || [];
			p.peak = values.length ? values.reduce((best, v, i) => (v > values[best] ? i : best), 0) : 0;
			p.pp = chartData.pp ? chartData.pp[p.key] ?? 0 : 0;
			// Equals the part's rating: the line was scaled to average to it
			p.mean = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
		});

		// The style: each line's share of the three lines' averages (effective stars)
		const totalStars = parts.reduce((sum, p) => sum + p.mean, 0);
		parts.forEach(p => (p.share = totalStars > 0 ? (p.mean / totalStars) * 100 : 0));

		subtitle = parts
			.filter(p => p.share > 0)
			.map(
				p =>
					`<div class="share-bar" style="width:${p.share}%;background:${p.color}" title="${p.label}: ${formatNumber(p.mean, 2)}★ average (${formatNumber(p.share, 1)}%), rating ${formatNumber(data.stars[p.key], 2)}, ${formatNumber(p.pp, 2)}pp">${p.share >= 8 ? `${p.label} ${formatNumber(p.share, 0)}%` : ''}</div>`
			)
			.join('');

		const datasets = parts.map(p => ({
			label: `${p.label}: ${formatNumber(p.share, 0)}%, rating ${formatNumber(data.stars[p.key], 2)}★, ${formatNumber(p.pp, 0)}pp, peak ${formatNumber(data[p.key][p.peak], 1)}★ at ${clock(data.time[p.peak])}`,
			data: data.time.map((t, i) => ({ x: t, y: data[p.key][i] })),
			borderColor: p.color,
			backgroundColor: p.color,
			borderWidth: 1.5,
			tension: 0.3,
			pointRadius: 0,
		}));

		if (chart) {
			chart.destroy();
			chart = null;
		}

		chart = new Chart(canvas, {
			type: 'line',
			data: { datasets },
			options: {
				maintainAspectRatio: false,
				interaction: { mode: 'nearest', axis: 'x', intersect: false },
				scales: {
					x: {
						type: 'linear',
						min: data.time[0],
						max: data.time[data.time.length - 1],
						title: { display: false, text: 'Time' },
						ticks: { callback: clock },
						grid: { color: gridColor },
					},
					y: {
						min: 0,
						suggestedMax: 15,
						title: { display: false, text: 'Effective stars' },
						ticks: { callback: v => `${formatNumber(v, 0)}★` },
						grid: { color: gridColor },
					},
				},
				plugins: {
					tooltip: {
						callbacks: {
							title: items => (items.length ? clock(items[0].parsed.x) : ''),
							label: ctx => {
								const p = parts[ctx.datasetIndex];
								const rate = p.mean > 0 ? (ctx.parsed.y / p.mean) * p.pp : 0;
								return `${p.label}: ${formatNumber(ctx.parsed.y, 2)}★ (${formatNumber(rate, 0)}pp rate)`;
							},
						},
					},
				},
			},
		});
	}
</script>

<article class="graph-container">
	<div class="graph-title">
		<span>Ratings over time</span>
	</div>
	{#if subtitle}
		<div class="subtitle-bar">
			{@html subtitle}
		</div>
	{/if}
	<section class="ratings-chart" style="--height: {height}">
		<canvas class="chartjs" bind:this={canvas} />
	</section>
	{#if loading}
		<div class="spinner-container">
			<Spinner />
		</div>
	{/if}
</article>

<style>
	.graph-container {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		align-items: center;
		gap: 0.3em;
		position: relative;
		width: 100%;
	}

	.graph-title {
		font-size: 1.25rem;
		color: var(--textColor);
		display: inline-flex;
		gap: 0.4em;
	}

	.subtitle-bar {
		display: flex;
		width: 100%;
		height: 1.2em;
		border-radius: 4px;
		overflow: hidden;
		font-size: 0.75rem;
		line-height: 1.2em;
		color: #fff;
		text-align: center;
	}

	:global(.subtitle-bar .share-bar) {
		display: flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding: 0 4px;
	}

	.spinner-container {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.ratings-chart {
		height: 100%;
		width: 100%;
	}

	canvas {
		width: 100% !important;
		height: var(--height);
	}
</style>
