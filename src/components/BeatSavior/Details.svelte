<script>
	import {fade} from 'svelte/transition';
	import {configStore} from '../../stores/config';
	import Hands from './Stats/Hands.svelte';
	import OtherStats from './Stats/OtherStats.svelte';
	import Grid from './Stats/Grid.svelte';
	import Chart from './Stats/Chart.svelte';
	import DetailsBox from '../Common/DetailsBox.svelte';
	import ExtendedAccGraphs from '../Score/ExtendedAccGraphs.svelte';
	import CompactPagination from '../Score/CompactPagination.svelte';

	export let beatSavior;
	export let showGrid = true;
	export let replayAccGraphs = null;
	export let underswingsData = null;
	export let notes;

	let graphPageIndex = $configStore?.scoreDetailsPreferences?.defaultAccChartIndex ?? 1;

	function onGraphPaginationChange(event) {
		graphPageIndex = event.detail.page;
	}

	function extractGridAcc(beatSavior) {
		const gridAcc = beatSavior?.trackers?.accuracyTracker?.gridAcc;
		if (!gridAcc) return null;

		return gridAcc && Array.isArray(gridAcc) && gridAcc.length === 12
			? gridAcc.slice(-4).concat(gridAcc.slice(4, 8)).concat(gridAcc.slice(0, 4))
			: null;
	}

	$: accGrid = extractGridAcc(beatSavior);
	$: $configStore?.scoreDetailsPreferences?.defaultAccChartIndex,
		(graphPageIndex = Number.isFinite($configStore?.scoreDetailsPreferences?.defaultAccChartIndex)
			? $configStore.scoreDetailsPreferences.defaultAccChartIndex
			: 1);
</script>

{#if beatSavior}
	<section class="beat-savior" transition:fade|global>
		{#if $configStore?.scoreDetailsPreferences?.showScoreMetrics || $configStore?.scoreDetailsPreferences?.showHandsAcc || (showGrid && $configStore?.scoreDetailsPreferences?.showSliceDetails)}
			<DetailsBox cls="details-and-hands">
				{#if $configStore?.scoreDetailsPreferences?.showScoreMetrics}
					<OtherStats {beatSavior} />
				{/if}
				<div class="hands-and-grid">
					{#if $configStore?.scoreDetailsPreferences?.showHandsAcc}
						<Hands stats={beatSavior.stats} />
					{/if}
					{#if showGrid && $configStore?.scoreDetailsPreferences?.showSliceDetails}
						<Grid {accGrid} />
					{/if}
				</div>
			</DetailsBox>
		{/if}

		{#if $configStore?.scoreDetailsPreferences?.showAccChart}
			<DetailsBox cls="chart">
				{#if graphPageIndex === 0 || !replayAccGraphs}
					<Chart {beatSavior} />
				{:else}
					<ExtendedAccGraphs {replayAccGraphs} {underswingsData} {beatSavior} {notes} />
				{/if}
				{#if replayAccGraphs}
					<CompactPagination pageIndex={graphPageIndex} pagesCount={2} on:change={onGraphPaginationChange} />
				{/if}
			</DetailsBox>
		{/if}
	</section>
{/if}

<style>
	.beat-savior {
		display: grid;
		grid-template-columns: 49.9% 49.9%;
		grid-gap: 0.2%;
	}

	.beat-savior > :global(.chart) {
		display: flex;
		flex-direction: row;
		grid-gap: 0.5em;
	}

	.beat-savior > :global(.details-and-hands) {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		grid-gap: 0.5em;
	}

	.hands-and-grid {
		display: flex;
		justify-items: center;
		justify-content: center;
		grid-gap: 0.6em;
		flex-wrap: wrap;
	}

	header {
		display: flex;
		justify-content: center;
		font-size: 0.75rem;
	}

	@media screen and (max-width: 767px) {
		.beat-savior {
			grid-template-columns: 100%;
		}
	}

	@media screen and (max-width: 520px) {
		.beat-savior {
			grid-template-columns: 100%;
		}
	}
</style>
