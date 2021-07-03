<script>
  import processPlayerData from './utils/profile';
  import Error from '../Common/Error.svelte'
  import Avatar from './Avatar.svelte'
  import PlayerStats from './PlayerStats.svelte'
  import SsBadges from './SsBadges.svelte'
  import ScoresStats from './ScoresStats.svelte'
  import Icons from './Icons.svelte'

  export let playerData;
  export let isLoading = false;
  export let error = null;
  export let skeleton = false;

  $: playerId = playerData && playerData.playerId ? playerData.playerId : null;
  $: name = playerData && playerData.name ? playerData.name : null;
  $: ({playerInfo, prevInfo, scoresStats, ssBadges} = processPlayerData(playerData))
</script>

<div class="box has-shadow" class:loading={isLoading}>
  <div class="columns">
    <div class="column is-narrow avatar">
      <Avatar {playerInfo} {isLoading}/>

      {#if playerId && !isLoading}
        <Icons {playerId} />
      {/if}
    </div>

    <div class="column">
      {#if error}
        <div>
          <Error {error}/>
        </div>
      {/if}

      <PlayerStats {name} {playerInfo} {prevInfo} {skeleton}/>

      {#if scoresStats || ssBadges || skeleton}
        <div class="columns">
          <div class="column">
            <ScoresStats stats={scoresStats} {skeleton}/>
            <SsBadges badges={ssBadges}/>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
    .column.avatar {
        position: relative;
        text-align: center;
        margin-right: 1rem;
        min-width: calc(150px + 1.5rem + 1rem);
        min-height: 190px;
    }

    @media (max-width: 768px) {
        .column.avatar {
            margin-right: 0;
            min-width: calc(150px + 1.5rem);
            padding-bottom: 0;
            min-height: 150px;
        }
    }
</style>