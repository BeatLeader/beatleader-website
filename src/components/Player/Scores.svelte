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

  export let playerId;
  export let initialType = 'recent';
  export let initialState = null;
  export let initialStateType = null;
  export let initialPage = 1;
  export let numOfScores = null;
  export let fixedBrowserTitle = null;

  let scoresBoxEl = null;

  let scoresTypes = [
    {id: 'recent', label: 'Recent', iconFa: 'fa fa-clock'},
    {id: 'top', label: 'Top', iconFa: 'fa fa-cubes'},
  ];

  function fetchPage(page) {
    scoresStore.fetch(page);
  }

  function onPageChanged(event) {
    fetchPage(opt(event, 'detail.page', 0) + 1);
  }

  function onScoreTypeChanged(event) {
    const type = opt(event, 'detail.id');
    if (!type) return;

    scoresStore.fetch(1, type)
  }

  function scrollToTop() {
    if (scoresBoxEl) scrollToTargetAdjusted(scoresBoxEl, 44)
  }

  $: {
    scoresStore && scoresStore.fetch(page)
  }

  $: scoresStore = playerId ? createScoresStore(playerId, initialType, initialPage, initialState, initialStateType) : null;

  $: page = $scoresStore && scoresStore && scoresStore.getPage ? scoresStore.getPage() : null;
  $: type = $scoresStore && scoresStore && scoresStore.getType ? scoresStore.getType() : null;
  $: isLoading = scoresStore ? scoresStore.isLoading : false;
  $: pending = scoresStore ? scoresStore.pending : null;
  $: error = scoresStore ? scoresStore.error : null;
  $: scoreType = scoresTypes.find(st => st.id === type);
  $: loadingScoreType = $pending ? scoresTypes.find(st => st.id === opt($pending, 'type')) : null

  $: {
    dispatch('type-changed', type);
  }

  $: {
    dispatch('page-changed', page);
  }

  $: {
    scrollToTop($pending)
  }
</script>

<div class="box has-shadow" bind:this={scoresBoxEl}>
  {#if $error}
    <div><Error error={$error} /></div>
  {/if}

  <Switcher values={scoresTypes} value={scoreType} on:change={onScoreTypeChanged} loadingValue={loadingScoreType} />

  {#if $scoresStore}
  <div class="song-scores">
    {#each $scoresStore as songScore}
      {#key opt(songScore, 'leaderboard.leaderboardId')}
        <SongScore {songScore} {fixedBrowserTitle} />
      {/key}
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