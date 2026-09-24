<script>
	import Select from 'svelte-select';
	import {createEventDispatcher} from 'svelte';
	import {slide} from 'svelte/transition';
	import {cubicOut} from 'svelte/easing';
	import {HMDs} from '../../utils/beatleader/format';
	import HeadsetPickerMultiItem from '../Common/PickerMultiItem.svelte';
	import HeadsetPickerItem from '../Common/PickerItem.svelte';
	import PickerBlock from '../Common/PickerBlock.svelte';

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
	const modeGroupName = `hmd-mode-${Math.random().toString(36).slice(2)}`;

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
		<div
			class="hmd-mode picker-footer"
			role="radiogroup"
			aria-label="Headset match mode"
			transition:slide={{duration: 500, easing: cubicOut}}>
			{#each modeOptions as option}
				<label class="hmd-mode-option">
					<input
						type="radio"
						name={modeGroupName}
						value={option.value}
						checked={(mode || 'main') === option.value}
						on:change={() => dispatch('mode-change', option.value)} />
					<span>{option.label}</span>
				</label>
			{/each}
		</div>
	{/if}
</PickerBlock>

<style>
	:global(.selectContainer) {
		width: 100%;
	}

	.hmd-mode {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 1rem;
		padding: 0.55rem 1rem 0.65rem;
		border-top: 1px solid var(--faded);
		border-radius: 0 0 3px 3px;
		background-color: var(--foreground);
		color: var(--textColor);
		font-size: 0.85em;
	}

	.hmd-mode-option {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
		user-select: none;
	}

	.hmd-mode-option input {
		appearance: none;
		display: grid;
		place-content: center;
		width: 1.1em;
		height: 1.1em;
		margin: 0;
		border: 2px solid var(--faded);
		border-radius: 50%;
		cursor: pointer;
		transition: border-color 150ms;
	}

	.hmd-mode-option input::before {
		content: '';
		width: 0.5em;
		height: 0.5em;
		border-radius: 50%;
		background-color: var(--selected);
		transform: scale(0);
		transition: transform 150ms;
	}

	.hmd-mode-option:hover input {
		border-color: var(--textColor);
	}

	.hmd-mode-option input:checked {
		border-color: var(--selected);
	}

	.hmd-mode-option input:checked::before {
		transform: scale(1);
	}

	.hmd-mode-option input:focus-visible {
		outline: 2px solid var(--selected);
		outline-offset: 2px;
	}
</style>
