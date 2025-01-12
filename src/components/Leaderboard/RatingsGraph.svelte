<script>
	import {fade, fly} from 'svelte/transition';
	import Chart from 'chart.js/auto';
	import {formatNumber} from '../../utils/format';
	import Spinner from '../Common/Spinner.svelte';
	import {createDistanceWeightFunction, createMinMaxCounter} from '../../utils/math';
	import {diffForDiffName} from '../../utils/beatleader/format';
	import {capitalize} from '../../utils/js';

	export let leaderboard;
	export let modifiers = 'base';
	export let height = '12em';

	var ratings = null;
	var loading = false;
	function fetchExMachinaRatings(hash, link, diff, mode) {
		if (!hash || !diff || !mode) return;
		loading = true;
		fetch(
			`https://stage.api.beatleader.net/ppai2/graph/${hash.length >= 40 ? hash : 'link'}/${mode}/${diffForDiffName(diff)}/full${hash.length >= 40 ? '' : '?link=' + link}`
		)
			.then(async response => {
				if (response.status == 200) {
					const data = await response.json();

					ratings = data;
				} else {
					ratings = null;
				}
			})
			.catch(err => null)
			.finally(() => (loading = false));
	}

	let canvas = null;
	let chart = null;

	let themeName = 'darkss';
	let theme = null;

	function processChartData(chartData, key, resolution, smoothPeriodPercentage, weightFunctionSteepness) {
		var data = [];
		if (chartData.length === 0 || resolution === 0) return data;

		var songDuration = chartData[chartData.length - 1].time;
		const distanceWeightFunction = createDistanceWeightFunction(songDuration * smoothPeriodPercentage, weightFunctionSteepness);

		for (let i = 0.0; i < resolution; i += 1.0) {
			const songTime = (songDuration * i) / (resolution - 1);

			var sum = 0;
			var divider = 0;

			for (let j = 0.0; j < chartData.length; j += 1.0) {
				const item = chartData[j];
				const weight = distanceWeightFunction.getWeight(item.time - songTime);

				sum += item[key] * weight;
				divider += weight;
			}

			if (divider === 0) continue;
			const value = sum / divider;
			data.push([songTime, value]);
		}

		return data;
	}

	const colors = {acc: '#72a8ff', pass: '#a8ff72', tech: '#ff72a8'};

	async function setupChart(canvas, modifiers, chartData) {
		if (!canvas || !chartData) return;

		const datasets = ['acc', 'pass', 'tech'].map(key => {
			return {
				label: capitalize(key) + ' rating',
				data: chartData[modifiers].notes.map(note => [note.time, note[key]]),
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				borderColor: colors[key],
				borderWidth: 2,
				pointRadius: 0,
				type: 'line',
			};
		});

		const labels = datasets[0].data.map(
			v =>
				Math.floor(v[0] / 60) +
				':' +
				Math.round(v[0] % 60, 2)
					.toString()
					.padStart(2, '0')
		);

		if (!chart) {
			chart = new Chart(canvas, {
				data: {labels, datasets},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: {
						mode: 'index',
						intersect: false,
					},
					plugins: {
						legend: {
							display: false,
						},
						tooltip: {
							callbacks: {
								label(ctx) {
									return ctx.dataset.label + ': ' + formatNumber(ctx.parsed.y) + '★';
								},
							},
						},
					},
					scales: {
						x: {
							scaleLabel: {
								display: false,
							},
							ticks: {
								autoSkip: true,
								autoSkipPadding: 4,
								color: 'white',
							},
						},
						y: {
							ticks: {
								callback: function (val) {
									return val + '★';
								},
								color: 'white',
							},
						},
					},
				},
			});
		} else {
			chart.data = {labels, datasets};
			chart.update();
		}
	}

	$: hash = leaderboard?.song?.hash;
	$: downloadUrl = leaderboard?.song?.downloadUrl;
	$: diffInfo = leaderboard?.diffInfo;
	$: fetchExMachinaRatings(hash, downloadUrl, diffInfo?.diff, diffInfo?.type);
	$: ratings && setupChart(canvas, modifiers, ratings);
</script>

<article transition:fade|global>
	<section class="accuracy-chart" style="--height: {height}">
		<canvas class="chartjs" bind:this={canvas} />
	</section>
	{#if loading}
		<div class="spinner-container">
			<Spinner />
		</div>
	{/if}
</article>

<style>
	.spinner-container {
	}

	.accuracy-chart {
		height: 100%;
	}

	canvas {
		width: 100% !important;
		height: var(--height);
	}
</style>
