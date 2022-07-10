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
  import RangeSlider from "svelte-range-slider-pips";
  import {debounce} from '../utils/debounce'
  import Switcher from '../components/Common/Switcher.svelte'
  import {createBuildFiltersFromLocation, buildSearchFromFilters, processFloatFilter, processStringFilter,} from '../utils/filters'

  export let page = 1;
  export let location;

  const MIN_STARS = 0;
  const MAX_STARS = 15;
  const FILTERS_DEBOUNCE_MS = 500;

  const params = [
    {key: 'search', default: '', process: processStringFilter},
    {key: 'type', default: '', process: processStringFilter},
    {key: 'stars_from', default: MIN_STARS, process: processFloatFilter},
    {key: 'stars_to', default: MAX_STARS, process: processFloatFilter},
  ];

  const buildFiltersFromLocation = createBuildFiltersFromLocation(
    params,
    filters => {
      if (filters.stars_from > filters.stars_to) {
        const tmp = filters.stars_from
        filters.stars_from = filters.stars_to;
        filters.stars_to = tmp;
      }

      return filters;
    }
  );

  document.body.classList.remove('slim');

  if (page && !Number.isFinite(page)) page = parseInt(page, 10);
  if (!page || isNaN(page) || page <= 0) page = 1;

  let currentPage = page;
  let currentFilters = buildFiltersFromLocation(location);
  let boxEl = null;

  const typeFilterOptions = [
    {key: '', label: 'All maps', iconFa: 'fa fa-music', color: 'var(--beatleader-primary)'},
    {key: 'ranked', label: 'Ranked only', iconFa: 'fa fa-cubes', color: 'var(--beatleader-primary)'},
    // {key: 'unranked', label: 'Unranked only', iconFa: 'fa fa-cubes', color: 'var(--beatleader-primary)'},
  ];

  function scrollToTop() {
    if (boxEl) scrollToTargetAdjusted(boxEl, 44)
  }

  const leaderboardsStore = createLeaderboardsStore(page, currentFilters);

  function changePageAndFilters(newPage, newLocation) {
    currentFilters = buildFiltersFromLocation(newLocation);

    newPage = parseInt(newPage, 10);
    if (isNaN(newPage)) newPage = 1;

    currentPage = newPage;
    leaderboardsStore.fetch(currentPage, {...currentFilters});
  }

  function onPageChanged(event) {
    if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

    navigate(`/leaderboards/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
  }

  function navigateToCurrentPageAndFilters() {
    navigate(`/leaderboards/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
  }

  function onSearchChanged(e) {
    currentFilters.search = e.target.value ?? '';
    navigateToCurrentPageAndFilters();
  }
  const debouncedOnSearchChanged = debounce(onSearchChanged, FILTERS_DEBOUNCE_MS);

  function onTypeChanged(event) {
    if (!event?.detail) return;

    currentFilters.type = event.detail.key ?? '';

    navigateToCurrentPageAndFilters();
  }

  function onStarsChanged(event) {
    if (!Array.isArray(event?.detail?.values) || event.detail.values.length !== 2) return;

    currentFilters.stars_from = event.detail.values[0];
    currentFilters.stars_to = event.detail.values[1];

    navigateToCurrentPageAndFilters();
  }
  const debouncedOnStarsChanged = debounce(onStarsChanged, FILTERS_DEBOUNCE_MS);

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
      <h2 class="title is-5">Filters</h2>

      <section class="filter">
        <label>Song/Author/Mapper Name</label>
        <input type="text" placeholder="Search for a map..." value={currentFilters.search} on:input={debouncedOnSearchChanged} />
      </section>

      <section class="filter">

        <Switcher values={typeFilterOptions} value={typeFilterOptions.find(o => o.key === currentFilters.type)}
                  on:change={onTypeChanged}
        />
      </section>

      <section class="filter" class:disabled={currentFilters.type !== 'ranked'}
               title={currentFilters.type !== 'ranked' ? 'Filter only available for ranked maps' : null}
      >
        <label>Stars <span>{currentFilters.stars_from}<sup>★</sup></span> to <span>{currentFilters.stars_to}<sup>★</sup></span></label>
        <RangeSlider range min={MIN_STARS} max={MAX_STARS} step={0.1} values={[currentFilters.stars_from, currentFilters.stars_to]}
                     float hoverable pips pipstep={20} all="label"
                     on:change={debouncedOnStarsChanged}
                     disabled={currentFilters.type !== 'ranked'}
        />
      </section>
    </ContentBox>
  </aside>
</section>

<style>
    .align-content {
        display: flex;
        justify-content: flex-end!important;
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