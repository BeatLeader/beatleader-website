<script>
  import Chart from 'chart.js/auto'
  import playersHistoryRepository from '../../db/repository/players-history'
  import {formatNumber} from '../../utils/format'
  import {dateFromString, formatDateRelativeInUnits, toSSDate} from '../../utils/date'

  export let playerId = null;
  export let rankHistory = null;
  export let height = "350px";

  let canvas = null;
  let chart = null;

  let themeName = 'darkss';
  let theme = null;

  let lastHistoryHash = null;
  let playerHistory = null;

  const calcHistoryHash = (rankHistory, additionalHistory) =>
    (rankHistory && rankHistory.length ? rankHistory.join(':') : '') +
    (additionalHistory ? Object.values(additionalHistory).map(h => Object.values(h).join(',')).join(':') : '')
  ;

  async function refreshPlayerHistory(playerId) {
    if (!playerId) return;

    playerHistory = await playersHistoryRepository().getAllFromIndex('players-history-playerId', playerId) ?? null;
  }

  async function setupChart(canvas, rankHistory, additionalHistory) {
    if (!canvas || !rankHistory || !Object.keys(rankHistory).length || chartHash === lastHistoryHash) return;

    lastHistoryHash = chartHash;

    const daysAgo = Array(50).fill(0).map((v, i) => i).reverse();

    if (rankHistory.length < 50) rankHistory = Array(50 - rankHistory.length).fill(null).concat(rankHistory);

    const gridColor = '#2a2a2a'
    const rankColor = theme && theme.alternate ? theme.alternate : "#3e95cd";
    const ppColor = theme && theme.increase ? theme.increase : "#007100";
    const rankedPlayCountColor = theme && theme.dimmed ? theme.dimmed: "#3e3e3e";
    const totalPlayCountColor = theme && theme.faded ? theme.faded: "#666";
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
      grid: {
        color: gridColor
      }
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
        grid: {
          color: gridColor,
        }
      },
    };

    if (additionalHistory && additionalHistory.length) {
      const additionalHistoryData = additionalHistory.reduce((cum, historyItem) => {
        const [ssTimestamp, pp] = Object.entries(historyItem)[0];
        let diffInDays = Math.floor((toSSDate(new Date()).getTime() - ssTimestamp) / (1000 * 60 * 60 * 24));
        if (diffInDays < 0) diffInDays = 0;

        cum[diffInDays] = pp;

        return cum;
      }, {})

      if (!additionalHistoryData[0] && additionalHistoryData[1]) additionalHistoryData[0] = additionalHistoryData[1];

      if (Object.keys(additionalHistoryData).length) {
        const skipped = (ctx, value) => ctx.p0.skip || ctx.p1.skip ? value : undefined;

        [
          {key: 'pp', name: 'PP', borderColor: ppColor, round: 2, axisDisplay: true},
          {key: 'rankedPlayCount', name: 'Ranked play count', borderColor: rankedPlayCountColor, round: 0, axisDisplay: false},
          {key: 'totalPlayCount', name: 'Total play count', borderColor: totalPlayCountColor, round: 0, axisDisplay: false}
          ]
          .forEach((obj, idx) => {
            const {key, name, axisDisplay, ...options} = obj;
          const fieldData = daysAgo.map(d => additionalHistoryData?.[d]?.[key] ?? null);

          const axisKey = `y${idx+1}`
          yAxes[axisKey] = {
            display: axisDisplay,
            position: 'right',
            title: {
              display: axisDisplay,
              text: name,
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

          datasets.push({
            ...options,
            yAxisID: axisKey,
            label: name,
            data: fieldData,
            fill: false,
            borderWidth: 2,
            pointRadius: 1,
            cubicInterpolationMode: 'monotone',
            tension: 0.4,
            type: 'line',
            spanGaps: true,
            segment: {
              borderWidth: ctx => skipped(ctx, 1),
              borderDash: ctx => skipped(ctx, [6, 6]),
            }
          });
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
                        switch(ctx.dataset.label) {
                          case 'Rank': return ` ${ctx.dataset.label}: #${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
                          case 'PP': return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}pp`;
                          default: return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
                        }
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
  $: additionalHistory = playerHistory && playerHistory.length ? playerHistory.map(h => ({[h.ssDate.getTime()]: {pp: h.pp, rankedPlayCount: h.rankedPlayCount, totalPlayCount: h.totalPlayCount}})) : null;
  $: chartHash = calcHistoryHash(rankHistory, additionalHistory);
  $: if (chartHash) setupChart(canvas, rankHistory, additionalHistory)
</script>

{#if rankHistory && rankHistory.length}
  <section class="chart" style="--height: {height}">
    <canvas class="chartjs" bind:this={canvas} height={parseInt(height,10)}></canvas>
  </section>
{/if}

<style>
    section {
        position: relative;
        margin: 1rem auto 0 auto;
        height: var(--height, 300px);
    }

    canvas {
        width: 100% !important;
    }
</style>
