<script>
  import {getContext} from 'svelte'
  import processPlayerData from './utils/profile';
  import {worker} from '../../utils/worker-wrappers'
  import {BL_CDN} from '../../network/queues/beatleader/page-queue'
  import createBeatSaviorService from '../../services/beatsavior'
  import createAccSaberService from '../../services/accsaber'
  import createAccountStore from '../../stores/beatleader/account'
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
  import Error from '../Common/Error.svelte'

  export let playerData;
  export let isLoading = false;
  export let error = null;
  export let skeleton = false;
  export let twitchVideos = null;
  export let avatarHash = null;

  const pageContainer = getContext('pageContainer');

  const beatSaviorService = createBeatSaviorService();
  const accSaberService = createAccSaberService();
  const account = createAccountStore();

  let accSaberPlayerInfo = null;
  let accSaberCategories = null;

  let onePpBoundary = null;

  let isBeatSaviorAvailable = false;

  async function refreshBeatSaviorState(playerId) {
    if (!playerId) return;

    isBeatSaviorAvailable = await beatSaviorService.isDataForPlayerAvailable(playerId)
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

  async function updateAccSaberPlayerInfo(playerId) {
    if (!playerId) return;

    accSaberPlayerInfo = await accSaberService.getPlayer(playerId);
    accSaberCategories = await accSaberService.getCategories();
  }

  let editError = null;
  function onPlayerDataEditError(err) {
    editError = err?.detail ?? null;
  }

  let roleIcon = null;
  let roleDescription = null;
  function updateRoleIcon(role) {
    if (role) {
      if (role.includes("tipper")) {
        roleIcon = BL_CDN + "/assets/patreon1.png";
        roleDescription = "Tier 1 Patreon supporter."
      } else if (role.includes("supporter")) {
        roleIcon = BL_CDN + "/assets/patreon2.png";
        roleDescription = "Tier 2 Patreon supporter."
      } else if (role.includes("sponsor")) {
        roleIcon = BL_CDN + "/assets/patreon3.png";
        roleDescription = "Highest tier Patreon supporter. Crypto godge"
    }
    } else {
      roleIcon = null;
    }
  }

  $: isCached = !!(playerData && playerData.scoresLastUpdated);
  $: playerId = playerData && playerData.playerId ? playerData.playerId : null;
  $: statsHistory = playerData?.statsHistory ?? null;
  $: name = playerData && playerData.name ? playerData.name : null;
  $: ({playerInfo, scoresStats, accStats, accBadges, ssBadges} = processPlayerData(playerData))
  $: updateRoleIcon(playerInfo?.role ?? null);
  $: calcOnePpBoundary(playerId, isCached);
  $: refreshBeatSaviorState(playerId);
  $: scoresStatsFinal = generateScoresStats(scoresStats, onePpBoundary);
  $: rankChartData = (playerData?.playerInfo.rankHistory ?? []).concat(playerData?.playerInfo.rank);
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
              ssBadges,
              statsHistory,
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
      <Avatar {isLoading} {playerInfo} hash={avatarHash} />

      {#if playerId && !isLoading}
        <AvatarOverlayIcons {playerId} on:player-data-updated on:player-data-edit-error={onPlayerDataEditError} />
      {/if}

      {#if roleIcon}
        <div class="player-role">
          <img class="role-icon" src={roleIcon} title={roleDescription} alt="Role icon"/>
        </div>
      {/if}
    </div>

    <div class="rank-and-stats-cell">
      {#if editError}
        <Error error={editError} />
      {/if}

      <ProfileHeaderInfo {error} {name} {playerInfo} {playerId} {statsHistory} on:player-data-updated on:player-data-edit-error={onPlayerDataEditError} />
      <BeatLeaderSummary {playerId} {scoresStats} {accBadges} {skeleton} />
      {#if $account.error}
        {$account.error}
      {/if}
    </div>
  </div>
</ContentBox>

<ContentBox>
  <div class="columns">
    <div class="column">
      <Carousel cards={swipeCards} />
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
        min-width: 150px;
        height: 150px;
    }

    .rank-and-stats-cell {
        display: flex;
        flex-direction: column;
        justify-content: center;
        grid-gap: .4em;
    }

    .player-role {
        width: 100px;
        padding-top: 7rem;
        padding-left: 5rem;
    }

    .role-icon {
      z-index: 5;
      position: absolute;
      width: 60%;
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