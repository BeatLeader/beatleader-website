<script>
  import {getContext} from 'svelte'
  import {navigate} from "svelte-routing";
  import {ROUTER} from 'svelte-routing/src/contexts'
  import {fade, fly} from 'svelte/transition'
  import createLeaderboardStore from '../stores/http/http-leaderboard-store'
  import {opt} from '../utils/js'
  import eventBus from '../utils/broadcast-channel-pubsub'
  import {scrollToTargetAdjusted} from '../utils/browser'
  import config from '../config'
  import Value from '../components/Common/Value.svelte'
  import Avatar from '../components/Common/Avatar.svelte'
  import Change from '../components/Common/Change.svelte'
  import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte'
  import Pager from '../components/Common/Pager.svelte'
  import Spinner from '../components/Common/Spinner.svelte'
  import {LEADERBOARD_SCORES_PER_PAGE} from '../utils/scoresaber/consts'

  export let leaderboardId;
  export let type = 'global';
  export let page = 1;

  if (page && !Number.isFinite(page)) page = parseInt(page, 10);
  if (!page || isNaN(page) || page <= 0) page = 1;

  const {activeRoute} = getContext(ROUTER);

  let currentLeaderboardId = leaderboardId;
  let currentType = type;
  let currentPage = page;
  let boxEl = null;

  function navigateToPlayer(playerId) {
    if (!playerId) return;

    if (!$activeRoute || !$activeRoute.uri || !$activeRoute.uri.startsWith('/u/')) {
      navigate(`/u/${playerId}`)
    } else {
      eventBus.publish('navigate-to-player-cmd', playerId)
    }
  }

  function scrollToTop() {
    if (boxEl) scrollToTargetAdjusted(boxEl, 44)
  }

  const leaderboardStore = createLeaderboardStore(leaderboardId, type, page);

  function changeParams(newLeaderboardId, newType, newPage) {
    currentLeaderboardId = newLeaderboardId;
    currentType = newType;

    newPage = parseInt(newPage, 10);
    if (isNaN(newPage)) newPage = 1;

    currentPage = newPage;
    leaderboardStore.fetch(currentLeaderboardId, currentType, currentPage);
  }

  function onPageChanged(event) {
    if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

    navigate(`/leaderboard/${currentType}/${currentLeaderboardId}/${event.detail.page + 1}`);
  }

  function onPlayerClick(event, player) {
    navigateToPlayer(player.playerId)
  }

  $: isLoading = leaderboardStore.isLoading;
  $: pending = leaderboardStore.pending;

  $: changeParams(leaderboardId, type, page)
  $: scrollToTop($pending);
  $: scores = opt($leaderboardStore, 'scores', null)

  $: console.log($leaderboardStore)
  $: console.log($isLoading)
</script>

<svelte:head>
  <title>Leaderboard - {config.name}</title>
</svelte:head>

<article transition:fade>
  <div class="box has-shadow" bind:this={boxEl}>
    {#if $isLoading}
      <Spinner/>
    {/if}

    {#if $leaderboardStore}
      {JSON.stringify($leaderboardStore.diffs)}
      <hr/>
      {JSON.stringify($leaderboardStore.leaderboard)}
      {JSON.stringify($leaderboardStore.stats)}
      <hr style="background-color:red"/>

      {#if scores && scores.length}
        {#each scores as score}
          {JSON.stringify(score)}
          <hr />
        {/each}
      {/if}

      <hr style="background-color: red"/>
      page={$leaderboardStore.page}, totalItems={$leaderboardStore.totalItems}
    {:else if (!$isLoading)}
      <p>Leaderboard not found</p>
    {/if}
  </div>
</article>

<style>
    .ranking-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(18em, 1fr));
        grid-gap: .75em;
    }

    .player-card {
        display: inline-grid;
        grid-template-columns: 5.25em 1fr;
        grid-template-rows: 1fr 1fr;
        max-width: 100%;
        padding: .5em;
        border: 1px solid var(--dimmed);
        border-radius: 4px;
        background-color: var(--background);
        cursor: pointer;
    }

    .player-card:hover {
        background-color: var(--faded);
    }

    .player-card .player-and-rank {
        grid-column-start: 1;
        grid-column-end: 1;
        grid-row-start: 1;
        grid-row-end: span 2;
        position: relative;
        overflow: hidden;
    }

    .player-card .player-and-rank :global(figure) {
        width: 4em;
        height: 4em;
    }

    .player-card .player-and-rank :global(.rank) {
        position: absolute;
        bottom: .5em;
        right: .75em;
        padding: 0 .25em;
        font-size: 1em;
        font-weight: 500;
        background-color: var(--dimmed);
        border-radius: 3px;
    }

    .player-card .player-and-rank :global(.rank.small) {
        font-size: .875em;
    }

    .player-card .player-and-rank :global(.rank.gold) {
        font-size: 1.1em;
        background-color: darkgoldenrod;
    }

    .player-card .player-and-rank :global(.rank.silver) {
        font-size: 1.1em;
        background-color: #888;
    }

    .player-card .player-and-rank :global(.rank.brown) {
        font-size: 1.1em;
        background-color: saddlebrown;
    }

    .player-card .player-pp-and-change {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1.1em;
        font-weight: 500;
        color: var(--ppColour);
    }

    .player-card .change {
        font-size: .875em;
    }

    @media screen and (max-width: 500px) {
        .ranking-grid {
            grid-template-columns: 1fr;
        }
    }
</style>