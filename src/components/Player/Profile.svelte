<script>
  import processPlayerData from './utils/profile';
  import Error from '../Common/Error.svelte'
  import Avatar from './Avatar.svelte'
  import PlayerStats from './PlayerStats.svelte'
  import SsBadges from './SsBadges.svelte'
  import ScoresStats from './ScoresStats.svelte'
  import Icons from './Icons.svelte'
  import eventBus from '../../utils/broadcast-channel-pubsub'

  export let playerData;
  export let isLoading = false;
  export let error = null;
  export let skeleton = false;

  let playerStats = null;
  eventBus.on('player-stats-calculated', stats => playerStats = stats)

  function clearPlayerStatsOnChange() {
    playerStats = null;
  }

  $: clearPlayerStatsOnChange(playerId)
  $: playerId = playerData && playerData.playerId ? playerData.playerId : null;
  $: name = playerData && playerData.name ? playerData.name : null;
  $: ({playerInfo, prevInfo, scoresStats, accStats, accBadges, ssBadges} = processPlayerData(playerData, playerStats))
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
          <div class="column stats">
            <ScoresStats stats={scoresStats} {skeleton}/>
            {#if accStats}<ScoresStats stats={accStats}/>{/if}
            {#if accBadges}<ScoresStats stats={accBadges}/>{/if}
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
        min-width: 150px;
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

    @media (max-width: 599px) {
        .stats {
            text-align: center;
        }

        .stats :global(.badges) {
            display: contents;
        }
    }
</style>