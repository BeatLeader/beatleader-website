<script>
	import Spinner from '../Common/Spinner.svelte';
	import GenericHeader from './GenericHeader.svelte';
	import Switcher from '../Common/Switcher.svelte';
	import {createEventDispatcher} from 'svelte';

	export let filters = {type: 'all'};
	export let isLoading = false;
	export let selected = false;

	const dispatch = createEventDispatcher();

	const options = [
		{label: 'All', value: 'all'},
		{label: 'Ranked', value: 'ranked'},
	];

	$: selectedFilter = options.find(f => f.value === filters?.type) ?? options[0];
</script>

<GenericHeader {...$$props} on:message on:close>
	<span>Maps</span>
	<span slot="right">
		{#if isLoading}<Spinner />{:else}
			<Switcher
				values={options}
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
