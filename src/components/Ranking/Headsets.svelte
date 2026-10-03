<script>
	import Select from 'svelte-select';
	import {createEventDispatcher} from 'svelte';
	import {slide} from 'svelte/transition';
	import {cubicOut} from 'svelte/easing';
	import {HMDs} from '../../utils/beatleader/format';
	import HeadsetPickerMultiItem from '../Common/PickerMultiItem.svelte';
	import HeadsetPickerItem from '../Common/PickerItem.svelte';
	import PickerBlock from '../Common/PickerBlock.svelte';
	import RadioGroup from '../Common/RadioGroup.svelte';

	export let value = [];
	export let placeholder = 'Click to select headset';
	export let icon = null;
	export let mode = undefined;

	const dispatch = createEventDispatcher();

	const modeOptions = [
		{value: 'main', label: 'Main headset'},
		{value: 'any', label: 'Ever played'},
		{value: 'mostPlayed', label: 'Most played'},
	];

	let listOpen = false;

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

<PickerBlock {icon} hasValue={!!value?.length} open={listOpen}>
	<Select
		value={currentItems.length ? currentItems : null}
		{items}
		{itemFilter}
		Item={HeadsetPickerItem}
		MultiSelection={HeadsetPickerMultiItem}
		{placeholder}
		isSearchable={true}
		isMulti={true}
		bind:listOpen
		on:select={e => {
			onSelect(e);
		}}
		on:clear />

	{#if mode !== undefined && value?.length}
		<div class="hmd-mode picker-footer" transition:slide={{duration: 500, easing: cubicOut}}>
			<RadioGroup
				options={modeOptions}
				value={mode || 'main'}
				label="Headset match mode"
				on:change={e => dispatch('mode-change', e.detail)} />
		</div>
	{/if}
</PickerBlock>

<style>
	:global(.selectContainer) {
		width: 100%;
	}

	.hmd-mode {
		padding: 0.55rem 1rem 0.65rem;
		border-top: 1px solid var(--faded);
		border-radius: 0 0 3px 3px;
		background-color: var(--foreground);
	}
</style>
