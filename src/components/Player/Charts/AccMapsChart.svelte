<script>
  import Chart from 'chart.js/auto'
  import zoomPlugin from 'chartjs-plugin-zoom';
  import {formatNumber, round, roundToPrecision} from '../../../utils/format'
  import {formatDateRelative} from '../../../utils/date'
  import createContainerStore from '../../../stores/container'
  import {debounce} from '../../../utils/debounce'
  import {worker} from '../../../utils/worker-wrappers'
  import regionsPlugin from './plugins/regions'
  import {capitalize} from '../../../utils/js'

  export let playerId = null;
  export let averageAcc = null;
  export let medianAcc = null;
  export let type = 'accuracy'; // or percentage
  export let height = "350px";

  Chart.register(zoomPlugin);

  const CHART_DEBOUNCE = 300;

  let chartContainerEl = null;
  const containerStore = createContainerStore();

  let canvas = null;
  let chart = null;

  let lastHistoryHash = null;
  let playerScores = null;

  const calcPlayerScoresHash = playerScores => playerScores.length + averageAcc + medianAcc;

  const getPlayerRankedScores = async playerId => {
    if (!playerId) return null;

    return worker.getPlayerRankedScoresWithStars(playerId);
  }

  const refreshPlayerRankedScores = async playerId => playerScores = await getPlayerRankedScores(playerId)

  async function setupChart(hash, canvas) {
    if (!hash || !canvas || !playerScores?.length || chartHash === lastHistoryHash) return;

    const mapColor = '#ffffff';
    const mapBorderColor = '#003e54';
    const ssPlusColor = 'rgba(143,72,219, .4)';
    const ssColor = 'rgba(190,42,66, .4)';
    const sPlusColor = 'rgba(255,99,71, .4)';
    const sColor = 'rgba(89,176,244, .4)';
    const aColor = 'rgba(60,179,113, .4)';
    const averageLinesColor = 'rgba(255,255,255,.35)'

    lastHistoryHash = chartHash;

    let maxStars = 0;
    let minAcc = 100;
    const chartData = await Promise.all(playerScores
      .filter(s => !!s?.score?.pp || !!s?.stars)
      .map(async s => {
        const acc = type === 'percentage' ? (s?.score?.percentage ? s?.score?.percentage : s?.score?.acc) : s?.score?.acc ?? 0;

        if (s.stars > maxStars) maxStars = s.stars;
        if (acc < minAcc) minAcc = acc;

        return {
          x: s.stars,
          y: acc,
          leaderboardId: s.leaderboardId,
          name: s?.leaderboard?.song?.name,
          songAuthor: s?.leaderboard?.song?.authorName,
          levelAuthor: s?.leaderboard?.song?.levelAuthorName,
          diff: s?.leaderboard?.diffInfo?.diff,
          timeSet: s.timeSet,
          mods: s?.score?.mods,
        }
      }));

    const avgData = Object.entries(
      chartData.reduce((cum, point) => {
        const roundedStars = roundToPrecision(point.x, 0.5);
        if (!cum[roundedStars]) cum[roundedStars] = [];

        cum[roundedStars].push(point.y);

        return cum;
      }, {}),
    )
      .reduce((cum, [stars, points]) => {
        const sum = points.reduce((sum, point) => sum + point, 0);
        const best = points.reduce((max, point) => point > max ? point : max, 0);

        const x = parseFloat(stars);

        const median = points.length > 1
          ? (points.sort((a, b) => a - b))[Math.ceil(points.length / 2)]
          : sum

        cum.best.push({x, y: best});
        cum.avg.push({x, y: sum / points.length});
        cum.median.push({x, y: median});

        return cum;
      }, {avg: [], best: [], median: []})

    Object.keys(avgData).forEach(key => avgData[key] = avgData[key].sort((a,b) => a.x - b.x))

    maxStars = roundToPrecision(maxStars, .5) + .5;
    minAcc = Math.floor(minAcc - 1);
    if (minAcc < 0) minAcc = 0;

    let averageLines = [];
    if (averageAcc) averageLines.push({min: averageAcc, max: averageAcc, color: averageLinesColor, label: 'Average', position: {vertical: 'bottom'}});
    if (medianAcc) averageLines.push({min: medianAcc, max: medianAcc, color: averageLinesColor, label: 'Median', position: {horizontal: 'right'}})

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
      const skipped = (ctx, value) => ctx.p0.skip || ctx.p1.skip ? value : undefined;

      chart = new Chart(
        canvas,
        {
          type: 'scatter',
          responsive: true,
          maintainAspectRatio: false,
          data: {
            datasets: [
              {
                label: 'Maps',
                borderColor: mapBorderColor,
                backgroundColor: mapColor,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 3,
                data: chartData,
              },

              {
                yAxisID: 'y',
                label: 'Best',
                borderColor: 'rgba(60,179,113, .75)',
                data: avgData.best,
                fill: false,
                borderWidth: 2,
                pointRadius: 2,
                pointHoverRadius: 4,
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
                type: 'line',
                spanGaps: true,
                segment: {
                  borderWidth: ctx => skipped(ctx, 1),
                  borderDash: ctx => skipped(ctx, [6, 6]),
                },
              },

              {
                yAxisID: 'y',
                label: 'Average',
                borderColor: '#3273dc',
                data: avgData.avg,
                fill: false,
                borderWidth: 2,
                pointRadius: 2,
                pointHoverRadius: 4,
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
                type: 'line',
                spanGaps: true,
                segment: {
                  borderWidth: ctx => skipped(ctx, 1),
                  borderDash: ctx => skipped(ctx, [6, 6]),
                },
              },

              {
                yAxisID: 'y',
                label: 'Median',
                borderColor: '#8992e8',
                data: avgData.median,
                fill: false,
                borderWidth: 2,
                pointRadius: 2,
                pointHoverRadius: 4,
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
                type: 'line',
                spanGaps: true,
                segment: {
                  borderWidth: ctx => skipped(ctx, 1),
                  borderDash: ctx => skipped(ctx, [6, 6]),
                },
              },
            ],
          },
          options: {
            layout: {
              padding: {
                right: 0,
              },
            },
            interaction: {
              mode: 'nearest',
              intersect: true,
            },
            plugins: {
              legend: {
                display: true,
              },
              tooltip: {
                displayColors: false,
                position: 'nearest',
                title: {
                  display: true,
                },
                callbacks: {
                  label: function (ctx) {
                    if (!ctx || !ctx?.dataset?.data[ctx?.dataIndex]) return '';

                    const ret = [];

                    switch(ctx?.dataset?.label) {
                      case 'Maps':
                        const song = ctx.dataset.data[ctx.dataIndex];
                        if (song) {
                          ret.push(formatDateRelative(song.timeSet));
                          ret.push(`${song.name} (${capitalize(song.diff)})`);
                          ret.push(`${song.songAuthor} / ${song.levelAuthor}`);
                        }
                        break;

                        default:
                          ret.push(`Stars: ${ctx?.raw?.x}*`);
                    }

                    return ret;
                  },
                  title: function (ctx) {
                    if (!ctx?.[0]?.raw) return '';

                    switch(ctx?.[0].dataset?.label) {
                      case 'Maps':
                        const mods = ctx[0].raw?.mods ?? null;
                        const stars = formatNumber(ctx[0].raw?.x ?? 0, 2);
                        const acc = formatNumber(ctx[0].raw?.y ?? 0, 2);

                        return type === 'percentage'
                          ? `Percentage: ${acc}%${mods?.length ? ' (' + mods.join(', ') + ')' : ''} | Stars: ${stars}*`
                          : `Accuracy: ${acc}%${mods?.length ? ' (' + mods.join(', ') + ')' : ''} | Stars: ${stars}*`

                      default:
                        if(ctx && Array.isArray(ctx))
                          return ctx.map(d => `${d?.dataset?.label ?? ''}: ${formatNumber(d?.raw?.y ?? 0)}%`)
                    }

                    return '';
                  }
                },
              },
              zoom: {
                pan: {
                  enabled: true,
                  mode: 'xy',
                },
                zoom: {
                  wheel: {
                    enabled: true,
                  },
                  pinch: {
                    enabled: true
                  },
                  mode: 'xy',
                },
                limits: {
                  x: {min: 0, max: maxStars},
                  y: {min: minAcc, max: 100},
                },
              },
              regions: {
                regions: [
                  {min: 95, max: 100, color: ssPlusColor},
                  {min: 90, max: 95, color: ssColor},
                  {min: 85, max: 90, color: sPlusColor},
                  {min: 80, max: 85, color: sColor},
                  {min: 0, max: 80, color: aColor},
                ].concat(averageLines),
              },
            },
            scales: {
              x: {
                type: 'linear',
                scaleLabel: {
                  display: false,
                  labelString: 'Stars',
                },
                ticks: {
                  min: 0,
                  stepSize: 0.5,
                  callback: function (value, index, values) {
                    return round(value, 2) + '*';
                  },
                },
                max: maxStars
              },
              y: {
                type: 'linear',
                scaleLabel: {
                  display: true,
                  labelString: 'Acc',
                },
                ticks: {
                  max: 100,
                  callback: function (value, index, values) {
                    return round(value, 2) + '%';
                  },
                },
                grid: {
                  color: "rgba(0,0,0,0.1)",
                  display: true,
                  drawBorder: true,
                  drawOnChartArea: true
                },
                min: minAcc
              },
            },
            onClick(e, item, chart) {
              if (!item?.[0]?.element?.$context?.raw?.leaderboardId) return;

              window.open(`/leaderboard/global/${item[0].element.$context.raw.leaderboardId}`, '_blank');
            },
          },
          plugins: [regionsPlugin],
        },
      );
    } else {
      chart.data = {
        datasets: [{
          label: '',
          borderColor: mapColor,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 3,
          data: chartData,
        }],
      }
      chart.update()
    }
  }

  let debouncedChartHash = null;
  const debounceChartHash = debounce(chartHash => debouncedChartHash = chartHash, CHART_DEBOUNCE);

  $: if (chartContainerEl) containerStore.observe(chartContainerEl)
  $: containerWidth = $containerStore?.nodeWidth;

  $: refreshPlayerRankedScores(playerId);

  $: chartHash = containerWidth ? calcPlayerScoresHash(playerScores) + containerWidth : null;
  $: debounceChartHash(chartHash)
  $: if (debouncedChartHash) setupChart(debouncedChartHash, canvas)
</script>

{#if playerScores?.length}
  <section bind:this={chartContainerEl} class="chart" style="--height: {height}">
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
