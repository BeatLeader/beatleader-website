<script>
  import Profile from '../components/Player/Profile.svelte'
  import createPlayerInfoWithScoresStore from '../stores/http-player-info-with-scores-store'
  import Scores from '../components/Player/Scores.svelte'

  export let initialPlayerId = null;
  export let initialScoresType = 'recent';
  export let initialState = null;

  let type = initialState?.scoresType ?? initialScoresType;

  export const changePlayer = async newPlayerId => playerStore.fetch(newPlayerId, type);

  let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, type, initialState);
  let playerIsLoading = playerStore?.isLoading ?? false;
  let playerError = playerStore?.error ?? null;

  function onTypeChanged(event) {
    type = event.detail ?? initialScoresType;
  }

  $: {
    changePlayer(initialPlayerId);
  }

  $: playerId = $playerStore ? playerStore?.getPlayerId() : null;

  $: {
    console.log("PlayerPage/store", $playerStore)
  }
</script>

<main>
  <Profile playerData={$playerStore} isLoading={$playerIsLoading} error={$playerError}/>

  {#if $playerStore}
    <Scores {playerId} initialState={$playerStore?.scores} initialType={type} on:type-changed={onTypeChanged}/>
  {/if}
</main>

<style>
    button {
        cursor: pointer;
        min-width: 2rem;
        margin-right: .5rem;
    }
</style>