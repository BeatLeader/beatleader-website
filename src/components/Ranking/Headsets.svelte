<script>
	import Select from 'svelte-select';
	import {createEventDispatcher} from 'svelte';
	import {HMDs} from '../../utils/beatleader/format';
	import HeadsetPickerMultiItem from '../Common/PickerMultiItem.svelte';
	import HeadsetPickerItem from '../Common/PickerItem.svelte';

	export let value = [];

	const dispatch = createEventDispatcher();

	const items = Object.keys(HMDs)
		.map(key => {
			return {value: key, label: HMDs[key].name, ...HMDs[key]};
		})
		.sort((a, b) => a.priority - b.priority);
	function onSelect(e) {
		dispatch('change', e?.detail?.map(i => i.value)?.filter(v => v?.length) ?? []);
	}
	const itemFilter = (label, filterText) => label.toLowerCase().includes(filterText.toLowerCase());
	$: currentItems = items.filter(i => (value ?? []).includes(i.value));
</script>

<section
	style=" --clearSelectTop: 8px; --multiItemBG: var(--selected); --multiClearBG: var(--selected); --listBackground:
var(--background); --inputColor: var(--textColor); --multiSelectPadding: 2px 35px 2px 4px">
	<Select
		value={currentItems}
		{items}
		{itemFilter}
		Item={HeadsetPickerItem}
		MultiSelection={HeadsetPickerMultiItem}
		placeholder="Click to select headset"
		isSearchable={true}
		isMulti={true}
		placeholderAlwaysShow={true}
		on:select={e => {
			onSelect(e);
		}}
		on:clear />
</section>

<style>
	section {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
	}

	section :global(.badge-bg) {
		background: rgba(255, 255, 255, 0.123);
		border-bottom: 2px solid transparent;
		border-radius: 0.1rem;
		padding: 0.5rem;
		filter: saturate(0.5) brightness(1.4);
		transform: scale(0.8);
		font-weight: 400 !important;
		color: white !important;
		margin: 0 0;
	}

	:global(.selectContainer) {
		width: 100%;
	}

	:global(.listItem) {
		cursor: pointer;
	}
</style>
