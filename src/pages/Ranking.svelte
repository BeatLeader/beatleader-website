<script>
  import {getContext} from 'svelte'
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
  import {PLAYERS_PER_PAGE} from '../utils/scoresaber/consts'

  export let type = 'global';
  export let page = 1;

  document.body.classList.add('slim');

  if (page && !Number.isFinite(page)) page = parseInt(page, 10);
  if (!page || isNaN(page) || page <= 0) page = 1;

  const {activeRoute} = getContext(ROUTER);

  let currentType = type;
  let currentPage = page;
  let boxEl = null;

  function navigateToPlayer(playerId) {
    if (!playerId) return;

    navigate(`/u/${playerId}/scoresaber/recent/1`)
  }

  function scrollToTop() {
    if (boxEl) scrollToTargetAdjusted(boxEl, 44)
  }

  const rankingStore = createRankingStore(type, page);

  function changeTypeAndPage(newType, newPage) {
    currentType = newType;

    newPage = parseInt(newPage, 10);
    if (isNaN(newPage)) newPage = 1;

    currentPage = newPage;
    rankingStore.fetch(currentType, currentPage);
  }

  function onPageChanged(event) {
    if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

    navigate(`/ranking/${currentType}/${event.detail.page + 1}`);
  }

  function onPlayerClick(event, player) {
    const target = event.target;
    if (target && target.classList.contains('country')) return;

    if (!player) return;

    navigateToPlayer(player.playerId)
  }

  function onCountryClick(player) {
    if (!player) return;

    navigateToPlayer(player.playerId);
  }

  $: isLoading = rankingStore.isLoading;
  $: pending = rankingStore.pending;
  $: numOfPlayers = $rankingStore ? $rankingStore.total : null;

  $: changeTypeAndPage(type, page)
  $: scrollToTop($pending);
</script>

<svelte:head>
  <title>{type && type.toUpperCase && type !== 'global' ? type.toUpperCase() : 'Global'} ranking / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<article transition:fade>
  <div class="box has-shadow" bind:this={boxEl}>
    <h1 class="title is-5">
      {type && type.toUpperCase && type !== 'global' ? type.toUpperCase() : 'Global'} leaderboard

      {#if $isLoading}<Spinner />{/if}
    </h1>

    {#if $rankingStore && $rankingStore.data && $rankingStore.data.length}
      <section class="ranking-grid">
        {#each $rankingStore.data as player, idx (player.playerId)}
          <div class="player-card" on:click={e => onPlayerClick(e, player)} in:fly={{delay: idx * 10, x: 100}}>
            <div class="player-avatar">
              <Avatar {player}/>
            </div>
            <div class="player-name-and-rank">
              <PlayerNameWithFlag {player} on:flag-click={e => onCountryClick(player)}/>
                
                <div class="player-countryglobal-rank">
                {#if player.playerId > 70000000000000000}
                  <SteamStats playerId={player.playerId}/>
                {/if}
                <div class={`rank ${opt(player, 'playerInfo.countries.0.rank') === 1 ? 'gold' : (opt(player, 'playerInfo.countries.0.rank') === 2 ? 'silver' : (opt(player, 'playerInfo.countries.0.rank') === 3 ? 'brown' : (opt(player, 'playerInfo.countries.0.rank') >= 10000 ? 'small' : '')))}`}>
                  #<Value value={opt(player, 'playerInfo.countries.0.rank')} digits={0} zero="?"/>
                  <Flag country={opt(player, 'playerInfo.countries.0.country')} on:flag-click={e => onCountryClick(player)} />
                </div>
                
              <div class={`rank ${opt(player, 'playerInfo.rank') === 1 ? 'gold' : (opt(player, 'playerInfo.rank') === 2 ? 'silver' : (opt(player, 'playerInfo.rank') === 3 ? 'brown' : (opt(player, 'playerInfo.rank') >= 10000 ? 'small' : '')))}`}>
                #<Value value={opt(player, 'playerInfo.rank')} digits={0} zero="?"/>
              </div>
            </div>
            </div>

            <div class="player-pp-and-change">
              <Value value={opt(player, 'playerInfo.pp')} zero="" suffix="pp"/>
              <span class="change">
                <Change value={opt(player, 'others.difference')} digits={0}/>
              </span>
            </div>
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
  </div>
</article>

<style>
    .ranking-grid {
        display: grid;
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

    .player-card .player-avatar {
        grid-column: 1 / 2;
        grid-row: 1 / span 2;
        position: relative;
        overflow: hidden;
    }

    .player-card .player-avatar :global(figure) {
        width: 4em;
        height: 4em;
    }

    .player-card .player-name-and-rank :global(.rank) {
        padding: 0 .25em;
        font-size: 1em;
        font-weight: 500;
        background-color: var(--dimmed);
        border-radius: 3px;
        margin-left: .25em;
    }

    .player-card .player-name-and-rank {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1.1em;
        font-weight: 500;
    }

    .player-card .player-countryglobal-rank {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
    }

    .player-card .player-name-and-rank :global(.rank.small) {
        font-size: .875em;
    }

    .player-card .player-name-and-rank :global(.rank.gold) {
        font-size: 1.1em;
        background-color: darkgoldenrod;
    }

    .player-card .player-name-and-rank :global(.rank.silver) {
        font-size: 1.1em;
        background-color: #888;
    }

    .player-card .player-name-and-rank :global(.rank.brown) {
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