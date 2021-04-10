<script>
  import Profile from '../components/Player/Profile.svelte'
  import createPlayerInfoStore from '../stores/http-player-info-store'

  export let initialPlayerId = null;
  export let initialState = null;

  export const changePlayer = async newPlayerId => playerStore.fetch(newPlayerId);

  let playerStore = createPlayerInfoStore(initialPlayerId, initialState);
  let playerIsLoading = playerStore?.isLoading ?? false;
  let playerError = playerStore?.error ?? null;

  $: {
    changePlayer(initialPlayerId);
  }

  $: playerId = $playerStore ? playerStore?.getPlayerId() : null;
</script>

<main>
  <Profile playerData={$playerStore} isLoading={$playerIsLoading} error={$playerError} />
</main>

<style>
    button {
        cursor: pointer;
        min-width: 2rem;
        margin-right: .5rem;
    }

    .spinner {
        width: 1rem;
        height: 1rem;
    }
</style>