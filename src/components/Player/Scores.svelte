<script>
  import {createEventDispatcher} from 'svelte'
  import {PLAYER_SCORES_PER_PAGE} from '../../scoresaber/consts'
  import createScoresStore from '../../stores/http-scores-store.js';
  import Pager from '../Common/Pager.svelte'

  const dispatch = createEventDispatcher();

  export let playerId;
  export let initialType = 'recent';
  export let initialState = null;
  export let initialPage = 1;
  export let numOfScores = null;

  const types = ['recent', 'top'];

  let scoresStore;

  function fetchPage(page) {
    scoresStore.fetch(page);
  }

  function changeType(type) {
    scoresStore.fetch(1, type);
  }

  function onPageChanged(event) {
    fetchPage((event?.detail?.page ?? 0 ) + 1);
  }

  $: {
    scoresStore && scoresStore.fetch(page)
  }

  $: scoresStore = playerId ? createScoresStore(playerId, initialType, initialPage, initialState) : null;

  $: page = $scoresStore ? scoresStore?.getPage() : null;
  $: type = $scoresStore ? scoresStore?.getType() : null;
  $: isLoading = scoresStore ? scoresStore.isLoading : false;
  $: pending = scoresStore ? scoresStore.pending : null;
  $: error = scoresStore ? scoresStore.error : null;

  $: {
    dispatch('type-changed', type);
  }

  $: {
    dispatch('page-changed', page);
  }
</script>

<div class="box has-shadow">
  {#if $error}
    <div class="error">{$error?.toString()}</div>
  {/if}

  {#each types as t}
    <button on:click={() => changeType(t)}
            disabled={[type, $pending?.type].includes(t)}>{t.toUpperCase()}</button>
  {/each}

  <pre>
		{JSON.stringify($scoresStore, null, 2)}
	</pre>

  {#if Number.isFinite(page)}
    <Pager totalItems={numOfScores} itemsPerPage={PLAYER_SCORES_PER_PAGE} itemsPerPageValues={null}
           currentPage={page-1} loadingPage={$pending?.page ? $pending.page - 1 : null}
           mode={numOfScores ? 'pages' : 'simple'}
           on:page-changed={onPageChanged}
    />
  {/if}
</div>

<style>
    button {
        cursor: pointer;
        min-width: 2rem;
        margin-right: .5rem;
    }

    pre {
        width: 800px;
        height: 800px;
        border: 1px solid red;
        overflow: scroll;
    }

    .error {
        color: red;
        font-weight: 500;
    }
</style>