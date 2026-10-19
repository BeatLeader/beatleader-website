<script>
	import {formatNumber} from '../../utils/format';
	import {formatDate, dateFromUnix} from '../../utils/date';
	import ChartCanvas from './ChartCanvas.svelte';
	import StatEntity from './StatEntity.svelte';
	import StatTable from './StatTable.svelte';
	import {
		ACCENT,
		BASE_OPTIONS,
		DAY,
		chartTheme,
		entityImage,
		entityName,
		entityUrl,
		globalStat,
		openUrl,
		rangeFrom,
		timeAxis,
		tooltipStyle,
		valueAxis,
	} from './utils';

	export let type;
	export let range;
	export let valueFormat = v => formatNumber(v, 0);
	export let height = 280;

	const COLORED_HOLDERS = 7;
	const IMAGE_SIZE = 30;

	let chart = null;
	let hovered = null;
	let images = [];
	let reigns = [];

	$: stat = globalStat(`${type}/leaders?from=0`);
	$: entities = $stat.data?.entities ?? {};
	$: points = withStreaks($stat.data?.points ?? []).filter(p => p.timestamp >= rangeFrom(range));
	$: {
		reigns = reignsOf(points);
		hovered = null;
	}
	$: holders = rankHolders(reigns, $chartTheme);
	$: holderByKey = new Map(holders.map(holder => [holder.key, holder]));
	$: others = holders.slice(COLORED_HOLDERS);
	$: current = reigns.at(-1);
	$: config = points.length ? chartConfig(points, holderByKey, $chartTheme) : null;

	// Days missing from the data don't end a streak while the same key holds #1 on both sides of them
	function withStreaks(raw) {
		const points = [];
		for (const point of raw) {
			const previous = points.at(-1);
			if (previous?.key !== point.key) {
				points.push({...point, streak: 1, reign: (previous?.reign ?? -1) + 1});
				continue;
			}
			for (let timestamp = previous.timestamp + DAY; timestamp < point.timestamp; timestamp += DAY) {
				points.push({...previous, timestamp, streak: points.at(-1).streak + 1});
			}
			points.push({...point, streak: points.at(-1).streak + 1, reign: previous.reign});
		}
		return points;
	}

	function reignsOf(points) {
		const reigns = [];
		points.forEach((point, index) => {
			if (reigns.at(-1)?.id !== point.reign) reigns.push({id: point.reign, key: point.key, from: index});
			Object.assign(reigns.at(-1), {to: index, days: point.streak, value: point.value});
		});
		return reigns;
	}

	function rankHolders(reigns, theme) {
		const byKey = new Map();
		reigns.forEach((reign, index) => {
			const holder = byKey.get(reign.key) ?? {key: reign.key, longest: 0, best: index, total: 0, times: 0};
			if (reign.days > holder.longest) Object.assign(holder, {longest: reign.days, best: index});
			holder.total += reign.days;
			holder.times++;
			byKey.set(reign.key, holder);
		});
		return [...byKey.values()]
			.sort((a, b) => b.longest - a.longest || b.total - a.total)
			.map((holder, i) => ({...holder, colored: i < COLORED_HOLDERS, color: i < COLORED_HOLDERS ? theme.series[i] : theme.other}));
	}

	const reignOf = point => point.reign - reigns[0].id;

	const highlightOf = reign => {
		const holder = holderByKey.get(reigns[reign].key);
		return holder?.colored ? holder.color : ACCENT;
	};

	function setHovered(reign) {
		if (reign === hovered) return;
		hovered = reign;
		chart?.update('none');
	}

	const streakPlugin = {
		id: 'streakHighlight',
		beforeDatasetsDraw(chart) {
			if (hovered == null || !reigns[hovered]) return;

			const {ctx, chartArea} = chart;
			const bars = chart.getDatasetMeta(0).data;
			const color = highlightOf(hovered);
			ctx.save();
			ctx.shadowColor = color;
			ctx.shadowBlur = 16;
			ctx.fillStyle = color;
			for (let i = reigns[hovered].from; i <= reigns[hovered].to; i++) {
				const {x, y, base, width} = bars[i].getProps(['x', 'y', 'base', 'width'], true);
				if (x >= chartArea.left) ctx.fillRect(x - width / 2, y, width, base - y);
			}
			ctx.restore();
		},
		afterRender(chart) {
			const bars = chart.getDatasetMeta(0).data;
			const shown = new Set(holders.filter(holder => holder.colored).map(holder => holder.best));
			if (hovered != null) shown.add(hovered);
			images = [...shown].map(reign => ({
				reign,
				entity: entities[reigns[reign].key],
				x: bars[reigns[reign].to].x,
				y: bars[reigns[reign].to].y,
				color: highlightOf(reign),
			}));
		},
	};

	function chartConfig(points, holderByKey, theme) {
		return {
			type: 'bar',
			data: {
				datasets: [
					{
						data: points.map(p => ({x: p.timestamp * 1000, y: p.streak})),
						backgroundColor: ctx => {
							const point = points[ctx.dataIndex];
							return reignOf(point) === hovered ? highlightOf(hovered) : holderByKey.get(point.key)?.color;
						},
						barPercentage: 1,
						categoryPercentage: 1,
						borderWidth: 0,
					},
				],
			},
			plugins: [streakPlugin],
			options: {
				...BASE_OPTIONS,
				layout: {padding: {top: IMAGE_SIZE + 12}},
				interaction: {mode: 'nearest', axis: 'x', intersect: false},
				onHover: (event, elements) => {
					const point = points[elements[0]?.index];
					setHovered(point ? reignOf(point) : null);
					if (event.native) event.native.target.style.cursor = point ? 'pointer' : 'default';
				},
				onClick: (event, elements) => {
					const point = points[elements[0]?.index];
					if (point) openUrl(entityUrl(entities[point.key]));
				},
				scales: {
					x: {...timeAxis(theme, range), offset: false},
					y: valueAxis(theme, {ticks: {precision: 0}, title: {display: true, text: 'days at #1', color: theme.muted}}),
				},
				plugins: {
					legend: {display: false},
					tooltip: {
						...tooltipStyle(theme),
						callbacks: {
							label: ctx => {
								const point = points[ctx.dataIndex];
								return ` ${entityName(entities[point.key]) || point.key}: day ${point.streak} at #1 (${valueFormat(point.value)})`;
							},
							footer: () => 'Click to open',
						},
					},
				},
			},
		};
	}
