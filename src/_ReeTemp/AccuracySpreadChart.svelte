<script>
    import Chart from 'chart.js/auto';
    import {formatNumber} from '../utils/format';

    export let accSpreadData = null;
    export let height = '12em';

    let canvas = null;
    let chart = null;

    async function setupChart(canvas, chartData) {
        if (!canvas || !chartData || !Object.keys(chartData).length) return;

        const minCount = 0;
        const maxCount = chartData.maxCount * 1.05;

        const xAxis = {
            scaleLabel: {
                display: true,
            },
            grid: {
                drawTicks: false
            },
            ticks: {
                autoSkip: true,
                autoSkipPadding: 4,
                color: 'white',
            },
        };

        const yAxes = {
            count: {
                display: false,
                min: minCount,
                max: maxCount,
                position: 'left'
            },
            td: {
                display: false,
                min: 0,
                max: Math.max(chartData.maxTD * 1.05, 0.2),
                position: 'right'
            },
        };

        const datasets = [
            {
                yAxisID: 'count',
                label: 'Left count',
                data: chartData.leftCount,
                type: 'bar',
                backgroundColor: '#ee5555',
                order: 2
            },
            {
                yAxisID: 'count',
                label: 'Right count',
                data: chartData.rightCount,
                type: 'bar',
                backgroundColor: '#5555ee',
                order: 3
            },
            {
                yAxisID: 'td',
                label: 'Left TD',
                data: chartData.leftTD,
                round: 3,
                type: 'line',
                borderColor: '#ff8888',
                backgroundColor: '#ff8888',
                borderWidth: 2,
                pointRadius: 2,
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
                spanGaps: true,
                order: 0
            },
            {
                yAxisID: 'td',
                label: 'Right TD',
                data: chartData.rightTD,
                round: 3,
                type: 'line',
                borderColor: '#8888ff',
                backgroundColor: '#8888ff',
                borderWidth: 2,
                pointRadius: 2,
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
                spanGaps: true,
                order: 1
            },
        ];

        const labels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

        if (!chart) {
            chart = new Chart(canvas, {
                data: {labels, datasets},
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
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
                                    return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
                                },
                            },
                        },
                    },
                    scales: {
                        xAxis,
                        ...yAxes
                    },
                },
            });
        } else {
            chart.data = {labels, datasets};
            chart.options.plugins.legend.display = true;
            chart.options.scales.y.min = minCount;
            chart.options.scales.y.max = maxCount;
            chart.update();
        }
    }

    $: setupChart(canvas, accSpreadData);
</script>

{#if accSpreadData}
    <section class="accuracy-spread-chart" style="--height: {height}">
        <canvas class="chartjs" bind:this={canvas}></canvas>
    </section>
{/if}

<style>
    .accuracy-spread-chart {
        height: 100%;
    }

    canvas {
        width: 100% !important;
        height: var(--height);
    }
</style>