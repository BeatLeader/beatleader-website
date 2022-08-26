<script>
	import {fade} from 'svelte/transition';
	import Hands from './Stats/Hands.svelte';
	import OtherStats from './Stats/OtherStats.svelte';
	import Grid from './Stats/Grid.svelte';
	import Chart from './Stats/Chart.svelte';

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
		<div class="details-with-shadow details-and-hands">
			<OtherStats {beatSavior} />
			<div class="hands-and-grid">
				<Hands stats={beatSavior.stats} />
				<Grid {accGrid} />
			</div>
		</div>

		<div class="details-with-shadow chart">
			<Chart {beatSavior} />
		</div>
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

	.details-and-hands {
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

	.details-with-shadow {
		margin: 0.4em 0.4em 0.6em;
		padding: 0.4em;
		box-shadow: 0 2px 10px rgb(0 0 0 / 53%);
		border-radius: 0.4em;
		background: var(--graph-gradient);
		width: 100%;
	}

	.details-with-shadow.chart {
		min-width: 12em;
		max-width: 29.5em;
	}

	.beat-savior.with-history {
		grid-template-columns: auto 1.5fr 1fr;
	}

	.history-selector {
		grid-column: 1 / 1;
		grid-row: 1 / span 2;
		align-self: start;
		min-width: 8em;
		max-width: 8em;
		max-height: 13em;
		overflow: hidden;

		display: flex;
		flex-direction: column;
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

		.beat-savior.with-history {
			grid-template-columns: 1fr;
		}

		.details-with-shadow.chart {
			max-width: 100%;
		}

		.history-selector {
			grid-row: 1/2;
			max-width: 100%;
			flex-direction: row;
			width: 100%;
		}

		.beat-savior.with-history > :global(.stats) {
			grid-row: 2/3;
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
