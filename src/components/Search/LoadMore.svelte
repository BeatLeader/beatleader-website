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
</script>

<div>
	{#if isLoading}
		Loading...
	{:else}
		Load more...
	{/if}
	{#if isLoading}<Spinner />{/if}
</div>

<style>
	div {
		text-align: center;
	}
</style>
