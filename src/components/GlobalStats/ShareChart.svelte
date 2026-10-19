<script>
	import {formatNumber} from '../../utils/format';
	import ChartCanvas from './ChartCanvas.svelte';
	import Legend from './Legend.svelte';
	import {chartTheme, crosshairPlugin, globalStat, rangeQuery, timeChartOptions} from './utils';

	export let type;
	export let range;
	export let labelFor = key => key;
	export let rankBy = 'latest';
	export let unit = 'players';
	export let height = 320;

	const MAX_SERIES = 8;

	$: stat = globalStat(`${type}?${rangeQuery(range)}`);
	$: summary = $stat.data?.timestamps.length ? summarize($stat.data, $chartTheme) : null;
	$: config = summary && chartConfig($stat.data.timestamps, summary.groups, $chartTheme);
	$: legend = [...(summary?.groups ?? [])].reverse().map(group => {
		const latest = group.shares.at(-1) ?? 0;
		const change = latest - (group.shares.find(v => v != null) ?? 0);
		return {
			key: group.key,
			color: group.color,
			name: group.label,
			change: `${change >= 0 ? '+' : ''}${formatNumber(change, 1)}`,
			value: `${formatNumber(latest, 2)}%`,
		};
	});

	function summarize({timestamps, series}, theme) {
		const totals = timestamps.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
		const share = (value, i) => (totals[i] ? (value / totals[i]) * 100 : null);
		const rank = s => (rankBy === 'peak' ? Math.max(...s.shares.map(v => v ?? 0)) : (s.shares.at(-1) ?? 0));

		const sorted = series
			.map(s => ({key: s.key, counts: s.values.map(v => v ?? 0)}))
			.map(s => ({...s, shares: s.counts.map(share)}))
			.sort((a, b) => rank(b) - rank(a));

		const groups = sorted.slice(0, MAX_SERIES).map((s, i) => ({...s, label: labelFor(s.key), color: theme.series[i]}));
		const rest = sorted.slice(MAX_SERIES);
		if (rest.length) {
			const counts = timestamps.map((_, i) => rest.reduce((sum, s) => sum + s.counts[i], 0));
			groups.push({key: 'other', label: 'Other', color: theme.other, counts, shares: counts.map(share)});
		}

		return {groups, latestTotal: totals.at(-1)};
	}

	function chartConfig(timestamps, groups, theme) {
		return {
			type: 'line',
			data: {
				datasets: groups.map((group, i) => ({
					label: group.label,
					data: group.shares.map((y, idx) => ({x: timestamps[idx] * 1000, y})),
					counts: group.counts,
					backgroundColor: group.color,
					borderColor: theme.surface,
					borderWidth: 1.5,
					pointRadius: 0,
					pointHitRadius: 0,
					fill: i === 0 ? 'origin' : '-1',
				})),
			},
			plugins: [crosshairPlugin],
			options: timeChartOptions(theme, range, {
				y: {stacked: true, max: 100, ticks: {callback: v => `${v}%`}},
				tooltip: {
					itemSort: (a, b) => b.datasetIndex - a.datasetIndex,
					callbacks: {
						label: ctx =>
							` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, 1)}% (${formatNumber(ctx.dataset.counts[ctx.dataIndex], 0)})`,
					},
				},
			}),
		};
	}
</script>

<div class="share-chart">
	<ChartCanvas {config} loading={$stat.loading} error={$stat.error} {height} />

	{#if summary}
		<Legend items={legend} />
		<div class="total">{formatNumber(summary.latestTotal, 0)} {unit} on the latest day · change over the range</div>
	{/if}
</div>

<style>
	.share-chart {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 17em;
		gap: 0.5em 1.5em;
		align-items: start;
	}

	.total {
		grid-column: 1;
		color: var(--faded);
		font-size: 0.85em;
	}

	@media screen and (max-width: 767px) {
		.share-chart {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
