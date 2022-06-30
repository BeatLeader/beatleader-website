<script>
	import Select from 'svelte-select';
	import Item from './CountryPickerItem.svelte';
	import CountryPickerMultiItem from './CountryPickerMultiItem.svelte'

	export let value;
	export let items

	const itemFilter = (label, filterText) => label.toLowerCase().includes(filterText.toLowerCase())
</script>

<Select {value} {items} {itemFilter} {Item} MultiSelection={CountryPickerMultiItem}
				placeholder="Click to select..." isSearchable={true} isMulti={true}
				placeholderAlwaysShow={true}
				on:select on:clear
/>

<style>
    :global(.selectContainer) {
				width: 100%;
    }

		:global(.listItem) {
				cursor: pointer;
		}
</style>
