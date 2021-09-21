<script>
  import {onMount} from 'svelte'
  import {navigate} from 'svelte-routing'
  import {fade} from 'svelte/transition'
  import createPlayerInfoWithScoresStore from '../stores/http/http-player-with-scores-store'
  import createTwitchService from '../services/twitch'
  import {opt} from '../utils/js'
  import ssrConfig from '../ssr-config'
  import {SsrHttpNotFoundError, SsrHttpUnprocessableEntityError} from '../network/errors'
  import {scrollToTargetAdjusted} from '../utils/browser'
  import Profile from '../components/Player/Profile.svelte'
  import Scores from '../components/Player/Scores.svelte'
  import MiniRanking from '../components/Ranking/Mini.svelte'
  import eventBus from '../utils/broadcast-channel-pubsub'
  import TwitchVideos from '../components/Player/TwitchVideos.svelte'

  export let initialPlayerId = null;
  export let initialScoresType = 'recent';
  export let initialScoresPage = 1;

  const SCORES_TYPES = ['recent', 'top', 'beatsavior']

  document.body.classList.remove('slim');

  let playerEl = null;

  let playerStore = createPlayerInfoWithScoresStore(
    initialPlayerId,
    SCORES_TYPES.includes(initialScoresType) ? initialScoresType : 'recent',
    !isNaN(parseInt(initialScoresPage, 10)) ? parseInt(initialScoresPage, 10) : 1
  );

  const twitchService = createTwitchService();
  let twitchVideos = [];

  async function changeParams(newPlayerId, newType, newPage) {
    if (!newPlayerId) return;

    newType = SCORES_TYPES.includes(newType) ? newType : 'recent'
    newPage = parseInt(newPage, 10);
    if (!Number.isFinite(newPage)) newPage = 1;

    if (!playerStore || newPlayerId !== playerStore.getPlayerId()) {
      playerStore.fetch(newPlayerId, newType, newPage)
    } else {
      playerStore.setType(newType)
      playerStore.setPage(newPage);
    }
  }

  function onPageChanged(event) {
    let newPage = opt(event, 'detail', currentPage);
    if (!newPage) return;

    if (!Number.isFinite(newPage)) newPage = 1;

    navigate(`/u/${currentPlayerId}/${currentType}/${newPage}`);
  }

  function onTypeChanged(event) {
    let newType = opt(event, 'detail', currentType);
    if (!newType) return;

    newType = SCORES_TYPES.includes(newType) ? newType : 'recent';

    navigate(`/u/${currentPlayerId}/${newType}/1`);
  }

  function scrollToTop() {
    if (playerEl) scrollToTargetAdjusted(playerEl, 55)
  }

  async function updateTwitchProfile(playerId) {
    if (!playerId) return;

    const twitchProfile = await twitchService.refresh(playerId);
    twitchVideos = twitchProfile && twitchProfile.videos && twitchProfile.videos.length ? twitchProfile.videos : [];
  }

  onMount(async () => {
    const twitchUnsubscribe = eventBus.on('player-twitch-videos-updated', ({playerId: twitchPlayerId, twitchProfile}) => {
      if (twitchPlayerId !== currentPlayerId) return;

      twitchVideos = twitchProfile && twitchProfile.videos && twitchProfile.videos.length ? twitchProfile.videos : [];
    })

    return () => {
      twitchUnsubscribe();
    }
  })

  $: changeParams(initialPlayerId, initialScoresType, initialScoresPage)

  $: paramsStore = playerStore ? playerStore.params : null;

  $: currentPlayerId = $paramsStore.currentPlayerId;
  $: currentType = $paramsStore.currentScoresType;
  $: currentPage = $paramsStore.currentScoresPage;

  $: playerIsLoading = playerStore ? playerStore.isLoading : null;
  $: playerError = playerStore ? playerStore.error : null;
  $: skeleton = !$playerStore && $playerIsLoading;
  $: browserTitle = `${opt($playerStore, 'name', 'Player')} / ${currentType} / ${currentPage} - ${ssrConfig.name}`

  $: updateTwitchProfile(currentPlayerId);

  let scoresPlayerId = null;
  let scoresState = null;
  $: if ($playerStore && !$playerIsLoading) {
    if (scoresPlayerId && scoresPlayerId === currentPlayerId) {
      scoresState = null;
    } else {
      scoresState = opt($playerStore, 'scores', null);
      scrollToTop();
    }

    scoresPlayerId = currentPlayerId;
  }
</script>

<svelte:head>
  <title>{browserTitle}</title>
</svelte:head>

<section>
<article bind:this={playerEl} transition:fade>
  {#if $playerError && ($playerError instanceof SsrHttpNotFoundError || $playerError instanceof SsrHttpUnprocessableEntityError)}
    <div class="box has-shadow">
      <p class="error">Player not found.</p>
    </div>
  {:else}
    <Profile playerData={$playerStore} isLoading={$playerIsLoading} error={$playerError} {skeleton} {twitchVideos} />

    {#if scoresPlayerId}
      <Scores playerId={scoresPlayerId}
              initialState={scoresState}
              initialStateType={playerStore && $playerStore ? playerStore.getStateType() : 'initial'}
              initialType={$paramsStore.currentScoresType}
              initialPage={$paramsStore.currentScoresPage}
              numOfScores={opt($playerStore, 'scoreStats.totalPlayCount', null)}
              on:type-changed={onTypeChanged} on:page-changed={onPageChanged}
              fixedBrowserTitle={browserTitle}
      />
    {/if}
  {/if}
</article>

<aside>
  <div class="box has-shadow">
    <MiniRanking rank={opt($playerStore, 'playerInfo.rank')} numOfPlayers={5} />
  </div>

  {#each opt($playerStore, 'playerInfo.countries', []) as countryInfo (countryInfo.country)}
    <div class="box has-shadow">
      <MiniRanking rank={countryInfo.rank} country={countryInfo.country} numOfPlayers={5} />
    </div>
  {/each}

  {#if twitchVideos && twitchVideos.length}
    <div class="box has-shadow">
      <TwitchVideos videos={twitchVideos} />
    </div>
  {/if}
</aside>
</section>

<style>
  section {
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
      overflow-x: hidden;
  }

  article {
      width: calc(100% - 25em);
      overflow-x: hidden;
  }

  aside {
      width: 25em;
      margin-left: 1em;
  }

  aside .box {
      padding: 0;
      margin-bottom: 1em;
  }

  button {
      cursor: pointer;
      min-width: 2rem;
      margin-right: .5rem;
  }

  @media screen and (max-width: 1749px) {
      article {
          width: 100%;
      }

      aside {
          display: none;
      }
  }
</style>