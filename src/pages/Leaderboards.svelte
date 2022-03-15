<script>
  import {navigate} from "svelte-routing";
  import {fade, fly} from 'svelte/transition'
  import createLeaderboardsStore from '../stores/http/http-leaderboards-store'
  import {scrollToTargetAdjusted} from '../utils/browser'
  import ssrConfig from '../ssr-config'
  import Pager from '../components/Common/Pager.svelte'
  import Spinner from '../components/Common/Spinner.svelte'
  import ContentBox from "../components/Common/ContentBox.svelte";
  import Icons from '../components/Song/Icons.svelte'
  import SongCover from '../components/Player/SongCover.svelte'

  export let page = 1;
  export let location;

  document.body.classList.remove('slim');

  if (page && !Number.isFinite(page)) page = parseInt(page, 10);
  if (!page || isNaN(page) || page <= 0) page = 1;

  const buildFiltersFromLocation = location => {
    const processString = val => val;
    const processBool = val => val === 'true';
    const processFloat = val => {
      val = parseFloat(val);
      if (isNaN(val)) return null;

      return val < 0 ? 0 : val;
    }

    // temporarily disable the use of filters
    const params = [
      // {key: 'search', default: '', process: processString},
      // {key: 'ranked', default: 'true', process: processBool},
      // {key: 'stars_from', default: 0, process: processFloat},
      // {key: 'stars_to', default: 15, process: processFloat},
    ];

    const searchParams = new URLSearchParams(location?.search ?? '');

    const filters = params.reduce((cum, param) => ({
      ...cum,
      [param.key]: param.process(searchParams.get(param.key)) ?? param.default
    }), {});

    if (filters.stars_from > filters.stars_to) {
      const tmp = filters.stars_from
      filters.stars_from = filters.stars_to;
      filters.stars_to = tmp;
    }

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

  const leaderboardsStore = createLeaderboardsStore(page, currentFilters);

  function changePageAndFilters(newPage, newLocation) {
    currentFilters = buildFiltersFromLocation(newLocation);

    newPage = parseInt(newPage, 10);
    if (isNaN(newPage)) newPage = 1;

    currentPage = newPage;
    leaderboardsStore.fetch(currentPage, currentFilters);
  }

  function onPageChanged(event) {
    if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

    navigate(`/leaderboards/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
  }

  $: isLoading = leaderboardsStore.isLoading;
  $: pending = leaderboardsStore.pending;
  $: numOfMaps = $leaderboardsStore ? $leaderboardsStore?.metadata?.total : null;
  $: itemsPerPage = $leaderboardsStore ? $leaderboardsStore?.metadata?.itemsPerPage : 10;

  $: changePageAndFilters(page, location)
  $: scrollToTop($pending);

  $: leaderboardsPage = ($leaderboardsStore?.data ?? [])
    .map(m => {
      return {
        ...m,
        diffInfo: {diff: m?.difficulty?.difficultyName, type: m?.difficulty?.modeName},
        stars: m?.difficulty?.stars ?? null,
      }
    })
</script>

<svelte:head>
  <title>Maps / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
  <article class="page-content" transition:fade>
    <ContentBox bind:box={boxEl}>
      <h1 class="title is-5">
        Maps

        {#if $isLoading}<Spinner />{/if}
      </h1>

      {#if leaderboardsPage?.length}
        <div class="filters"></div>

        <div class="songs grid-transition-helper">
          {#each leaderboardsPage as map, idx (map.id)}
            <div class={`song-line row-${idx}`}  in:fly={{delay: idx * 10, x: 100}}>
              <div class="icons mobile-only">
                {#if map?.song?.hash?.length}
                  <Icons hash={map.song.hash} diffInfo={map?.diffInfo} />
                {/if}
              </div>

              <div class="main">
                <SongCover leaderboard={map} url={`/leaderboard/global/${map.id}/1`}/>

                <div class="songinfo">
                  <a href={`/leaderboard/global/${map.id}/1`}
                     on:click|preventDefault={() => navigate(`/leaderboard/global/${map.id}/1`)}>
                    <span class="name">{map?.song?.name} {map?.song?.subName}</span>
                    <div class="author">{map?.song?.author} <small>{map?.song?.mapper}</small></div>
                  </a>
                </div>

                {#if map?.song?.hash?.length}
                  <div class="icons tablet-and-up">
                    <Icons hash={map.song.hash}
                           diffInfo={{diff: map?.difficulty?.difficultyName, type: map?.difficulty?.modeName}}/>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <Pager totalItems={numOfMaps} {itemsPerPage} itemsPerPageValues={null}
               currentPage={currentPage-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
               mode={numOfMaps ? 'pages' : 'simple'}
               on:page-changed={onPageChanged}
        />
      {:else if (!$isLoading)}
        <p>No maps found.</p>
      {/if}
    </ContentBox>
  </article>

  <aside>
    <ContentBox>
      <h2 class="title is-6">Filters</h2>

      <p>TODO</p>

    </ContentBox>
  </aside>
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

    article {
        width: calc(100% - 25em);
        overflow-x: hidden;
    }

    aside {
        width: 25em;
        display: none; /* temporarily disable the display of filters */
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

    .icons :global(> *) {
        margin-bottom: .25em!important;
    }

    @media screen and (max-width: 1023px) {
        .align-content {
            flex-direction: column-reverse;
            align-items: center;
        }

        aside {
            width: 100%;
        }
    }

    @media screen and (max-width: 767px) {
        .icons {
            margin-bottom: .5em;
            width: 100%;
        }
    }
</style>