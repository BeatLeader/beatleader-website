<script>
  import Chart from 'chart.js/auto'
  import zoomPlugin from 'chartjs-plugin-zoom';
  import {formatNumber, roundToPrecision} from '../../../utils/format'
  import {formatDateRelative} from '../../../utils/date'
  import {debounce} from '../../../utils/debounce'
  import regionsPlugin from './utils/regions-plugin'
  import {capitalize} from '../../../utils/js'
	import createPlayerService from '../../../services/beatleader/player'
  import Spinner from '../../Common/Spinner.svelte'

  export let playerId = null;
  export let averageAcc = null;
  export let medianAcc = null;
  export let type = 'accuracy'; // or percentage
  export let height = "350px";

  Chart.register(zoomPlugin);

	const playerService = createPlayerService();

  const CHART_DEBOUNCE = 300;

  let canvas = null;
  let chart = null;

  let lastHistoryHash = null;
  let playerScores = null;

  let isLoading = false;

  const calcPlayerScoresHash = playerScores => (playerScores?.length ?? 0) + averageAcc + medianAcc;

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

    const skipped = (ctx, value) => ctx.p0.skip || ctx.p1.skip ? value : undefined;

    let maxStars = 0;
    let minAcc = 100;
    const chartData = playerScores
			.filter(s => !!s?.acc && !!s?.stars)
      .map(s => {
        const acc = s.acc;

        if (s.stars > maxStars) maxStars = s.stars;
        if (acc < minAcc) minAcc = acc;

        return {
          x: s.stars,
          y: acc,
          leaderboardId: s?.leaderboardId ?? null,
          name: s?.songName ?? '',
          songAuthor: '',
          levelAuthor: s?.mapper ?? '',
          diff: `${s?.diff ?? ''}${s?.mode?.length && s.mode !== 'Standard' ? ' ' + s.mode : ''}`,
          timeSet: s.timeset,
          mods: s?.modifiers?.length ? s.modifiers.split(',') : null,
        }
      });

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

    Object.keys(avgData).forEach(key => avgData[key] = avgData[key].sort((a, b) => a.x - b.x))

    maxStars = roundToPrecision(maxStars, .5) + .5;
    minAcc = Math.floor(minAcc - 1);
    if (minAcc < 0) minAcc = 0;

    let averageLines = [];
    if (averageAcc) averageLines.push({
      min: averageAcc,
      max: averageAcc,
      color: averageLinesColor,
      label: 'Average',
      position: {vertical: 'bottom'},
    });
    if (medianAcc) averageLines.push({
      min: medianAcc,
      max: medianAcc,
      color: averageLinesColor,
      label: 'Median',
      position: {horizontal: 'right'},
    });

    const datasets = [
      {
        label: 'Maps',
        borderColor: mapBorderColor,
        backgroundColor: mapColor,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 4,
        data: chartData,
        order: 4,
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
    ];

    if (!chart) {
      chart = new Chart(
        canvas,
        {
          type: 'scatter',
          data: {
            datasets,
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
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

                    switch (ctx?.dataset?.label) {
                      case 'Maps':
                        const song = ctx.dataset.data[ctx.dataIndex];
                        if (song) {
                          ret.push(formatDateRelative(song.timeSet));
                          ret.push(`${song.name} (${capitalize(song?.diff?.replace('Plus', '+' ?? ''))})`);
                          ret.push(`${song.levelAuthor}`);
                        }
                        break;
                    }

                    return ret;
                  },
                  title: function (ctx) {
                    if (!ctx?.[0]?.raw) return '';

                    switch (ctx?.[0].dataset?.label) {
                      case 'Maps':
                        const mods = ctx[0].raw?.mods ?? null;
                        const stars = formatNumber(ctx[0].raw?.x ?? 0, 2);
                        const acc = formatNumber(ctx[0].raw?.y ?? 0, 2);

                        return type === 'percentage'
                          ? `Percentage: ${acc}%${mods?.length ? ' (' + mods.join(', ') + ')' : ''} | Stars: ${stars}★`
                          : `Accuracy: ${acc}%${mods?.length ? ' (' + mods.join(', ') + ')' : ''} | Stars: ${stars}★`

                      default:
                        if (ctx && Array.isArray(ctx))
                          return [`Stars: ${ctx?.[0]?.raw?.x}★`]
                            .concat(
                              ctx.map(d => `${d?.dataset?.label ?? ''}: ${formatNumber(d?.raw?.y ?? 0)}%`),
                            )
                    }

                    return '';
                  },
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
                    enabled: true,
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
                  callback: val => formatNumber(val, 1) + '★',
                },
                max: maxStars,
              },
              y: {
                type: 'linear',
                scaleLabel: {
                  display: true,
                  labelString: 'Acc',
                },
                ticks: {
                  max: 100,
                  callback: val => formatNumber(val, 2) + '%',
                },
                grid: {
                  color: "rgba(0,0,0,0.1)",
                  display: true,
                  drawBorder: true,
                  drawOnChartArea: true,
                },
                min: minAcc,
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
      chart.data = {datasets}
      chart.update()
    }
  }

  let debouncedChartHash = null;
  const debounceChartHash = debounce(chartHash => debouncedChartHash = chartHash, CHART_DEBOUNCE);

	async function fetchPlayerScores(playerId) {
		if (!playerId?.length) return;

		try {
			isLoading = true;
			playerScores = await playerService.fetchAccGraph(playerId);
		}
		finally {
			isLoading = false;
		}
	}

	$: fetchPlayerScores(playerId)

  $: chartHash = calcPlayerScoresHash(playerScores);
  $: debounceChartHash(chartHash)
  $: if (debouncedChartHash) setupChart(debouncedChartHash, canvas)
</script>

<section class="chart" style="--height: {height}">
  <canvas class="chartjs" bind:this={canvas} height={parseInt(height,10)}></canvas>
  {#if isLoading}
    <Spinner width="10em" height="10em" />
  {/if}
</section>

<style>
    section {
        position: relative;
        margin: 1rem auto 0 auto;
        height: var(--height, 300px);
    }

    section :global(svg) {
        position: absolute;
        top: calc((100% - 10em) / 2);
        left: calc((100% - 10em) / 2);
    }

    canvas {
        width: 100% !important;
    }
</style>
