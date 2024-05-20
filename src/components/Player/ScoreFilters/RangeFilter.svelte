<script>
	import {createEventDispatcher, tick} from 'svelte';
	import {debounce} from '../../../utils/debounce';

	const DEBOUNCE_MS = 300;

	export let open = false;
	export let minValue = 0;
	export let maxValue = 15;
	export let step = 0.1;

	const dispatch = createEventDispatcher();

	let filterEl = null;
	let from = minValue;
	let to = maxValue;

	async function onFromChanged() {
		await tick();

		if (from < minValue) from = minValue;
		if (from > maxValue) from = maxValue;
		if (from > to) from = to;

		dispatch('change', {from, to});
	}

	async function onToChanged() {
		await tick();

		if (to < minValue) to = minValue;
		if (to > maxValue) to = maxValue;
		if (to < from) to = from;

		dispatch('change', {from, to});
	}

	const debouncedOnFromChanged = debounce(onFromChanged, DEBOUNCE_MS);
	const debouncedOnToChanged = debounce(onToChanged, DEBOUNCE_MS);

	$: if (open && filterEl) filterEl.focus();
	$: if (open) debouncedOnFromChanged();
	$: if (open) debouncedOnToChanged();
</script>

<span class="flex">
	<input
		type="number"
		min={minValue}
		max={Math.min(to, maxValue)}
		{step}
		bind:value={from}
		class:open
		bind:this={filterEl}
		on:input={debouncedOnFromChanged}
		title="Use the up/down arrow to quickly change the value" />
	<span>to</span>
	<input
		type="number"
		min={Math.max(from, minValue)}
		max={maxValue}
		{step}
		bind:value={to}
		class:open
		on:input={debouncedOnToChanged}
		title="Use the up/down arrow to quickly change the value" />
</span>

<style>
	.flex {
		display: flex;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	input {
		width: 50%;
		height: 100%;
		line-height: 1;
		color: var(--textColor);
		background-color: transparent;
		border: 1px solid transparent;
		padding: calc(0.25em - 1px) 0.5em calc(0.25em - 1px) 0.5em;
		transition: all 300ms ease-out;
		outline: none;
	}

	.flex > span {
		margin: 0 0.25em;
		font-size: 0.875em;
	}

	input.open {
		border-color: var(--faded);
	}
</style>
