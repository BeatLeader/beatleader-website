<script>
	import MapsAccChart from './MapsAccChart.svelte';
	import MapsRankChart from './MapsRankChart.svelte';
	import MapsWeightChart from './MapsWeightChart.svelte';
	import Switcher from '../../Common/Switcher.svelte';

	export let playerId = null;
	export let scoresStats = null;

	const allSwitcherOptions = [
		{id: 'accmaps', label: 'Maps Acc', iconFa: 'fas fa-crosshairs'},
		{id: 'weightmaps', label: 'Maps Weight', iconFa: 'fas fa-weight-hanging'},
		{id: 'rankmaps', label: 'Maps Rank', iconFa: 'fas fa-ranking-star'},
	];

	let switcherOptions = allSwitcherOptions;

	let selectedOption = switcherOptions[0];
	let chartComponent = null;
	let chartComponentProps = null;

	function updateChartComponent(option) {
		switch (option?.id) {
			case 'accmaps':
				chartComponent = MapsAccChart;
				chartComponentProps = {playerId, averageAcc, medianAcc};
				break;

			case 'weightmaps':
				chartComponent = MapsWeightChart;
				chartComponentProps = {playerId};
				break;
			case 'rankmaps':
				chartComponent = MapsRankChart;
				chartComponentProps = {playerId};
				break;

			default:
				chartComponent = null;
				chartComponentProps = null;
		}
	}

	function onSwitcherChanged(event) {
		if (!event?.detail?.id) return;

		selectedOption = event.detail;
	}

	$: avgStat = scoresStats?.find(s => s.key === 'averageRankedAccuracy') ?? null;
	$: medianStat = scoresStats?.find(s => s.key === 'medianRankedAccuracy') ?? null;
	$: avgAccTween = avgStat?.value ?? null;
	$: medianAccTween = medianStat?.value ?? null;
	$: averageAcc = $avgAccTween;
	$: medianAcc = $medianAccTween;

	$: updateChartComponent(selectedOption, averageAcc, medianAcc);
</script>

<div class="beatleader-inner-swipe-card">
	{#if selectedOption}
		<div class="chart-switcher">
			<Switcher values={switcherOptions} value={selectedOption} on:change={onSwitcherChanged} />
		</div>
		<div class="chart-container">
			<svelte:component this={chartComponent} {...chartComponentProps} on:height-changed />
		</div>
	{/if}
</div>

<style>
	.beatleader-inner-swipe-card {
		display: flex;
		flex-direction: column;
		grid-gap: 0.6em;
	}

	.chart-container {
		margin: 0 0.4em 0 0.4em;
		padding: 0.4em;
		box-shadow: 0 2px 10px rgb(0 0 0 / 53%);
		border-radius: 0.4em;
		min-width: 29.6em;
		background: var(--graph-gradient);
		overflow: hidden;
	}

	@media screen and (max-width: 500px) {
		.chart-container {
			min-width: auto;
		}
	}
</style>
