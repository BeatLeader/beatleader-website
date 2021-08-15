<script>
  import {fade} from 'svelte/transition'
  import {opt} from '../../utils/js'
  import beatSaviorRepository from '../../db/repository/beat-savior'
  import Hands from './Stats/Hands.svelte'
  import OtherStats from './Stats/OtherStats.svelte'
  import Grid from './Stats/Grid.svelte'
  import Chart from './Stats/Chart.svelte'
  import History from './History.svelte'

  export let beatSavior;
  export let leaderboard;
  export let playerId;

  let allSongRuns = [];
  let selectedRun = beatSavior;

  function extractGridAcc(beatSavior) {
    const gridAcc = opt(beatSavior, 'trackers.accuracyTracker.gridAcc');
    if (!gridAcc) return null;

    return gridAcc && Array.isArray(gridAcc) && gridAcc.length === 12
      ? gridAcc.slice(-4).concat(gridAcc.slice(4, 8)).concat(gridAcc.slice(0, 4))
      : null;
  }

  async function getAllLeaderboardPlays(playerId, leaderboard) {
    if (!playerId || !leaderboard) return;

    let hash = opt(leaderboard, 'song.hash');
    const diff = opt(leaderboard, 'diffInfo.diff')

    if (!hash || !diff) return;

    hash = hash.toLowerCase();

    allSongRuns = (await beatSaviorRepository().getAllFromIndex('beat-savior-playerId', playerId))
      .filter(bs => bs && bs.hash === hash && bs.diff === diff)
      .sort((a, b) => b.timeSet && a.timeSet ? b.timeSet - a.timeSet : 0);
  }

  function onRunSelected(event) {
    if (!event || !event.detail) return;

    selectedRun = event.detail;
  }

  $: if (beatSavior && !selectedRun) selectedRun = beatSavior;
  $: accGrid = extractGridAcc(selectedRun)
  $: playerId = opt(selectedRun, 'playerId')
  $: getAllLeaderboardPlays(playerId, leaderboard)
</script>

{#if selectedRun}
  <section class="beat-savior" class:with-history={allSongRuns && allSongRuns.length > 1} transition:fade>
    {#if allSongRuns && allSongRuns.length > 1}
      <nav>
        <History runs={allSongRuns} selectedId={selectedRun.beatSaviorId} bestId={opt(beatSavior, 'beatSaviorId')}
                 on:selected={onRunSelected}
        />
      </nav>
    {/if}

    <Hands stats={selectedRun.stats}/>
    <OtherStats beatSavior={selectedRun}/>
    <Grid {accGrid}/>
    <Chart beatSavior={selectedRun}/>
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

    .beat-savior.with-history {
        grid-template-columns: auto 1fr 1fr;
    }

    .beat-savior.with-history nav {
        grid-column: 1 / 1;
        grid-row: 1 / span 2;
        align-self: start;
        max-width: 10.5em;
        max-height: 17em;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .beat-savior.with-history nav::-webkit-scrollbar {
        width: .25rem;
    }
    body::-webkit-scrollbar-track {
        background: var(--foreground, #fff);
    }
    .beat-savior.with-history nav::-webkit-scrollbar-thumb {
        background-color: var(--selected, #3273dc) ;
        border-radius: 6px;
        border: 3px solid var(--selected, #3273dc);
    }

    @media screen and (max-width: 767px) {
        .beat-savior {
            grid-template-columns: 1fr;
            grid-gap: 1.5em;
        }

        .beat-savior.with-history {
            grid-template-columns: 1fr;
        }

        .beat-savior.with-history nav {
            grid-row: 1/2;
            max-width: 100%;
        }

        .beat-savior.with-history > :global(.stats) {
            grid-row: 2/3;
        }

        .beat-savior > :global(.stats) {
            grid-row: 1/2;
        }
    }

</style>