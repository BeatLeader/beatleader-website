<script>
	import {createEventDispatcher} from 'svelte';

	const dispatch = createEventDispatcher();

	export let country;
</script>

{#if country && country.length}
	<img
		alt={`${country ? country.toLowerCase() : ''} flag`}
		src={`/assets/flags/${country ? country.toLowerCase() : ''}.png`}
		class="country"
		on:click|preventDefault={() => dispatch('flag-click', {country: country.toLowerCase()})} />
{/if}

<style>
	.country {
		width: 1.2em;
		vertical-align: middle;
		margin: -0.25em 0 0 0;
	}
</style>
