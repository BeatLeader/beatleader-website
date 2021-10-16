<script>
  import Chart from 'chart.js/auto'
  import {getContext, onMount} from 'svelte'
  import createPlayerService from '../../../services/scoresaber/player'
  import createScoresService from '../../../services/scoresaber/scores'
  import createBeatSaviorService from '../../../services/beatsavior'
  import {formatNumber} from '../../../utils/format'
  import {addToDate, dateFromString, DAY, formatDateRelativeInUnits, toSSDate} from '../../../utils/date'
  import eventBus from '../../../utils/broadcast-channel-pubsub'
  import {debounce} from '../../../utils/debounce'
  import {onLegendClick} from './utils/legend-click-handler'

  export let playerId = null;
  export let rankHistory = null;
  export let playerHistory = null;
  export let height = "350px";

  const CHART_DEBOUNCE = 300;
  const MAGIC_INACTIVITY_RANK = 999999;

  const pageContainer = getContext('pageContainer');

  const playerService = createPlayerService();
  const scoresService = createScoresService();
  const beatSaviorService = createBeatSaviorService();

  let canvas = null;
  let chart = null;

  let lastHistoryHash = null;
  let playerScores = null;
  let activityHistory = null;
  let beatSaviorWonHistory = null;
  let beatSaviorFailedHistory = null;

  const calcHistoryHash = (rankHistory, additionalHistory, activityHistory, beatSaviorHistory) =>
    (rankHistory && rankHistory.length ? rankHistory.join(':') : '') +
    (additionalHistory ? Object.values(additionalHistory).map(h => Object.values(h).join(',')).join(':') : '') +
    (activityHistory && activityHistory.length ? activityHistory.join(':') : '') +
    (beatSaviorHistory && beatSaviorHistory.length ? beatSaviorHistory.join(':') : '')
  ;

  const mapScoresToHistory = scores => {
    if (!Object.keys(scores)?.length) return null;

    const ssToday = toSSDate(new Date());

    return Array(50).fill(0)
      .map((_, idx) => {
        const agoTimeset = (addToDate(-(49 - idx) * DAY, ssToday)).getTime();

        return scores[agoTimeset] ? scores[agoTimeset] : 0;
      })
      ;
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

    activityHistory = mapScoresToHistory(lastScores);
  }

  async function refreshPlayerBeatSaviorScores(playerId) {
    if (!playerId) return;

    const scores = await beatSaviorService.getPlayerScores(playerId);

    const ssToday = toSSDate(new Date());
    const oldestDate = addToDate(-49 * DAY, ssToday);
    const lastScores = scores.filter(score => score.timeSet && score.timeSet > oldestDate)

    const countScores = (scores, incFunc) => scores
      .reduce((cum, score) => {
        const ssDate = toSSDate(score.timeSet);
        const ssTimestamp = ssDate.getTime();

        if (!cum.hasOwnProperty(ssTimestamp)) cum[ssTimestamp] = 0;

        if (incFunc(score)) cum[ssTimestamp]++;

        return cum;
      }, {})

    beatSaviorWonHistory = mapScoresToHistory(countScores(lastScores, score => !!(score.trackers.winTracker.won ?? false)));
    beatSaviorFailedHistory = mapScoresToHistory(countScores(lastScores, score => !(score.trackers.winTracker.won ?? false)));
  }

  async function setupChart(hash, canvas) {
    if (!hash || !canvas || !rankHistory || !Object.keys(rankHistory).length || chartHash === lastHistoryHash) return;

    lastHistoryHash = chartHash;

    const daysAgo = Array(50).fill(0).map((v, i) => i).reverse();

    if (rankHistory.length < 50) rankHistory = Array(50 - rankHistory.length).fill(null).concat(rankHistory);

    const gridColor = '#2a2a2a'
    const rankColor = "#3e95cd";
    const ppColor = "#007100";
    const rankedPlayCountColor = "#3e3e3e";
    const totalPlayCountColor = "#666";
    const activityColor = "#333"

    const data = rankHistory.map(h => h === MAGIC_INACTIVITY_RANK ? null : h);

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
          display: $pageContainer.name !== 'phone',
          text: 'Rank',
        },
        ticks: {
          callback: val => val === Math.floor(val) ? val : null,
          precision: 0,
        },
        grid: {
          color: gridColor,
        }
      },
    };

    let lastYIdx = 0;

    if (additionalHistory && Object.keys(additionalHistory).length) {
      const additionalHistoryData = Object.entries(additionalHistory).reduce((cum, [ssTimestamp, historyItem]) => {
        let diffInDays = Math.floor((toSSDate(new Date()).getTime() - parseInt(ssTimestamp, 10)) / DAY);
        if (diffInDays < 0) diffInDays = 0;

        cum[diffInDays] = historyItem;

        return cum;
      }, {})

      if (!additionalHistoryData[0] && additionalHistoryData[1]) additionalHistoryData[0] = additionalHistoryData[1];

      if (Object.keys(additionalHistoryData).length) {
        const skipped = (ctx, value) => ctx.p0.skip || ctx.p1.skip ? value : undefined;

        [
          {key: 'pp', name: 'PP', borderColor: ppColor, round: 2, axisDisplay: true, precision: 0},
          {
            key: 'rankedPlayCount',
            name: 'Ranked play count',
            borderColor: rankedPlayCountColor,
            round: 0,
            axisDisplay: false,
            precision: 0,
          },
          {
            key: 'totalPlayCount',
            name: 'Total play count',
            borderColor: totalPlayCountColor,
            round: 0,
            axisDisplay: false,
            precision: 0,
          },
        ]
          .forEach(obj => {
            const {key, name, axisDisplay, usePrevAxis, precision, ...options} = obj;
            const fieldData = daysAgo.map(d => additionalHistoryData?.[d]?.[key] ?? null);

            if (!usePrevAxis) lastYIdx++;
            const axisKey = `y${lastYIdx}`
            yAxes[axisKey] = {
              display: axisDisplay,
              position: 'right',
              title: {
                display: $pageContainer.name !== 'phone',
                text: name,
              },
              ticks: {
                callback: val => val === Math.floor(val) ? val : null,
                precision
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

    // prepare common axis for activity & beat savior histories
    let scoresAxisKey = null;
    if (activityHistory?.length || (beatSaviorWonHistory?.length && beatSaviorFailedHistory?.length)) {
      lastYIdx++;

      scoresAxisKey = `y${lastYIdx}`

      yAxes[scoresAxisKey] = {
        display: false,
        position: 'right',
        title: {
          display: true,
          text: 'Scores count',
        },
        ticks: {
          callback: val => val,
          precision: 0,
        },
        grid: {
          drawOnChartArea: false,
        },
      };
    }

    if (activityHistory?.length) {
      datasets.push({
        yAxisID: scoresAxisKey,
        label: 'SS scores',
        data: activityHistory,
        fill: false,
        backgroundColor: activityColor,
        round: 0,
        type: 'bar',
      });
    }

    if (beatSaviorWonHistory?.length && beatSaviorFailedHistory?.length) {
      datasets.push({
        yAxisID: scoresAxisKey,
        label: 'Beat Savior pass',
        data: beatSaviorWonHistory,
        fill: false,
        backgroundColor: '#9c27b0',
        round: 0,
        type: 'bar',
        stack: 'beatsavior',
        order: 0
      });

      datasets.push({
        yAxisID: scoresAxisKey,
        label: 'Beat Savior fail',
        data: beatSaviorFailedHistory,
        fill: false,
        backgroundColor: '#7f4e88',
        round: 0,
        type: 'bar',
        stack: 'beatsavior',
        order: 1
      });
    }

    const labels = daysAgo.map(d => formatDateRelativeInUnits(-d, 'day'))

    if (!chart)
    {
      chart = new Chart(
            canvas,
            {
              type: 'line',
              data: {labels, datasets},
              options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                  padding: {
                    right: 0
                  }
                },
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                plugins: {
                  legend: {
                    display: true,
                    onClick: onLegendClick,
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

  let debouncedChartHash = null;
  const debounceChartHash = debounce(chartHash => debouncedChartHash = chartHash, CHART_DEBOUNCE);

  $: refreshPlayerScores(playerId);
  $: refreshPlayerBeatSaviorScores(playerId);

  $: additionalHistory = playerHistory?.length
    ? playerHistory.reduce((cum, h) => {
      const time = dateFromString(h.ssDate)?.getTime()
      if (!time) return cum;

      const history = {[time]: {pp: h.pp, rankedPlayCount: h.rankedPlayCount, totalPlayCount: h.totalPlayCount}};
      return {...cum, ...history};
    }, {})
    : null;

  $: chartHash = calcHistoryHash(rankHistory, additionalHistory, activityHistory, (beatSaviorWonHistory ?? []).concat(beatSaviorFailedHistory ?? []));
  $: debounceChartHash(chartHash)
  $: if (debouncedChartHash) setupChart(debouncedChartHash, canvas)
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
