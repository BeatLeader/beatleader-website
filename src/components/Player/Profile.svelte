<script>
  import {getContext} from 'svelte'
  import processPlayerData from './utils/profile';
  import eventBus from '../../utils/broadcast-channel-pubsub'
  import {worker} from '../../utils/worker-wrappers'
  import {opt} from '../../utils/js'
  import createBeatSaviorService from '../../services/beatsavior'
  import Avatar from './Avatar.svelte'
  import PlayerStats from './PlayerStats.svelte'
  import Icons from './Icons.svelte'
  import ScoreSaberStats from './ProfileCards/ScoreSaberStats.svelte'
  import MiniRanking from './ProfileCards/MiniRanking.svelte'
  import TwitchVideos from './ProfileCards/TwitchVideos.svelte'
  import PpCalc from './ProfileCards/PpCalc.svelte'
  import AccSaber from './ProfileCards/AccSaber.svelte'
  import BeatSavior from './ProfileCards/BeatSavior.svelte'
  import Carousel from '../Common/Carousel.svelte'
  import SsBadges from './SsBadges.svelte'
  import Badge from '../Common/Badge.svelte'

  export let playerData;
  export let isLoading = false;
  export let error = null;
  export let skeleton = false;
  export let twitchVideos = null;
  export let accSaberPlayerInfo = null;
  export let accSaberCategories = null;

  const pageContainer = getContext('pageContainer');

  const beatSaviorService = createBeatSaviorService();

  let playerStats = null;
  eventBus.on('player-stats-calculated', stats => {
    if (stats?.playerId && stats?.playerId === playerData?.playerId) playerStats = stats
  })

  let onePpBoundery = null;

  let isBeatSaviorAvailable = false;

  async function refreshBeatSaviorState(playerId) {
    if (!playerId) return;

    isBeatSaviorAvailable = await beatSaviorService.isDataForPlayerAvailable(playerId)
  }

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
  $: playerRole = playerInfo?.role ?? null;
  $: calcOnePpBoundary(playerId);
  $: refreshBeatSaviorState(playerId)
  $: scoresStatsFinal = generateScoresStats(scoresStats, onePpBoundery)
  $: rankChartData = (playerData?.playerInfo.rankHistory ?? []).concat(playerData?.playerInfo.rank)

  $: swipeCards = []
    .concat(
      playerId
        ? [
          {
            name: `stats-${playerId}`,
            component: ScoreSaberStats,
            props: {
              playerId,
              scoresStats: scoresStatsFinal,
              accStats,
              accBadges,
              ssBadges,
              isCached,
              skeleton,
              rankHistory: rankChartData,
            },
            delay: 500,
          },
        ]
          .concat(
            $pageContainer.name !== 'xxl'
              ? [{
                name: `ranking-${playerId}`,
                component: MiniRanking,
                props: {playerInfo: opt(playerData, 'playerInfo')},
              }]
              : [],
          )
          .concat(
            onePpBoundery
              ?
              [{
                name: `ppcalc-${playerId}`,
                component: PpCalc,
                props: {playerId, worker},
              }]
              : [],
          )
          .concat(
            accSaberCategories && accSaberPlayerInfo && accSaberCategories.length && accSaberPlayerInfo.length
              ?
              [{
                name: `accsaber-${playerId}`,
                component: AccSaber,
                props: {categories: accSaberCategories, playerInfo: accSaberPlayerInfo},
              }]
              : [],
          )
          .concat(
            isBeatSaviorAvailable
              ?
              [{
                name: `beat-savior-${playerId}`,
                component: BeatSavior,
                props: {playerId},
              }]
              : [],
          )
          .concat(
            $pageContainer.name !== 'xxl' && twitchVideos && twitchVideos.length
              ? [{
                name: `twitch-${playerId}`,
                component: TwitchVideos,
                props: {videos: twitchVideos},
              }]
              : [],
          )
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

      {#if playerRole}
        <div class="player-role above-tablet">
          <Badge label={playerRole} onlyLabel={true} fluid={true} bgColor="var(--dimmed)" />
        </div>
      {/if}

      {#if ssBadges}
        <div class="ss-badges">
          <SsBadges badges={ssBadges}/>
        </div>
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
        min-width: 188px;
        width: 188px;
        min-height: 190px;
        padding-right: 0;
    }

    .player-role {
        width: 150px;
        padding-top: 1rem;
    }

    .ss-badges {
        padding-top: 1rem;
    }

    @media screen and (max-width: 768px) {
        .column.avatar {
            margin-right: 0;
            min-width: calc(188px + 1.5rem);
            padding-bottom: 0;
            min-height: 150px;
            width: auto;
        }

        .ss-badges {
            display: none;
        }
    }
</style>