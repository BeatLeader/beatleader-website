<script>
  import BlChart from '../Charts/BlChart.svelte'
  import BlBadges from '../BlBadges.svelte'
  import AccHistoryChart from '../Charts/AccHistoryChart.svelte'
  import AccMapsChart from '../Charts/AccMapsChart.svelte'
  import Switcher from '../../Common/Switcher.svelte'

  export let playerId = null;
  export let scoresStats = null;
  export let ssBadges = null;
  export let statsHistory = null;

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
        chartComponent = BlChart;
        chartComponentProps = {playerId, statsHistory}
        break;

      case 'accmaps':
        chartComponent = AccMapsChart;
        chartComponentProps = {playerId, medianAcc, averageAcc}
        break;

      case 'acchistory':
        chartComponent = AccHistoryChart;
        chartComponentProps = {playerId, statsHistory}
        break;

      default:
        chartComponent = null;
        chartComponentProps = null;
    }
  }

  function onSwitcherChanged(event) {
    if (!event?.detail?.id) return;

    selectedOption = event.detail;
  }

  $: avgStat = scoresStats?.find(s => s.key === 'averageRankedAccuracy') ?? null
  $: medianStat = scoresStats?.find(s => s.key === 'medianRankedAccuracy') ?? null
  $: avgAccTween = avgStat?.value ?? null
  $: medianAccTween = medianStat?.value ?? null
  $: averageAcc = $avgAccTween
  $: medianAcc = $medianAccTween

  $: updateChartComponent(selectedOption, averageAcc, medianAcc)
</script>

<div class="beatleader-swipe-card">
  {#if ssBadges}
    <BlBadges badges={ssBadges}/>
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

    @media screen and (max-width: 500px) {
        .chart {
            min-width: auto;
        }
    }
</style>