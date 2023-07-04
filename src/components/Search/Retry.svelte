<script context="module">
	export function getProps(page = 1) {
		return {
			type: 'retry',
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
</script>

<div>
	{#if isLoading}
		Loading...
	{:else}
		An error occurred. Click to try again.
	{/if}
	{#if isLoading}<Spinner />{/if}
</div>

<style>
	div {
		text-align: center;
		color: orangered;
		background-color: var(--textColor);
	}
</style>
