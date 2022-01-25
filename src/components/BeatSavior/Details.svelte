<script>
  import {fade} from 'svelte/transition'
  import {convertArrayToObjectByKey, opt} from '../../utils/js'
  import createPlayerService from '../../services/scoresaber/player'
  import beatSaviorRepository from '../../db/repository/beat-savior'
  import Hands from './Stats/Hands.svelte'
  import OtherStats from './Stats/OtherStats.svelte'
  import Grid from './Stats/Grid.svelte'
  import Chart from './Stats/Chart.svelte'
  import History from './History.svelte'
  import Switcher from '../Common/Switcher.svelte'
  import {formatNumber} from '../../utils/format'
  import Button from '../Common/Button.svelte'

  export let beatSavior;
  export let leaderboard;
  export let playerId;
  export let noHistory = false;

  const playerService = createPlayerService();

  let allSongRunsWithOtherPlayers = [];
  let allSongRuns = [];
  let selectedRun = beatSavior;
  let previouslySelected = null;
  let compareTo = null;

  let withOtherPlayers = false;

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

    const allCachedPlayers = convertArrayToObjectByKey(await playerService.getAll(), 'playerId');

    hash = hash.toLowerCase();

    allSongRunsWithOtherPlayers = Object.entries(
      (await beatSaviorRepository().getAllFromIndex('beat-savior-hash',
        hash))
        .filter(bs => bs && bs.diff === diff && ((allCachedPlayers && allCachedPlayers[bs.playerId]) || bs.playerId === playerId))
        .map(bs => ({...bs, playerName: opt(allCachedPlayers, `${bs.playerId}.name`, null)}))
        .reduce((cum, bs) => {
          if (!cum[bs.playerId]) cum[bs.playerId] = [];

          cum[bs.playerId].push(bs);
          cum[bs.playerId].sort((a, b) => b?.trackers?.scoreTracker?.rawRatio - a?.trackers?.scoreTracker?.rawRatio);

          return cum;
        }, {}),
    )
      .reduce((cum, [currentPlayerId, bsArr]) => cum.concat(currentPlayerId === playerId ? bsArr : bsArr[0]), [])
      .sort((a, b) => b.timeSet && a.timeSet ? b.timeSet - a.timeSet : 0);

    allSongRuns = withOtherPlayers
      ? allSongRunsWithOtherPlayers
      : allSongRunsWithOtherPlayers.filter(bs => bs.playerId === playerId)

    if (!selectedRun || !allSongRuns.find(r => r.beatSaviorId === selectedRun.beatSaviorId)) {
      selectedRun = best ? allSongRuns.find(r => r.beatSaviorId === best.beatSaviorId) : allSongRuns[0];
    }

    if (previouslySelected && allSongRuns.find(r => r.beatSaviorId === previouslySelected.beatSaviorId))
      previouslySelected = selectedRun;

    if (compareTo && allSongRuns.find(r => r.beatSaviorId === compareTo.beatSaviorId))
      compareTo = null;
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

    const updatedRun = allSongRuns.find(r => r.beatSaviorId === run.beatSaviorId);
    if (updatedRun) run = updatedRun;

    const acc = opt(run, 'trackers.scoreTracker.rawRatio')

    return `${withOtherPlayers && run.playerName ? run.playerName + ' / ' : ''}${formatNumber(acc * 100)}%${run.beatSaviorId === best.beatSaviorId ? ' (BEST)' : ''} run`
  }

  $: best = beatSavior;
  $: if (beatSavior && !selectedRun) selectedRun = beatSavior;
  $: accGrid = extractGridAcc(selectedRun)
  $: getAllLeaderboardPlays(playerId, leaderboard, withOtherPlayers)
  $: updateCompareTo(opt(selectedSwitcherOption, 'id', 'none'), selectedRun, best, previouslySelected)
  $: accCompareGrid = extractGridAcc(compareTo)
  $: name = getRunName(selectedRun)
  $: compareToName = getRunName(compareTo)
</script>

{#if selectedRun}
  <section class="beat-savior" class:with-history={!noHistory && allSongRunsWithOtherPlayers && allSongRunsWithOtherPlayers.length > 1} transition:fade>
    {#if !noHistory && allSongRunsWithOtherPlayers && allSongRunsWithOtherPlayers.length > 1}
      <nav>
        <header>
          <Switcher values={switcherOptions} value={selectedSwitcherOption} on:change={onSwitcherChanged}/>

          {#if withOtherPlayers || (allSongRunsWithOtherPlayers && allSongRunsWithOtherPlayers.length > allSongRuns.length)}
            <Button iconFa="fas fa-users" type={withOtherPlayers ? 'primary' : 'default'}
                    title="Show/hide scores of other players" noMargin={true}
                    on:click={() => withOtherPlayers = !withOtherPlayers}
            />
          {/if}
        </header>

        <History withPlayerName={withOtherPlayers} runs={allSongRuns} selectedId={selectedRun.beatSaviorId}
                 compareToId={opt(compareTo, 'beatSaviorId')} bestId={opt(beatSavior, 'beatSaviorId')}
                 on:selected={onRunSelected}
        />
      </nav>
    {/if}

    <div class="details-and-hands details-with-shadow">
      <OtherStats beatSavior={selectedRun} compareTo={compareTo} {name} {compareToName}/>
      <div class="hands-and-grid">
        <Hands stats={selectedRun.stats} compareTo={compareTo ? compareTo.stats : null} {name} {compareToName}/>
        <Grid {accGrid} compareTo={accCompareGrid} {name} {compareToName} />
      </div>
    </div>

    <div class="details-with-shadow">
      <Chart beatSavior={selectedRun} compareTo={compareTo} {name} {compareToName} />
    </div>
  </section>
{/if}

<style>
    .beat-savior {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        grid-gap: .4em;
        justify-content: center;
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
        grid-gap: 0.5em;
    }

    .details-with-shadow {
        margin: .4em;
        padding: .4em;
        box-shadow: 0 2px 10px rgb(0 0 0 / 53%);
        border-radius: .4em;
        min-width: 28em;
        background: linear-gradient(0deg, #06003814, #5a46ff14);
    }

    .beat-savior.with-history {
        grid-template-columns: auto 1.5fr 1fr;
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

    header {
        display: flex;
        justify-content: space-between;
        font-size: .75rem;
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