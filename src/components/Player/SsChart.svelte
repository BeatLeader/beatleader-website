<script>
  import Chart from 'chart.js/auto'
  import {onMount} from 'svelte'
  import playersHistoryRepository from '../../db/repository/players-history'
  import createScoresService from '../../services/scoresaber/scores'
  import {formatNumber} from '../../utils/format'
  import {addToDate, DAY, formatDateRelativeInUnits, toSSDate} from '../../utils/date'
  import eventBus from '../../utils/broadcast-channel-pubsub'

  export let playerId = null;
  export let rankHistory = null;
  export let height = "350px";

  const scoresService = createScoresService();

  let canvas = null;
  let chart = null;

  let lastHistoryHash = null;
  let playerHistory = null;
  let playerScores = null;
  let activityHistory = null;

  const calcHistoryHash = (rankHistory, additionalHistory, activityHistory) =>
    (rankHistory && rankHistory.length ? rankHistory.join(':') : '') +
    (additionalHistory ? Object.values(additionalHistory).map(h => Object.values(h).join(',')).join(':') : '') +
    (activityHistory && activityHistory.length ? activityHistory.join(':') : '')
  ;

  async function refreshPlayerHistory(playerId) {
    if (!playerId) return;

    playerHistory = await playersHistoryRepository().getAllFromIndex('players-history-playerId', playerId) ?? null;
  }

  async function refreshPlayerScores(playerId) {
    if (!playerId) return;

    playerScores = await scoresService.getPlayerScores(playerId)

    const ssToday = toSSDate(new Date());
    const oldestDate = addToDate(-49 * DAY, ssToday);
    const lastScores = playerScores
      .filter(score => score.timeSet && score.timeSet > oldestDate)
      .reduce((cum, score) => {
        const allSongScores = [score.timeSet.getTime()]
          .concat(
            score.history && score.history.length
              ? score.history.filter(h => h.timeSet && h.timeSet > oldestDate).map(h => h.timeSet.getTime())
              : []
          );

        allSongScores.forEach(t => {
          const ssDate = toSSDate(new Date(t));
          const ssTimestamp = ssDate.getTime();

          if (!cum.hasOwnProperty(ssTimestamp)) cum[ssTimestamp] = 0;

          cum[ssTimestamp]++;
        });

        return cum;
      }, {})
    ;
    if (Object.keys(lastScores)?.length)
      activityHistory = Array(50).fill(0)
        .map((_, idx) => {
          const agoTimeset = (addToDate(-(49 - idx) * DAY, ssToday)).getTime();

          return lastScores[agoTimeset] ? lastScores[agoTimeset] : 0;
        })
      ;
  }

  async function setupChart(canvas, rankHistory, additionalHistory, activityHistory) {
    if (!canvas || !rankHistory || !Object.keys(rankHistory).length || chartHash === lastHistoryHash) return;

    lastHistoryHash = chartHash;

    const daysAgo = Array(50).fill(0).map((v, i) => i).reverse();

    if (rankHistory.length < 50) rankHistory = Array(50 - rankHistory.length).fill(null).concat(rankHistory);

    const gridColor = '#2a2a2a'
    const rankColor = "#3e95cd";
    const ppColor = "#007100";
    const rankedPlayCountColor = "#3e3e3e";
    const totalPlayCountColor = "#666";
    const activityColor = "#2a2a2a"

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

    let lastYIdx = 0;

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
          {
            key: 'rankedPlayCount',
            name: 'Ranked play count',
            borderColor: rankedPlayCountColor,
            round: 0,
            axisDisplay: false,
          },
          {
            key: 'totalPlayCount',
            name: 'Total play count',
            borderColor: totalPlayCountColor,
            round: 0,
            axisDisplay: false,
          },
        ]
          .forEach(obj => {
            const {key, name, axisDisplay, ...options} = obj;
            const fieldData = daysAgo.map(d => additionalHistoryData?.[d]?.[key] ?? null);

            lastYIdx++;
            const axisKey = `y${lastYIdx}`
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
              },
            });
          });
      }
    }

    if (activityHistory?.length) {
      lastYIdx++;

      const key = `y${lastYIdx}`

      yAxes[key] = {
        display: false,
        position: 'right',
        title: {
          display: false,
          text: name,
        },
        ticks: {
          callback: val => val
        },
        grid: {
          drawOnChartArea: false,
        },
      };

      datasets.push({
        yAxisID: key,
        label: 'Scores set',
        data: activityHistory,
        fill: false,
        backgroundColor: activityColor,
        round: 0,
        type: 'bar',
      });
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

  onMount(async () => {
    const playerScoresUpdatedUnsubscriber = eventBus.on('player-scores-updated', async({playerId: updatedPlayerId}) => {
      if (updatedPlayerId !== playerId) return;

      await refreshPlayerScores(updatedPlayerId)
    });

    return () => {
      playerScoresUpdatedUnsubscriber();
    }
  })

  $: refreshPlayerHistory(playerId);
  $: refreshPlayerScores(playerId);
  $: additionalHistory = playerHistory && playerHistory.length ? playerHistory.map(h => ({[h.ssDate.getTime()]: {pp: h.pp, rankedPlayCount: h.rankedPlayCount, totalPlayCount: h.totalPlayCount}})) : null;
  $: chartHash = calcHistoryHash(rankHistory, additionalHistory, activityHistory);
  $: if (chartHash) setupChart(canvas, rankHistory, additionalHistory, activityHistory)
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
