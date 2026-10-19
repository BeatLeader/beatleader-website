<script>
	import {formatNumber} from '../../utils/format';
	import ChartCanvas from './ChartCanvas.svelte';
	import {chartTheme, crosshairPlugin, globalStat, markersPlugin, rangeQuery, spanGapsFor, timeChartOptions} from './utils';

	export let type;
	export let range;
	export let lines = [];
	export let digits = 0;
	export let height = 280;
	export let stacked = false;
	export let markers = [];

	$: stat = globalStat(`${type}?${rangeQuery(range)}`);
	$: config = $stat.data?.timestamps.length ? chartConfig($stat.data, lines, $chartTheme) : null;

	function chartConfig({timestamps, series}, lines, theme) {
		const datasets = lines.map((line, i) => {
			const values = series.find(s => s.key === line.key)?.values ?? [];
			return {
				label: line.label,
				data: timestamps.map((t, idx) => ({x: t * 1000, y: values[idx] ?? null})),
				backgroundColor: theme.series[i],
				borderColor: stacked ? theme.surface : theme.series[i],
				borderWidth: stacked ? 1.5 : 2,
				fill: stacked ? (i === 0 ? 'origin' : '-1') : false,
				pointRadius: 0,
				pointHoverRadius: 4,
				pointHoverBorderColor: theme.surface,
				pointHoverBorderWidth: 2,
				cubicInterpolationMode: 'monotone',
				spanGaps: spanGapsFor(range),
			};
		});
		const total = items => items.reduce((sum, item) => sum + (item.parsed.y ?? 0), 0);

		return {
			type: 'line',
			data: {datasets},
			plugins: [crosshairPlugin, markersPlugin],
			options: timeChartOptions(theme, range, {
				y: {stacked, ticks: {callback: v => formatNumber(v, 0)}},
				legend: {
					display: lines.length > 1,
					position: 'top',
					align: 'start',
					labels: {color: theme.text, usePointStyle: true, pointStyle: stacked ? 'rectRounded' : 'line', boxWidth: 24},
				},
				statsMarkers: {items: markers, color: theme.muted},
				tooltip: {
					itemSort: (a, b) => (stacked ? b.datasetIndex - a.datasetIndex : 0),
					callbacks: {
						label: ctx => ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, digits)}`,
						footer: items => (stacked && items.length > 1 ? `Total: ${formatNumber(total(items), digits)}` : ''),
					},
				},
			}),
		};
	}
</script>

<ChartCanvas {config} loading={$stat.loading} error={$stat.error} {height} />
