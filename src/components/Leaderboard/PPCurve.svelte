<script>
    import Chart from 'chart.js/auto'
    import 'chartjs-adapter-luxon';
    import {getContext, onMount} from 'svelte'
    import {formatNumber} from '../../utils/format'
  
    export let stars = 5;
    export let height = "200px";
    export let logarithmic = false;
  
    const pageContainer = getContext('pageContainer');

    let canvas = null;
    let chart = null;

    function curve(acc, stars) {
        var l = (1 - (0.03 * (stars - 3.0) / 11.0));
        var a = 0.96 * l;
        var f = 1.2 - 0.6 * stars / 14.0;

        return Math.pow(Math.log10(l / (l - acc)) / Math.log10(l / (l - a)), f);
    }

    function ppFromAcc(acc, stars) {
        return curve(acc, stars - 0.5) * (stars + 0.5) * 42;
    }
  
    async function setupChart(canvas, stars, logarithmic) {
      if (!canvas) return;
  
      const gridColor = '#2a2a2a'
      const rankColor = "#3e95cd";
      const data = [];
      for (let acc = 0.61; acc < 1; acc += 0.01) {
        data.push({x: logarithmic ? 1 - acc : acc, y: ppFromAcc(acc, stars) })
      }
  
      const datasets = [
        {
          data,
          borderColor: rankColor,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          type: 'line',
        },
      ];
  
      const xAxis = {
        type: logarithmic ? 'logarithmic' : 'linear',
        reverse: logarithmic,
        display: true,
        title: {
            display: $pageContainer.name !== 'phone',
            text: 'acc',
          },
        ticks: {
            callback: val => logarithmic ? 1 - val : val,
            precision: 2,
        },
        grid: {
          color: gridColor,
        },
      };
  
      const yAxis = {
          display: true,
          position: 'left',
          title: {
            display: $pageContainer.name !== 'phone',
            text: 'pp',
          },
          ticks: {
            callback: val => val === Math.floor(val) ? val : null,
            precision: 0,
          },
          grid: {
            color: gridColor,
          }
      };
  
      if (!chart)
      {
        chart = new Chart(
              canvas,
              {
                type: 'line',
                data: {datasets},
                options: {
                  responsive: true,
                  animation: {
                    duration: 0 // general animation time
                    },
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
                    display: false,
                    },
                    tooltip: {
                      position: 'nearest',
                      callbacks: {
                        title(ctx) {
                          if (!ctx?.[0]?.raw) return '';

                          const accuracy = Math.round(ctx[0].raw?.x * 10000) / 100;
  
                          return `acc: ${logarithmic ? 100 - accuracy : accuracy }%`;
                        },
                        label(ctx) {
                          switch(ctx.dataset.label) {
                            case 'Rank': return ` ${ctx.dataset.label}: #${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
                            case 'PP': return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}pp`;
                            default: return `pp: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
                          }
                        },
                      }
                    },
                  },
                  scales: {
                    x: xAxis,
                    y: yAxis,
                  },
                },
              },
            );
      }
      else {
        chart.data = {datasets};
        chart.options.scales = {x: xAxis, y: yAxis};
        chart.update();
      }
    }

    $: setupChart(canvas, stars, logarithmic)
  </script>

    <section class="chart" style="--height: {height}">
        <canvas class="chartjs" bind:this={canvas} height={parseInt(height,10)}></canvas>
    </section>
  
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
  