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
  import createAccSaberService from '../services/accsaber'
  import eventBus from '../utils/broadcast-channel-pubsub'
  import Profile from '../components/Player/Profile.svelte'
  import Scores from '../components/Player/Scores.svelte'
  import MiniRanking from '../components/Ranking/Mini.svelte'
  import TwitchVideos from '../components/Player/TwitchVideos.svelte'

  export let initialPlayerId = null;
  export let initialParams = null;

  document.body.classList.remove('slim');

  let playerEl = null;

  let accSaberPlayerInfo = null;
  let accSaberCategories = null;
  const accSaberService = createAccSaberService();

  // TODO: temp only
  let initialScoresType = null;
  let initialScoresPage = 1;

  function processInitialParams(params) {
    const paramsArr = params ? params.split('/') : ['scoresaber', 'recent', '1'];

    const service = paramsArr[0] ?? 'scoresaber';
    let serviceFilters = {};

    switch(service) {
      case 'beatsavior':
        const bsSort = paramsArr[1] ?? 'recent';
        serviceFilters = {sort: bsSort}
        break;

      case 'accsaber':
        const accType = paramsArr[1] ?? 'overall';
        const accSort = paramsArr[2] ?? 'recent';
        let accPage = parseInt(paramsArr[3] ?? null, 10);
        if (isNaN(accPage)) accPage = 1;

        // TODO: temp only for tests
        serviceFilters = {type: accType, sort: accType, page: accSort}
        // serviceFilters = {type: accType, sort: accSort, page: accPage}
        break;

      case 'scoresaber':
      default:
        const ssSort = paramsArr[1] ?? 'recent';
        let ssPage = parseInt(paramsArr[2] ?? null, 10);
        if (isNaN(ssPage)) ssPage = 1;

        serviceFilters = {sort: ssSort, page: ssPage}
        break;
    }

    // TODO: temp only
    initialScoresType = `${service}/${serviceFilters?.sort ?? 'recent'}`;
    initialScoresPage = serviceFilters?.page ?? 1;

    console.log(service, serviceFilters, initialScoresType, initialScoresPage)

    return {service, serviceFilters}
  }

  processInitialParams(initialParams);

  // TODO: replace with service & serviceFilters
  let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, initialScoresType, initialScoresPage);

  const twitchService = createTwitchService();
  let twitchVideos = [];

  async function changeParams(newPlayerId, newType, newPage) {
    if (!newPlayerId) return;

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

  async function updateAccSaberPlayerInfo(playerId) {
    if (!playerId) return;

    accSaberPlayerInfo = await accSaberService.getPlayer(playerId);
    accSaberCategories = await accSaberService.getCategories();
  }

  onMount(async () => {
    const twitchUnsubscribe = eventBus.on('player-twitch-videos-updated', ({playerId: twitchPlayerId, twitchProfile}) => {
      if (twitchPlayerId !== currentPlayerId) return;

      twitchVideos = twitchProfile && twitchProfile.videos && twitchProfile.videos.length ? twitchProfile.videos : [];
    })

    const isPlayerChangeRelevant = player =>
      player?.playerId === currentPlayerId &&
      playerStore &&
      !(playerIsLoading && $playerIsLoading) &&
      (
        player?.profileLastUpdated.getTime() !== $playerStore?.profileLastUpdated?.getTime() ||
        player?.totalPlayCount !== $playerStore?.totalPlayCount ||
        (player?.scoresLastUpdated && !$playerStore?.scoresLastUpdated)
      )

    const playerProfileChangedUnsubscribe = eventBus.on('player-profile-changed', async (player) => {
      if (!isPlayerChangeRelevant(player)) return;

      await playerStore.refresh();
    });

    const playerScoresUpdatedUnsubscribe = eventBus.on('player-scores-updated', async ({player}) => {
      if (!isPlayerChangeRelevant(player)) return;

      await playerStore.refresh();
    });

    return () => {
      twitchUnsubscribe();
      playerProfileChangedUnsubscribe();
      playerScoresUpdatedUnsubscribe();
    }
  })

  $: processInitialParams(initialParams);
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
  $: updateAccSaberPlayerInfo(currentPlayerId);

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
    <Profile playerData={$playerStore} isLoading={$playerIsLoading} error={$playerError} {skeleton} {twitchVideos}
             {accSaberCategories} {accSaberPlayerInfo}
    />

    {#if scoresPlayerId}
      <Scores playerId={scoresPlayerId}
              initialState={scoresState}
              initialStateType={playerStore && $playerStore ? playerStore.getStateType() : 'initial'}
              initialType={$paramsStore.currentScoresType}
              initialPage={$paramsStore.currentScoresPage}
              numOfScores={opt($playerStore, 'scoreStats.totalPlayCount', null)}
              on:type-changed={onTypeChanged} on:page-changed={onPageChanged}
              fixedBrowserTitle={browserTitle}
              withAccSaber={accSaberCategories && accSaberCategories.length && accSaberPlayerInfo && accSaberPlayerInfo.length}
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