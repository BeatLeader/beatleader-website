<script>
	import {fade} from 'svelte/transition';
	import Hands from './Stats/Hands.svelte';
	import OtherStats from './Stats/OtherStats.svelte';
	import Grid from './Stats/Grid.svelte';
	import Chart from './Stats/Chart.svelte';
	import DetailsBox from "../Common/DetailsBox.svelte";

	export let beatSavior;

	function extractGridAcc(beatSavior) {
		const gridAcc = beatSavior?.trackers?.accuracyTracker?.gridAcc;
		if (!gridAcc) return null;

		return gridAcc && Array.isArray(gridAcc) && gridAcc.length === 12
			? gridAcc.slice(-4).concat(gridAcc.slice(4, 8)).concat(gridAcc.slice(0, 4))
			: null;
	}

	$: accGrid = extractGridAcc(beatSavior);
</script>

{#if beatSavior}
	<section class="beat-savior" transition:fade>
		<DetailsBox cls="details-and-hands">
			<OtherStats {beatSavior} />
			<div class="hands-and-grid">
				<Hands stats={beatSavior.stats} />
				<Grid {accGrid} />
			</div>
		</DetailsBox>

		<DetailsBox cls="chart">
			<Chart {beatSavior} />
		</DetailsBox>
	</section>
{/if}

<style>
	.beat-savior {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: center;
		margin: 0em 0.3em;
	}

	.beat-savior > :global(.details-and-hands) {
		display: grid;
		justify-content: center;
		grid-gap: 0.5em;
		grid-template-columns: min-content;
	}

	.hands-and-grid {
		display: flex;
		justify-items: center;
		grid-gap: 0.6em;
	}

	.beat-savior > :global(.chart) {
		min-width: 12em;
		max-width: 29.5em;
	}

	header {
		display: flex;
		justify-content: center;
		font-size: 0.75rem;
	}

	@media screen and (max-width: 767px) {
		.beat-savior {
			grid-template-columns: 1fr;
			flex-wrap: wrap;
		}

		.beat-savior > :global(.chart) {
			max-width: 100%;
		}

		.beat-savior > :global(.stats) {
			grid-row: 1/2;
		}
	}

	@media screen and (max-width: 520px) {
		.hands-and-grid {
			flex-wrap: wrap;
			justify-content: space-around;
		}
	}
</style>
