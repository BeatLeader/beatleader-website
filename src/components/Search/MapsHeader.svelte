<script>
	import Spinner from '../Common/Spinner.svelte';
	import GenericHeader from './GenericHeader.svelte';
	import Switcher from '../Common/Switcher.svelte';
	import {createEventDispatcher} from 'svelte';

	export let type = 'all';
	export let isLoading = false;
	export let selected = false;

	const dispatch = createEventDispatcher();

	const filters = [
		{label: 'All', value: 'all'},
		{label: 'Ranked', value: 'ranked'},
	];

	$: selectedFilter = filters.find(f => f.value === type) ?? filters[0];
</script>

<GenericHeader {...$$props}>
	<span>Maps</span>
	<span slot="right">
		{#if isLoading}<Spinner />{:else}
			<Switcher
				values={filters}
				value={selectedFilter}
				on:change={e => dispatch('message', {source: 'header', type: 'filter-map-type', value: e?.detail ?? null})} />
		{/if}
	</span>
</GenericHeader>

<style>
	* :global(.switch-types .button.not-selected) {
		opacity: 1 !important;
	}
</style>