</script>

{#if current}
	<div class="current">
		<span class="note">Now at #1</span>
		<StatEntity entity={entities[current.key]} fallback={current.key} />
		<span class="note">{current.days} {current.days === 1 ? 'day' : 'days'} · {valueFormat(current.value)}</span>
	</div>
{/if}

<ChartCanvas {config} loading={$stat.loading} error={$stat.error} {height} bind:chart>
	{#each images as image (image.reign)}
		<div
			class="streak-image"
			class:active={image.reign === hovered}
			class:square={!!image.entity?.map}
			style="left: {image.x}px; top: {image.y}px; --color: {image.color}; --size: {IMAGE_SIZE}px">
			{#if entityImage(image.entity)}
				<img src={entityImage(image.entity)} alt="" />
			{/if}
		</div>
	{/each}
</ChartCanvas>

{#if holders.length}
	<StatTable>
		<thead>
			<tr>
				<th></th>
				<th class="left">Holder</th>
				<th>Longest streak</th>
				<th>Days at #1</th>
				<th>Times</th>
			</tr>
		</thead>
		<tbody>
			{#each holders.slice(0, COLORED_HOLDERS) as holder}
				<tr on:mouseenter={() => setHovered(holder.best)} on:mouseleave={() => setHovered(null)}>
					<td><span class="swatch" style="background: {holder.color}"></span></td>
					<td class="left"><StatEntity entity={entities[holder.key]} fallback={holder.key} /></td>
					<td>{holder.longest}</td>
					<td>{holder.total}</td>
					<td>{holder.times}</td>
				</tr>
			{/each}
			{#if others.length}
				<tr class="muted">
					<td><span class="swatch" style="background: {others[0].color}"></span></td>
					<td class="left">{others.length} more, hover their streaks to see them</td>
					<td>{Math.max(...others.map(h => h.longest))}</td>
					<td>{others.reduce((sum, h) => sum + h.total, 0)}</td>
					<td>{others.reduce((sum, h) => sum + h.times, 0)}</td>
				</tr>
			{/if}
		</tbody>
	</StatTable>
	<div class="note since">Since {formatDate(dateFromUnix(points[0].timestamp), 'medium', null)}</div>
{/if}

<style>
	.current {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75em;
		margin-bottom: 0.75em;
	}

	.note {
		color: var(--faded);
		font-size: 0.9em;
	}

	.streak-image {
		position: absolute;
		width: var(--size);
		height: var(--size);
		transform: translate(-50%, calc(-100% - 6px));
		border-radius: 50%;
		border: 2px solid var(--color);
		background: var(--foreground);
		overflow: hidden;
		pointer-events: none;
		transition:
			transform 0.12s ease,
			box-shadow 0.12s ease;
	}

	.streak-image.square {
		border-radius: 6px;
	}

	.streak-image.active {
		z-index: 1;
		box-shadow: 0 0 12px 2px var(--color);
		transform: translate(-50%, calc(-100% - 6px)) scale(1.15);
	}

	.streak-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.since {
		margin-top: 0.5em;
	}
</style>
