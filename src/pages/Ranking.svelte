<script>
  import {afterUpdate, getContext} from 'svelte'
  import {navigate} from "svelte-routing";
  import {ROUTER} from 'svelte-routing/src/contexts'
  import {fade, fly} from 'svelte/transition'
  import createRankingStore from '../stores/http/http-ranking-store'
  import {opt} from '../utils/js'
  import {scrollToTargetAdjusted} from '../utils/browser'
  import ssrConfig from '../ssr-config'
  import Value from '../components/Common/Value.svelte'
  import Avatar from '../components/Common/Avatar.svelte'
  import Change from '../components/Common/Change.svelte'
  import Flag from '../components/Common/Flag.svelte'
  import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte'
  import SteamStats from '../components/Common/SteamStats.svelte'
  import Pager from '../components/Common/Pager.svelte'
  import Spinner from '../components/Common/Spinner.svelte'
  import {PLAYERS_PER_PAGE} from '../utils/beatleader/consts'
  import createConfigService from '../services/config'
  import { HSVtoRGB } from '../utils/color';
  import ContentBox from "../components/Common/ContentBox.svelte";
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

  function navigateToPlayer(playerId) {
    if (!playerId) return;

    navigate(`/u/${playerId}/beatleader/date/1`)
  }

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

  function onPlayerClick(event, player) {
    const target = event.target;
    if (target && (target.classList.contains('rank') || target.classList.contains('country') || target.classList.contains('sharp') || target.classList.contains('value'))) return;

    if (!player) return;

    navigateToPlayer(player.playerId)
  }

  function onCountryClick(player) {
    if (!player) return;

    navigate(`/ranking/${player.playerInfo.countries[0].country}/${Math.floor((player.playerInfo.countries[0].rank - 1) / PLAYERS_PER_PAGE) + 1}?${buildSearchFromFilters(currentFilters)}`)
  }

  function onGlobalClick(player) {
    if (!player) return;

    navigate(`/ranking/global/${Math.floor((player.playerInfo.rank - 1) / PLAYERS_PER_PAGE) + 1}?${buildSearchFromFilters(currentFilters)}`)
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
      <div class="banner">
        <img src="/assets/EarthDay.png" alt="Earth day banner">
        
      </div>
      <div class="show-details clickable" on:click={() => showDetails = !showDetails}>
        <span class="reveal-title">
          {showDetails ? "Hide details" : "Show details"}
        </span>
        
        <span class="details-reveal" class:opened={showDetails} title="Show details">
              
          <i class="fas fa-chevron-down"></i>
        </span>
      </div>

      {#if showDetails}
      <div class="details">
        <span >
          <b>We in BeatLeader believe that PP growth should be sustainable.</b><br>
          And to cut machine time and space on cloud and database we endorse you to recycle the scores. 
          Improve your old(one day or older) scores and climb this leaderboard. Top 1 on 12pm UTC 4/23/22 will get the "Earth's bff" badge!
        <br><br> Jokes aside, today is Earth Day and it's important. 
        We kinda don't have another place to live for now and it also means the place to play Beat Saber.
        It's just a reminder for us that we are very fragile and our current problems can be meaningless in face of climate changes
        (how much pp will you need if the wildfire will burn your house)
        
        <br>
        <br>Check the <a href="https://github.com/zeph-yr/OurFuture">amazing article from @zeph-yr</a> to learn more and help make <b>our home better.</b></span>
        <br>And support <a href="https://www.portmone.com.ua/r3/support-ukrainian-army">the Ukrainian army.</a> Burning cities do not help the planet!
      </div>
      {/if}
      
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
              <div class={`player-card ${playerId == player.playerId ? "current" : ""}`} on:click={e => onPlayerClick(e, player)}>
                <div class="player-rank">
                  <div class={`rank ${opt(player, 'playerInfo.rank') === 1 ? 'gold' : (opt(player, 'playerInfo.rank') === 2 ? 'silver' : (opt(player, 'playerInfo.rank') === 3 ? 'brown' : (opt(player, 'playerInfo.rank') >= 10000 ? 'small' : '')))}`} title="Go to global ranking" on:click={e => onGlobalClick(player)}>
                    #<Value value={opt(player, 'playerInfo.rank')} digits={0} zero="?"/>
                  </div>
                  <div class={`rank ${opt(player, 'playerInfo.countries.0.rank') === 1 ? 'gold' : (opt(player, 'playerInfo.countries.0.rank') === 2 ? 'silver' : (opt(player, 'playerInfo.countries.0.rank') === 3 ? 'brown' : (opt(player, 'playerInfo.countries.0.rank') >= 10000 ? 'small' : '')))}`} title="Go to country ranking" on:click={e => onCountryClick(player)}>
                    #<Value value={opt(player, 'playerInfo.countries.0.rank')} digits={0} zero="?"/>
                    <Flag country={opt(player, 'playerInfo.countries.0.country')} />
                  </div>
                </div>
                <div class="player-avatar">
                  <Avatar {player}/>
                </div>
                <div class="player-name-and-rank">
                  <PlayerNameWithFlag {player} hideFlag={true}/>
                  <span class="change">
                  {#if opt(player, 'others.difference') > 900000}
                    <span style="margin-left: 0.5em" class="inc" title="This player appeared after a long break.">resurrected</span>
                  {:else}
                    <Change value={opt(player, 'others.difference')} digits={0}/>
                  {/if}
                </span>
                </div>
                <div class="steam-and-pp">
                  {#if player.playerId > 70000000000000000}
                    <SteamStats {player}/>
                  {/if}
                  {#if currentFilters.sortBy == "dailyImprovements"}<div style="color: {HSVtoRGB(player.others.improvement / 20, 1.0, 1.0)}">
                    <Value value={opt(player, 'others.improvement')} zero="Carbon positive" suffix={opt(player, 'others.improvement') == 1 ? " score" : " scores"} digits=0/>
                  </div>
                  {:else}
                  <div style="color: {HSVtoRGB(Math.max(0, player.playerInfo.pp - 1000) / 18000, 1.0, 1.0)}">
                    <Value value={opt(player, 'playerInfo.pp')} zero="" suffix="pp"/>
                  </div>
                  {/if}
                  
                </div>
              </div>
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

    .player-card {
        display: inline-grid;
        grid-template-columns: 7.5em 4em auto 1fr;
        grid-template-rows: 1fr;
        padding: .2em;
        border: 2px solid var(--dimmed);
        border-radius: 8px;
        background-color: var(--background);
        cursor: pointer;
        font-size: 1.12em;
        align-items: center;
        width: 100%;
    }

    .current {
      border-color: yellow;
    }

    .player-card:hover {
        background-color: var(--faded);
    }

    .player-card .player-avatar {
        position: relative;
        overflow: hidden;
    }

    .player-card .player-avatar :global(figure) {
        width: 2em;
        height: 2em;
        margin-left: 1em;
    }

    .player-card :global(.rank) {
        padding: 0 .25em;
        font-size: 0.8em;
        font-weight: 500;
        background-color: var(--dimmed);
        border-radius: 3px;
        margin-left: .25em;
        cursor: pointer;
    }

    .player-card .player-name-and-rank {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        font-size: 1.1em;
        font-weight: 500;
    }

    .player-card .steam-and-pp {
        display: flex;
        justify-content: end;
        align-items: center;
        font-size: 0.8em;
        font-weight: 500;
        margin-right: .25em;
    }

    .player-card .player-countryglobal-rank {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .player-card :global(.rank.small) {
        font-size: .875em;
    }

    .player-card :global(.rank.gold) {
        background-color: darkgoldenrod;
    }

    .player-card :global(.rank.silver) {
        background-color: #888;
    }

    .player-card :global(.rank.brown) {
        background-color: saddlebrown;
    }

    .player-card .player-rank {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1.1em;
        font-weight: 500;
    }

    .player-card .change {
        font-size: .875em;
    }

    .banner {
      display: flex;
      justify-content: center;
      margin-bottom: 1em;
    }

    .show-details {
      display: flex;
      justify-content: center;
      margin-bottom: 1em;
    }

    .details {
      margin: 1em;
    }

    .clickable {
      cursor: pointer;
    }

    .reveal-title {
      margin-right: 0.5em;
      margin-bottom: -0.2em;
    }

    .details-reveal.opened {
        transform: rotateZ(180deg);
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

    @media screen and (max-width: 768px) {
        .player-card {
          grid-template-columns: 50% 50%;
          grid-template-rows: 1fr 1fr;
        }

        .player-card .player-avatar {
          grid-column: 1 / 2;
          grid-row: 1;
          margin-left: -0.8em;
        }

        .player-card .player-name-and-rank {
          grid-column: 1 / 3;
          margin-left: 2.5em;
          grid-row: 1;
        }

        .player-card .player-name-and-rank :global(a) {
          white-space: unset;
          overflow-wrap: break-word;
        }

        .player-card .player-rank {
          grid-column: 1;
          grid-row: 2;
          justify-content: flex-start;
          font-size: 0.8em;
        }

        .player-card .steam-and-pp {
          grid-column: 2;
          grid-row: 2;
        }

        .player-card :global(.rank) {
          font-size: 1em;
        }
    }
</style>