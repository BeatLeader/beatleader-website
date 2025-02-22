<script>
	import {createEventDispatcher, getContext, onMount} from 'svelte';
	import 'chartjs-adapter-luxon';
	import Chart from 'chart.js/auto';
	import regionsPlugin from './utils/regions-plugin';
	import {formatNumber, GLOBAL_LEADERBOARD_TYPE} from '../../utils/format';
	import {ModifiersList, userDescriptionForModifier} from '../../utils/beatleader/format';
	import {getPPFromAcc, computeModifiedRating, computeStarRating} from '../../utils/beatleader/pp';
	import RangeSlider from 'svelte-range-slider-pips';
	import {debounce} from '../../utils/debounce';
	import {configStore} from '../../stores/config';
	import {produce} from 'immer';
	import ModifiersFilter from './ModifiersPicker/ModifiersFilter.svelte';

	export let passRating = 5;
	export let accRating = 5;
	export let techRating = 5;
	export let modifiersRating = null;
	export let height = '200px';
	export let logarithmic = false;
	export let modifiers = {};
	export let mode;

	const pageContainer = getContext('pageContainer');

	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;
	let startAcc = 0.6,
		endAcc = 1,
		minAcc = 0.5,
		maxAcc = 1;

	if (GLOBAL_LEADERBOARD_TYPE == 'golf') {
		startAcc = 0;
		endAcc = 0.3;
		minAcc = 0;
		maxAcc = 0.5;
	}

	const mutuallyExclusive = {
		NA: ['DA'],
		GN: ['DA'],
		DA: ['GN', 'NA'],
		SS: ['FS', 'SF'],
		FS: ['SF', 'SS'],
		SF: ['FS', 'SS'],
	};

	function fetchLimitsFromConfig(configStore) {
		startAcc = configStore.ppCurve.startAcc;
		endAcc = configStore.ppCurve.endAcc;
	}

	let selectedModifiers = [];

	function updateSelected(modifiers) {
		selectedModifiers = selectedModifiers.map(sm => modifiers.find(m => m.name == sm.name)).filter(sm => !!sm);
	}

	async function setupChart(canvas, configStore, passRating, accRating, techRating, logarithmic, startAcc, endAcc) {
		if (!canvas) return;

		const gridColor = '#2a2a2a';
		const mainColor = '#eb008c';
		const annotationColor = '#aaa';

		let annotations = [];
		const totalPPData = [];
		const passPPData = [];
		const accPPData = [];
		const techPPData = [];
		for (let acc = startAcc; acc < endAcc; acc += 0.0001) {
			const ppParts = getPPFromAcc(acc, passRating, accRating, techRating, mode);
			const pp = ppParts[0];

			totalPPData.push({x: logarithmic ? 1 - acc : acc, y: pp});

			passPPData.push({x: logarithmic ? 1 - acc : acc, y: ppParts[1]});
			accPPData.push({x: logarithmic ? 1 - acc : acc, y: ppParts[2]});
			techPPData.push({x: logarithmic ? 1 - acc : acc, y: ppParts[3]});

			if (acc > startAcc && (acc * 100) % Math.round(((maxAcc - startAcc) * 100) / 8) < 0.001)
				if (pp)
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
				data: totalPPData,
				borderColor: mainColor,
				borderWidth: 2,
				pointRadius: 0,
				tension: 0.4,
				type: 'line',
				label: 'PP',
			},
		];

		if (configStore.ppCurve.passPp) {
			datasets.push({
				data: passPPData,
				borderColor: 'orange',
				borderWidth: 2,
				pointRadius: 0,
				tension: 0.4,
				type: 'line',
				label: 'Pass PP',
			});
		}
		if (configStore.ppCurve.accPp) {
			datasets.push({
				data: accPPData,
				borderColor: 'purple',
				borderWidth: 2,
				pointRadius: 0,
				tension: 0.4,
				type: 'line',
				label: 'Acc PP',
			});
		}
		if (configStore.ppCurve.techPp) {
			datasets.push({
				data: techPPData,
				borderColor: 'red',
				borderWidth: 2,
				pointRadius: 0,
				tension: 0.4,
				type: 'line',
				label: 'Tech PP',
			});
		}

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
			min: startAcc,
			max: endAcc,
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

									const accuracy = Math.round(ctx[0].raw?.x * 100000) / 1000;

									return `acc: ${formatNumber(logarithmic ? 100 - accuracy : accuracy, 3)}%`;
								},
								label(ctx) {
									return `${formatNumber(ctx.parsed.y, ctx.dataset.round)} ${ctx.dataset.label}`;
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
		dispatch('modified-stars', {passRating, accRating, techRating, stars: null});
	});

	function onRangeChange(event) {
		startAcc = event.detail.values[0] / 100;
		endAcc = event.detail.values[1] / 100;

		$configStore = produce($configStore, draft => {
			draft.ppCurve.startAcc = startAcc;
			draft.ppCurve.endAcc = endAcc;
		});

		if (startAcc - minAcc < 0.05 && minAcc >= 0.05) {
			minAcc -= 0.05;
		} else if (startAcc - minAcc > 0.1) {
			minAcc += 0.05;
		}
	}

	const debouncedOnRangeChange = debounce(onRangeChange, 100);
	const hiddenModifiers = ModifiersList.filter(m => m.hideInFilter).map(m => m.id.toLowerCase());

	$: fetchLimitsFromConfig($configStore);
	$: modifiersArr = Object.entries(modifiers ?? {})
		?.filter(m => m?.[0] !== 'modifierId' && !hiddenModifiers.includes(m[0]))
		?.map(m => ({
			name: m[0]?.toUpperCase() ?? null,
			value: m[1] ?? null,
		}))
		.filter(m => m.name && m.value && m.name != 'NF')
		.sort((a, b) => b.value - a.value);
	$: updateSelected(modifiersArr);

	$: excludedModifiers = selectedModifiers.reduce(
		(all, mod) => (mutuallyExclusive[mod?.name] ? all.concat(mutuallyExclusive[mod.name]) : all),
		[]
	);
	$: modifiedPassRating = computeModifiedRating(passRating, 'PassRating', modifiersRating, selectedModifiers);
	$: modifiedAccRating = computeModifiedRating(accRating, 'AccRating', modifiersRating, selectedModifiers);
	$: modifiedTechRating = computeModifiedRating(techRating, 'TechRating', modifiersRating, selectedModifiers);
	$: modifiedStars =
		selectedModifiers?.length && (passRating !== modifiedPassRating || accRating !== modifiedAccRating || techRating !== modifiedTechRating)
			? computeStarRating(modifiedPassRating, modifiedAccRating, modifiedTechRating)
			: null;
	$: setupChart(canvas, $configStore, modifiedPassRating, modifiedAccRating, modifiedTechRating, logarithmic, startAcc, endAcc);

	$: dispatch('modified-stars', {
		passRating: modifiedPassRating,
		accRating: modifiedAccRating,
		techRating: modifiedTechRating,
		stars: modifiedStars,
		selectedModifiers,
	});
