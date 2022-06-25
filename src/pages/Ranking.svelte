<script>
  import {navigate} from "svelte-routing";
  import {fade} from 'svelte/transition'
  import {createBuildFiltersFromLocation, buildSearchFromFilters, processStringFilter,} from '../utils/filters'
  import {capitalize} from '../utils/js'
  import {scrollToTargetAdjusted} from '../utils/browser'
  import ssrConfig from '../ssr-config'
  import Spinner from '../components/Common/Spinner.svelte'
  import ContentBox from "../components/Common/ContentBox.svelte";
  import RankingTable from '../components/Ranking/RankingTable.svelte'

  export let type = 'global';
  export let page = 1;

  const params = [
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

  let currentType = type;
  let currentPage = page;
  let currentFilters = buildFiltersFromLocation(location);
  let boxEl = null;

  let isLoading = false;
  let pending = null;

  if (!currentFilters?.sortBy?.length) {
      currentFilters.sortBy = 'pp';
  }

  function scrollToTop() {
    if (boxEl) scrollToTargetAdjusted(boxEl, 44)
  }

  function changeParams(newType, newPage, newLocation) {
    currentType = newType;
    currentFilters = buildFiltersFromLocation(newLocation);
    if (!currentFilters?.sortBy?.length) {
      currentFilters.sortBy = 'pp';
    }
    newPage = parseInt(newPage, 10);
    if (isNaN(newPage)) newPage = 1;

    currentPage = newPage;

    navigateToCurrentPageAndFilters();
  }

  function onPageChanged(event) {
    if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

    navigate(`/ranking/${currentType}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
  }

  function navigateToCurrentPageAndFilters() {
    navigate(`/ranking/${currentType}/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
  }

  function toggleSortBy() {
    currentFilters.sortBy = currentFilters.sortBy === "dailyImprovements" ? "pp" : "dailyImprovements";

    navigateToCurrentPageAndFilters();
  }

  $: typeName = type && type.toUpperCase && !['global', 'friends'].includes(type) ? type.toUpperCase() : capitalize(type)
  $: changeParams(type, page, location)
  $: scrollToTop(pending);
</script>

<svelte:head>
  <title>{typeName} ranking / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
  <article class="page-content" transition:fade>
    <ContentBox bind:box={boxEl}>
      <h1 class="title is-5">
        {typeName} leaderboard

        {#if isLoading}
          <Spinner/>
        {/if}
      </h1>

      <RankingTable type={currentType} page={currentPage} filters={currentFilters}
                    on:page-changed={onPageChanged}
                    on:sort-toggled={toggleSortBy}
                    on:loading={e => isLoading = !!e?.detail}
                    on:pending={e => pending = e?.detail}
      />
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
</style>