<script>
	import {createEventDispatcher} from 'svelte';
	import {debounce} from '../../utils/debounce';
	import Spinner from '../Common/Spinner.svelte';

	export let placeholder;
	export let search;
	export let empty;
	export let round = false;
	export let busy = null;

	const dispatch = createEventDispatcher();

	let query = '';
	let results = null;
	let searching = false;

	const run = debounce(async term => {
		let found = [];
		try {
			found = await search(term);
		} catch {}
		if (query.trim() != term) return;
		results = found;
		searching = false;
	}, 300);

	function onInput() {
		const term = query.trim();
		searching = term.length >= 2;
		if (searching) run(term);
		else results = null;
	}
</script>

<label class="search">
	<i class="fas fa-search"></i>
	<input type="search" {placeholder} autocomplete="off" bind:value={query} on:input={onInput} />
	{#if searching}<Spinner />{/if}
</label>

{#if results}
	<div class="results">
		{#each results as item (item.id)}
			<button class="result" disabled={busy != null} on:click={() => dispatch('select', item)}>
				<img class:round src={item.image} alt="" loading="lazy" />
				<span class="text">
					<b>{item.title}</b>
					<span class="hint">{item.subtitle}</span>
				</span>
				{#if busy == item.id}<Spinner />{:else}<i class="fas fa-chevron-right"></i>{/if}
			</button>
		{:else}
			{#if !searching}<p class="hint">{empty}</p>{/if}
		{/each}
	</div>
{/if}

<style>
	.search,
	.results {
		align-self: stretch;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.4em 0.6em;
		border: 1px solid var(--faded);
		border-radius: 4px;
	}

	.search:focus-within {
		border-color: var(--selected);
	}

	.search i {
		color: var(--faded);
	}

	.search input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: none;
		color: var(--textColor);
		font: inherit;
	}

	.search input::placeholder {
		color: var(--faded);
	}

	.result {
		display: flex;
		align-items: center;
		gap: 0.75em;
		width: 100%;
		padding: 0.4em 0.6em;
		border: none;
		border-radius: 4px;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.result:hover:not(:disabled) {
		background-color: var(--inset);
	}

	.result:disabled {
		cursor: progress;
	}

	.result img {
		flex: none;
		width: 2.5em;
		height: 2.5em;
		border-radius: 4px;
		object-fit: cover;
	}

	.result img.round {
		border-radius: 50%;
	}

	.text {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.text b {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result > i {
		color: var(--faded);
	}
</style>
