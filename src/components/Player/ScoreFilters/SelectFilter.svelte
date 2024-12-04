<script>
	import {createEventDispatcher, tick} from 'svelte';

	export let open = false;
	export let values = [];
	export let defaultValue = null;

	const dispatch = createEventDispatcher();

	let value = defaultValue ? defaultValue : values?.length ? values[0]?.id : null;

	async function onChanged() {
		await tick();

		dispatch('change', value);
	}

	$: if (!open) value = values?.length ? values[0]?.id : null;
</script>

{#if values?.length}
	<select class:open bind:value on:change={onChanged}>
		{#each values as option}
			{#if option}
				<option value={option.id}>{option.name}</option>
			{/if}
		{/each}
	</select>
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
