<script>
  import eventBus from '../utils/broadcast-channel-pubsub'
  import {onDestroy} from 'svelte'
  import {navigate} from 'svelte-routing'
  import {fade} from 'svelte/transition'
  import createPlayerInfoWithScoresStore from '../stores/http/http-player-with-scores-store'
  import {opt} from '../utils/js'
  import config from '../config'
  import {SsrHttpNotFoundError, SsrHttpUnprocessableEntityError} from '../network/errors'
  import Profile from '../components/Player/Profile.svelte'
  import Scores from '../components/Player/Scores.svelte'

  export let initialPlayerId = null;
  export let initialScoresType = 'recent';
  export let initialScoresPage = 1;
  export let initialState = null;

  let initialType = opt(initialState, 'scoresType', initialScoresType);
  let initialPage = parseInt(opt(initialState, 'page', initialScoresPage), 10);

  if (!initialType || !initialType.length) initialType = 'recent';
  if (isNaN(initialPage)) initialPage = 1;

  export const changePlayer = async newPlayerId => playerStore.fetch(newPlayerId);

  let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, initialType, initialPage, initialState);
  let playerIsLoading = opt(playerStore, 'isLoading', false);
  let playerError = opt(playerStore, 'error', null);

  let currentNavType = initialType;
  let currentNavPage = initialPage;

  const navigateUnsubscribe = eventBus.on('navigate-to-player-cmd', (playerId, isLocal) => {
    if (!isLocal || !playerId || !playerId.length) return;

    navigateToPlayer(playerId);
  })

  function onPageChanged(event) {
    currentNavPage = opt(event, 'detail', initialPage)

    playerStore.setPage(currentNavPage);
    if (playerId && currentNavType && currentNavPage) navigate(`/u/${playerId}/${currentNavType}/${currentNavPage}`, {replace: true});
  }

  function onTypeChanged(event) {
    currentNavType = opt(event, 'detail', initialType)
    currentNavPage = 1;

    playerStore.setType(currentNavType);
    playerStore.setPage(currentNavPage);
    if (playerId && currentNavType) navigate(`/u/${playerId}/${currentNavType}/${currentNavPage}`, {replace: true});
  }

  function navigateToPlayer(playerId) {
    currentNavPage = 1;
    playerStore.setPage(currentNavPage);
    navigate(`/u/${playerId}/${currentNavType}/1`)
  }

  onDestroy(() => navigateUnsubscribe())

  $: changePlayer(initialPlayerId);

  $: playerId = $playerStore && playerStore && playerStore.getPlayerId ? playerStore.getPlayerId() : null;
  $: currentStoreType = $playerStore && playerStore && playerStore.getType ? playerStore.getType() : null;
  $: currentStorePage = $playerStore && playerStore && playerStore.getPage ? playerStore.getPage() : 1;
  $: skeleton = !$playerStore && $playerIsLoading;
</script>

<svelte:head>
  <title>{opt($playerStore, 'name', 'Player')} - {config.name}</title>
</svelte:head>

<article transition:fade>
  {#if $playerError && ($playerError instanceof SsrHttpNotFoundError || $playerError instanceof SsrHttpUnprocessableEntityError)}
    <div class="box has-shadow">
      <p class="error">Player not found.</p>
    </div>
  {:else}
    <Profile playerData={$playerStore} isLoading={$playerIsLoading} error={$playerError} {skeleton} />

    {#if $playerStore}
      <Scores {playerId}
              initialState={opt($playerStore, 'scores', null)}
              initialStateType={playerStore && $playerStore ? playerStore.getStateType() : 'initial'}
              initialType={currentStoreType}
              initialPage={currentStorePage}
              numOfScores={opt($playerStore, 'scoreStats.totalPlayCount', null)}
              on:type-changed={onTypeChanged} on:page-changed={onPageChanged}
      />
    {/if}
  {/if}
</article>

<style>
  article {
      width: 100%;
  }

  button {
      cursor: pointer;
      min-width: 2rem;
      margin-right: .5rem;
  }
</style>