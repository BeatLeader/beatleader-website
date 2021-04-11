<script>
  import createScoresStore from '../../stores/http-scores-store.js';
  import Spinner from '../Common/Spinner.svelte'

  export let playerId;
  export let initialType = 'recent';
  export let initialState = null;
  export let initialPage = 1;

  const types = ['recent', 'top'];

  let scoresStore;

  function fetchPage(page) {
    scoresStore.fetch(page);
  }

  function changeType(type) {
    scoresStore.fetch(1, type);
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

  // TODO: remove it
  const pages = Array(10).fill(0).map((v, idx) => idx + 1);
</script>

<section>
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

  <div class="pages">
    {#each pages as p}
      <button on:click={() => fetchPage(p)} disabled={[page, $pending?.page].includes(p)}>
        {#if $pending?.page === p}
          <span class="spinner"><Spinner /></span>
        {:else}
          {p}
        {/if}
      </button>
    {/each}
  </div>
  </div>
</section>

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

    .spinner {
        width: 1rem;
        height: 1rem;
    }
</style>