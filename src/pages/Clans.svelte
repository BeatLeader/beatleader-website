<script>
  import {navigate} from "svelte-routing";
  import {fade, fly} from 'svelte/transition'
  import createClansStore from '../stores/http/http-clans-store'
  import createAccountStore from '../stores/beatleader/account'
  import createClanService from '../services/beatleader/clan'
  import {scrollToTargetAdjusted} from '../utils/browser'
  import {debounce} from '../utils/debounce'
  import ssrConfig from '../ssr-config'
  import Pager from '../components/Common/Pager.svelte'
  import Spinner from '../components/Common/Spinner.svelte'
  import ContentBox from "../components/Common/ContentBox.svelte";
  import Button from "../components/Common/Button.svelte";
  import ClanInfo from '../components/Clans/ClanInfo.svelte'

  export let page = 1;
  export let location;

  const FILTERS_DEBOUNCE_MS = 500;

  document.body.classList.remove('slim');

  const clanService = createClanService();

  let createMode = false;
  let createError = null;
  let createIsSaving = false;

  let shouldBeForceRefreshed = new URLSearchParams(location?.search ?? '')?.get('refresh') ?? false;

  if (page && !Number.isFinite(page)) page = parseInt(page, 10);
  if (!page || isNaN(page) || page <= 0) page = 1;

  const buildFiltersFromLocation = location => {
    const processString = val => val?.toString() ?? '';

    const params = [
      {key: 'search', default: '', process: processString}, ,
    ];

    const searchParams = new URLSearchParams(location?.search ?? '');

    return params.reduce((cum, param) => ({
      ...cum,
      [param.key]: param.process(searchParams.get(param.key)) ?? param.default,
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

  const clansStore = createClansStore(page, currentFilters);

  function changePageAndFilters(newPage, newLocation, force) {
    shouldBeForceRefreshed = false;

    currentFilters = buildFiltersFromLocation(newLocation);

    newPage = parseInt(newPage, 10);
    if (isNaN(newPage)) newPage = 1;

    currentPage = newPage;
    clansStore.fetch(currentPage, {...currentFilters}, force);
  }

  function onPageChanged(event) {
    if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

    navigate(`/clans/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
  }

  function navigateToCurrentPageAndFilters() {
    navigate(`/clans/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
  }

  function onSearchChanged(e) {
    currentFilters.search = e.target.value ?? '';
    navigateToCurrentPageAndFilters();
  }

  const debouncedOnSearchChanged = debounce(onSearchChanged, FILTERS_DEBOUNCE_MS);

  function onClanClick(clan) {
    if (!clan?.id) return;

    navigate(`/clan/${clan.id}`)
  }

  async function onClanAddedOrRemoved() {
    createMode = false;
    await clansStore.refresh();
  }

  const account = createAccountStore();

  $: isLoading = clansStore.isLoading;
  $: pending = clansStore.pending;
  $: numOfClans = $clansStore ? $clansStore?.metadata?.total : null;
  $: itemsPerPage = $clansStore ? $clansStore?.metadata?.itemsPerPage : 10;

  $: changePageAndFilters(page, location, shouldBeForceRefreshed)
  $: scrollToTop($pending);

  $: clanRequests = ($account?.clanRequest ?? []);

  $: clansPage = ($clansStore?.data ?? [])
</script>

<svelte:head>
  <title>Clans / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
  <article class="page-content" transition:fade>
    {#if !createMode && $account?.clan?.id}
      <ContentBox>
        <h1 class="title is-5">My clan</h1>

        <a href={`/clan/${$account.clan.id}`} on:click|preventDefault={() => navigate(`/clan/${$account.clan.id}`)}>
          <ClanInfo clan={$account.clan} noButtons={true}/>
        </a>
      </ContentBox>
    {/if}

    {#if clanRequests?.length}
      <ContentBox background="var(--dimmed)">
        <section class="clan-requests">
          <h2 class="title is-5">Clan requests</h2>

          {#each clanRequests as clan, idx (clan.id)}
            <section class={`clan-line row-${idx}`} in:fly={{delay: idx * 10, x: 100}}>
              <div class="main" on:click={() => onClanClick(clan)}>
                <ClanInfo editMode={false} {clan}/>
              </div>
            </section>
          {/each}
        </section>
      </ContentBox>
    {/if}

    <ContentBox bind:box={boxEl}>
      <h1 class="title is-5">
        All clans

        {#if $isLoading}
          <Spinner/>
        {/if}
      </h1>

      {#if createMode}
        <ContentBox>
          <ClanInfo enableCreateMode={true}
                    on:added={onClanAddedOrRemoved} on:removed={onClanAddedOrRemoved} on:cancel={() => {createMode =false}}
          />
        </ContentBox>
      {:else if ($account?.player && !$account?.clan)}
        <Button iconFa="fas fa-users" label="Create a new clan" type="primary"
                on:click={() => {createMode = true}}/>
      {/if}

      {#if clansPage?.length}
        <div class="clans grid-transition-helper">
          {#each clansPage as clan, idx (clan.id)}
            <div class={`clan-line row-${idx}`} in:fly={{delay: idx * 10, x: 100}}>
              <div class="main" on:click={() => onClanClick(clan)}>
                <ClanInfo {clan} noButtons={true}/>
              </div>
            </div>
          {/each}
        </div>

        <Pager totalItems={numOfClans} {itemsPerPage} itemsPerPageValues={null}
               currentPage={currentPage-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
               mode={numOfClans ? 'pages' : 'simple'}
               on:page-changed={onPageChanged}
        />
      {:else if (!$isLoading)}
        <p>No clans found.</p>
      {/if}
    </ContentBox>
  </article>

  <aside>
    <ContentBox>
      <h2 class="title is-5">Filters</h2>

      <section class="filter">
        <label>Tag/Clan name</label>
        <input type="text" placeholder="Search..." value={currentFilters.search} on:input={debouncedOnSearchChanged}/>
      </section>
    </ContentBox>
  </aside>
</section>

<style>
    .align-content {
        display: flex;
        justify-content: flex-end !important;
    }

    .page-content {
        max-width: 65em;
        width: 100%;
    }

    article {
        width: calc(100% - 25em);
        overflow-x: hidden;
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

    .clans :global(> *:last-child) {
        border-bottom: none !important;
    }

    .clan-line {
        border-bottom: 1px solid var(--dimmed);
        padding: .5em 0;
    }

    .clan-line:last-child {
        border-bottom: none;
    }

    .clans .clan-line:hover {
        background-color: var(--dimmed);
        cursor: pointer;
    }

    .clan-line .icons.up-to-tablet + .main {
        padding-top: 0;
    }

    .clan-line .main {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: center;
        grid-column-gap: .75em;
    }

    .clan-line .main > *:last-child {
        margin-right: 0;
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
</style>