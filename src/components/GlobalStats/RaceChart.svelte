<script>
	import {DateTime} from 'luxon';
	import {formatNumber} from '../../utils/format';
	import ChartCanvas from './ChartCanvas.svelte';
	import Legend from './Legend.svelte';
	import {chartTheme, crosshairPlugin, entityName, globalStat, rangeFrom, timeChartOptions} from './utils';

	export let type;
	export let range;
	export let unit = '';
	export let height = 340;

	const COUNT = 8;
	const FRIDAY = 5;

	$: stat = globalStat(`${type}/ranking?order=Latest&count=${COUNT}&from=${rangeFrom(range)}`);
	$: lines = $stat.data?.timestamps.length ? raceLines($stat.data, $chartTheme) : [];
	$: config = lines.length ? chartConfig(lines, $chartTheme) : null;
	$: legend = lines.map(line => ({
		key: line.key,
		color: line.color,
		name: line.name,
		entity: $stat.data.entities[line.key],
		change: line.change > 0 ? `+${formatNumber(line.change, 0)}` : '',
		value: formatNumber(line.latest, 0),
	}));

	// Maps get ranked on Fridays: each week is drawn at its Friday with the last value before it
	function weeks(timestamps) {
		const byFriday = new Map();
		const now = Date.now();
		timestamps.forEach((timestamp, index) => {
			const day = DateTime.fromSeconds(timestamp, {zone: 'utc'});
			const friday = day.plus({days: (FRIDAY - day.weekday + 7) % 7}).toMillis();
			if ((byFriday.get(friday)?.timestamp ?? 0) < timestamp) byFriday.set(friday, {timestamp, index, x: Math.min(friday, now)});
		});
		return [...byFriday.values()].sort((a, b) => a.timestamp - b.timestamp);
	}

	function raceLines({timestamps, items, entities}, theme) {
		const points = weeks(timestamps);
		return items.map((item, i) => {
			const values = points.map(point => ({x: point.x, y: item.values[point.index]}));
			return {
				key: item.key,
				name: entityName(entities[item.key]) || item.key,
				color: theme.series[i],
				values,
				latest: item.latest,
				change: item.latest - (values.find(v => v.y != null)?.y ?? 0),
			};
		});
	}

	function chartConfig(lines, theme) {
		return {
			type: 'line',
			data: {
				datasets: lines.map(line => ({
					label: line.name,
					data: line.values,
					borderColor: line.color,
					backgroundColor: line.color,
					borderWidth: 2,
					stepped: true,
					pointRadius: 0,
					pointHoverRadius: 4,
					pointHoverBorderColor: theme.surface,
					pointHoverBorderWidth: 2,
				})),
			},
			plugins: [crosshairPlugin],
			options: timeChartOptions(theme, range, {
				y: {beginAtZero: false, grace: '5%', ticks: {precision: 0}},
				tooltip: {
					itemSort: (a, b) => (b.parsed.y ?? 0) - (a.parsed.y ?? 0),
					filter: item => item.parsed.y != null,
					callbacks: {
						title: items => `Week to ${items[0]?.label ?? ''}`,
						label: ctx => ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, 0)} ${unit}`,
					},
				},
			}),
		};
	}
</script>

<div class="race">
	<ChartCanvas {config} loading={$stat.loading} error={$stat.error} {height} />
	{#if legend.length}
		<Legend items={legend} />
	{/if}
</div>

<style>
	.race {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 17em;
		gap: 0.5em 1.5em;
		align-items: start;
	}

	@media screen and (max-width: 767px) {
		.race {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
