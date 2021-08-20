<script>
  import {fade} from 'svelte/transition'
  import {opt} from '../../utils/js'
  import beatSaviorRepository from '../../db/repository/beat-savior'
  import Hands from './Stats/Hands.svelte'
  import OtherStats from './Stats/OtherStats.svelte'
  import Grid from './Stats/Grid.svelte'
  import Chart from './Stats/Chart.svelte'
  import History from './History.svelte'
  import Switcher from '../Common/Switcher.svelte'
  import {formatNumber} from '../../utils/format'

  export let beatSavior;
  export let leaderboard;
  export let playerId;

  let allSongRuns = [];
  let selectedRun = beatSavior;
  let previouslySelected = null;
  let compareTo = null;

  const switcherOptions = [
    {id: 'none', title: 'No comparision', iconFa: 'fas fa-times'},
    {id: 'best', title: 'Compare to the best', iconFa: 'fas fa-cubes'},
    {id: 'last-clicked', title: 'Compare to previously selected', iconFa: 'fas fa-mouse'},
  ];

  let selectedSwitcherOption = switcherOptions[1];

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
    if (!event || !event.detail || (selectedRun && event.detail.beatSaviorId === selectedRun.beatSaviorId)) return;

    previouslySelected = selectedRun ? {...selectedRun} : null;
    selectedRun = event.detail;
  }

  function onSwitcherChanged(e) {
    selectedSwitcherOption = e.detail;
  }

  function updateCompareTo(type, selected, best, previous) {
    switch (type) {
      case 'none':
        compareTo = null;
        break;

      case 'best':
        compareTo = opt(best, 'beatSaviorId') !== opt(selected, 'beatSaviorId') ? best : null;
        break;

      case 'last-clicked':
        compareTo = opt(previous, 'beatSaviorId') !== opt(selected, 'beatSaviorId') ? previous : null;
        break;
    }
  }

  function getRunName(run) {
    if (!run) return null;

    const acc = opt(run, 'trackers.scoreTracker.rawRatio')

    return `${formatNumber(acc*100)}%${run.beatSaviorId === best.beatSaviorId ? ' (BEST)' : ''} run`
  }

  $: best = beatSavior;
  $: if (beatSavior && !selectedRun) selectedRun = beatSavior;
  $: accGrid = extractGridAcc(selectedRun)
  $: playerId = opt(selectedRun, 'playerId')
  $: getAllLeaderboardPlays(playerId, leaderboard)
  $: updateCompareTo(opt(selectedSwitcherOption, 'id', 'none'), selectedRun, best, previouslySelected)
  $: accCompareGrid = extractGridAcc(compareTo)

  $: name = getRunName(selectedRun)
  $: compareToName = getRunName(compareTo)
</script>

{#if selectedRun}
  <section class="beat-savior" class:with-history={allSongRuns && allSongRuns.length > 1} transition:fade>
    {#if allSongRuns && allSongRuns.length > 1}
      <nav>
        <Switcher values={switcherOptions} value={selectedSwitcherOption} on:change={onSwitcherChanged}/>

        <History runs={allSongRuns} selectedId={selectedRun.beatSaviorId}
                 compareToId={opt(compareTo, 'beatSaviorId')} bestId={opt(beatSavior, 'beatSaviorId')}
                 on:selected={onRunSelected}
        />
      </nav>
    {/if}

    <Hands stats={selectedRun.stats} compareTo={compareTo ? compareTo.stats : null} {name} {compareToName}/>
    <OtherStats beatSavior={selectedRun} compareTo={compareTo} {name} {compareToName}/>
    <Grid {accGrid} compareTo={accCompareGrid} {name} {compareToName} />
    <Chart beatSavior={selectedRun} compareTo={compareTo} {name} {compareToName} />
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
        overflow: hidden;

        display: flex;
        flex-direction: column;
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

</style>