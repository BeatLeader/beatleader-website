<script>
  import {createEventDispatcher} from 'svelte'
  import {PLAYER_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'
  import createScoresStore from '../../stores/http/http-scores-store.js';
  import {opt} from '../../utils/js'
  import {scrollToTargetAdjusted} from '../../utils/browser'
  import createBeatSaviorService from '../../services/beatsavior'
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
  export let withAccSaber = false;

  const beatSaviorService = createBeatSaviorService();

  let scoresStore = createScoresStore(
    playerId,
    ['recent', 'top', 'beatsavior', 'accsaber'].includes(initialType) ? initialType : 'recent',
    !isNaN(parseInt(initialPage, 10)) ? parseInt(initialPage, 10) : 1,
    initialState,
    initialStateType
  );

  let scoresBoxEl = null;

  let pagerTotalScores = numOfScores;

  const allScoresTypes = [
    {id: 'recent', label: 'Recent', iconFa: 'fa fa-clock', url: `/u/${playerId}/recent/1`},
    {id: 'top', label: 'Top', iconFa: 'fa fa-cubes', url: `/u/${playerId}/top/1`},
    {id: 'beatsavior', label: 'Beat Savior', icon: '<div class="beatsavior-icon"></div>', url: `/u/${playerId}/beatsavior/1`},
    {id: 'accsaber', label: 'AccSaber', icon: '<div class="accsaber-icon"></div>', url: `/u/${playerId}/accsaber/1`},
  ];

  let scoresTypes = allScoresTypes;

  function changeParams(newPlayerId, newType, newPage, newInitialState, newInitialStateType) {
    if (!newPlayerId) return null;

    newType = scoresTypes.map(st => st.id).includes(newType) ? newType : 'recent'
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

  function updateTotalScores(numOfScores) {
    pagerTotalScores = numOfScores
  }

  async function updateAvailableScoresTypes(playerId, withAccSaber) {
    if (!playerId) return;

    let newScoresTypes = allScoresTypes;
    if (!await beatSaviorService.isDataForPlayerAvailable(playerId)) {
      newScoresTypes = newScoresTypes.filter(st => st.id !== 'beatsavior');
    }

    if (!withAccSaber) {
      newScoresTypes = newScoresTypes.filter(st => st.id !== 'accsaber');
    }

    scoresTypes = newScoresTypes;
  }

  $: updateAvailableScoresTypes(playerId, withAccSaber)

  $: changeParams(playerId, initialType, initialPage, initialState, initialStateType)
  $: page = $scoresStore && scoresStore && scoresStore.getPage ? scoresStore.getPage() : null;
  $: type = $scoresStore && scoresStore && scoresStore.getType ? scoresStore.getType() : null;
  $: totalScores = $scoresStore && scoresStore && scoresStore.getTotalScores ? scoresStore.getTotalScores() : null;
  $: isLoading = scoresStore ? scoresStore.isLoading : false;
  $: pending = scoresStore ? scoresStore.pending : null;
  $: error = scoresStore ? scoresStore.error : null;
  $: scoreType = scoresTypes.find(st => st.id === type);

  $: loadingScoreType = $pending ? scoresTypes.find(st => st.id === opt($pending, 'type')) : null

  $: scoresStore && scoresStore.fetch(page, type)
  $: updateTotalScores(totalScores !== null && totalScores !== undefined ? totalScores : numOfScores)
</script>

<div class="box has-shadow" bind:this={scoresBoxEl}>
  {#if $error}
    <div><Error error={$error} /></div>
  {/if}

  <Switcher values={scoresTypes} value={scoreType} on:change={onScoreTypeChanged} loadingValue={loadingScoreType} />

  {#if $scoresStore && $scoresStore.length}
  <div class="song-scores grid-transition-helper">
    {#each $scoresStore as songScore, idx (opt(songScore, 'leaderboard.leaderboardId'))}
      <SongScore {playerId} {songScore} {fixedBrowserTitle} {idx} {type} {withAccSaber} />
    {/each}
  </div>
  {:else}
    <p>No scores.</p>
  {/if}

  {#if Number.isFinite(page) && (!Number.isFinite(pagerTotalScores) || pagerTotalScores > 0)}
    <Pager totalItems={pagerTotalScores} itemsPerPage={PLAYER_SCORES_PER_PAGE} itemsPerPageValues={null}
           currentPage={page-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
           mode={pagerTotalScores ? 'pages' : 'simple'}
           on:page-changed={onPageChanged}
    />
  {/if}
</div>

<style>
    .song-scores :global(> *:last-child) {
        border-bottom: none !important;
    }
</style>