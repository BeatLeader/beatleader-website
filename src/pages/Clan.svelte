<script>
    import {navigate} from "svelte-routing";
    import {fly} from 'svelte/transition'
    import createClanStore from '../stores/http/http-clan-store'
    import createAccountStore from '../stores/beatleader/account'
    import createConfigService from '../services/config'
    import {scrollToTargetAdjusted} from '../utils/browser'
    import ssrConfig from '../ssr-config'
    import Pager from '../components/Common/Pager.svelte'
    import Spinner from '../components/Common/Spinner.svelte'
    import ContentBox from "../components/Common/ContentBox.svelte";
    import {opt} from '../utils/js'
    import {debounce} from '../utils/debounce'
    import Value from '../components/Common/Value.svelte'
    import Avatar from '../components/Common/Avatar.svelte'
    import Change from '../components/Common/Change.svelte'
    import Flag from '../components/Common/Flag.svelte'
    import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte'
    import SteamStats from '../components/Common/SteamStats.svelte'
    import { HSVtoRGB } from '../utils/color';
    import ClanInfo from '../components/Clans/ClanInfo.svelte'
    import {PLAYERS_PER_PAGE} from '../utils/beatleader/consts'

    export let clanId;
    export let page = 1;
    export let location;

    const FILTERS_DEBOUNCE_MS = 500;

    document.body.classList.remove('slim');

    const mainPlayerId = createConfigService().getMainPlayerId();

    if (page && !Number.isFinite(page)) page = parseInt(page, 10);
    if (!page || isNaN(page) || page <= 0) page = 1;

    const buildFiltersFromLocation = location => {
      const processString = val => val?.toString() ?? '';

      const params = [
        {key: 'search', default: '', process: processString},
      ];

      const searchParams = new URLSearchParams(location?.search ?? '');

      return params.reduce((cum, param) => ({
        ...cum,
        [param.key]: param.process(searchParams.get(param.key)) ?? param.default
      }), {});
    }
    const buildSearchFromFilters = filters => {
      if (!filters) return '';

      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => searchParams.append(key, value));

      return searchParams.toString();
    }

    let currentPage = page;
    let currentFilters = buildFiltersFromLocation(location);
    let boxEl = null;

    function scrollToTop() {
      if (boxEl) scrollToTargetAdjusted(boxEl, 44)
    }

    const clanStore = createClanStore(clanId, page, currentFilters);

    function changePageAndFilters(clanId, newPage, newLocation) {
      if (!clanId) return;

      currentFilters = buildFiltersFromLocation(newLocation);

      newPage = parseInt(newPage, 10);
      if (isNaN(newPage)) newPage = 1;

      currentPage = newPage;
      clanStore.fetch(clanId, currentPage, {...currentFilters});
    }

    function onPageChanged(event) {
      if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

      navigate(`/clan/${clanId}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
    }

    function navigateToCurrentPageAndFilters() {
      navigate(`/clan/${clanId}/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
    }

    function onCountryClick(player) {
      if (!player) return;

      navigate(`/ranking/${player.playerInfo.countries[0].country}/${Math.floor((player.playerInfo.countries[0].rank - 1) / PLAYERS_PER_PAGE) + 1}?${buildSearchFromFilters(currentFilters)}`)
    }

    function onGlobalClick(player) {
      if (!player) return;

      navigate(`/ranking/global/${Math.floor((player.playerInfo.rank - 1) / PLAYERS_PER_PAGE) + 1}?${buildSearchFromFilters(currentFilters)}`)
    }

    function onSearchChanged(e) {
      currentFilters.search = e.target.value ?? '';
      navigateToCurrentPageAndFilters();
    }
    const debouncedOnSearchChanged = debounce(onSearchChanged, FILTERS_DEBOUNCE_MS);

    const account = createAccountStore();

    $: isLoading = clanStore.isLoading;
    $: pending = clanStore.pending;
    $: numOfItems = $clanStore ? $clanStore?.metadata?.total : null;
    $: itemsPerPage = $clanStore ? $clanStore?.metadata?.itemsPerPage : 10;

    $: changePageAndFilters(clanId, page, location)
    $: scrollToTop($pending);

    $: clan = $clanStore?.container ?? null;
    $: playersPage = ($clanStore?.data ?? [])
  </script>

  <svelte:head>
    <title>{clan?.name ?? ''} / {currentPage} - {ssrConfig.name}</title>
  </svelte:head>

  <section class="align-content">
    <article class="page-content">
      <ContentBox bind:box={boxEl}>
        <ClanInfo {clan}
                  on:removed={() => navigate('/clans?refresh=true')}
                  on:accepted={() => clanStore.refresh()}
                  on:left={() => clanStore.refresh()}
        />

        {#if $isLoading}<Spinner />{/if}

        {#if playersPage?.length}
          <div class="players grid-transition-helper">
            {#each playersPage as player, idx (player.playerId)}
            <div class="ranking-grid-row" in:fly={{delay: idx * 10, x: 100}}>
              <div class={`player-card ${mainPlayerId === player.playerId ? "current" : ""}`} on:click|stopPropagation={() => navigate(`/u/${player.playerId}`)}>
                <div class="player-rank">
                  <div class={`rank ${opt(player, 'playerInfo.rank') === 1 ? 'gold' : (opt(player, 'playerInfo.rank') === 2 ? 'silver' : (opt(player, 'playerInfo.rank') === 3 ? 'brown' : (opt(player, 'playerInfo.rank') >= 10000 ? 'small' : '')))}`} title="Go to global ranking" on:click|stopPropagation={() => onGlobalClick(player)}>
                    #<Value value={opt(player, 'playerInfo.rank')} digits={0} zero="?"/>
                  </div>
                  <div class={`rank ${opt(player, 'playerInfo.countries.0.rank') === 1 ? 'gold' : (opt(player, 'playerInfo.countries.0.rank') === 2 ? 'silver' : (opt(player, 'playerInfo.countries.0.rank') === 3 ? 'brown' : (opt(player, 'playerInfo.countries.0.rank') >= 10000 ? 'small' : '')))}`} title="Go to country ranking" on:click|stopPropagation={() => onCountryClick(player)}>
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
                  <div style="color: {HSVtoRGB(Math.max(0, player.playerInfo.pp - 1000) / 18000, 1.0, 1.0)}">
                    <Value value={opt(player, 'playerInfo.pp')} zero="" suffix="pp"/>
                  </div>
                </div>
              </div>
            </div>
          {/each}
          </div>

          <Pager totalItems={numOfItems} {itemsPerPage} itemsPerPageValues={null}
                 currentPage={currentPage-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
                 mode={numOfItems ? 'pages' : 'simple'}
                 on:page-changed={onPageChanged}
          />
        {:else if (!$isLoading)}
          <p>No clans found.</p>
        {/if}
      </ContentBox>
    </article>
  </section>

  <style>
    .align-content {
        display: flex;
        align-items: flex-start!important;
        justify-content: center!important;
    }

    .page-content {
        max-width: 65em;
        width: 100%;
    }

    article {
        width: calc(100% - 25em);
        overflow-x: hidden;
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

    .players :global(> *:last-child) {
        border-bottom: none !important;
    }

    @media screen and (max-width: 1275px) {
        aside {
            width: 100%;
            max-width: 65em;
        }
    }
  </style>