<script>
	import BlChart from '../Charts/BlChart.svelte';
	import AccHistoryChart from '../Charts/AccHistoryChart.svelte';
	import Switcher from '../../Common/Switcher.svelte';
	import SkillTriangleChart from '../Charts/SkillTriangleChart.svelte';
	import MapsGraphs from '../Charts/MapsGraphs.svelte';

	export let playerId = null;
	export let scoresStats = null;
	export let playerInfo = null;

	const allSwitcherOptions = [
		{id: 'rank', label: 'Rank & PP', iconFa: 'fas fa-chart-line'},
		{id: 'mapsgraphs', label: 'Maps Graphs', iconFa: 'fas fa-arrow-up-right-dots'},
		{id: 'acchistory', label: 'Acc history', iconFa: 'fas fa-crosshairs'},
		{id: 'triangle', label: 'Skill triangle', iconFa: 'skilltriangle-icon'},
	];

	let switcherOptions = allSwitcherOptions;

	let selectedOption = switcherOptions[0];
	let chartComponent = null;
	let chartComponentProps = null;

	function updateChartComponent(option) {
		switch (option?.id) {
			case 'rank':
				chartComponent = BlChart;
				chartComponentProps = {playerId};
				break;

			case 'mapsgraphs':
				chartComponent = MapsGraphs;
				chartComponentProps = {playerId, scoresStats};
				break;

			case 'acchistory':
				chartComponent = AccHistoryChart;
				chartComponentProps = {playerId};
				break;
			case 'triangle':
				chartComponent = SkillTriangleChart;
				chartComponentProps = {playerInfo};
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

	$: updateChartComponent(selectedOption);
</script>

<div class="beatleader-swipe-card">
	{#if selectedOption}
		<div class="chart-switcher">
			<Switcher values={switcherOptions} value={selectedOption} on:change={onSwitcherChanged} />
		</div>
		<div class="chart">
			<svelte:component this={chartComponent} {...chartComponentProps} on:height-changed />
		</div>
	{/if}
</div>

<style>
	.beatleader-swipe-card {
		display: flex;
		flex-direction: column;
		grid-gap: 0.6em;
		margin-top: 0.5em;
	}

	.chart {
		margin: 0 0.4em 0 0.4em;
		padding: 0.4em;
		box-shadow: 0 2px 10px rgb(0 0 0 / 53%);
		border-radius: 0.4em;
		min-width: 29.6em;
		background: var(--graph-gradient);
		overflow: hidden;
	}

	@media screen and (max-width: 500px) {
		.chart {
			min-width: auto;
		}
	}
</style>
