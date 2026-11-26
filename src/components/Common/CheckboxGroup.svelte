<script>
	import {createEventDispatcher} from 'svelte';

	// Same look as RadioGroup, several options can be on
	export let options = [];
	// Values of the checked options
	export let value = [];
	export let label = null;
	// Keeps the last checked option from being unchecked
	export let required = false;

	const dispatch = createEventDispatcher();

	function toggle(option) {
		const checked = value.includes(option.value);
		dispatch('change', checked ? value.filter(v => v !== option.value) : [...value, option.value]);
	}
</script>

<div class="checkbox-group" role="group" aria-label={label}>
	{#each options as option}
		{@const checked = value.includes(option.value)}
		{@const locked = required && checked && value.length === 1}
		<label class="checkbox-option" class:locked title={locked ? 'At least one has to stay on' : (option.title ?? null)}>
			<input type="checkbox" value={option.value} {checked} disabled={locked} on:change={() => toggle(option)} />
			{#if option.iconFa}
				<i class={option.iconFa}></i>
			{/if}
			<span>{option.label}</span>
		</label>
	{/each}
</div>

<style>
	.checkbox-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 1rem;
		color: var(--textColor);
		font-size: 0.85em;
	}

	.checkbox-option {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
		user-select: none;
	}

	.checkbox-option.locked {
		cursor: default;
	}

	.checkbox-option input {
		appearance: none;
		display: grid;
		place-content: center;
		width: 1.1em;
		height: 1.1em;
		margin: 0;
		border: 2px solid var(--faded);
		border-radius: 3px;
		cursor: pointer;
		transition: border-color 150ms;
	}

	.checkbox-option input::before {
		content: '';
		width: 0.55em;
		height: 0.55em;
		border-radius: 1px;
		background-color: var(--selected);
		transform: scale(0);
		transition: transform 150ms;
	}

	.checkbox-option:hover input:not(:disabled) {
		border-color: var(--textColor);
	}

	.checkbox-option input:checked {
		border-color: var(--selected);
	}

	.checkbox-option input:checked::before {
		transform: scale(1);
	}

	.checkbox-option input:disabled {
		cursor: default;
	}

	.checkbox-option input:focus-visible {
		outline: 2px solid var(--selected);
		outline-offset: 2px;
	}
</style>
