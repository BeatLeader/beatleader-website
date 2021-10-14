<script>
  import {createEventDispatcher} from 'svelte'
  import Chart from 'chart.js/auto'
  import 'chartjs-adapter-luxon';
  import {DAY, formatDate, formatDateWithOptions} from '../../utils/date'
  import {formatNumber} from '../../utils/format'

  export let data = null;
  export let color = "#2366d1";
  export let tooltipTitleFunc = null;
  export let tooltipLabelFunc = null;
  export let tickFormatFunc = null;
  export let type = 'time';
  export let displayType = 'bar';
  export let linearRoundPrecision = 2;
  export let height = "80px";

  const dispatch = createEventDispatcher();

  let canvas = null;
  let chart = null;

  async function setupChart(canvas, data, tooltipTitleFunc, tooltipLabelFunc) {
    if (!canvas || !data?.length) return;

    const skipped = (ctx, value) => ctx.p0.skip || ctx.p1.skip ? value : undefined;

    const yAxes = {
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    };

    const xAxis = {
      type,
      display: true,
      offset: true,
      time: {
        unit: 'month',
      },
      grid: {
        display: false,
      },
      reverse: true,
      ticks: {
        major: {
          enabled: true,
        },
        backdropPadding: 0,
        padding: 0,
        font: function (context) {
          const font = {size: 11};

          if (context?.tick?.major) font.weight = 'bold';

          return font;
        },
        callback: (val, idx, ticks) => {
          if (!ticks?.[idx]) return '';

          if (tickFormatFunc) return tickFormatFunc(val, idx, ticks);

          return type === 'time'
            ? formatDateWithOptions(new Date(ticks[idx]?.value), {
              localeMatcher: 'best fit',
              year: '2-digit',
              month: 'short',
            })
            : formatNumber(ticks[idx]?.value, linearRoundPrecision);
        },
      },
    };

    const datasets = [{
      label: 'Date',
      data,
      fill: false,
      backgroundColor: color,
      borderColor: color,
      borderWidth: 2,
      pointRadius: 1,
      maxBarThickness: 3,
      cubicInterpolationMode: 'monotone',
      tension: 0.4,
      type: displayType ?? 'bar',
      spanGaps: true,
      segment: {
        borderWidth: ctx => skipped(ctx, 1),
        borderDash: ctx => skipped(ctx, [6, 6]),
      },
    }]

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
            onClick(e, item) {
              if ((item?.[0]?.element?.$context?.raw?.page ?? null) === null) return;

              dispatch('page-changed', {page: item[0].element.$context.raw.page, raw: item[0].element.$context.raw});
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                position: 'nearest',
                displayColors: false,
                callbacks: {
                  title(ctx) {
                    if (!ctx?.[0]?.raw) return '';

                    return tooltipTitleFunc ? tooltipTitleFunc(ctx[0]) : formatDate(new Date(ctx[0].raw?.x), 'long', null);
                  },

                  label(ctx) {
                    return tooltipLabelFunc
                      ? tooltipLabelFunc(ctx)
                      : (ctx?.raw?.page ?? null) !== null ? `Click to go to page ${ctx.raw.page + 1}` : null;
                  },
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
    } else {
      chart.data = {datasets}
      chart.options.scales = {x: xAxis, ...yAxes}
      chart.update()
    }
  }

  $: setupChart(canvas, data, tooltipTitleFunc, tooltipLabelFunc)
</script>

{#if data?.length}
  <section class="chart" style="--height: {height}">
    <canvas class="chartjs" bind:this={canvas}></canvas>
  </section>
{/if}

<style>
    section {
        position: relative;
        margin: 1rem auto 0 auto;
        height: var(--height, 32px);
    }

    canvas {
        width: 100% !important;
    }
</style>
