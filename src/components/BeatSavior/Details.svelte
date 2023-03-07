<script>
	import {fade} from 'svelte/transition';
	import Hands from './Stats/Hands.svelte';
	import OtherStats from './Stats/OtherStats.svelte';
	import Grid from './Stats/Grid.svelte';
	import Chart from './Stats/Chart.svelte';
	import DetailsBox from '../Common/DetailsBox.svelte';

	export let beatSavior;
	export let showGrid = true;

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
				{#if showGrid}
					<Grid {accGrid} />
				{/if}
			</div>
		</DetailsBox>

		<DetailsBox cls="chart">
			<Chart {beatSavior} />
		</DetailsBox>
	</section>
{/if}

<style>
	.beat-savior {
		display: grid;
		grid-template-columns: 49.9% 49.9%;
		grid-gap: 0.2%;
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
