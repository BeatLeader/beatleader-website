<script>
  import {fade} from 'svelte/transition'
  import {opt} from '../../utils/js'
  import Hands from './Stats/Hands.svelte'
  import OtherStats from './Stats/OtherStats.svelte'
  import Grid from './Stats/Grid.svelte'
  import Chart from './Stats/Chart.svelte'

  export let beatSavior;
  export let leaderboard;

  function extractGridAcc(beatSavior) {
    const gridAcc = opt(beatSavior, 'trackers.accuracyTracker.gridAcc');
    if (!gridAcc) return null;

    return gridAcc && Array.isArray(gridAcc) && gridAcc.length === 12
      ? gridAcc.slice(-4).concat(gridAcc.slice(4, 8)).concat(gridAcc.slice(0, 4))
      : null;
  }

  $: accGrid = extractGridAcc(beatSavior)
</script>

{#if beatSavior}
  <section class="beat-savior" transition:fade>
    <Hands stats={beatSavior.stats}/>
    <OtherStats {beatSavior}/>
    <Grid {accGrid}/>
    <Chart {beatSavior}/>
  </section>
{/if}

<style>
    .beat-savior {
        max-width: 100%;
        overflow-x: hidden;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 1.5em;
        align-items: center;
        justify-items: center;
    }

    @media screen and (max-width: 767px) {
        .beat-savior {
            grid-template-columns: 1fr;
            grid-gap: 1.5em;
        }

        .beat-savior > :global(.stats) {
            grid-row: 1/2;
        }
    }

</style>