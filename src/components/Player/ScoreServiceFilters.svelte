<script>
	import {createEventDispatcher} from 'svelte';
	import stringify from 'json-stable-stringify';
	import GenericFilter from './ScoreFilters/GenericFilter.svelte';

	export let filters = null;
	export let currentFilterValues = {};

	const dispatch = createEventDispatcher();

	let lastFilterValues = {};

	function onFilterChanged(event) {
		const key = event?.detail?.id ?? null;
		if (!key) return;

		currentFilterValues[key] = event.detail.value;

		if (stringify(currentFilterValues) !== stringify(lastFilterValues)) dispatch('change', currentFilterValues);

		lastFilterValues = {...currentFilterValues};
	}
</script>

{#if filters?.length}
	<section class="score-filters">
		{#each filters as filter}
			{#if filter.asComponent}
				<svelte:component this={filter.component} {...filter.props} on:change={onFilterChanged} on:click />
			{:else}
				<GenericFilter {filter} on:change={onFilterChanged} on:click />
			{/if}
		{/each}
	</section>
{/if}
