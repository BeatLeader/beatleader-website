<script>
  import Profile from '../components/Player/Profile.svelte'
  import createPlayerInfoWithScoresStore from '../stores/http-player-info-with-scores-store'
  import Scores from '../components/Player/Scores.svelte'

  export let initialPlayerId = null;
  export let initialScoresType = 'recent';
  export let initialState = null;

  let initialType = initialState?.scoresType ?? initialScoresType;

  export const changePlayer = async newPlayerId => playerStore.fetch(newPlayerId);

  let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, initialType, initialState);
  let playerIsLoading = playerStore?.isLoading ?? false;
  let playerError = playerStore?.error ?? null;

  function onTypeChanged(event) {
    playerStore.setType(event.detail ?? initialScoresType);
  }

  $: {
    changePlayer(initialPlayerId);
  }

  $: playerId = $playerStore ? playerStore?.getPlayerId() : null;
  $: currentType = $playerStore ? playerStore?.getType() : null;
</script>

<main>
  <Profile playerData={$playerStore} isLoading={$playerIsLoading} error={$playerError}/>

  {#if $playerStore}
    <Scores {playerId} initialState={$playerStore?.scores} initialType={currentType}
            on:type-changed={onTypeChanged}
    />
  {/if}
</main>

<style>
    button {
        cursor: pointer;
        min-width: 2rem;
        margin-right: .5rem;
    }
</style>