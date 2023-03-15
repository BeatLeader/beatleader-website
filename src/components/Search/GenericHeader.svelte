<script>
	import Spinner from '../Common/Spinner.svelte';
	export let isLoading = false;
	export let selected = false;
</script>

<header>
	<span><slot /></span>
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
</style>
