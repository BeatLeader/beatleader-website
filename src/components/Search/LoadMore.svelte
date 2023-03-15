<script context="module">
	export function getProps(page = 1) {
		return {
			type: 'load-more',
			value: {
				page,
			},
		};
	}
</script>

<script>
	import Spinner from '../Common/Spinner.svelte';

	export let item = null;
	export let isLoading = false;
	export let retry = false;
</script>

<div class:retry>
	{#if isLoading}
		Loading...
	{:else if retry}
		An error occurred. Click to try again.
	{:else}
		Load more...
	{/if}
	{#if isLoading}<Spinner />{/if}
</div>

<style>
	div {
		text-align: center;
	}

	div.retry {
		color: orangered;
		background-color: var(--textColor);
	}
</style>
