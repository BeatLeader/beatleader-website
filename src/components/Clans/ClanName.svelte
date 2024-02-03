<script>
	import {createEventDispatcher} from 'svelte';

	export let clan;
	export let withCrown = false;
	
	const dispatch = createEventDispatcher();

    $: tag = clan?.tag ?? null;
	$: name = clan?.name;
</script>

<a
	href={`/clan/${tag}/players/1?`}
	class="clan-name clickable has-pointer-events"
	title={name}
	on:click|preventDefault>
	<span class="name">
		{#if withCrown}
		<span class="crown">👑</span>
		{/if}{name ?? 'Unknown'}
	</span>
</a>

<style>
	a {
		color: inherit !important;
	}

	.clan-name {
		white-space: nowrap;
		overflow-x: hidden;
		overflow: hidden;
		word-break: break-all;
	}

	.clan-name :global(> img) {
		margin-right: 0.125rem;
	}
</style>
