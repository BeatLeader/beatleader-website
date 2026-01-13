<script>
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import processPlayer from '../../network/clients/beatleader/player/process';
	import PlayerName from './PlayerName.svelte';
	import {navigate} from 'svelte-routing';

	export let playerId;

	let player = null;

	function fetchPlayer(playerId) {
		fetch(`${BL_API_URL}player/${playerId}`)
			.then(d => d.json())
			.then(p => {
				player = processPlayer(p);
			});
	}

	$: fetchPlayer(playerId);
</script>

{#if player}
	<PlayerName {player} showRank={false} cls="player-mention-link" on:click={() => navigate(`/u/${player.alias ?? player.playerId}`)} />
{/if}

<style>
	:global(.player-mention-link) {
		display: inline-flex !important;
		color: var(--linkColor) !important;
		margin-left: 0.3em;
	}
</style>
