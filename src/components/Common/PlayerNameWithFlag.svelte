<script>
	import {createEventDispatcher} from 'svelte';
	import {opt} from '../../utils/js';
	import Flag from './Flag.svelte';

	export let player;
	export let type = '';
	export let hideFlag = false;
	export let withCrown = false;

	const dispatch = createEventDispatcher();

	$: country = opt(player, 'playerInfo.countries.0.country') ?? player?.country;
	$: name = player?.name;
	$: playerId = player?.playerId ?? player?.id;
</script>

<a href={`/u/${playerId}/${type}/1`} class="player-name clickable has-pointer-events" title={name} on:click|preventDefault>
	{#if !hideFlag}
		<Flag {country} on:flag-click />
	{/if}
	<span class="name"
		>{#if withCrown}<span class="crown">👑</span>{/if}{name}</span>
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

	.crown {
		position: relative;
		top: -0.125em;
	}
</style>
