<script>
  import {createEventDispatcher} from 'svelte'
  import createScoresStore from '../../stores/http/http-scores-store.js';
  import {opt} from '../../utils/js'
  import {scrollToTargetAdjusted} from '../../utils/browser'
  import SongScore from './SongScore.svelte'
  import Error from '../Common/Error.svelte'
  import ScoreServiceSwitcher from './ScoreServiceSwitcher.svelte'
  import ScoresPager from './ScoresPager.svelte'

  const dispatch = createEventDispatcher();

  export let playerId = null;
  export let initialState = null;
  export let initialStateType = null;
  export let initialService = 'scoresaber';
  export let initialServiceParams = {};
  export let numOfScores = null;
  export let fixedBrowserTitle = null;

  let scoresStore = createScoresStore(
    playerId,
    initialService,
    initialServiceParams,
    initialState,
    initialStateType
  );

  let scoresBoxEl = null;

  function changeParams(newPlayerId, newService, newServiceParams) {
    if (!newPlayerId) return null;

    scoresStore.fetch(newServiceParams, newService, newPlayerId);

    return {playerId: newPlayerId, service: newService, serviceParams: newServiceParams}
  }

  function onPageChanged(event) {
    if (!(event?.detail?.initial ?? false)) scrollToTop();

    const page = (event?.detail?.page ?? 0) + 1

    dispatch('page-changed', page);
  }

  function onServiceParamsChanged(event) {
    if (!event?.detail) return;

    dispatch('service-params-changed', event.detail)
  }

  function onServiceChanged(event) {
    if (!event?.detail) return;

    scrollToTop();

    dispatch('service-changed', event.detail);
  }

  function scrollToTop() {
    if (scoresBoxEl) scrollToTargetAdjusted(scoresBoxEl, 44)
  }

  $: changeParams(playerId, initialService, initialServiceParams, initialState, initialStateType)
  $: currentService = ((scoresStore) => scoresStore ? scoresStore?.getService() : null)(scoresStore, $scoresStore);
  $: currentServiceParams = ((scoresStore) => scoresStore ? scoresStore?.getServiceParams() : null)(scoresStore, $scoresStore);
  $: page = currentServiceParams?.page ?? null;
  $: totalScores = ((scoresStore) => scoresStore && scoresStore.getTotalScores ? scoresStore.getTotalScores() : null)(scoresStore, $scoresStore);
  $: isLoading = scoresStore ? scoresStore.isLoading : false;
  $: pending = scoresStore ? scoresStore.pending : null;
  $: error = scoresStore ? scoresStore.error : null;

  $: scoresStore && scoresStore.fetch(currentServiceParams, currentService)
  $: pagerTotalScores = totalScores !== null && totalScores !== undefined ? totalScores : numOfScores
</script>

<div class="box has-shadow" bind:this={scoresBoxEl}>
  {#if $error}
    <div><Error error={$error} /></div>
  {/if}

  <ScoreServiceSwitcher {playerId} service={currentService} serviceParams={currentServiceParams}
                        loadingService={$pending?.service} loadingServiceParams={$pending?.serviceParams}
                        on:service-change={onServiceChanged} on:service-params-change={onServiceParamsChanged}
  />

  {#if $scoresStore && $scoresStore.length}
  <div class="song-scores grid-transition-helper">
    {#each $scoresStore as songScore, idx (opt(songScore, 'leaderboard.leaderboardId'))}
      <SongScore {playerId} {songScore} {fixedBrowserTitle} {idx} service={currentService} />
    {/each}
  </div>
  {:else}
    <p>No scores.</p>
  {/if}

  {#if Number.isFinite(page) && (!Number.isFinite(pagerTotalScores) || pagerTotalScores > 0)}
    <ScoresPager {playerId} service={currentService} serviceParams={currentServiceParams}
                 totalItems={pagerTotalScores} currentPage={page-1}
                 loadingPage={$pending?.serviceParams?.page ? $pending.serviceParams.page - 1 : null}
                 on:page-changed={onPageChanged}
    />
  {/if}
</div>

<style>
    .song-scores :global(> *:last-child) {
        border-bottom: none !important;
    }
</style>