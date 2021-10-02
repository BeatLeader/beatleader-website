<script>
  import {createEventDispatcher} from 'svelte'
  import Chart from 'chart.js/auto'
  import 'chartjs-adapter-luxon';
  import createAccSaberService from '../../../services/accsaber'
  import {formatNumber} from '../../../utils/format'
  import {addToDate, DAY, formatDate, formatDateWithOptions, HOUR, toAccSaberMidnight} from '../../../utils/date'
  import createContainerStore from '../../../stores/container'
  import {debounce} from '../../../utils/debounce'
  import {convertArrayToObjectByKey} from '../../../utils/js'
  import {capitalize} from '../../../utils/js'
  import Switcher from '../../Common/Switcher.svelte'

  const dispatch = createEventDispatcher();

  export let playerId = null;
  export let height = "350px";

  const CHART_DEBOUNCE = 300;
  const DAYS_QTY = 30;

  const accSaberService = createAccSaberService();

  let chartContainerEl = null;
  const containerStore = createContainerStore();

  let canvas = null;
  let chart = null;

  let isLoading = false;
  let lastHistoryHash = null;
  let playerRankHistory = null;
  let availableCategories = null;
  let category = 'overall';

  const calcHistoryHash = (playerId, playerRankHistory, category) =>
    (playerId ?? '') +
    (playerRankHistory?.map(h => h?.accSaberDate?.getTime())?.join(':') ?? '') +
    category
  ;

  async function refreshPlayerRankHistory(playerId) {
    if (!playerId) return;

    isLoading = true;

    const playerHistoryPromises = await Promise.all([
      accSaberService.fetchPlayerRankHistory(playerId).catch(e => null),
      accSaberService.getPlayerHistory(playerId),
    ])

    const theOldestChartHistory = addToDate(-49 * DAY, toAccSaberMidnight(new Date()))
    const dbHistory = (playerHistoryPromises?.[1] ?? []).filter(h => h.accSaberDate >= theOldestChartHistory)

    const enhancedFetchedHistory = (playerHistoryPromises?.[0]?.history ?? [])
      .map(h => {
        const dbItem = dbHistory.find(dbH => dbH?.accSaberDate?.getTime() === h?.date?.getTime());
        if (dbItem?.categories?.overall) dbItem.categories.overall.rank = h.rank;

        return dbItem ?? {
          playerId: playerHistoryPromises?.[0]?.playerId ?? null,
          accSaberDate: h.date,
          categories: {overall: {rank: h.rank}},
        };
      })

    const timestampsInEnhancedFetchedHistory = enhancedFetchedHistory.map(h => h?.accSaberDate?.getTime())

    playerRankHistory = enhancedFetchedHistory.concat(
      dbHistory.filter(dbH => !timestampsInEnhancedFetchedHistory.includes(dbH?.accSaberDate?.getTime())),
    )

    availableCategories = [...new Set(playerRankHistory.reduce((categories, h) => {
      if (h.accSaberDate && h.categories) categories = categories.concat(Object.keys(h.categories));

      return categories;
    }, []))].map(c => ({label: capitalize(c)}))

    isLoading = false;

    dispatch('height-changed');
  }

  async function setupChart(hash, canvas) {
    if (!hash || !canvas || !playerRankHistory?.length || !selectedCategory?.label || chartHash === lastHistoryHash)
      return;

    lastHistoryHash = chartHash;

    const category = selectedCategory?.label?.toLowerCase();

    const gridColor = "#2a2a2a"
    const rankColor = "#3e95cd";
    const ppColor = "#007100";
    const accColor = "#3273dc";
    const rankedPlayCountColor = "#3e3e3e";

    // add 12h just to be sure that it won't messed up by DST
    const accSaberToday = new Date(toAccSaberMidnight(new Date()).getTime() + 12 * HOUR);
    const dayTimestamps = Array(DAYS_QTY).fill(0).map((_, idx) => toAccSaberMidnight(addToDate(-(DAYS_QTY - 1 - idx) * DAY, accSaberToday)).getTime());

    const playerRankHistoryByTimestamp = convertArrayToObjectByKey(playerRankHistory.filter(h => h.accSaberDate).map(h => ({
      ...h,
      timestamp: h.accSaberDate.getTime(),
    })), 'timestamp');

    const yAxes = {
      y: {
        display: true,
        position: 'left',
        reverse: true,
        title: {
          display: false,
          text: 'Rank',
        },
        ticks: {
          callback: val => val === Math.floor(val) ? val : null,
        },
        grid: {
          color: gridColor,
        },
      },
    };

    const skipped = (ctx, value) => ctx.p0.skip || ctx.p1.skip ? value : undefined;

    const datasets = [];

    [
      {key: 'rank', label: 'Rank', borderColor: rankColor, axis: 'y', round: 0, gridColor},
      {key: 'averageAcc', label: 'Acc', borderColor: accColor, axis: 'y2', round: 2, axisDisplay: true, valueMult: 100, tickSuffix: '%', max: 100},
      {key: 'ap', label: 'AP', borderColor: ppColor, axis: 'y3', round: 2, axisDisplay: false},
      {key: 'rankedPlays', label: 'Plays', backgroundColor: rankedPlayCountColor, borderColor: rankedPlayCountColor, axis: 'y4', round: 0, axisDisplay: false, type: 'bar', barThickness: 3, maxMult: 1.5}].forEach(obj => {
      const {key, axis, axisDisplay, label, valueMult, tickSuffix, type, max, maxMult, gridColor, ...options} = obj;

      const data = dayTimestamps.map(t => {
        const val = playerRankHistoryByTimestamp?.[t]?.categories?.[category]?.[key] ?? null;

        return {
          x: t,
          y: val ? val * (valueMult ?? 1) : (type === 'bar' ? 0 : val),
        }
      });

      const dataExists = data.some(v => (type !== 'bar' && v.y !== null) || (type === 'bar' && v.y !== 0));
      if (!dataExists) return;

      const maxVal = data.reduce((max, v) => v.y > max ? v.y : max, 0);

      if (!yAxes[axis]) yAxes[axis] = {
        display: axisDisplay ?? false,
        position: 'right',
        title: {
          display: false,
          text: label,
        },
        ticks: {
          callback: val => formatNumber(val, obj.round ?? 2) + (tickSuffix ?? '')
        },
        grid: {
          color: gridColor,
          drawOnChartArea: gridColor ? true : false,
        },
        max: max ? max : (maxMult ? maxVal * maxMult : null),
      }

      datasets.push(
        {
          yAxisID: axis,
          label,
          data,
          fill: false,
          borderWidth: 2,
          pointRadius: 1,
          cubicInterpolationMode: 'monotone',
          tension: 0.4,
          type: type ?? 'line',
          spanGaps: true,
          segment: {
            borderWidth: ctx => skipped(ctx, 1),
            borderDash: ctx => skipped(ctx, [6, 6]),
          },
          ...options,
        }
      )
    });

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
            month: '2-digit',
          });
        },
      },
      grid: {
        color: gridColor,
      },
    };

    if (chart) {
      chart.destroy();
      chart = null;
      if (chartContainerEl) {
        const canvas = chartContainerEl.querySelector('canvas');
        if (canvas) {
          canvas.style.height = null;
          var ctx = canvas.getContext("2d");
          ctx.canvas.height = height;
        }
      }
    }

    if (!chart) {
      chart = new Chart(
        canvas,
        {
          type: 'line',
          data: {datasets},
          options: {
            layout: {
              padding: {
                right: 0,
              },
            },
            spanGaps: DAY,
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                display: Object.keys(yAxes).length > 1,
              },
              tooltip: {
                position: 'nearest',
                callbacks: {
                  title(ctx) {
                    if (!ctx?.[0]?.raw) return '';

                    return formatDate(new Date(ctx[0].raw?.x), 'short', null);
                  },

                  label(ctx) {
                    switch (ctx.dataset.label) {
                      case 'Rank':
                        return ` ${ctx.dataset.label}: #${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
                      case 'AP':
                        return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}AP`;
                      case 'Acc':
                        return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}%`;
                      default:
                        return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
                    }
                  },
                },
              },
              customYAxisPosition: {
                y: {
                  display: true,
                  text: 'Rank',
                },
                y1: {
                  display: true,
                  text: 'PP',
                },
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
  }

  let debouncedChartHash = null;
  const debounceChartHash = debounce(chartHash => debouncedChartHash = chartHash, CHART_DEBOUNCE);

  $: if (chartContainerEl) containerStore.observe(chartContainerEl)
  $: containerWidth = $containerStore?.nodeWidth;

  $: refreshPlayerRankHistory(playerId);

  $: selectedCategory = availableCategories?.find(c => c.label === capitalize(category)) ?? null;

  $: chartHash = containerWidth ? calcHistoryHash(playerId, playerRankHistory, category) + containerWidth : null;
  $: debounceChartHash(chartHash)
  $: if (debouncedChartHash) setupChart(debouncedChartHash, canvas)
</script>

{#if playerRankHistory?.length}
  <section bind:this={chartContainerEl} class="chart" style="--height: {height}">
    <canvas class="chartjs" bind:this={canvas} height={parseInt(height,10)}></canvas>
  </section>

  <div class="chart-switcher">
    <Switcher values={availableCategories} value={selectedCategory} on:change={e => category = e?.detail?.label ?? 'overall'} />
  </div>
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

    .chart-switcher {
        margin-top: 1rem;
    }
</style>