</script>

<section class="chart" style="--height: {height}">
	<canvas class="chartjs" bind:this={canvas} height={parseInt(height, 10)} />
</section>

{#if modifiersArr?.length}
	<div class="modifiers">
		{#each modifiersArr as modifier}
			<label
				title={`${userDescriptionForModifier(modifier.name)}: ${formatNumber(modifier.value * 100, 0, true)}%`}
				class:selected={selectedModifiers.includes(modifier)}
				class:disabled={excludedModifiers.includes(modifier.name)}
				on:click={() => {
					if (excludedModifiers.includes(modifier.name)) return;
					selectedModifiers = selectedModifiers.includes(modifier)
						? selectedModifiers.filter(m => m !== modifier)
						: [...selectedModifiers, modifier];
				}}>
				{modifier.name}
			</label>
		{/each}
	</div>
{/if}

<div class="acc-range">
	<RangeSlider
		range
		min={minAcc * 100}
		max={maxAcc * 100}
		step={((maxAcc - minAcc) * 100) / 2000}
		values={[startAcc * 100, endAcc * 100]}
		suffix="%"
		float
		hoverable
		pips
		pipstep={225}
		all="label"
		formatter={v => formatNumber(v, 0)}
		on:change={debouncedOnRangeChange} />
</div>

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
		display: flex;
		flex-wrap: wrap;
		align-content: center;
		justify-content: center;
		gap: 0.75em;
	}

	.modifiers > * {
		display: inline-block;
		width: 2.8em;
	}

	.modifiers label {
		transition:
			color 300ms,
			background-color 300ms;
		background-color: #4e4e4e;
		border-radius: 0.3em;
		padding: 0.2em 0.3em;
		cursor: pointer;
	}

	.modifiers label.selected {
		background-color: #838383;
	}

	.modifiers label.disabled {
		color: var(--faded) !important;
		background-color: #212121;
		cursor: default;
	}

	.acc-range {
		margin-top: 1rem;
	}
</style>
