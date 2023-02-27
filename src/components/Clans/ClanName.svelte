<script>
	import {createEventDispatcher} from 'svelte';

	export let clan;
	
	const dispatch = createEventDispatcher();

    $: tag = clan?.tag ?? null;
	$: name = clan?.name;
</script>

<a
	href={`/clan/${tag}`}
	class="player-name clickable has-pointer-events"
	title={name}
	on:click|preventDefault>
</a>

<style>
	a {
		color: inherit !important;
	}

	.player-name {
		white-space: nowrap;
		overflow-x: hidden;
		overflow: hidden;
		word-break: break-all;
	}

	.player-name :global(> img) {
		margin-right: 0.125rem;
	}
</style>
