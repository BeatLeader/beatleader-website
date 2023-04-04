<script>
	import {createEventDispatcher} from 'svelte';
	import {availableMetrics, getDefaultMetricWithOptions} from '../../utils/beatleader/performance-badge';
	import Select from './Select.svelte';

	export let badge = null;

	const dispatch = createEventDispatcher();

	function onMetricChanged() {
		if (!badge?.metric) return;

		dispatch('change', getDefaultMetricWithOptions(badge.metric));
	}

	function onMetricOptionChanged() {
		const metric = availableMetrics.find(m => m.metric === badge?.metric);
		if (!metric) return;

		const options = (metric?.options ?? []).reduce(
			(acc, o) => ({...acc, [o.name]: badge?.[o.name] ?? metric?.default?.[o.name] ?? null}),
			{}
		);

		dispatch('change', {metric: badge.metric, ...options});
	}

	$: badgeOptions = availableMetrics.find(m => m.metric === badge?.metric)?.options ?? null;
</script>

{#if badge}
	<section class="option">
		<label>Metric</label>

		<Select bind:value={badge.metric} on:change={onMetricChanged}>
			{#each availableMetrics as option (option.metric)}
				<option value={option.metric}>{option.name}</option>
			{/each}
		</Select>
	</section>

	{#if badgeOptions?.length}
		{#each badgeOptions as option}
			<section class="option">
				<label>{option?.label ?? option?.name}</label>
				<Select bind:value={badge[option.name]} on:change={onMetricOptionChanged}>
					{#each option.values as option (option.value)}
						<option value={option.value}>{option.name}</option>
					{/each}
				</Select>
			</section>
		{/each}
	{/if}
{/if}
