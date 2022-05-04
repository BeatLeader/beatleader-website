<script>
  import Chart from 'chart.js/auto'
  import 'chartjs-adapter-luxon';
  import {DateTime} from 'luxon';
  import {getContext, onMount} from 'svelte'
  import createPlayerService from '../../../services/beatleader/player'
  import createScoresService from '../../../services/beatleader/scores'
  import {formatNumber} from '../../../utils/format'
  import {
    formatDate,
    formatDateWithOptions,
    toBlMidnight,
  } from '../../../utils/date'
  import eventBus from '../../../utils/broadcast-channel-pubsub'
  import {debounce} from '../../../utils/debounce'
  import {onLegendClick} from './utils/legend-click-handler'
  import stringify from 'json-stable-stringify'

  export let playerId = null;
  export let statsHistory = null;
  export let height = "350px";

  const CHART_DAYS = 50;
  const CHART_DEBOUNCE = 300;
  const MAGIC_INACTIVITY_RANK = 999999;

  const pageContainer = getContext('pageContainer');

  const playerService = createPlayerService();
  const scoresService = createScoresService();

  let canvas = null;
  let chart = null;

  let lastHistoryHash = null;
  let playerScores = null;
  let activityHistory = null;

  const calcHistoryHash = statsHistory => stringify(statsHistory);

  const mapScoresToHistory = scores => {
    if (!Object.keys(scores)?.length) return null;

    const dtBlToday = DateTime.fromJSDate(toBlMidnight(new Date()));

    return Array(CHART_DAYS).fill(0)
      .map((_, idx) => {
        const agoTimeset = dtBlToday.minus({days: CHART_DAYS - 1 - idx}).toMillis();

        return {x: agoTimeset, y: scores[agoTimeset] ? scores[agoTimeset] : 0};
      })
      ;
  }

  async function refreshPlayerScores(playerId) {
    if (!playerId) return;

    playerScores = await scoresService.getPlayerScores(playerId)

    const dtBlToday = DateTime.fromJSDate(toBlMidnight(new Date()));
    const oldestDate = dtBlToday.minus({days: CHART_DAYS - 1}).toJSDate();

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
          const blDate = toBlMidnight(new Date(t));
          const blTimestamp = blDate.getTime();

          if (!cum.hasOwnProperty(blTimestamp)) cum[blTimestamp] = 0;

          cum[blTimestamp]++;
        });

        return cum;
      }, {})
    ;

    activityHistory = mapScoresToHistory(lastScores);
  }

  async function setupChart(hash, canvas) {
    if (!hash || !canvas || !statsHistory?.rank?.length || chartHash === lastHistoryHash) return;

    // TODO: remove it
    const additionalHistory = null;

    let rankHistory = statsHistory.rank;
    const CHART_DAYS = rankHistory.length;

    lastHistoryHash = chartHash;

    const gridColor = '#2a2a2a'
    const rankColor = "#3e95cd";
    const countryRankColor = "#8992e8";
    const ppColor = "#007100";
    const rankedPlayCountColor = "#3e3e3e";
    const totalPlayCountColor = "#666";

    const dtBlToday = DateTime.fromJSDate(toBlMidnight(new Date()));
    const dayTimestamps = rankHistory.map((_, idx) => toBlMidnight(dtBlToday.minus({days: CHART_DAYS - 1 - idx}).toJSDate()).getTime());

    const data = rankHistory.map((h, idx) => ({x: dayTimestamps[idx], y :h === MAGIC_INACTIVITY_RANK ? null : h}));

    const datasets = [
      {
        yAxisID: 'y',
        label: 'Rank',
        data,
        fill: false,
        borderColor: rankColor,
        borderWidth: 3,
        pointRadius: 0,
        cubicInterpolationMode: 'monotone',
        tension: 0.4,
        round: 0,
        type: 'line',
      },
    ];

    const xAxis = {
      type: 'time',
      display: true,
      offset: true,
      time: {
        unit: 'day',
      },
      scaleLabel: {
        display: false,
      },
      ticks: {
        autoSkip: false,
        major: {
          enabled: true,
        },
        font: function (context) {
          if (context.tick && context.tick.major) {
            return {
              weight: 'bold',
            };
          }
        },
        callback: (val, idx, ticks) => {
          if (!ticks?.[idx]) return '';

          return formatDateWithOptions(new Date(ticks[idx]?.value), {
            localeMatcher: 'best fit',
            day: '2-digit',
            month: 'short',
          });
        },
      },
      grid: {
        color: gridColor,
      },
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

    const skipped = (ctx, value) => ctx.p0.skip || ctx.p1.skip ? value : undefined;

    [
      {key: 'pp', name: 'PP', borderColor: ppColor, round: 2, axisDisplay: true, precision: 0},
      {
        key: 'countryRank',
        name: 'Country rank',
        borderColor: countryRankColor,
        round: 0,
        axisDisplay: false,
        precision: 0,
        reverse: true,
      },
      {
        key: 'rankedPlayCount',
        name: 'Ranked play count',
        borderColor: rankedPlayCountColor,
        round: 0,
        axisDisplay: false,
        precision: 0,
        hidden: true,
      },
      {
        key: 'totalPlayCount',
        name: 'Total play count',
        borderColor: totalPlayCountColor,
        round: 0,
        axisDisplay: false,
        precision: 0,
        hidden: true,
      },
    ]
      .forEach(obj => {
        const {key, name, axisDisplay, usePrevAxis, precision, reverse, ...options} = obj;

        if (!statsHistory?.[key]) return;

        const fieldData = dayTimestamps.map((x, idx) => ({x, y: statsHistory?.[key]?.[idx] ?? null}));

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
          reverse: reverse === true,
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

    if (!chart)
    {
      chart = new Chart(
            canvas,
            {
              type: 'line',
              data: {datasets},
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
                      title(ctx) {
                        if (!ctx?.[0]?.raw) return '';

                        const nextDayDate = DateTime.fromMillis(ctx[0].raw?.x).plus({days: 1}).toJSDate();
                        const nextDayDateFormatted = nextDayDate > new Date() ? 'now' : formatDate(nextDayDate, 'short', 'short');

                        return `${formatDate(new Date(ctx[0].raw?.x), 'short', 'short')} - ${nextDayDateFormatted}`;
                      },
                      label(ctx) {
                        switch(ctx.dataset.label) {
                          case 'Rank': return ` ${ctx.dataset.label}: #${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
                          case 'Country rank': return ` ${ctx.dataset.label}: #${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
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
      chart.data = {datasets};
      chart.options.scales = {x: xAxis, ...yAxes};
      chart.update();
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

  $: chartHash = calcHistoryHash(statsHistory);
  $: debounceChartHash(chartHash)
  $: if (debouncedChartHash) setupChart(debouncedChartHash, canvas)
</script>

{#if statsHistory?.rank?.length}
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
