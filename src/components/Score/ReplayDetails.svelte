<script>
	import {downloadReplay} from '../../utils/beatleader/open-replay-decoder';
	import {
		processAccGraphs,
		processAccuracySpread,
		processSliceDetails,
		processSliceSummary,
	} from '../../utils/beatleader/process-replay-data';
	import SliceDetails from './SliceDetails.svelte';
	import AccuracySpreadChart from './AccuracySpreadChart.svelte';
	import DetailsBox from '../Common/DetailsBox.svelte';
	import {createEventDispatcher} from "svelte";

	const dispatch = createEventDispatcher();

	export let score;

	let accSpreadData;
	let sliceDetailsData;
	let sliceSummaryData;
	let accGraphsData;

	function processReplay(score) {
		downloadReplay(score, replay => {
			accSpreadData = processAccuracySpread(replay);
			sliceDetailsData = processSliceDetails(replay);
			sliceSummaryData = processSliceSummary(replay);
			accGraphsData = processAccGraphs(replay);

			dispatch('replay-was-processed', {
				accGraphsData: accGraphsData
			});
		});
	}

	$: processReplay(score);
</script>

<div class="replay-details">
	<DetailsBox cls="slice-details-container">
		<SliceDetails {sliceDetailsData} {sliceSummaryData} />
	</DetailsBox>
	<DetailsBox cls="accuracy-spread-container">
		<AccuracySpreadChart {accSpreadData} />
	</DetailsBox>
</div>

<style>
	.replay-details {
		display: grid;
		grid-template-columns: 49.9% 49.9%;
		grid-gap: 0.2%;
	}

	.replay-details > :global(.slice-details-container) {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.replay-details > :global(.accuracy-spread-container) {
		display: block;
	}

	@media screen and (max-width: 520px) {
		.replay-details {
			grid-template-columns: 100%;
		}
	}
</style>
