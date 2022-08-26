<script>
	import {opt} from '../../utils/js';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';

	export let player = null;
	export let withRank = true;

	$: rank = opt(player, 'playerInfo.rank');
	$: country = opt(player, 'playerInfo.countries.0.country');
</script>

{#if player}
	<div class="player">
		{#if withRank}
			<span class="rank">#{rank}</span>
		{/if}
		<PlayerNameWithFlag {player} />
	</div>
{/if}

<style>
	div.player {
		display: flex;
		justify-content: flex-start;
		align-items: center;
	}

	div.player span.rank {
		width: 4rem;
		min-width: max-content;
		text-align: right;
		padding-right: 0.5rem;
		flex-basis: 4rem;
		flex-shrink: 0;
		flex-grow: 0;
	}
</style>
