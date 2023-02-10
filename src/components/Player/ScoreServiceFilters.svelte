<script>
	import {createEventDispatcher} from 'svelte';
	import stringify from 'json-stable-stringify';
	import GenericFilter from './ScoreFilters/GenericFilter.svelte';

	export let filters = null;

	const dispatch = createEventDispatcher();

	let currentFilterValues = {};
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
	<section>
		{#each filters as filter}
			<GenericFilter {filter} on:change={onFilterChanged} />
		{/each}
	</section>
{/if}
