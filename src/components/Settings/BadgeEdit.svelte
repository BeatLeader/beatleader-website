<script>
	import {createEventDispatcher} from 'svelte';
	import {availableMetrics, getDefaultMetricWithOptions} from '../../utils/beatleader/performance-badge';
	import Select from './Select.svelte';

	export let badge = null;
	export let level = 1;
	export let idx = 0;

	const dispatch = createEventDispatcher();

	function onMetricChanged() {
		if (!badge?.metric) return;

		const alternatives = level === 1 ? {alternatives: badge?.alternatives ?? []} : {};
		dispatch('change', {...getDefaultMetricWithOptions(badge.metric), ...alternatives});
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

	function onAdd() {
		if (!Array.isArray(badge?.alternatives)) badge.alternatives = [];

		badge.alternatives = [...badge.alternatives, {metric: '__not-set'}];

		dispatch('change', badge);
	}

	$: badgeOptions = availableMetrics.find(m => m.metric === badge?.metric)?.options ?? null;
</script>

{#if badge}
	{#if level > 1}
		<section class="option full alternative">
			<label
				>Metric {idx + 1}
				<i class="fas fa-times remove" title="Remove metric" on:click={() => dispatch('remove', idx)} /></label>
		</section>
	{/if}

	<section class="option">
		<label> Primary metric </label>

		<Select bind:value={badge.metric} on:change={onMetricChanged} options={availableMetrics} valueSelector={x => x.metric}/>
	</section>

	{#if badgeOptions?.length}
		{#each badgeOptions as option}
			<section class="option">
				<label>{option?.label ?? option?.name}</label>
				<Select bind:value={badge[option.name]} on:change={onMetricOptionChanged} options={option.values}/>
			</section>
		{/each}
	{/if}

	{#if level === 1}
		<section class="option full">
			<label>Alternative metrics <i class="fa-solid fa-circle-plus add" title="Add metric" on:click={onAdd} /></label>
			<small
				>They will be shown if the primary metric does not exist, such as PP for unrankeds, and rotated when clicked if more are selected.</small>
		</section>

		{#each badge?.alternatives ?? [] as alternative, idx}
			<svelte:self
				badge={alternative}
				level={level + 1}
				{idx}
				on:change={e => {
					badge.alternatives[idx] = e.detail;
					dispatch('change', badge);
				}}
				on:remove={() => {
					badge.alternatives = badge.alternatives.filter((_, bidx) => bidx !== idx);
					dispatch('change', badge);
				}} />
		{/each}
	{/if}
{/if}

<style>
	.option.full label {
		margin-top: 0.25rem;
		font-weight: bold;
	}

	.option.alternative label {
		font-size: 0.85em;
	}

	i {
		cursor: pointer !important;
	}
	i.add {
		color: var(--increase);
	}
	i.remove {
		color: var(--decrease);
	}
</style>
