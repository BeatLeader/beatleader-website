<script>
	import {createEventDispatcher, tick} from 'svelte';
	import Select from 'svelte-select';

	import PickerMultiItem from '../../Common/PickerMultiItem.svelte';
	import PickerItem from '../../Common/PickerItem.svelte';

	export let open = false;
	export let items = [];
	export let defaultValue = null;
	export let Item = PickerItem;
	export let MultiSelection = PickerMultiItem;
	export let placeholder = '';

	const dispatch = createEventDispatcher();

	let value = null;

	async function onSelect(e) {
		await tick();

		dispatch('change', e?.detail?.map(i => i.value)?.filter(v => v?.length) ?? []);
	}
	const itemFilter = (label, filterText) => label.toLowerCase().includes(filterText.toLowerCase());

	$: console.log(items);
</script>

{#if items?.length}
	<section
		style=" --clearSelectTop: 8px; --multiItemBG: var(--selected); --multiClearBG: var(--selected); --listBackground:
var(--background); --inputColor: var(--textColor); --multiSelectPadding: 2px 35px 2px 4px">
		<Select
			{value}
			{items}
			{itemFilter}
			{Item}
			{MultiSelection}
			{placeholder}
			isSearchable={true}
			isMulti={true}
			placeholderAlwaysShow={true}
			listOpen={open}
			on:select={onSelect}
			on:clear />
	</section>
{/if}

<style>
	select {
		width: 100%;
		height: 100%;
		line-height: 1;
		color: var(--textColor);
		background-color: var(--foreground);
		border: 1px solid transparent;
		padding: calc(0.25em - 1px) 0.5em calc(0.25em - 1px) 0.5em;
		transition: all 300ms ease-out;
		outline: none;
	}

	select.open {
		border-color: var(--faded);
	}
</style>
