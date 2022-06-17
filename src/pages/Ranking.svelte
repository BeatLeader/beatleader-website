<script>
  import {afterUpdate, getContext} from 'svelte'
  import {navigate} from "svelte-routing";
  import {ROUTER} from 'svelte-routing/src/contexts'
  import {fade, fly} from 'svelte/transition'
  import createRankingStore from '../stores/http/http-ranking-store'
  import {scrollToTargetAdjusted} from '../utils/browser'
  import ssrConfig from '../ssr-config'
  import Pager from '../components/Common/Pager.svelte'
  import Spinner from '../components/Common/Spinner.svelte'
  import {PLAYERS_PER_PAGE} from '../utils/beatleader/consts'
  import createConfigService from '../services/config'
  import ContentBox from "../components/Common/ContentBox.svelte";
  import PlayerCard from "../components/Ranking/PlayerCard.svelte";
  import AddFriendButton from "../components/Player/AddFriendButton.svelte";
  import stringify from 'json-stable-stringify'
  import {createBuildFiltersFromLocation, buildSearchFromFilters, processFloatFilter, processStringFilter,} from '../utils/filters'

  export let type = 'global';
  export let page = 1;

  const params = [
    {key: 'search', default: '', process: processStringFilter},
    {key: 'sortBy', default: '', process: processStringFilter},
  ];

  const buildFiltersFromLocation = createBuildFiltersFromLocation(
    params,
    filters => {
      return filters;
    }
  );

  document.body.classList.add('slim');

  if (page && !Number.isFinite(page)) page = parseInt(page, 10);
  if (!page || isNaN(page) || page <= 0) page = 1;

  const {activeRoute} = getContext(ROUTER);
  const mainPlayerId = createConfigService().getMainPlayerId();

  let currentType = type;
  let currentPage = page;
  let currentFilters = buildFiltersFromLocation(location);
  let lastFilters = buildFiltersFromLocation(location);
  let boxEl = null;

  function scrollToTop() {
    if (boxEl) scrollToTargetAdjusted(boxEl, 44)
  }

  if (!currentFilters.sortBy.length) {
      currentFilters.sortBy = 'pp';
      lastFilters.sortBy = 'pp';
    }

  const rankingStore = createRankingStore(type, page, currentFilters);

  function changeParams(newType, newPage, newLocation) {
    currentType = newType;
    currentFilters = buildFiltersFromLocation(newLocation);
    lastFilters = buildFiltersFromLocation(newLocation);
    if (!currentFilters.sortBy.length) {
      currentFilters.sortBy = 'pp';
      lastFilters.sortBy = 'pp';
    }
    newPage = parseInt(newPage, 10);
    if (isNaN(newPage)) newPage = 1;

    currentPage = newPage;
    rankingStore.fetch(currentType, currentPage, {...currentFilters}, true);
  }

  function onPageChanged(event) {
    if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

    navigate(`/ranking/${currentType}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
  }

  function navigateToCurrentPageAndFilters() {
    navigate(`/ranking/${currentType}/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
  }

  function toggleSortBy() {
    if (currentFilters.sortBy == "dailyImprovements") {
      currentFilters.sortBy = "pp";
    } else {
      currentFilters.sortBy = "dailyImprovements";
    }
    navigateToCurrentPageAndFilters();
  }

  let showDetails = false;

  afterUpdate(() => {
    if (stringify(lastFilters) !== stringify(currentFilters)) {
      changeParams(type, page, location);
    }
  });

  $: isLoading = rankingStore.isLoading;
  $: pending = rankingStore.pending;
  $: numOfPlayers = $rankingStore ? $rankingStore.total : null;

  $: changeParams(type, page, location)
  $: scrollToTop($pending);
</script>

<svelte:head>
  <title>{type && type.toUpperCase && type !== 'global' ? type.toUpperCase() : 'Global'} ranking / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
  <article class="page-content" transition:fade>
    <ContentBox bind:box={boxEl}>
      <h1 class="title is-5">
        {type && type.toUpperCase && type !== 'global' ? type.toUpperCase() : 'Global'} leaderboard

        {#if $isLoading}<Spinner />{/if}
      </h1>

      {#await mainPlayerId}
        Loading...
      {:then playerId}
      {#if $rankingStore && $rankingStore.data && $rankingStore.data.length}
        <div class={currentFilters.sortBy == "dailyImprovements" ? "fas fa-lightbulb icon dailyImprovements" : "far fa-lightbulb icon off pp"}
        on:click={() => toggleSortBy()}
        title={"Sort by amount of recycled scores"}>
        <span class="sortBy">Sort by {currentFilters.sortBy == "dailyImprovements" ? "savings" : "pp"}</span>
        
        </div>
        <section class="ranking-grid">
          {#each $rankingStore.data as player, idx (player.playerId)}
            <div class="ranking-grid-row" in:fly={{delay: idx * 10, x: 100}}>
              <PlayerCard player={player} playerId={playerId} currentFilters={currentFilters} />
              <AddFriendButton playerId={player.playerId}/>
            </div>
          {/each}
        </section>

        <Pager totalItems={numOfPlayers} itemsPerPage={PLAYERS_PER_PAGE} itemsPerPageValues={null}
              currentPage={currentPage-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
              mode={numOfPlayers ? 'pages' : 'simple'}
              on:page-changed={onPageChanged}
        />
      {:else if (!$isLoading)}
        <p>No players found.</p>
      {/if}
      {/await}
    </ContentBox>
  </article>
</section>

<style>
    .align-content {
        display: flex;
        justify-content: center;
    }

    .page-content {
        max-width: 65em;
        width: 100%;
    }

    .ranking-grid {
        display: grid;
        grid-gap: .75em;
    }

    .ranking-grid-row {
        display: grid;
        grid-template-columns: auto 2.4em;
        grid-gap: .4em;
        align-items: center;
        justify-items: center;
    }

    .icon {
        display: flex;
        width: 9.5em;
        height: 2.5em;
        color: white;
        border-radius: .4em;
        margin-bottom: 1em;
    }

    .icon.off {
      color: #ffffffe1;
    }

    .icon.pp {
        background: var(--faded);
    }

    .icon.pp:hover {
        background: var(--faded) linear-gradient(0deg, transparent, #ffffff66);
    }

    .icon.dailyImprovements {
        background: green;
        cursor: pointer;
    }

    .icon.dailyImprovements:hover {
        background: green linear-gradient(0deg, transparent, #ffffff66);
    }

    .sortBy {
      margin-left: 0.5em;
      font-weight: normal;
      font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
    }

    @media screen and (max-width: 500px) {
        .ranking-grid {
            grid-template-columns: 1fr;
        }
    }
</style>