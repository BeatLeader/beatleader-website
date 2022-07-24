<script>
	import Chart from 'chart.js/auto';
	import regionsPlugin from './utils/regions-plugin';
	import 'chartjs-adapter-luxon';
	import {createEventDispatcher, getContext, onMount} from 'svelte';
	import {formatNumber} from '../../utils/format';

	export let stars = 5;
	export let height = '200px';
	export let logarithmic = false;
	export let modifiers = {};

	const pageContainer = getContext('pageContainer');

	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;

	const mutuallyExclusive = {
		DA: ['GN'],
		GN: ['DA'],
		SF: ['FS'],
		FS: ['SF'],
	};
	let selectedModifiers = [];

	function curve(acc, stars) {
		var l = 1 - (0.03 * (stars - 3.0)) / 11.0;
		var a = 0.96 * l;
		var f = 1.2 - (0.6 * stars) / 14.0;

		return Math.pow(Math.log10(l / (l - acc)) / Math.log10(l / (l - a)), f);
	}

	function ppFromAcc(acc, stars) {
		return curve(acc, stars - 0.5) * (stars + 0.5) * 42;
	}

	async function setupChart(canvas, stars, logarithmic, negativeModifiersSum) {
		if (!canvas) return;

		negativeModifiersSum = negativeModifiersSum < -1 ? -1 : negativeModifiersSum;

		const gridColor = '#2a2a2a';
		const rankColor = '#3e95cd';
		const annotationColor = '#aaa';

		let minPp = 0;
		let annotations = [];
		const data = [];
		for (let acc = 0.6; acc < 1; acc += 0.001) {
			const finalAcc = acc * (1 + negativeModifiersSum);
			const pp = ppFromAcc(finalAcc, stars);
			data.push({x: logarithmic ? 1 - acc : acc, y: pp});

			if (!minPp) minPp = pp;

			if (acc > 0.6 && (acc * 100) % 5 < 0.001)
				annotations.push({
					min: acc,
					max: acc,
					color: annotationColor,
					label: `${formatNumber(pp, 0)}pp`,
					position: {horizontal: 'left', vertical: 'top'},
				});
		}

		const datasets = [
			{
				data,
				borderColor: rankColor,
				borderWidth: 2,
				pointRadius: 0,
				tension: 0.4,
				type: 'line',
				label: 'PP',
			},
		];

		const xAxis = {
			type: logarithmic ? 'logarithmic' : 'linear',
			reverse: logarithmic,
			display: true,
			title: {
				display: false,
				text: 'acc',
			},
			ticks: {
				callback: val => (val * 100 === Math.floor(val * 100) ? (logarithmic ? 1 - val : `${formatNumber(val * 100, 0)}%`) : null),
				autoSkip: true,
				color: 'white',
			},
			grid: {
				color: gridColor,
			},
			min: 0.6,
			max: 1,
		};

		const yAxis = {
			display: true,
			position: 'left',
			title: {
				display: $pageContainer.name !== 'phone',
				text: 'pp',
				color: 'white',
			},
			ticks: {
				callback: val => (val === Math.floor(val) ? val : null),
				precision: 0,
				color: 'white',
			},
			grid: {
				color: gridColor,
			},
			min: Math.floor(minPp * 0.9),
		};

		if (!chart) {
			chart = new Chart(canvas, {
				type: 'line',
				data: {datasets},
				options: {
					responsive: true,
					animation: {
						duration: 0, // general animation time
					},
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
							display: false,
						},
						tooltip: {
							position: 'nearest',
							callbacks: {
								title(ctx) {
									if (!ctx?.[0]?.raw) return '';

									const accuracy = Math.round(ctx[0].raw?.x * 10000) / 100;

									return `acc: ${formatNumber(logarithmic ? 100 - accuracy : accuracy, 1)}%`;
								},
								label(ctx) {
									return `${formatNumber(ctx.parsed.y, ctx.dataset.round)}pp`;
								},
							},
						},
						regions: {
							regions: annotations,
						},
					},
					scales: {
						x: xAxis,
						y: yAxis,
					},
				},
				plugins: [regionsPlugin],
			});
		} else {
			chart.data = {datasets};
			chart.options.scales = {x: xAxis, y: yAxis};
			chart.options.plugins.regions = {
				regions: annotations,
			};
			chart.update();
		}
	}

	onMount(() => {
		dispatch('modified-stars', stars);
	});

	$: modifiersArr = Object.entries(modifiers ?? {})
		?.map(m => ({
			name: m[0],
			value: m[1],
		}))
		.filter(m => m.value)
		.sort((a, b) => b.value - a.value);
	$: positiveModifiersSum = selectedModifiers?.reduce((sum, mod) => sum + (mod.value > 0 ? mod.value : 0), 0) ?? 0;
	$: negativeModifiersSum = selectedModifiers?.reduce((sum, mod) => sum + (mod.value < 0 ? mod.value : 0), 0) ?? 0;
	$: excludedModifiers = selectedModifiers.reduce(
		(all, mod) => (mutuallyExclusive[mod?.name] ? all.concat(mutuallyExclusive[mod.name]) : all),
		[]
	);
	$: modifiedStars = stars * (1 + positiveModifiersSum * 2);
	$: setupChart(canvas, modifiedStars, logarithmic, negativeModifiersSum);

	$: dispatch('modified-stars', modifiedStars);
</script>

<section class="chart" style="--height: {height}">
	<canvas class="chartjs" bind:this={canvas} height={parseInt(height, 10)} />
</section>

{#if modifiersArr?.length}
	<div class="modifiers">
		{#each modifiersArr as modifier}
			<label title={`${formatNumber(modifier.value, 2, true)}%`} class:disabled={excludedModifiers.includes(modifier?.name)}>
				<input type="checkbox" bind:group={selectedModifiers} value={modifier} disabled={excludedModifiers.includes(modifier?.name)} />
				{modifier.name}
			</label>
		{/each}
	</div>
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

	.modifiers {
		margin-top: 1rem;
		text-align: center;
	}

	.modifiers > * {
		display: inline-block;
		margin-right: 0.75rem;
	}

	.modifiers label {
			transition: color 300ms;
	}

	.modifiers label.disabled {
		color: var(--faded) !important;
	}
</style>
