<script>
	import {formatNumber} from '../../utils/format';
	import {formatDate, dateFromUnix} from '../../utils/date';
	import ChartCanvas from './ChartCanvas.svelte';
	import StatEntity from './StatEntity.svelte';
	import StatTable from './StatTable.svelte';
	import {chartTheme, crosshairPlugin, globalStat, rangeFrom, timeChartOptions} from './utils';

	export let type;
	export let range;
	export let label;
	export let valueFormat = v => formatNumber(v, 2);
	export let height = 260;

	$: stat = globalStat(`${type}/leaders?from=0`);
	$: points = $stat.data?.points ?? [];
	$: entities = $stat.data?.entities ?? {};
	$: changes = recordChanges(points, rangeFrom(range));
	$: config = points.length ? chartConfig(points, $chartTheme) : null;

	function recordChanges(points, from) {
		const changes = points.filter((p, i) => i === 0 || p.key !== points[i - 1].key);
		const standing = changes.findLast(c => c.timestamp <= from);
		return changes.filter(c => c.timestamp > from || c === standing).reverse();
	}

	const holderName = key => [entities[key]?.map?.name, entities[key]?.player?.name].filter(Boolean).join(' by ') || key;

	function chartConfig(points, theme) {
		return {
			type: 'line',
			data: {
				datasets: [
					{
						label,
						data: points.map(p => ({x: p.timestamp * 1000, y: p.value})),
						borderColor: theme.series[0],
						backgroundColor: theme.series[0],
						borderWidth: 2,
						stepped: true,
						pointRadius: 0,
						pointHoverRadius: 4,
						pointHoverBorderColor: theme.surface,
						pointHoverBorderWidth: 2,
					},
				],
			},
			plugins: [crosshairPlugin],
			options: timeChartOptions(theme, range, {
				y: {beginAtZero: false, ticks: {callback: valueFormat}},
				tooltip: {
					callbacks: {
						label: ctx => ` ${valueFormat(ctx.parsed.y)}`,
						afterLabel: ctx => ` ${holderName(points[ctx.dataIndex].key)}`,
					},
				},
			}),
		};
	}
</script>

<ChartCanvas {config} loading={$stat.loading} error={$stat.error} {height} />

{#if changes.length}
	<StatTable>
		<thead>
			<tr>
				<th class="left">Since</th>
				<th class="left">Holder</th>
				<th>{label}</th>
			</tr>
		</thead>
		<tbody>
			{#each changes.slice(0, 10) as change}
				<tr>
					<td class="left muted">{formatDate(dateFromUnix(change.timestamp), 'medium', null)}</td>
					<td class="left"><StatEntity entity={entities[change.key]} fallback={change.key} /></td>
					<td>{valueFormat(change.value)}</td>
				</tr>
			{/each}
		</tbody>
	</StatTable>
{/if}
