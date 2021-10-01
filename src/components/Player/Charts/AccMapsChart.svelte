<script>
  import Chart from 'chart.js/auto'
  import {formatNumber, round} from '../../../utils/format'
  import {formatDateRelative} from '../../../utils/date'
  import createContainerStore from '../../../stores/container'
  import {debounce} from '../../../utils/debounce'
  import {worker} from '../../../utils/worker-wrappers'

  export let playerId = null;
  export let type = 'accuracy'; // or percentage
  export let height = "350px";

  const CHART_DEBOUNCE = 300;

  let chartContainerEl = null;
  const containerStore = createContainerStore();

  let canvas = null;
  let chart = null;

  let lastHistoryHash = null;
  let playerScores = null;

  const calcPlayerScoresHash = playerScores => playerScores.length;

  const getPlayerRankedScores = async playerId => {
    if (!playerId) return null;

    return worker.getPlayerRankedScoresWithStars(playerId);
  }

  const refreshPlayerRankedScores = async playerId => playerScores = await getPlayerRankedScores(playerId)

  async function setupChart(hash, canvas) {
    if (!hash || !canvas || !playerScores?.length || chartHash === lastHistoryHash) return;

    lastHistoryHash = chartHash;

    const chartData = await Promise.all(playerScores
      .filter(s => !!s?.score?.pp || !!s?.stars)
      .map(async s => {
        return {
          x: s.stars,
          y: type === 'percentage' ? (s?.score?.percentage ? s?.score?.percentage : s?.score?.acc) : s?.score?.acc ?? 0,
          leaderboardId: s.leaderboardId,
          name: s?.leaderboard?.song?.name,
          songAuthor: s?.leaderboard?.song?.authorName,
          levelAuthor: s?.leaderboard?.song?.levelAuthorName,
          timeSet: s.timeSet,
          mods: s?.score?.mods,
        }
      }))
    ;

    console.warn(chartData);

    const gridColor = '#2a2a2a'
    const mapColor = '#3e95cd';
    const mapBorderColor = '#003e54';

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
          type: 'scatter',
          responsive: true,
          maintainAspectRatio: false,
          data: {
            datasets: [{
              label: 'Maps',
              borderColor: mapBorderColor,
              backgroundColor: mapColor,
              fill: false,
              pointRadius: 2,
              pointHoverRadius: 3,
              data: chartData,
            }],
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

                    const song = ctx.dataset.data[ctx.dataIndex];
                    if (song) {
                      ret.push(formatDateRelative(song.timeSet));
                      ret.push(song.name);
                      ret.push(`${song.songAuthor} / ${song.levelAuthor}`);
                    }

                    return ret;
                  },
                  title: function (ctx) {
                    if (!ctx?.[0]?.raw) return '';

                    const mods = ctx[0].raw?.mods ?? null;
                    const stars = formatNumber(ctx[0].raw?.x ?? 0, 2);
                    const acc = formatNumber(ctx[0].raw?.y ?? 0, 2);

                    return type === 'percentage'
                     ? `Percentage: ${acc}%${mods?.length ? ' (' + mods.join(', ') + ')' : ''} | Stars: ${stars}*`
                      : `Accuracy: ${acc}%${mods?.length ? ' (' + mods.join(', ') + ')' : ''} | Stars: ${stars}*`
                  }
                },
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
                grid: {
                  color: gridColor
                }
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
                  color: gridColor
                }
              },
            },
          },
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
