<script>
	import {formatNumber} from '../../utils/format';
	import {formatDate, dateFromUnix} from '../../utils/date';
	import Spinner from '../Common/Spinner.svelte';
	import StatEntity from './StatEntity.svelte';
	import {chartTheme, globalStat} from './utils';

	export let type;
	export let days = null;
	export let unit = 'players';
	export let count = 15;

	const SPARK_WIDTH = 80;
	const SPARK_HEIGHT = 22;

	$: stat = globalStat(`${type}/ranking?order=Sum&count=${count}${days ? `&days=${days}` : ''}`);
	$: timestamps = $stat.data?.timestamps ?? [];
	$: items = rank($stat.data?.items ?? [], timestamps.length);
	$: period = timestamps.length ? [timestamps[0], timestamps.at(-1)].map(t => formatDate(dateFromUnix(t), 'medium', null)) : [];

	function rank(items, days) {
		const averages = items.map(item => item.sum / days);
		const max = Math.max(...averages, 1);
		return items.map((item, i) => ({...item, average: averages[i], share: (averages[i] / max) * 100}));
	}

	function sparkPoints(values) {
		const counts = values.map(v => v ?? 0);
		const max = Math.max(...counts, 1);
		return counts
			.map((v, i) => `${(i / (counts.length - 1)) * SPARK_WIDTH},${SPARK_HEIGHT - 1 - (v / max) * (SPARK_HEIGHT - 2)}`)
			.join(' ');
	}
</script>

{#if $stat.loading}
	<div class="status"><Spinner /></div>
{:else if $stat.error}
	<div class="status">Failed to load the stats</div>
{:else if !items.length}
	<div class="status">No data yet</div>
{:else}
	<div class="period">{period[0] === period[1] ? period[0] : period.join(' – ')}</div>
	<div class="row head">
		<span></span>
		<span></span>
		<span class="value">{timestamps.length > 1 ? 'per day' : unit}</span>
		{#if timestamps.length > 1}<span class="spark-head">daily</span>{/if}
	</div>
	{#each items as item, idx (item.key)}
		<div class="row">
			<span class="rank">{idx + 1}</span>
			<div class="entity">
				<StatEntity entity={$stat.data.entities[item.key]} fallback={item.key} />
				<div class="track">
					<div class="bar" style="width: {item.share}%; background: {$chartTheme.series[0]}"></div>
				</div>
			</div>
			<span class="value">{formatNumber(item.average, timestamps.length > 1 ? 1 : 0)}</span>
			{#if timestamps.length > 1}
				<svg class="spark" viewBox="0 0 {SPARK_WIDTH} {SPARK_HEIGHT}" preserveAspectRatio="none" aria-hidden="true">
					<polyline points={sparkPoints(item.values)} fill="none" stroke={$chartTheme.series[0]} stroke-width="1.5" />
				</svg>
			{/if}
		</div>
	{/each}
{/if}

<style>
	.status {
		color: var(--faded);
		padding: 1em 0;
	}

	.period {
		color: var(--faded);
		font-size: 0.9em;
		margin-bottom: 0.5em;
	}

	.row {
		display: grid;
		grid-template-columns: 2em minmax(0, 1fr) 6em 6em;
		align-items: center;
		gap: 0.75em;
		padding: 0.35em 0.25em;
		border-top: 1px solid var(--row-separator);
	}

	.row.head {
		border-top: none;
		padding-bottom: 0.1em;
		color: var(--faded);
		font-size: 0.85em;
	}

	.rank {
		color: var(--faded);
		text-align: right;
	}

	.entity {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
		min-width: 0;
	}

	.track {
		height: 4px;
		border-radius: 2px;
		background: var(--row-separator);
		overflow: hidden;
	}

	.bar {
		height: 100%;
		border-radius: 2px;
	}

	.value {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.row:not(.head) .value {
		font-weight: 600;
	}

	.spark-head {
		text-align: center;
	}

	.spark {
		width: 6em;
		height: 1.6em;
	}

	@media screen and (max-width: 767px) {
		.row {
			grid-template-columns: 1.5em minmax(0, 1fr) 4.5em;
		}

		.spark,
		.spark-head {
			display: none;
		}
	}
</style>
