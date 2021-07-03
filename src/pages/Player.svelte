<script>
  import {navigate} from 'svelte-routing'
  import eventBus from '../utils/broadcast-channel-pubsub'
  import createPlayerInfoWithScoresStore from '../stores/http/http-player-with-scores-store'
  import createScoresService from '../services/scoresaber/scores'
  import {opt} from '../utils/js'
  import Profile from '../components/Player/Profile.svelte'
  import Scores from '../components/Player/Scores.svelte'
  import {SsrHttpNotFoundError} from '../network/errors'

  export let initialPlayerId = null;
  export let initialScoresType = 'recent';
  export let initialScoresPage = 1;
  export let initialState = null;

  const scoresService = createScoresService();

  const players = [
    {id: '76561198035381239', name: 'motzel'},
    {id: '76561198171067154', name: 'Sasasin'},
    {id: '76561198025451538', name: 'Drakonno'},
    {id: '76561198333869741', name: 'Cerret'},
  ];

  let initialType = opt(initialState, 'scoresType', initialScoresType);
  let initialPage = parseInt(opt(initialState, 'page', initialScoresPage), 10);
  if (isNaN(initialPage)) initialPage = 1;

  export const changePlayer = async newPlayerId => playerStore.fetch(newPlayerId);

  let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, initialType, initialPage, initialState);
  let playerIsLoading = opt(playerStore, 'isLoading', false);
  let playerError = opt(playerStore, 'error', null);

  let currentNavType = initialType;
  let currentNavPage = initialPage;

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
    navigate(`/u/${playerId}/${currentNavType}`)
  }

  $: {
    changePlayer(initialPlayerId);
  }

  $: playerId = $playerStore && playerStore && playerStore.getPlayerId ? playerStore.getPlayerId() : null;
  $: currentStoreType = $playerStore && playerStore && playerStore.getType ? playerStore.getType() : null;
  $: currentStorePage = $playerStore && playerStore && playerStore.getPage ? playerStore.getPage() : 1;
  $: skeleton = !$playerStore && $playerIsLoading;
</script>

<article>
  {#if $playerError && $playerError instanceof SsrHttpNotFoundError}
    <div class="box has-shadow">
      <p class="error">Player not found.</p>
    </div>
  {:else}
    <Profile playerData={$playerStore} isLoading={$playerIsLoading} error={$playerError} {skeleton} />

    {#if $playerStore}
      <Scores {playerId} initialState={opt($playerStore, 'scores', null)} initialType={currentStoreType}
              initialPage={currentStorePage}
              numOfScores={opt($playerStore, 'scoreStats.totalPlayCount', null)}
              on:type-changed={onTypeChanged} on:page-changed={onPageChanged}
      />
    {/if}
  {/if}
</article>

<style>
  article {
      max-width: 1024px;
      margin: 0 auto;
  }

  button {
      cursor: pointer;
      min-width: 2rem;
      margin-right: .5rem;
  }
</style>