<script>
  import Chart from 'chart.js/auto'
  import playersHistoryRepository from '../../db/repository/players-history'
  import {formatNumber} from '../../utils/format'
  import {dateFromString, formatDateRelativeInUnits, toSSDate} from '../../utils/date'

  export let playerId = null;
  export let rankHistory = null;
  export let height = "300px";

  let canvas = null;
  let chart = null;

  let themeName = 'darkss';
  let theme = null;

  let lastHistoryHash = null;
  let playerHistory = null;

  const calcHistoryHash = (rankHistory, ppHistory) =>
    (rankHistory && rankHistory.length ? rankHistory.join(':') : '') +
    (ppHistory ? Object.values(ppHistory).join(':') : '')
  ;

  async function refreshPlayerHistory(playerId) {
    if (!playerId) return;

    playerHistory = await playersHistoryRepository().getAllFromIndex('players-history-playerId', playerId) ?? null;
  }

  async function setupChart(canvas, rankHistory, ppHistory) {
    if (!canvas || !rankHistory || !Object.keys(rankHistory).length || chartHash === lastHistoryHash) return;

    lastHistoryHash = chartHash;

    const daysAgo = Array(50).fill(0).map((v, i) => i).reverse();

    if (rankHistory.length < 50) rankHistory = Array(50 - rankHistory.length).fill(null).concat(rankHistory);

    const rankColor = theme && theme.alternate ? theme.alternate : "#3e95cd";
    const ppColor = theme && theme.increase ? theme.increase : "#007100";
    const activityColor = theme && theme.dimmed ? theme.dimmed : "#3e3e3e"

    const data = rankHistory;

    const datasets = [
      {
        yAxisID: 'y',
        label: 'Rank',
        data,
        fill: false,
        borderColor: rankColor,
        borderWidth: 2,
        pointRadius: 0,
        cubicInterpolationMode: 'monotone',
        tension: 0.4,
        round: 0,
        type: 'line',
      },
    ];

    const xAxis = {
      scaleLabel: {
        display: false,
      },
      ticks: {
        autoSkip: true,
        autoSkipPadding: 4,
      },
    };

    const yAxes = {
      y: {
        display: true,
        position: 'left',
        reverse: true,
        title: {
          display: true,
          text: 'Rank',
        },
        ticks: {
          callback: function (val) {
            return val
          },
        },
      },
    };

    let ppData = [];
    if (ppHistory && ppHistory.length) {
      const ppHistoryData = ppHistory.reduce((cum, historyItem) => {
        const [ssTimestamp, pp] = Object.entries(historyItem)[0];
        let diffInDays = Math.floor((toSSDate(new Date()).getTime() - ssTimestamp) / (1000 * 60 * 60 * 24));
        if (diffInDays < 0) diffInDays = 0;

        cum[diffInDays] = pp;

        return cum;
      }, {})

      if (!ppHistoryData[0] && ppHistoryData[1]) ppHistoryData[0] = ppHistoryData[1];

      if (Object.keys(ppHistoryData).length) {
        ppData = daysAgo.map(d => ppHistoryData?.[d] ?? null)

        yAxes.y1 = {
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'PP',
          },
          ticks: {
            callback: function (val) {
              return val
            },
          },
          grid: {
            drawOnChartArea: false,
          },
        };

        const skipped = (ctx, value) => ctx.p0.skip || ctx.p1.skip ? value : undefined;

        datasets.push({
          yAxisID: 'y1',
          label: 'PP',
          data: ppData,
          fill: false,
          borderColor: ppColor,
          borderWidth: 2,
          pointRadius: 1,
          cubicInterpolationMode: 'monotone',
          tension: 0.4,
          type: 'line',
          round: 2,
          spanGaps: true,
          segment: {
            borderWidth: ctx => skipped(ctx, 1),
            borderDash: ctx => skipped(ctx, [6, 6]),
          }
        });
      }
    }

    const labels = daysAgo.map(d => formatDateRelativeInUnits(-d, 'day'))

    if (!chart)
    {
      chart = new Chart(
            canvas,
            {
              type: 'line',
              responsive: true,
              maintainAspectRatio: false,
              data: {labels, datasets},
              options: {
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                plugins: {
                  legend: {
                    display: true,
                  },
                  tooltip: {
                    position: 'nearest',
                    callbacks: {
                      label(ctx) {
                        return ctx.dataset.label === 'Rank'
                          ? ` #${formatNumber(ctx.parsed.y, ctx.dataset.round)}`
                          : ` ${formatNumber(ctx.parsed.y, ctx.dataset.round)}pp`
                      },
                    }
                  },
                },
                scales: {
                  x: xAxis,
                  ...yAxes,
                },
              },
            },
          );
    }
    else {
      chart.data = {labels, datasets}
      chart.options.scales = {x: xAxis, ...yAxes}
      chart.update()
    }
  }

  $: refreshPlayerHistory(playerId);
  $: ppHistory = playerHistory && playerHistory.length ? playerHistory.map(h => ({[h.ssDate.getTime()]: h.pp})) : null;
  $: chartHash = calcHistoryHash(rankHistory, ppHistory);
  $: if (chartHash) setupChart(canvas, rankHistory, ppHistory)
</script>

{#if rankHistory && rankHistory.length}
  <section class="chart" style="--height: {height}">
    <canvas class="chartjs" bind:this={canvas} height="300"></canvas>
  </section>
{/if}

<style>
    section {
        position: relative;
        margin: auto;
        height: var(--height, 300px);
    }

    canvas {
        width: 100% !important;
    }
</style>
