<script>
	import {createEventDispatcher} from 'svelte';

	export let open = false;
	export let placeholder = null;
	export let value = null;

	const dispatch = createEventDispatcher();

	let filterEl = null;

	function onSubmit(e) {
		e.preventDefault();
		e.stopPropagation();

		if (filterEl) {
			dispatch('change', filterEl?.value);
		}

		return false;
	}

	function onKeyUp(e) {
		const value = e?.target?.value ?? null;

		if (e.key === 'Enter') {
			e.preventDefault();
		}
		dispatch('change', value);
	}

	$: if (open && filterEl) filterEl.focus();
	$: if (!open && filterEl) filterEl.value = '';
</script>

<form on:submit={onSubmit}>
	<input type="text" {placeholder} {value} class:open bind:this={filterEl} on:keyup={onKeyUp} />
</form>

<style>
	input {
		width: 100%;
		height: 100%;
		line-height: 1;
		color: var(--textColor);
		background-color: transparent;
		border: 1px solid transparent;
		padding: calc(0.25em - 1px) 0.5em calc(0.25em - 1px) 0.5em;
		transition: all 300ms ease-out;
		outline: none;
	}

	input::placeholder {
		color: var(--faded) !important;
	}

	input.open {
		border-color: var(--faded);
	}
</style>
