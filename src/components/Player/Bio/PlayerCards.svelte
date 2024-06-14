<script>
	export let playerId = null;
	export let playerInfo = null;

	import RankedMapper from './RankedMapper.svelte';
	import ClanFounder from './ClanFounder.svelte';
</script>

{#if playerInfo}
	{#if playerInfo.mapperId}
		<RankedMapper mapperId={playerInfo.mapperId} />
	{/if}
	<ClanFounder {playerId} />
{/if}
