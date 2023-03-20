<script>
	import Select from 'svelte-select';
	import Item from './CountryPickerItem.svelte';
	import CountryPickerMultiItem from './CountryPickerMultiItem.svelte';
	import {createEventDispatcher} from 'svelte';

	export let value;
	export let items;

	const dispatch = createEventDispatcher();

	let opened;

	function openedChanged(opened) {
		dispatch('open', opened);
	}

	const itemFilter = (label, filterText) => label.toLowerCase().includes(filterText.toLowerCase());

	$: openedChanged(opened);
</script>

<Select
	{value}
	{items}
	{itemFilter}
	{Item}
	MultiSelection={CountryPickerMultiItem}
	placeholder="Click to select country"
	isSearchable={true}
	isMulti={true}
	placeholderAlwaysShow={true}
	bind:listOpen={opened}
	on:select
	on:clear />

<style>
	:global(.selectContainer) {
		width: 100%;
	}

	:global(.listItem) {
		cursor: pointer;
	}
</style>
