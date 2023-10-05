<script>
	import createPlayerService from "../../services/beatleader/player"
	import Avatar from "../Common/Avatar.svelte";
    import PlayerNameWithFlag from "../Common/PlayerNameWithFlag.svelte";
    import {navigate} from 'svelte-routing';

    export let playerId;
    export let compact = false;
    export let hideFlag = false;

	const playerService = createPlayerService();

	let user;

	async function retrievePlayer(playerId) {
		user = await playerService.fetchPlayerOrGetFromCache(playerId);
	}

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	$: retrievePlayer(playerId);

</script>

<div>
  <div class="mapper">
    <a title={user ? user.name : null} href={`/u/${playerId}/1?`}><Avatar player={user} /></a>
    {#if !compact}
    <div class="mapper-name">
        <PlayerNameWithFlag player={user} on:click={user ? () => navigateToPlayer(playerId) : null} disablePopover, hideFlag={hideFlag} />
    </div>
    {/if}
    
  </div>
</div>

<style>
  div {
    display: flex;
    height: 24px;
    gap: 0.6em;
    line-height: 170%;
  }

  .mapper {
    background-color: #323232;
    border-radius: 12px;
    color: white;
  }

  .mapper-name {
    margin-top: -0.1em;
    padding-right: 0.6em;
  }

</style>