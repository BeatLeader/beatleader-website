<script>
  import {createEventDispatcher} from 'svelte'
  import createPlayerService from '../../../services/scoresaber/player'
  import ScoresStats from '../ScoresStats.svelte'
  import SsBadges from '../SsBadges.svelte'
  import SsChart from '../Charts/SsChart.svelte'
  import AccHistoryChart from '../Charts/AccHistoryChart.svelte'
  import AccMapsChart from '../Charts/AccMapsChart.svelte'
  import Switcher from '../../Common/Switcher.svelte'
  import {addToDate, DAY, toSSDate} from '../../../utils/date'

  export let playerId = null;
  export let scoresStats = null;
  export let accStats = null;
  export let accBadges = null;
  export let ssBadges = null;
  export let skeleton = false;
  export let isCached = false;
  export let rankHistory = null;

  const dispatch = createEventDispatcher();

  const playerService = createPlayerService();

  let playerHistory = null;
  let playerHistoryGain = null;

  let gainDaysAgo = 1;

  const allSwitcherOptions = [
    {id: 'rank', label: 'Rank & PP', iconFa: 'fas fa-chart-line'},
    {id: 'accmaps', label: 'Maps Acc', iconFa: 'fas fa-music'},
    {id: 'acchistory', label: 'Acc history', iconFa: 'fas fa-crosshairs'},
  ];

  let switcherOptions = allSwitcherOptions;

  let selectedOption = switcherOptions[0];
  let chartComponent = null;
  let chartComponentProps = null;

  function updateChartComponent(option) {
    switch (option?.id) {
      case 'rank':
        chartComponent = SsChart;
        chartComponentProps = {playerId, rankHistory, playerHistory}
        break;

      case 'accmaps':
        chartComponent = AccMapsChart;
        chartComponentProps = {playerId, medianAcc, averageAcc}
        break;

      case 'acchistory':
        chartComponent = AccHistoryChart;
        chartComponentProps = {playerId, rankHistory}
        break;

      default:
        chartComponent = null;
        chartComponentProps = null;
    }
  }

  function updateAvailableSwitcherOptions(isCached) {
    const currentSelection = selectedOption?.id ?? 'rank';

    switcherOptions = allSwitcherOptions.filter(o => o?.id !== 'accmaps' || isCached);
    selectedOption = switcherOptions.find(o => o.id === currentSelection) ?? switcherOptions[0];
  }

  function onSwitcherChanged(event) {
    if(!event?.detail?.id) return;

    selectedOption = event.detail;
  }

  async function refreshPlayerHistory(playerId) {
    if (!playerId) return;

    playerHistory = await playerService.getPlayerHistory(playerId) ?? null;
  }

  function refreshHistoryGain(playerId, playerHistory, rankHistory, daysAgo = 1) {
    playerHistoryGain = null;

    if (!playerId || (!playerHistory?.length && !rankHistory?.length)) return;

    const todaySsDate = toSSDate(new Date());

    let playerHistoryItem = playerService.getPlayerGain(playerHistory, daysAgo, daysAgo + 7 - 1);
    if (rankHistory?.length) {
      const reversedRankHistory = rankHistory.map(r => r).reverse();
      if (!reversedRankHistory?.[daysAgo]) return;

      if (!playerHistoryItem) playerHistoryItem = {playerId, rank: reversedRankHistory[daysAgo], ssDate: addToDate(-DAY, todaySsDate)};
      else playerHistoryItem.rank = reversedRankHistory[daysAgo]
    }

    if (!playerHistoryItem) return;

    playerHistoryGain = playerHistoryItem;

    dispatch('player-gain-changed', {...playerHistoryItem, gainDaysAgo: Math.floor((todaySsDate - playerHistoryItem.ssDate) / DAY), gainType: 'scoresaber'});
  }

  $: avgStat = accStats?.find(s => s.label === 'Average') ?? null
  $: medianStat = accStats?.find(s => s.label === 'Median') ?? null
  $: avgAccTween = avgStat?.value ?? null
  $: medianAccTween = medianStat?.value ?? null
  $: averageAcc = $avgAccTween
  $: medianAcc = $medianAccTween

  $: refreshPlayerHistory(playerId);
  $: refreshHistoryGain(playerId, playerHistory, rankHistory, gainDaysAgo)
  $: updateAvailableSwitcherOptions(isCached)
  $: updateChartComponent(selectedOption, rankHistory, averageAcc, medianAcc, playerHistory)
</script>

{#if scoresStats || ssBadges || skeleton}
  <div class="stats" class:enhanced={isCached}>
    {#if scoresStats}<ScoresStats stats={scoresStats} {skeleton}/>{/if}
    <div>
      {#if accStats}<ScoresStats stats={accStats}/>{/if}
      {#if accBadges}<ScoresStats stats={accBadges}/>{/if}
    </div>
    {#if ssBadges}
      <div class="up-to-tablet">
        <SsBadges badges={ssBadges}/>
      </div>
    {/if}
  </div>
{/if}
{#if selectedOption}
  <div class="chart">
    <svelte:component this={chartComponent} {...chartComponentProps} />
  </div>

  <div class="chart-switcher">
    <Switcher values={switcherOptions} value={selectedOption} on:change={onSwitcherChanged}/>
  </div>
{/if}

<style>
    .chart {
        min-height: calc(350px + 1rem);
        overflow: hidden;
    }

    .chart-switcher {
        margin-top: 1rem;
    }

    @media screen and (min-width: 1200px) {
        .stats.enhanced {
            display: grid;
            grid-template-columns: auto auto;
            grid-gap: 1em;
        }
    }

    @media (max-width: 599px) {
        .stats {
            text-align: center;
        }

        .stats :global(.badges) {
            display: contents;
        }
    }
</style>