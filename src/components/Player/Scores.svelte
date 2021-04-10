<script>
  import createScoresStore from '../../stores/http-scores-store.js';
  import Spinner from '../Common/Spinner.svelte'

  export let playerId;
  export let type = 'recent';
  export let initialState;
  export let initialPage = 1;

  let page = initialPage;

  let scoresStore = createScoresStore(playerId, type, page, initialState);

  $: {
    scoresStore.fetch(page, type, playerId)
  }

  function fetchPage(page) {
    scoresStore.fetch(page);
  }

  $: {
    console.log($scoresStore, scoresStore);
  }
  $: playerInfo = scoresStore && $scoresStore ? $scoresStore.playerInfo : null;

  $: isLoading = scoresStore ? scoresStore.isLoading : false;
  $: pending = scoresStore ? scoresStore.pending : null;
  $: error = scoresStore ? scoresStore.error : null;

  // TODO: remove it
  const pages = Array(10).fill(0).map((v, idx) => idx + 1);
</script>

<section>
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

  {#if $error}
    <div class="error">{$error?.toString()}</div>
  {/if}
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