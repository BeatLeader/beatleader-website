<script>
  import {getContext} from 'svelte'
  import processPlayerData from './utils/profile';
  import eventBus from '../../utils/broadcast-channel-pubsub'
  import {worker} from '../../utils/worker-wrappers'
  import createBeatSaviorService from '../../services/beatsavior'
  import createAccSaberService from '../../services/accsaber'
  import Avatar from './Avatar.svelte'
  import AvatarOverlayIcons from './AvatarOverlayIcons.svelte'
  import ProfileHeaderInfo from './ProfileHeaderInfo.svelte'
  import BeatLeaderSwipeCard from './ProfileCards/BeatLeaderSwipeCard.svelte'
  import MiniRankingSwipeCard from './ProfileCards/MiniRankingSwipeCard.svelte'
  import TwitchVideosSwipeCard from './ProfileCards/TwitchVideosSwipeCard.svelte'
  import PpCalcSwipeCard from './ProfileCards/PpCalcSwipeCard.svelte'
  import AccSaberSwipeCard from './ProfileCards/AccSaberSwipeCard.svelte'
  import BeatSaviorSwipeCard from './ProfileCards/BeatSaviorSwipeCard.svelte'
  import Carousel from '../Common/Carousel.svelte'
  import Badge from '../Common/Badge.svelte'
  import BeatLeaderSummary from "./BeatLeaderSummary.svelte";
  import ContentBox from "../Common/ContentBox.svelte";

  export let playerData;
  export let isLoading = false;
  export let error = null;
  export let skeleton = false;
  export let twitchVideos = null;

  const pageContainer = getContext('pageContainer');

  const beatSaviorService = createBeatSaviorService();
  const accSaberService = createAccSaberService();

  let accSaberPlayerInfo = null;
  let accSaberCategories = null;
  let playerGain = null;

  let playerStats = null;
  eventBus.on('player-stats-calculated', stats => {
    if (stats?.playerId && stats?.playerId === playerData?.playerId) playerStats = stats
  })

  let onePpBoundary = null;

  let isBeatSaviorAvailable = false;

  async function refreshBeatSaviorState(playerId) {
    if (!playerId) return;

    isBeatSaviorAvailable = await beatSaviorService.isDataForPlayerAvailable(playerId)
  }

  function clearPlayerStatsOnChange() {
    playerStats = null;
    playerGain = null;
  }

  async function calcOnePpBoundary(playerId, isCached) {
    if (!playerId || !isCached) {
      onePpBoundary = null;
      return;
    }

    onePpBoundary = await worker.calcPpBoundary(playerId);
  }

  function generateScoresStats(stats, onePp) {
    return (stats && stats.length ? stats : [])
      .concat(
        onePp
          ? [{
            label: '+ 1pp',
            title: 'Determines how many raw PPs in the new play you need to achieve to increase your total PP by 1pp',
            value: onePpBoundary,
            digits: 2,
            suffix: ' raw pp new play',
            fluid: true,
            bgColor: 'var(--dimmed)',
          }]
          : [],
      )
  }

  function onPlayerGainChanged(e) {
    if (e?.detail?.gainType !== 'beatleader') return;

    playerGain = e.detail;
  }

  async function updateAccSaberPlayerInfo(playerId) {
    if (!playerId) return;

    accSaberPlayerInfo = await accSaberService.getPlayer(playerId);
    accSaberCategories = await accSaberService.getCategories();
  }

  $: isCached = !!(playerData && playerData.scoresLastUpdated)
  $: clearPlayerStatsOnChange(playerId)
  $: playerId = playerData && playerData.playerId ? playerData.playerId : null;
  $: name = playerData && playerData.name ? playerData.name : null;
  $: ({playerInfo, scoresStats, accStats, accBadges, ssBadges} = processPlayerData(playerData, playerStats))
  $: playerRole = playerInfo?.role ?? null;
  $: calcOnePpBoundary(playerId, isCached);
  $: refreshBeatSaviorState(playerId)
  $: scoresStatsFinal = generateScoresStats(scoresStats, onePpBoundary)
  $: rankChartData = (playerData?.playerInfo.rankHistory ?? []).concat(playerData?.playerInfo.rank)
  $: updateAccSaberPlayerInfo(playerId);

  $: swipeCards = []
    .concat(
      playerId
        ? [
          {
            name: `stats-${playerId}`,
            component: BeatLeaderSwipeCard,
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
                component: MiniRankingSwipeCard,
                props: {player: playerData},
              }]
              : [],
          )
          .concat(
            onePpBoundary
              ?
              [{
                name: `ppcalc-${playerId}`,
                component: PpCalcSwipeCard,
                props: {playerId, worker},
              }]
              : [],
          )
          .concat(
            accSaberCategories && accSaberPlayerInfo && accSaberCategories.length && accSaberPlayerInfo.length
              ?
              [{
                name: `accsaber-${playerId}`,
                component: AccSaberSwipeCard,
                props: {categories: accSaberCategories, playerInfo: accSaberPlayerInfo},
              }]
              : [],
          )
          .concat(
            isBeatSaviorAvailable
              ?
              [{
                name: `beat-savior-${playerId}`,
                component: BeatSaviorSwipeCard,
                props: {playerId},
              }]
              : [],
          )
          .concat(
            $pageContainer.name !== 'xxl' && twitchVideos && twitchVideos.length
              ? [{
                name: `twitch-${playerId}`,
                component: TwitchVideosSwipeCard,
                props: {videos: twitchVideos},
              }]
              : [],
          )
        : [],
    );
</script>

<ContentBox>
  <div class="player-general-info">
    <div class="avatar-cell">
      <Avatar {isLoading} {playerInfo}/>

      {#if playerId && !isLoading}
        <AvatarOverlayIcons {playerId}/>
      {/if}

      {#if playerRole}
        <div class="player-role above-tablet">
          <Badge label={playerRole} onlyLabel={true} fluid={true} bgColor="var(--dimmed)"/>
        </div>
      {/if}
    </div>

    <div class="rank-and-stats-cell">
      <ProfileHeaderInfo {error} {name} {playerInfo} prevInfo={playerGain}/>
      <BeatLeaderSummary {playerId} {scoresStats} {accStats} {accBadges} {skeleton} {isCached} rankHistory={rankChartData} />
    </div>
  </div>
</ContentBox>

<ContentBox>
  <div class="columns">
    <div class="column">
      <Carousel cards={swipeCards} on:player-gain-changed={e => onPlayerGainChanged(e)}/>
    </div>
  </div>
</ContentBox>

<style>
    .player-general-info {
        display: flex;
        flex-wrap: nowrap;
        grid-gap: 1.5em;
    }

    .avatar-cell {
        position: relative;
        width: 150px;
        height: 150px;
    }

    .rank-and-stats-cell {
        display: flex;
        flex-direction: column;
        justify-content: center;
        grid-gap: .4em;
        overflow: hidden;
    }

    .player-role {
        width: 150px;
        padding-top: 1rem;
    }

    @media screen and (max-width: 767px) {
        .player-general-info {
            flex-direction: column;
            align-items: center;
            grid-gap: .4em;
        }

        .rank-and-stats-cell {
            align-items: center;
        }
    }
</style>