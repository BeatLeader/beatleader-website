<script>
  import Profile from '../components/Player/Profile.svelte'
  import createPlayerInfoWithScoresStore from '../stores/http-player-info-with-scores-store'
  import Scores from '../components/Player/Scores.svelte'

  export let initialPlayerId = null;
  export let initialScorestype = 'recent';
  export let initialState = null;

  export const changePlayer = async newPlayerId => playerStore.fetch(newPlayerId);

  let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, initialState?.scoresType ?? initialScorestype, initialState);
  let playerIsLoading = playerStore?.isLoading ?? false;
  let playerError = playerStore?.error ?? null;

  $: {
    changePlayer(initialPlayerId);
  }

  $: {
    console.log("PlayerPage/store", $playerStore)
  }

  $: playerId = $playerStore ? playerStore?.getPlayerId() : null;
</script>

<main>
  <Profile playerData={$playerStore} isLoading={$playerIsLoading} error={$playerError} />

  {#if $playerStore}
  <Scores {playerId} initialState={$playerStore?.scores} initialType={$playerStore?.scoresType} />
  {/if}
</main>

<style>
    button {
        cursor: pointer;
        min-width: 2rem;
        margin-right: .5rem;
    }
</style>