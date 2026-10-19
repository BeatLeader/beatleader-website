<script>
	import {formatNumber} from '../../utils/format';
	import ChartCanvas from './ChartCanvas.svelte';
	import {BASE_OPTIONS, chartTheme, globalStat, rangeQuery, tooltipStyle, valueAxis} from './utils';

	export let range;
	export let height = 300;

	const MAX_BUCKET = 15;
	const buckets = Array.from({length: MAX_BUCKET + 1}, (_, i) => i);

	$: ranked = globalStat(`RankedStars?${rangeQuery(range)}`);
	$: unranked = globalStat(`UnrankedStars?${rangeQuery(range)}`);
	$: groups =
		$ranked.data && $unranked.data
			? [
					{label: 'Ranked maps', ...summarize($ranked.data)},
					{label: 'Unranked maps with stars', ...summarize($unranked.data)},
				]
			: [];
	$: config = groups.some(g => g.total) ? chartConfig(groups, $chartTheme) : null;

	function summarize(data) {
		const counts = buckets.map(b => (data.series.find(s => s.key === `${b}`)?.values ?? []).reduce((sum, v) => sum + (v ?? 0), 0));
		const total = counts.reduce((sum, v) => sum + v, 0);
		return {counts, total, shares: counts.map(c => (total ? (c / total) * 100 : 0))};
	}

	function chartConfig(groups, theme) {
		return {
			type: 'bar',
			data: {
				labels: buckets.map(b => (b === MAX_BUCKET ? `${b}+★` : `${b}★`)),
				datasets: groups.map((group, i) => ({
					label: group.label,
					data: group.shares,
					counts: group.counts,
					backgroundColor: theme.series[i],
					borderRadius: {topLeft: 4, topRight: 4},
					borderSkipped: 'bottom',
					categoryPercentage: 0.75,
					barPercentage: 0.9,
				})),
			},
			options: {
				...BASE_OPTIONS,
				interaction: {mode: 'index', intersect: false},
				scales: {
					x: {ticks: {color: theme.muted}, grid: {display: false}, border: {color: theme.grid}},
					y: valueAxis(theme, {ticks: {callback: v => `${v}%`}}),
				},
				plugins: {
					legend: {position: 'top', align: 'start', labels: {color: theme.text, usePointStyle: true, pointStyle: 'rectRounded'}},
					tooltip: {
						...tooltipStyle(theme),
						callbacks: {
							label: ctx =>
								` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, 1)}% (${formatNumber(ctx.dataset.counts[ctx.dataIndex], 0)} attempts)`,
						},
					},
				},
			},
		};
	}
</script>

<ChartCanvas {config} loading={$ranked.loading || $unranked.loading} error={$ranked.error || $unranked.error} {height} />
