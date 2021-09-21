<script>
  import {getContext} from 'svelte'
  import processPlayerData from './utils/profile';
  import eventBus from '../../utils/broadcast-channel-pubsub'
  import {worker} from '../../utils/worker-wrappers'
  import {opt} from '../../utils/js'
  import Avatar from './Avatar.svelte'
  import PlayerStats from './PlayerStats.svelte'
  import Icons from './Icons.svelte'
  import ScoreSaberStats from './ProfileCards/ScoreSaberStats.svelte'
  import MiniRanking from './ProfileCards/MiniRanking.svelte'
  import TwitchVideos from './ProfileCards/TwitchVideos.svelte'
  import PpCalc from './ProfileCards/PpCalc.svelte'
  import Carousel from '../Common/Carousel.svelte'

  export let playerData;
  export let isLoading = false;
  export let error = null;
  export let skeleton = false;
  export let twitchVideos = null;

  const pageContainer = getContext('pageContainer');

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

  $: swipeCards = [
    {
      name: 'stats',
      component: ScoreSaberStats,
      props: {scoresStats: scoresStatsFinal, accStats, accBadges, ssBadges, isCached, skeleton},
      delay: 500,
    },
  ]
    .concat(
      $pageContainer.name !== 'xxl'
        ? [{
          name: 'ranking',
          component: MiniRanking,
          props: {playerInfo: opt(playerData, 'playerInfo')},
        }]
        : [],
    )
    .concat(
      onePpBoundery
        ?
        [{
          name: 'ppcalc',
          component: PpCalc,
          props: {playerId, worker},
        }]
        : [],
    )
    .concat(
      $pageContainer.name !== 'xxl' && twitchVideos && twitchVideos.length
        ? [{
          name: 'twitch',
          component: TwitchVideos,
          props: {videos: twitchVideos},
        }]
        : [],
    )
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
      <PlayerStats {name} {playerInfo} {prevInfo} {skeleton} {error}/>

      <Carousel cards={swipeCards} />
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

    @media screen and (max-width: 767px) {
        .column.avatar {
            margin-right: 0;
            min-width: calc(150px + 1.5rem);
            padding-bottom: 0;
            min-height: 150px;
        }
    }
</style>