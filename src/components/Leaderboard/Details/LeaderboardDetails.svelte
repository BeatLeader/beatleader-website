<script>
	import Switcher from '../../Common/Switcher.svelte';
	import PredictedAccGraph from '../PredictedAccGraph.svelte';
	import LeaderboardStats from './LeaderboardStats.svelte';
	import {configStore} from '../../../stores/config';

	export let leaderboard;
	export let selectedModifiers;

	const allSwitcherOptions = [
		{id: 'stats', label: 'Stats', iconFa: 'fas fa-clipboard-list'},
		{id: 'accGraph', label: 'Graphs', iconFa: 'fas fa-chart-line'},
	];

	let switcherOptions = allSwitcherOptions;

	let selectedOption = switcherOptions[0];

	function onSwitcherChanged(event) {
		if (!event?.detail?.id) return;

		selectedOption = event.detail;
	}
</script>

<div class="leaderboard-details-container">
	{#if $configStore?.leaderboardPreferences?.showStatsInHeader}
		<div class="leaderboard-details-content">
			<PredictedAccGraph {leaderboard} {selectedModifiers} />
		</div>
	{:else if selectedOption}
		<div class="chart-switcher">
			<Switcher values={switcherOptions} value={selectedOption} on:change={onSwitcherChanged} />
		</div>
		<div class="leaderboard-details-content">
			{#if selectedOption.id === 'stats'}
				<LeaderboardStats {leaderboard} />
			{:else if selectedOption.id === 'accGraph'}
				<PredictedAccGraph {leaderboard} {selectedModifiers} />
			{/if}
		</div>
	{/if}
</div>

<style>
	.leaderboard-details-container {
		display: flex;
		flex-direction: column;
		grid-gap: 0.6em;
		margin-top: 0.5em;
	}
</style>
