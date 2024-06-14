<script>
	export let playerId = null;
	export let playerInfo = null;

	import RankedMapper from './RankedMapper.svelte';
	import ClanFounder from './ClanFounder.svelte';
</script>

{#if playerInfo}
	<div class="cards-container">
		{#if playerInfo.mapperId}
			<RankedMapper mapperId={playerInfo.mapperId} />
		{/if}
		<ClanFounder {playerId} />
	</div>
{/if}

<style>
	.cards-container {
		display: flex;
		justify-content: center;
	}
</style>
