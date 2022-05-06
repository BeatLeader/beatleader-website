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
    import Button from "../components/Common/Button.svelte";
    import {debounce} from '../utils/debounce'
    import Value from '../components/Common/Value.svelte'
    import Avatar from '../components/Common/Avatar.svelte'
    import Change from '../components/Common/Change.svelte'
    import Flag from '../components/Common/Flag.svelte'
    import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte'
    import SteamStats from '../components/Common/SteamStats.svelte'
    import { HSVtoRGB } from '../utils/color';
    
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
      const processFloat = val => {
        val = parseFloat(val);
        if (isNaN(val)) return null;
  
        return val < 0 ? 0 : val;
      }
  
      const params = [
        {key: 'search', default: '', process: processString},,
      ];
  
      const searchParams = new URLSearchParams(location?.search ?? '');
  
      const filters = params.reduce((cum, param) => ({
        ...cum,
        [param.key]: param.process(searchParams.get(param.key)) ?? param.default
      }), {});
  
      return filters;
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
  
    function changePageAndFilters(newPage, newLocation) {
      currentFilters = buildFiltersFromLocation(newLocation);
  
      newPage = parseInt(newPage, 10);
      if (isNaN(newPage)) newPage = 1;
  
      currentPage = newPage;
      clanStore.fetch(currentPage, {...currentFilters});
    }
  
    function onPageChanged(event) {
      if (event.detail.initial || !Number.isFinite(event.detail.page)) return;
  
      navigate(`/clan/${clanId}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
    }
  
    function navigateToCurrentPageAndFilters() {
      navigate(`/clan/${clanId}/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
    }
  
    function onSearchChanged(e) {
      currentFilters.search = e.target.value ?? '';
      navigateToCurrentPageAndFilters();
    }
    const debouncedOnSearchChanged = debounce(onSearchChanged, FILTERS_DEBOUNCE_MS);

    let fileinput;
    const changeImage = (e) => {
        let image = e.target.files[0];
        let reader = new FileReader();
        reader.readAsArrayBuffer(image);
        reader.onload = e => {
            clan.icon = e.target.result;
            //store.set($store);
        };
    }

    const changeColor = (e) => {
        clan.color = e.value;
    }

    let titleInput;
    let redactingTitle = false;
    function onRedactTitleButtonClick() {
        if (redactingTitle && titleInput.value) {
            clan.name = titleInput.value;
            //store.set($store);
        }
        redactingTitle = !redactingTitle;
    }

    let tagInput;
    let redactingTag = false;
    function onRedactTagButtonClick() {
        if (redactingTag && tagInput.value) {
            clan.tag = tagInput.value;
            //store.set($store);
        }
        redactingTag = !redactingTag;
    }

    function onCreateButtonClick() {
        account.foundClan(clan);
    }

    const account = createAccountStore();
  
    $: isLoading = clanStore.isLoading;
    $: pending = clanStore.pending;
    $: numOfMaps = $clanStore ? $clanStore?.metadata?.total : null;
    $: itemsPerPage = $clanStore ? $clanStore?.metadata?.itemsPerPage : 10;
  
    $: changePageAndFilters(page, location)
    $: scrollToTop($pending);
    
    $: currentClan = $clanStore?.container
    $: clan = $clanStore?.container ?? (clanId == "my" && {name: "New clan", tag: "NTG", icon: "https://cdn.beatleader.xyz/assets/102.png"});
    $: playersPage = ($clanStore?.data ?? [])
  </script>
  
  <svelte:head>
    <title>{clan.name} / {currentPage} - {ssrConfig.name}</title>
  </svelte:head>
  
  <section class="align-content">
    <article class="page-content">
      <ContentBox bind:box={boxEl}>
        <div class="clanData">
            <div class="imageInput" on:click={() => fileinput.click()}>
                <img class="playlistImage" src="{clan.icon}" alt="PlaylistImage"/>
                <input style="display:none" type="file" accept=".jpg, .jpeg, .png, .gif" on:change={(e)=>changeImage(e)} bind:this={fileinput} >
                <span class="imageChange">
                    <h3 class="changeLabel">Change</h3>
                </span>
            </div>

            <div class="clanTitleAndTag">
                <h1 class="title is-5">
                    <div style="display: grid; width: 90%;">
                        <div style="display: flex;">
                            <span class="clanName" style="display: {redactingTitle ? "none" : "block"};">{clan.name}</span>
                            <input type="text" style="display: {redactingTitle ? "block" : "none"};" value="{clan.name}" placeholder="Clan name" class="input-reset" bind:this={titleInput}>
                            <Button type="text" cls="editTitleButton" iconFa={redactingTitle ? "fas fa-check" : "fas fa-edit"}
                                on:click={() => onRedactTitleButtonClick()} />
                        </div>
                    </div>
        
                
                </h1>

                <div style="display: grid; width: 90%;">
                    <div style="display: flex;">
                        <span class="clanTag" style="display: {redactingTag ? "none" : "block"};">{clan.tag}</span>
                        <input type="text" style="display: {redactingTag ? "block" : "none"};" value="{clan.tag}" placeholder="Clan tag" class="input-reset" bind:this={tagInput}>
                        <Button type="text" cls="editTitleButton" iconFa={redactingTag ? "fas fa-check" : "fas fa-edit"}
                            on:click={() => onRedactTagButtonClick()} />
                        <input type="color" id="tagColor" value="#ff0000" on:change={changeColor}>
                    </div>
                </div>
            </div>

            
                        
        </div>

        <Button title="Delete failed score upload" label="Create a clan" type="primary"
                            on:click={() => onCreateButtonClick()}/>

        {#if $isLoading}<Spinner />{/if}
  
        {#if playersPage?.length}
          <div class="songs grid-transition-helper">
            {#each playersPage as player, idx (player.playerId)}
            <div class="ranking-grid-row" in:fly={{delay: idx * 10, x: 100}}>
              <div class={`player-card ${mainPlayerId == player.playerId ? "current" : ""}`} on:click={e => onPlayerClick(e, player)}>
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
                  <div style="color: {HSVtoRGB(Math.max(0, player.playerInfo.pp - 1000) / 18000, 1.0, 1.0)}">
                    <Value value={opt(player, 'playerInfo.pp')} zero="" suffix="pp"/>
                  </div>
                </div>
              </div>
              <!-- <AddFriendButton playerId={player.playerId}/> -->
            </div>
          {/each}
          </div>
  
          <Pager totalItems={numOfMaps} {itemsPerPage} itemsPerPageValues={null}
                 currentPage={currentPage-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
                 mode={numOfMaps ? 'pages' : 'simple'}
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
        justify-content: flex-end!important;
    }

    .clanData {
        display: flex;
    }

    .clanTitleAndTag {
        width: 100%;
    }

    .input-reset {
        width: 70%;
        font-size: inherit;
        padding: 0;
        color: var(--textColor);
        background-color: transparent;
        border: none;
        border-bottom: solid 1px var(--dimmed);
        outline: none;
    }

    .page-content {
        max-width: 65em;
        width: 100%;
    }

    article {
        width: calc(100% - 25em);
        overflow-x: hidden;
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
  
    aside {
        width: 25em;
    }

    aside .filter {
        margin-bottom: 1.5rem;
        transition: opacity 300ms;
    }

    aside .filter.disabled {
        opacity: .25;
    }

    aside label {
        display: block;
        font-weight: 500;
        margin-bottom: 1rem;
    }

    aside .filter.disabled label {
        cursor: help;
    }

    aside label span {
        color: var(--beatleader-primary);
    }

    aside input {
        width: 100%;
        font-size: 1em;
        color: var(--beatleader-primary);
        background-color: var(--foreground);
        border: none;
        border-bottom: 1px solid var(--faded);
        outline: none;
    }
  
    aside :global(.switch-types) {
        justify-content: flex-start;
    }

    input::placeholder {
        color: var(--faded) !important;
    }

    .songs :global(> *:last-child) {
        border-bottom: none !important;
    }

    .song-line {
        border-bottom: 1px solid var(--dimmed);
        padding: .5em 0;
    }

    .song-line .icons.up-to-tablet + .main {
        padding-top: 0;
    }

    .song-line .main {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: center;
        grid-column-gap: .75em;
    }

    .song-line .main > *:last-child {
        margin-right: 0;
    }
  
    .songinfo {
        flex-grow: 1;
        text-align: left;
        font-size: .95rem;
        font-weight: 500;
    }

    .songinfo {
        color: var(--alternate);
    }

    .songinfo small {
        margin-left: .25em;
        font-size: 0.75em;
        color: var(--ppColour);
    }

    .icons {
        width: 7em;
        font-size: .75em;
        text-align: right;
        margin-right: 0;
        margin-bottom: .5em;
    }

    .icons:empty {
        margin-bottom: 0 !important;
    }

    .song-score {
        border-bottom: 1px solid var(--dimmed);
        padding: .5em 0;
    }

    .playlistInfo {
        display: flex;
    }

    .clanName {
        display: block;
        max-width: 80%;
        overflow: hidden;
        max-height: 80%;
        margin-left: 1em;
    }

    .clanTag {
        display: block;
        max-width: 80%;
        overflow: hidden;
        max-height: 80%;
        margin-left: 1em;
    }

    .titleAndButtons {
        display: flex;
        justify-content: space-between;
        font-size: 1.1em;
        font-weight: 500;
        width: 90%;
        margin: 1em;
    }

    :global(.editTitleButton) {
        padding-bottom: 1.4em !important;
        padding-left: 0.6em !important;
    }

    .song-score .icons.up-to-tablet + .main {
      padding-top: 0;
    }

    .song-score .main {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-evenly;
        align-items: center;
    }

    .song-score.with-details .main {
        border-bottom: none;
    }

    .song-score .main > * {
        margin-right: 1em;
    }

    .song-score .main > *:last-child {
        margin-right: 0;
    }

    .song-score .main :global(.badge) {
        margin: 0 !important;
        padding: .125em .25em !important;
        width: 100%;
    }

    .song-score .main :global(.badge small) {
        font-size: .7em;
        font-weight: normal;
        margin-top: -2px;
    }

    .song-score .main :global(.inc), .song-score :global(.dec) {
        color: inherit;
    }

    .imageInput {
        cursor: pointer;
        display: flex;
        position: relative;
    }

    .playlistImage {
        width: 10em;
    }

    .imageChange {
        transition: opacity .2s ease-in-out;
        background-color: rgba(32,33,36,0.6);
        bottom: 0;
        height: 33%;
        left: 0;
        opacity: 0;
        position: absolute;
        right: 0;
        display: flex;
        justify-content: center;
    }

    .imageInput:hover .imageChange {
        opacity: 1;
    }

    .changeLabel {
        top: 30%;
        position: absolute;
    }
  
    .icons :global(> *) {
        margin-bottom: .25em!important;
    }

    @media screen and (max-width: 1275px) {
        .align-content {
            flex-direction: column-reverse;
            align-items: center;
        }

        aside {
            width: 100%;
            max-width: 65em;
        }
    }

    @media screen and (max-width: 767px) {
        .icons {
            margin-bottom: .5em;
            width: 100%;
        }
    }
  </style>