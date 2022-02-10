<script>
  import {onMount} from 'svelte'
  import {navigate} from 'svelte-routing'
  import {fade} from 'svelte/transition'
  import createPlayerInfoWithScoresStore from '../stores/http/http-player-with-scores-store'
  import createTwitchService from '../services/twitch'
  import createAccSaberService from '../services/accsaber'
  import {capitalize, opt} from '../utils/js'
  import ssrConfig from '../ssr-config'
  import {SsrHttpNotFoundError, SsrHttpUnprocessableEntityError} from '../network/errors'
  import {scrollToTargetAdjusted} from '../utils/browser'
  import createServiceParamsManager from '../components/Player/utils/service-param-manager'
  import eventBus from '../utils/broadcast-channel-pubsub'
  import Profile from '../components/Player/Profile.svelte'
  import Scores from '../components/Player/Scores.svelte'
  import MiniRanking from '../components/Ranking/Mini.svelte'
  import AccSaberMiniRanking from '../components/Ranking/AccSaberMini.svelte'
  import TwitchVideos from '../components/Player/TwitchVideos.svelte'
  import ContentBox from "../components/Common/ContentBox.svelte";

  export let initialPlayerId = null;
  export let initialParams = null;

  document.body.classList.remove('slim');

  let playerEl = null;

  let service = null;
  let serviceParams = {};

  const serviceParamsManager = createServiceParamsManager(initialPlayerId);

  processInitialParams(initialPlayerId, initialParams);

  let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, service, serviceParams);

  function processInitialParams(playerId, params) {
    if (playerId !== $playerStore?.playerId) serviceParamsManager.clearServiceParams();

    const serviceInfo = serviceParamsManager.initFromUrl(params);

    service = serviceInfo.service;
    serviceParams = serviceInfo.params;

    return {service, serviceParams}
  }

  const twitchService = createTwitchService();
  let twitchVideos = [];

  const accSaberService = createAccSaberService();

  async function changeParams(newPlayerId, service, serviceParams) {
    if (!newPlayerId) return;

    if (!playerStore || newPlayerId !== playerStore.getPlayerId()) {
      playerStore.fetch(newPlayerId, service, serviceParams)
    } else {
      playerStore.setService(service)
      playerStore.setServiceParams(serviceParams);
    }
  }

  function onPageChanged(event) {
    let newPage = event?.detail ?? null;
    if (!newPage) return;

    if (!Number.isFinite(newPage)) newPage = 1;

    serviceParamsManager.update({page: newPage});

    navigate(`/u/${currentPlayerId}/${serviceParamsManager.getCurrentServiceUrl()}`, {replace: true});
  }

  function onServiceChanged(event) {
    const newService = event?.detail ?? null;
    if (!newService) return;

    if (newService !== serviceParamsManager.getService()) serviceParamsManager.clearServiceParams();

    serviceParamsManager.update({}, newService)

    navigate(`/u/${currentPlayerId}/${serviceParamsManager.getCurrentServiceUrl()}`, {replace: true});
  }

  function onServiceParamsChanged(event) {
    const newServiceParams = event?.detail ?? null;
    if (!newServiceParams) return;

    const oldServiceUrl = serviceParamsManager.getCurrentServiceUrl();

    serviceParamsManager.update(newServiceParams);

    if (oldServiceUrl !== serviceParamsManager.getCurrentServiceUrl()) {
      navigate(`/u/${currentPlayerId}/${serviceParamsManager.getCurrentServiceUrl()}`, {replace: true});
    } else {
      changeParams(currentPlayerId, serviceParamsManager.getService(), serviceParamsManager.getParams())
    }
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

  $: processInitialParams(initialPlayerId, initialParams);
  $: changeParams(initialPlayerId, service, serviceParams)

  $: paramsStore = playerStore ? playerStore.params : null;

  $: currentPlayerId = $paramsStore.currentPlayerId;
  $: currentService = $paramsStore.currentService;
  $: currentServiceParams = $paramsStore.currentServiceParams;

  $: playerIsLoading = playerStore ? playerStore.isLoading : null;
  $: playerError = playerStore ? playerStore.error : null;
  $: skeleton = !$playerStore && $playerIsLoading;
  $: browserTitle = `${$playerStore?.name ?? 'Player'} / ${serviceParamsManager.getCurrentServiceUrl()?.split('/').map(s => capitalize(s)).join(' / ')} - ${ssrConfig.name}`

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
  $: accSaberAvailable = accSaberService.isDataForPlayerAvailable(scoresPlayerId)
</script>

<svelte:head>
  <title>{browserTitle}</title>
</svelte:head>

<section class="align-content">
<article class="page-content" bind:this={playerEl} transition:fade>
  {#if $playerError && ($playerError instanceof SsrHttpNotFoundError || $playerError instanceof SsrHttpUnprocessableEntityError)}
    <ContentBox>
      <p class="error">Player not found.</p>
    </ContentBox>
  {:else}
    <Profile playerData={$playerStore} isLoading={$playerIsLoading} error={$playerError} {skeleton} {twitchVideos} />

    {#if scoresPlayerId}
      <Scores playerId={scoresPlayerId}
              initialState={scoresState}
              initialStateType={playerStore && $playerStore ? playerStore.getStateType() : 'initial'}
              initialService={$paramsStore.currentService}
              initialServiceParams={$paramsStore.currentServiceParams}
              numOfScores={$playerStore?.scoreStats?.totalPlayCount ?? null}
              on:service-changed={onServiceChanged} on:service-params-changed={onServiceParamsChanged}
              on:page-changed={onPageChanged}
              fixedBrowserTitle={browserTitle}
      />
    {/if}
  {/if}
</article>

<aside>
  <ContentBox>
    <MiniRanking rank={opt($playerStore, 'playerInfo.rank')} numOfPlayers={5} />
  </ContentBox>

  {#each opt($playerStore, 'playerInfo.countries', []) as countryInfo (countryInfo.country)}
    <ContentBox>
      <MiniRanking rank={countryInfo.rank} country={countryInfo.country} numOfPlayers={5} />
    </ContentBox>
  {/each}

  {#if twitchVideos && twitchVideos.length}
    <ContentBox>
      <TwitchVideos videos={twitchVideos} />
    </ContentBox>
  {/if}

  {#await accSaberAvailable}
      Loading...
  {:then accSaberAvailable} 
    {#if accSaberAvailable}
      <ContentBox>
        <AccSaberMiniRanking playerId={scoresPlayerId} category="overall" numOfPlayers={5} />
      </ContentBox>
    {/if}
  {/await}

</aside>
</section>

<style>
    .align-content {
        display: flex;
        justify-content: center;
    }

    .page-content {
        max-width: 65em;
        width: 100%;
    }

  article {
      width: calc(100% - 25em);
      overflow-x: hidden;
  }

  aside {
      width: 25em;
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