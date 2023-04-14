<script>
	import {createEventDispatcher} from 'svelte';
	import stringify from 'json-stable-stringify';
	import {downloadReplay} from '../../utils/beatleader/open-replay-decoder';
	import {
		processAccGraphs,
		processAccuracySpread,
		processSliceDetails,
		processSliceSummary,
		processUnderswings,
	} from '../../utils/beatleader/process-replay-data';
	import {configStore} from '../../stores/config';
	import SliceDetails from './SliceDetails.svelte';
	import AccuracySpreadChart from './AccuracySpreadChart.svelte';
	import DetailsBox from '../Common/DetailsBox.svelte';

	const dispatch = createEventDispatcher();

	export let score;

	let accSpreadData;
	let sliceDetailsData;
	let sliceSummaryData;

	let lastProcessedReplay = null;
	function processReplay(score) {
		const {replay, offsets} = score;
		const replayObj = stringify({replay, offsets});

		if (lastProcessedReplay === replayObj) return;

		lastProcessedReplay = replayObj;

		downloadReplay(score, replay => {
			accSpreadData = processAccuracySpread(replay);
			sliceDetailsData = processSliceDetails(replay);
			sliceSummaryData = processSliceSummary(replay);
			const accGraphsData = processAccGraphs(replay);
			const underswingsData = processUnderswings(replay);

			dispatch('replay-was-processed', {
				accGraphsData,
				underswingsData,
			});
		});
	}

	$: processReplay(score);
</script>

<div class="replay-details">
	{#if $configStore?.scoreDetailsPreferences?.showSliceDetails}
		<DetailsBox cls="slice-details-container">
			<SliceDetails {sliceDetailsData} {sliceSummaryData} />
		</DetailsBox>
	{/if}

	{#if $configStore?.scoreDetailsPreferences?.showAccSpreadChart}
		<DetailsBox cls="accuracy-spread-container">
			<AccuracySpreadChart {accSpreadData} />
		</DetailsBox>
	{/if}
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
