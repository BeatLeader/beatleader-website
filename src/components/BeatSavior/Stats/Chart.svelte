<script>
  import Chart from 'chart.js/auto'
  import {formatNumber} from '../../../utils/format'
  import {opt} from '../../../utils/js'

  export let beatSavior = null;
  export let height = "200px";

  let canvas = null;
  let chart = null;

  let themeName = 'darkss';
  let theme = null;

  async function setupChart(canvas, chartData) {
    if (!canvas || !chartData || !Object.keys(chartData).length) return;

    canvas.height = parseInt(height, 10);

    if (chart) chart.destroy();

    const accColor = theme && theme.alternate ? theme.alternate : "#3e95cd";

    const data = Object.values(chartData).map(v => v * 100);
    const minValue = Math.floor(data.reduce((min, cur) => cur < min ? cur : min, 100));

    const datasets = [
      {
        label: 'Accuracy',
        data,
        cubicInterpolationMode: 'monotone',
        tension: 0.4,
        borderColor: accColor,
        borderWidth: 2,
        pointRadius: 0,
        type: 'line',
      },
    ];

    chart = new Chart(
      canvas,
      {
        responsive: true,
        maintainAspectRatio: false,
        data: {
          labels: Object.keys(chartData).map(v => Math.floor(v / 60) + ':' + (v % 60).toString().padStart(2, '0')),
          datasets,
        },
        options: {
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label(ctx) {
                  return formatNumber(ctx.parsed.y) + '%'
                },
              }
            },
          },
          scales: {
            x: {
              scaleLabel: {
                display: false,
              },
              ticks: {
                autoSkip: true,
                autoSkipPadding: 4,
              },
            },
            y: {
              min: minValue,
              max: 100,
              ticks: {
                callback: function(val) {
                  return val+'%'
                },
              }
            }
          },
        },
      },
    );
  }

  $: data = opt(beatSavior, 'trackers.scoreGraphTracker.graph', null)
  $: setupChart(canvas, data)
</script>

{#if data}
  <section class="chart" style="--height: {height}">
    <canvas class="chartjs" bind:this={canvas}></canvas>
  </section>
{/if}

<style>
    section {
        position: relative;
        margin: 0 auto !important;
        width: 100%;
    }

    canvas {
        width: 100% !important;
        height: var(--height);
    }
</style>
