<script>
  import {createEventDispatcher} from 'svelte'
  import {PLAYER_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'
  import createScoresStore from '../../stores/http/http-scores-store.js';
  import {opt} from '../../utils/js'
  import {scrollToTargetAdjusted} from '../../utils/browser'
  import Pager from '../Common/Pager.svelte'
  import SongScore from './SongScore.svelte'
  import Error from '../Common/Error.svelte'
  import Switcher from '../Common/Switcher.svelte'

  const dispatch = createEventDispatcher();

  export let playerId = null;
  export let initialType = 'recent';
  export let initialState = null;
  export let initialStateType = null;
  export let initialPage = 1;
  export let numOfScores = null;
  export let fixedBrowserTitle = null;

  let scoresStore = createScoresStore(
    playerId,
    ['recent', 'top'].includes(initialType) ? initialType : 'recent',
    !isNaN(parseInt(initialPage, 10)) ? parseInt(initialPage, 10) : 1,
    initialState,
    initialStateType
  );

  let scoresBoxEl = null;

  let scoresTypes = [
    {id: 'recent', label: 'Recent', iconFa: 'fa fa-clock', url: `/u/${playerId}/recent/1`},
    {id: 'top', label: 'Top', iconFa: 'fa fa-cubes', url: `/u/${playerId}/top/1`},
  ];

  function changeParams(newPlayerId, newType, newPage, newInitialState, newInitialStateType) {
    if (!newPlayerId) return null;

    newType = ['recent', 'top'].includes(newType) ? newType : 'recent'
    newPage = parseInt(newPage, 10);
    if (!Number.isFinite(newPage)) newPage = 1;

    scoresStore.fetch(newPage, newType, newPlayerId);

    return {playerId: newPlayerId, type: newType, page: newPage}
  }

  function onPageChanged(event) {
    if (!opt(event, 'detail.initial', false)) scrollToTop();
    const page = opt(event, 'detail.page', 0) + 1
    dispatch('page-changed', page);
  }

  function onScoreTypeChanged(event) {
    scrollToTop();
    const type = opt(event, 'detail.id')
    dispatch('type-changed', type);
  }

  function scrollToTop() {
    if (scoresBoxEl) scrollToTargetAdjusted(scoresBoxEl, 44)
  }

  $: changeParams(playerId, initialType, initialPage, initialState, initialStateType)

  $: page = $scoresStore && scoresStore && scoresStore.getPage ? scoresStore.getPage() : null;
  $: type = $scoresStore && scoresStore && scoresStore.getType ? scoresStore.getType() : null;
  $: isLoading = scoresStore ? scoresStore.isLoading : false;
  $: pending = scoresStore ? scoresStore.pending : null;
  $: error = scoresStore ? scoresStore.error : null;
  $: scoreType = scoresTypes.find(st => st.id === type);
  $: loadingScoreType = $pending ? scoresTypes.find(st => st.id === opt($pending, 'type')) : null

  $: scoresStore && scoresStore.fetch(page, type)
</script>

<div class="box has-shadow" bind:this={scoresBoxEl}>
  {#if $error}
    <div><Error error={$error} /></div>
  {/if}

  <Switcher values={scoresTypes} value={scoreType} on:change={onScoreTypeChanged} loadingValue={loadingScoreType} />

  {#if $scoresStore}
  <div class="song-scores grid-transition-helper">
    {#each $scoresStore as songScore, idx (opt(songScore, 'leaderboard.leaderboardId'))}
      <SongScore {songScore} {fixedBrowserTitle} {idx} />
    {/each}
  </div>
  {:else}
    <p>No scores.</p>
  {/if}

  {#if Number.isFinite(page)}
    <Pager totalItems={numOfScores} itemsPerPage={PLAYER_SCORES_PER_PAGE} itemsPerPageValues={null}
           currentPage={page-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
           mode={numOfScores ? 'pages' : 'simple'}
           on:page-changed={onPageChanged}
    />
  {/if}
</div>

<style>
    .song-scores :global(> *:last-child) {
        border-bottom: none !important;
    }
</style>