<script>
  import Chart from 'chart.js/auto'
  import {formatNumber} from '../../../utils/format'
  import {opt} from '../../../utils/js'

  export let beatSavior = null;
  export let name = null;
  export let compareTo = null;
  export let compareToName = null;
  export let height = "200px";

  let canvas = null;
  let chart = null;

  let themeName = 'darkss';
  let theme = null;

  async function setupChart(canvas, chartData, compareChartData, name, compareToName) {
    if (!canvas || !chartData || !Object.keys(chartData).length) return;

    const accColor = theme && theme.alternate ? theme.alternate : "#72a8ff";
    const compareColor = theme && theme.dimmed ? theme.alternate : "#3e3e3e";

    const data = Object.values(chartData).map(v => v * 100);
    const mainMinValue = Math.floor(Math.max(Math.floor(data.reduce((min, cur) => cur < min ? cur : min, 100)), 0) * 0.99);
    const mainMaxValue = Math.ceil(Math.min(Math.ceil(data.reduce((max, cur) => cur > max ? cur : max, 0)), 100));

    const compareData = compareChartData ? Object.values(compareChartData).map(v => v * 100) : null;
    const compareMinValue = compareChartData ? Math.floor(Math.max(Math.floor(compareData.reduce((min, cur) => cur < min ? cur : min, 100)), 0) * 0.99) : 100;
    const compareMaxValue = compareChartData ? Math.ceil(Math.min(Math.ceil(compareData.reduce((max, cur) => cur > max ? cur : max, 0)), 100)) : 0;

    const minValue = Math.min(mainMinValue, compareMinValue)
    const maxValue = Math.max(mainMaxValue, compareMaxValue)

    const datasets = [
      {
        label: name ? name : 'Selected',
        data,
        cubicInterpolationMode: 'monotone',
        tension: 0.4,
        borderColor: accColor,
        borderWidth: 2,
        pointRadius: 0,
        type: 'line',
      },
    ];

    if (compareData) datasets.push({
      label: compareToName ? compareToName : 'Compared',
      data: compareData,
      cubicInterpolationMode: 'monotone',
      tension: 0.4,
      borderColor: compareColor,
      borderWidth: 2,
      pointRadius: 0,
      type: 'line',
    })

    const labels = Object.keys(compareData && compareData.length > data.length ? compareChartData : chartData)
      .map(v => Math.floor(v / 60) + ':' + (v % 60).toString().padStart(2, '0'))

    if (!chart)
    {
      chart = new Chart(
            canvas,
            {
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
                    max: maxValue,
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
    else {
      chart.data = {labels, datasets}
      chart.options.plugins.legend.display = !!compareData;
      chart.options.scales.y.min = minValue;
      chart.options.scales.y.max = maxValue;
      chart.update()
    }
  }

  $: data = opt(beatSavior, 'trackers.scoreGraphTracker.graph', null)
  $: compareData = opt(beatSavior, 'beatSaviorId') !== opt(compareTo, 'beatSaviorId') ? opt(compareTo, 'trackers.scoreGraphTracker.graph', null) : null
  $: setupChart(canvas, data, compareData, name, compareToName)
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
