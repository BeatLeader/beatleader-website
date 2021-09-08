<script>
  import processPlayerData from './utils/profile';
  import eventBus from '../../utils/broadcast-channel-pubsub'
  import {worker} from '../../utils/worker-wrappers'
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

  let playerStats = null;
  eventBus.on('player-stats-calculated', stats => playerStats = stats)

  let onePpBoundery = null;

  function clearPlayerStatsOnChange() {
    playerStats = null;
  }

  async function calcOnePpBoundary(playerId) {
    if (!playerId) {
      onePpBoundery = null;
      return;
    }

    onePpBoundery = await worker.calcPpBoundary(playerId);
  }

  function generateScoresStats(stats, onePp) {
    return (stats && stats.length ? stats : [])
      .concat(
        onePp
          ? [{
            label: '+ 1pp',
            title: 'Determines how many raw PPs in the new play you need to achieve to increase your total PP by 1pp',
            value: onePpBoundery,
            digits: 2,
            suffix: ' raw pp new play',
            fluid: true,
            bgColor: 'var(--dimmed)',
          }]
          : [],
      )
  }

  $: isCached = !!(playerData && playerData.scoresLastUpdated)
  $: clearPlayerStatsOnChange(playerId)
  $: playerId = playerData && playerData.playerId ? playerData.playerId : null;
  $: name = playerData && playerData.name ? playerData.name : null;
  $: ({playerInfo, prevInfo, scoresStats, accStats, accBadges, ssBadges} = processPlayerData(playerData, playerStats))
  $: calcOnePpBoundary(playerId);
  $: scoresStatsFinal = generateScoresStats(scoresStats, onePpBoundery)
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
        <div class="stats" class:enhanced={isCached}>
          <ScoresStats stats={scoresStatsFinal} {skeleton}/>
          <div>
            {#if accStats}<ScoresStats stats={accStats}/>{/if}
            {#if accBadges}<ScoresStats stats={accBadges}/>{/if}
          </div>
          <SsBadges badges={ssBadges}/>
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

    @media screen and (min-width: 1200px) {
        .stats.enhanced {
            display: grid;
            grid-template-columns: auto auto;
            grid-gap: 1em;
        }
    }

    @media screen and (max-width: 768px) {
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