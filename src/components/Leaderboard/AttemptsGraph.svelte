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
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let leaderboardId;

	let count = 0;
	let todayCount = 0;
	let weekCount = 0;
	let successRate = 0;
	let failurePoints = [];
	let duration = 0;
	let loading = true;
	let error = null;

	const pageContainer = getContext('pageContainer');

	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;
	let height = '300px';
	let isChartHovered = false;

	function formatTime(seconds) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.round(seconds % 60);
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	function setupChart(canvas, data, isChartHovered) {
		if (!canvas || !data?.length) return;

		const labels = data.map((_, i) => i);

		const getBackgroundColor = (color, alpha) => color.replace(/[\d.]+\)$/g, `${alpha})`);

		const datasets = [
			{
				label: 'Fails',
				data: data.map(p => p.fails * 100),
				backgroundColor: ctx => getBackgroundColor('rgba(255, 99, 132, 0.5)', isChartHovered ? '0.8' : '0.5'),
				borderColor: 'rgb(255, 99, 132)',
				fill: true,
				order: 3,
				borderWidth: 0,
			},
			{
				label: 'Restarts',
				data: data.map(p => p.restarts * 100),
				backgroundColor: ctx => getBackgroundColor('rgba(54, 162, 235, 0.5)', isChartHovered ? '0.8' : '0.5'),
				borderColor: 'rgb(54, 162, 235)',
				fill: true,
				order: 2,
				borderWidth: 0,
			},
			{
				label: 'Quits',
				data: data.map(p => p.quits * 100),
				backgroundColor: ctx => getBackgroundColor('rgba(255, 206, 86, 0.5)', isChartHovered ? '0.8' : '0.5'),
				borderColor: 'rgb(255, 206, 86)',
				fill: true,
				order: 1,
				borderWidth: 0,
			},
		];

		const config = {
			type: 'bar',
			data: {
				labels,
				datasets,
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false,
				},
				scales: {
					x: {
						display: isChartHovered,
						stacked: true,
						grid: {
							display: isChartHovered,
							color: '#2a2a2a',
						},
						ticks: {
							color: 'white',
							callback: value => formatTime((value / (data.length - 1)) * duration),
						},
					},
					y: {
						display: isChartHovered,
						stacked: true,
						grid: {
							display: isChartHovered,
							color: '#2a2a2a',
						},
						ticks: {
							color: 'white',
							callback: value => `${formatNumber(value, 1)}%`,
						},
					},
				},
				plugins: {
					legend: {
						display: isChartHovered,
						position: 'top',
						labels: {
							color: 'white',
							padding: 20,
						},
					},
					tooltip: {
						position: 'nearest',
						callbacks: {
							title: items => formatTime((items[0].dataIndex / (data.length - 1)) * duration),
							label: context => {
								const label = context.dataset.label;
								const value = context.raw;
								return `${label}: ${formatNumber(value, 2)}%`;
							},
						},
					},
				},
			},
		};

		if (!chart) {
			chart = new Chart(canvas, config);
		} else {
			chart.data = config.data;
			chart.options = config.options;
			chart.update();
		}
	}

	async function fetchData(leaderboardId) {
		try {
			loading = true;
			error = null;
			const response = await fetch(`${BL_API_URL}leaderboard/scorestats/${leaderboardId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch attempts data');
			}
			const data = await response.json();

			// Update the component state with fetched data
			count = data.count;
			todayCount = data.todayCount;
			weekCount = data.weekCount;
			successRate = data.successRate;
			failurePoints = data.failurePoints;
			duration = data.duration;
		} catch (err) {
			error = err.message;
			console.error('Error fetching attempts data:', err);
		} finally {
			loading = false;
		}
	}

	$: fetchData(leaderboardId);

	$: setupChart(canvas, failurePoints, isChartHovered);
</script>

<div class="stats" class:hidden={isChartHovered}>
	<div class="success-rate">
		<div class="progress-bar">
			<div class="progress" style="width: {successRate * 100}%"></div>
		</div>
		<div class="rate">{formatNumber(successRate * 100, 1)}% Success Rate</div>
	</div>

	<div class="attempts">
		<div class="count">{formatNumber(count, 0)}</div>
		<div class="label">attempts</div>
	</div>
</div>

<section
	class="chart"
	style="--height: {height}"
	on:mouseenter={() => (isChartHovered = true)}
	on:mouseleave={() => (isChartHovered = false)}>
	<canvas class="chartjs" bind:this={canvas} height={parseInt(height, 10)} />
	{#if loading}
		<div class="spinner-container">Loading attempts data...</div>
	{:else if error}
		<div class="spinner-container">Error: {error}</div>
	{/if}
</section>
<div class="period" class:hidden={isChartHovered}>{formatNumber(todayCount, 0)} today, {formatNumber(weekCount, 0)} this week</div>

<style>
	.stats {
		text-align: center;
		margin-bottom: 2rem;
		position: relative;
		z-index: 1;
	}

	.success-rate {
		margin-bottom: 1rem;
	}

	.progress-bar {
		height: 8px;
		background: #333;
		border-radius: 4px;
		overflow: hidden;
		margin: 0.5rem 0;
	}

	.progress {
		height: 100%;
		background: #98ff98;
		transition: width 0.3s ease;
	}

	.spinner-container {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.rate {
		font-size: 1.2rem;
		color: white;
	}

	.attempts {
		margin-top: 1rem;
	}

	.count {
		font-size: 2.5rem;
		font-weight: bold;
		color: white;
	}

	.label {
		font-size: 1.5rem;
		color: #999;
	}

	.period {
		font-size: 1rem;
		color: #666;
		margin-top: 0.5rem;
		text-align: center;
	}

	section {
		position: relative;
		margin: 1rem auto 0 auto;
		height: var(--height, 300px);
		margin-top: calc(var(--height, 300px) / -1.9);
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

	.loading {
		text-align: center;
		padding: 2rem;
		color: #999;
	}

	.error {
		text-align: center;
		padding: 2rem;
		color: #ff5555;
	}

	.hidden {
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.stats,
	.period {
		transition: opacity 0.2s ease;
	}
</style>
