<script>
	import {createEventDispatcher} from 'svelte';
	import Spinner from '../Common/Spinner.svelte';

	export let isLoading = false;
	export let selected = false;
	export let total = null;
	export let url = null;

	const dispatch = createEventDispatcher();
</script>

<header>
	<a href={url} on:click|preventDefault|stopPropagation={() => dispatch('message', {source: 'header', type: 'navigate', value: url})}>
		<slot />
		{#if Number.isFinite(total)} ({total}){/if}

		{#if url?.length}
			<small class="fas fa-external-link-alt" />
		{/if}
	</a>
	{#if isLoading}<Spinner />
	{:else}
		<slot name="right" />
	{/if}
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		font-weight: 500;
		font-size: 1.05em;
		padding: 0.25rem;
		color: var(--textColor);
		background-color: var(--beatleader-primary);
	}

	header :global(> *:nth-child(1)) {
		flex-grow: 1;
	}

	a {
		color: inherit !important;
	}
	a:hover {
		text-decoration: underline;
	}
</style>
