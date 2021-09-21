<script>
  import {onMount, tick, getContext} from 'svelte'
  import processPlayerData from './utils/profile';
  import eventBus from '../../utils/broadcast-channel-pubsub'
  import {worker} from '../../utils/worker-wrappers'
  import {Swipe, SwipeItem} from "svelte-swipe";
  import {opt} from '../../utils/js'
  import Avatar from './Avatar.svelte'
  import PlayerStats from './PlayerStats.svelte'
  import Icons from './Icons.svelte'
  import ScoreSaberStats from './ProfileCards/ScoreSaberStats.svelte'
  import MiniRanking from './ProfileCards/MiniRanking.svelte'
  import TwitchVideos from './ProfileCards/TwitchVideos.svelte'

  export let playerData;
  export let isLoading = false;
  export let error = null;
  export let skeleton = false;
  export let twitchVideos = null;

  const pageContainer = getContext('pageContainer');

  let playerStats = null;
  eventBus.on('player-stats-calculated', stats => playerStats = stats)

  let onePpBoundery = null;

  let swipeComponent = null;
  let swipeHolderHeight = 0;
  let activeSwipeItem = null;

  function onHeightChanged({detail}) {
    swipeHolderHeight = detail.height + 32;
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

  let shouldRefreshHeight = true;

  async function forceRefreshHeight(noResizeEvent = false) {
    if (swipeComponent) swipeComponent.goTo(0);

    shouldRefreshHeight = false;
    await tick();
    shouldRefreshHeight = true;

    // swipe component bug workaround on small screens
    if (!noResizeEvent) window.dispatchEvent(new Event('resize'));
  }

  onMount(() => {
    const callForceRefreshHeight = () => forceRefreshHeight(true);

    window.addEventListener('resize', callForceRefreshHeight);

    return () => {
      window.removeEventListener('resize', callForceRefreshHeight)
    }
  })

  $: isCached = !!(playerData && playerData.scoresLastUpdated)
  $: clearPlayerStatsOnChange(playerId)
  $: playerId = playerData && playerData.playerId ? playerData.playerId : null;
  $: name = playerData && playerData.name ? playerData.name : null;
  $: ({playerInfo, prevInfo, scoresStats, accStats, accBadges, ssBadges} = processPlayerData(playerData, playerStats))
  $: (scoresStats, accStats, accBadges, ssBadges, forceRefreshHeight(), setTimeout(() => forceRefreshHeight(), 600))
  $: calcOnePpBoundary(playerId);
  $: scoresStatsFinal = generateScoresStats(scoresStats, onePpBoundery)

  $: swipeCards = [
    {
      component: ScoreSaberStats,
      props: {scoresStats: scoresStatsFinal, accStats, accBadges, ssBadges, isCached, skeleton},
    },
  ]
    .concat(
      $pageContainer.name !== 'xxl'
        ? [{
          component: MiniRanking,
          props: {playerInfo: opt(playerData, 'playerInfo')},
        }]
        : [],
    )
    .concat(
      $pageContainer.name !== 'xxl' && twitchVideos && twitchVideos.length
        ? [{
          component: TwitchVideos,
          props: {videos: twitchVideos},
        }]
        : []
    )

  $: swipeConfig = {
    autoplay: false,
    delay: 5000,
    showIndicators: swipeCards.length > 1,
    transitionDuration: 300,
    defaultIndex: 0,
  }

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

      <div class="swipe-container"  style="height:{swipeHolderHeight}px">
        {#key swipeCards ? playerId + swipeCards.length : 0}
        <Swipe bind:this={swipeComponent} bind:active_item={activeSwipeItem} {...swipeConfig}>
          {#each swipeCards as card, cardIdx (card.component)}
            <SwipeItem
              active={activeSwipeItem === cardIdx && (cardIdx !== 0 || shouldRefreshHeight)}
              allow_dynamic_height={true}
              on:swipe_item_height_change={onHeightChanged}>
              <svelte:component this={card.component} {...card.props} />
            </SwipeItem>
          {/each}
        </Swipe>
        {/key}
      </div>
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

    .swipe-container {
        min-height: 120px;
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