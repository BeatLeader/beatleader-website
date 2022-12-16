<script>
	import {downloadReplay} from '../../utils/beatleader/open-replay-decoder';
	import {
		processAccuracySpread,
		processSliceDetails,
		processSliceSummary
	} from '../../utils/beatleader/process-replay-data';
	import SliceDetails from './SliceDetails.svelte';
	import AccuracySpreadChart from './AccuracySpreadChart.svelte';
	import DetailsBox from '../Common/DetailsBox.svelte';

	export let score;

	let accSpreadData;
	let sliceDetailsData;
	let sliceSummaryData;

	function processReplay(score) {
		downloadReplay(score, replay => {
			accSpreadData = processAccuracySpread(replay);
			sliceDetailsData = processSliceDetails(replay);
			sliceSummaryData = processSliceSummary(replay);
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

	@media screen and (max-width: 767px) {
		.replay-details {
			grid-template-columns: 100%;
		}
	}

	@media screen and (max-width: 520px) {
		.replay-details {
			grid-template-columns: 100%;
		}
	}
</style>
