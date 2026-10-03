<script>
	import {createEventDispatcher} from 'svelte';

	export let options = [];
	export let value = null;
	export let label = null;

	const dispatch = createEventDispatcher();

	const groupName = `radio-group-${Math.random().toString(36).slice(2)}`;
</script>

<div class="radio-group" role="radiogroup" aria-label={label}>
	{#each options as option}
		<label class="radio-option" title={option.title ?? null}>
			<input
				type="radio"
				name={groupName}
				value={option.value}
				checked={value === option.value}
				on:change={() => dispatch('change', option.value)} />
			{#if option.iconFa}
				<i class={option.iconFa} />
			{/if}
			<span>{option.label}</span>
		</label>
	{/each}
</div>

<style>
	.radio-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 1rem;
		color: var(--textColor);
		font-size: 0.85em;
	}

	.radio-option {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
		user-select: none;
	}

	.radio-option input {
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

	.radio-option input::before {
		content: '';
		width: 0.5em;
		height: 0.5em;
		border-radius: 50%;
		background-color: var(--selected);
		transform: scale(0);
		transition: transform 150ms;
	}

	.radio-option:hover input {
		border-color: var(--textColor);
	}

	.radio-option input:checked {
		border-color: var(--selected);
	}

	.radio-option input:checked::before {
		transform: scale(1);
	}

	.radio-option input:focus-visible {
		outline: 2px solid var(--selected);
		outline-offset: 2px;
	}
</style>
