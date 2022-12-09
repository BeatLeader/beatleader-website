<script>
    import {useReplayOrNull} from "./open-replay-decoder";
    import {processAccuracySpread, processSliceDetails} from "./process-replay-data";
    import Spinner from "../components/Common/Spinner.svelte";
    import SliceDetails from "./SliceDetails.svelte";
    import AccuracySpreadChart from "./AccuracySpreadChart.svelte";
    import DetailsBox from "../components/Common/DetailsBox.svelte";

    let accSpreadData;
    let sliceDetailsData;
    let isLoading = true;

    function processReplay(replayLink) {
        useReplayOrNull(replayLink, replay => {
            accSpreadData = processAccuracySpread(replay)
            sliceDetailsData = processSliceDetails(replay)
        })
        isLoading = false;
    }

    $: processReplay("/assets/testReplay.bsor")
</script>

<div class="replay-details">
    {#if isLoading}
        <Spinner/>
    {:else}
        <DetailsBox cls="slice-details-container">
            <SliceDetails {sliceDetailsData}/>
        </DetailsBox>
        <DetailsBox cls="accuracy-spread-container">
            <AccuracySpreadChart {accSpreadData}/>
        </DetailsBox>
    {/if}
</div>

<style>
    .replay-details {
        display: flex;
        justify-content: center;
        align-items: stretch;
    }

    .replay-details > :global(.slice-details-container) {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .replay-details > :global(.accuracy-spread-container) {
        display: block;
    }
</style>