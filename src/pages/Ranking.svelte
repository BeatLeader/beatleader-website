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
  import createConfigService from '../services/config'
  import { HSVtoRGB } from '../utils/color';

  export let type = 'global';
  export let page = 1;

  document.body.classList.add('slim');

  if (page && !Number.isFinite(page)) page = parseInt(page, 10);
  if (!page || isNaN(page) || page <= 0) page = 1;

  const {activeRoute} = getContext(ROUTER);
  const mainPlayerId = createConfigService().getMainPlayerId();

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
    if (target && (target.classList.contains('rank') || target.classList.contains('country') || target.classList.contains('sharp') || target.classList.contains('value'))) return;

    if (!player) return;

    navigateToPlayer(player.playerId)
  }

  function onCountryClick(player) {
    if (!player) return;

    navigate(`/ranking/${player.playerInfo.countries[0].country}/${Math.floor((player.playerInfo.countries[0].rank - 1) / PLAYERS_PER_PAGE) + 1}`)
  }

  function onGlobalClick(player) {
    if (!player) return;

    navigate(`/ranking/global/${Math.floor((player.playerInfo.rank - 1) / PLAYERS_PER_PAGE) + 1}`)
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

<section class="align-content">
  <article class="page-content" transition:fade>
    <div class="box has-shadow" bind:this={boxEl}>
      <h1 class="title is-5">
        {type && type.toUpperCase && type !== 'global' ? type.toUpperCase() : 'Global'} leaderboard

        {#if $isLoading}<Spinner />{/if}
      </h1>

      {#await mainPlayerId}
        Loading...
      {:then playerId} 
      {#if $rankingStore && $rankingStore.data && $rankingStore.data.length}
        <section class="ranking-grid">
          {#each $rankingStore.data as player, idx (player.playerId)}
            <div class={`player-card ${playerId == player.playerId ? "current" : ""}`} on:click={e => onPlayerClick(e, player)} in:fly={{delay: idx * 10, x: 100}}>
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
                    <span style="margin-left: 0.5em" class="inc" title="This player appeared after a long break.">ressurected</span>
                  {:else}
                    <Change value={opt(player, 'others.difference')} digits={0}/>
                  {/if}
                </span>
              </div>
              <div class="steam-and-pp">
                {#if player.playerId > 70000000000000000}
                  <SteamStats playerId={player.playerId}/>
                {/if}
                <div style="color: {HSVtoRGB(Math.max(0, player.playerInfo.pp - 1000) / 18000, 1.0, 1.0)}">
                  <Value value={opt(player, 'playerInfo.pp')} zero="" suffix="pp"/>
                </div>
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
      {/await}
    </div>
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

    .player-card {
        display: inline-grid;
        grid-template-columns: 7.5em 4em auto 1fr;
        grid-template-rows: 1fr;
        max-width: 100%;
        padding: .2em;
        border: 2px solid var(--dimmed);
        border-radius: 8px;
        background-color: var(--background);
        cursor: pointer;
        font-size: 1.12em;
        align-items: center;
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