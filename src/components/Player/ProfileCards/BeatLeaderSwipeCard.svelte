<script>
  import {createEventDispatcher} from 'svelte'
  import createPlayerService from '../../../services/beatleader/player'
  import {addToDate, DAY, formatDateRelative, toSsMidnight} from '../../../utils/date'
  import {debounce} from '../../../utils/debounce'
  import ScoresStats from '../ScoresStats.svelte'
  import SsBadges from '../SsBadges.svelte'
  import SsChart from '../Charts/SsChart.svelte'
  import AccHistoryChart from '../Charts/AccHistoryChart.svelte'
  import AccMapsChart from '../Charts/AccMapsChart.svelte'
  import Switcher from '../../Common/Switcher.svelte'

  export let playerId = null;
  export let scoresStats = null;
  export let accStats = null;
  export let accBadges = null;
  export let ssBadges = null;
  export let skeleton = false;
  export let isCached = false;
  export let rankHistory = null;

  const HISTORY_GAIN_DEBOUNCE = 500;

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
    if (!event?.detail?.id) return;

    selectedOption = event.detail;
  }

  async function refreshPlayerHistory(playerId) {
    if (!playerId) return;

    playerHistory = await playerService.getPlayerHistory(playerId) ?? null;
  }

  function refreshHistoryGain(playerId, playerHistory, rankHistory, daysAgo = 1) {
    playerHistoryGain = null;

    if (!playerId || (!playerHistory?.length && !rankHistory?.length)) return;

    const todaySsDate = toSsMidnight(new Date());
    let gainDaysAgo = null;
    let playerHistoryItem = playerService.getPlayerGain(playerHistory, daysAgo, daysAgo + 7 - 1);
    if (playerHistoryItem) {
      gainDaysAgo = Math.floor((todaySsDate - playerHistoryItem.ssDate) / DAY);
    }

    if (rankHistory?.length) {
      const reversedRankHistory = rankHistory.map(r => r).reverse();
      if (!reversedRankHistory?.[daysAgo]) return;

      if (!playerHistoryItem) playerHistoryItem = {
        playerId,
        rank: reversedRankHistory[daysAgo],
        ssDate: addToDate(-DAY, todaySsDate)
      };
      else {
        playerHistoryItem.rank = reversedRankHistory[gainDaysAgo];
      }
    }

    if (!playerHistoryItem) return;

    playerHistoryGain = {...playerHistoryItem, gainDaysAgo, gainType: 'beatleader'};

    dispatch('player-gain-changed', playerHistoryGain);
  }

  const debouncedRefreshHistoryGain = debounce(
    (playerId, playerHistory, rankHistory, gainDaysAgo) =>
      refreshHistoryGain(playerId, playerHistory, rankHistory, gainDaysAgo), HISTORY_GAIN_DEBOUNCE,
  );

  $: avgStat = accStats?.find(s => s.key === 'avgAcc') ?? null
  $: medianStat = accStats?.find(s => s.key === 'medianAcc') ?? null
  $: avgAccTween = avgStat?.value ?? null
  $: medianAccTween = medianStat?.value ?? null
  $: averageAcc = $avgAccTween
  $: medianAcc = $medianAccTween

  $: refreshPlayerHistory(playerId);
  $: debouncedRefreshHistoryGain(playerId, playerHistory, rankHistory, gainDaysAgo)
  $: updateAvailableSwitcherOptions(isCached)
  $: updateChartComponent(selectedOption, rankHistory, averageAcc, medianAcc, playerHistory)
</script>

<div class="beatleader-swipe-card">
  {#if ssBadges}
    <SsBadges badges={ssBadges}/>
  {/if}
  {#if selectedOption}
    <div class="chart">
      <svelte:component this={chartComponent} {...chartComponentProps}/>
    </div>

    <div class="chart-switcher">
      <Switcher values={switcherOptions} value={selectedOption} on:change={onSwitcherChanged}/>
    </div>
  {/if}
</div>

<style>
    .beatleader-swipe-card {
        display: flex;
        flex-direction: column;
        grid-gap: .6em;
    }

    .chart {
        margin: .4em .4em .6em;
        padding: .4em;
        box-shadow: 0 2px 10px rgb(0 0 0 / 53%);
        border-radius: .4em;
        min-width: 29.6em;
        background: var(--graph-gradient);
        overflow: hidden;
    }
</style>