<script>
  import {onMount} from 'svelte'
  import {navigate} from 'svelte-routing'
  import {fade} from 'svelte/transition'
  import createPlayerInfoWithScoresStore from '../stores/http/http-player-with-scores-store'
  import createTwitchService from '../services/twitch'
  import {capitalize, opt} from '../utils/js'
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

  const createServiceParamsManager = () => {
    let currentService = null;
    let currentServiceParams = {};

    const getAvailableServices = () => ['scoresaber', 'beatsavior', 'accsaber'];

    const get = () => ({service: currentService, params: currentServiceParams});

    const getDefaultParams = service => {
      switch(service) {
        case 'beatsavior': return {sort: 'recent', page: 1, filters: {}};

        case 'accsaber': return {type: 'overall', sort: 'recent', page: 1, filters: {}}

        case 'scoresaber':
        default:
          return {sort: 'recent', page: 1, filters: {}}
      }
    }

    const update = (serviceParams = {}, service = currentService) => {
      const availableServices = getAvailableServices();
      if (!availableServices.includes(service)) service = availableServices?.[0] ?? 'scoresaber';

      const defaultServiceParams = getDefaultParams(service);

      if (defaultServiceParams?.page && !Number.isFinite(serviceParams?.page)) {
        const val = parseInt(serviceParams?.page, 10);
        serviceParams.page = !isNaN(val) ? val : 1;
      }

      currentService = service;
      currentServiceParams = {...defaultServiceParams, ...currentServiceParams, ...serviceParams}

      return get();
    }

    const set = (serviceParams = {}, service = currentService) => {
      currentServiceParams = {};

      return update(serviceParams, service)
    }

    const initFromUrl = (url = null) => {
      const availableServices = getAvailableServices();
      const defaultService = availableServices?.[0] ?? 'scoresaber';
      const paramsArr = url ? url.split('/') : [defaultService];

      const service = paramsArr[0] ?? 'scoresaber';
      const serviceParamsUrl = paramsArr.slice(1).join('/')

      const serviceDefaultParams = getDefaultParams(service);

      switch(service) {
        case 'beatsavior':
          return set(
            {
              sort: paramsArr[1] ?? serviceDefaultParams?.sort,
              page: paramsArr[2] ?? serviceDefaultParams?.page,
            },
            service,
          );

        case 'accsaber':
          return set(
            {
              type: paramsArr[1] ?? serviceDefaultParams?.type,
              sort: paramsArr[2] ?? serviceDefaultParams?.sort,
              page: paramsArr[3] ?? serviceDefaultParams?.page,
            },
            service,
          );

        case 'scoresaber':
        default:
          return set(
            {
              sort: paramsArr[1] ?? serviceDefaultParams?.sort,
              page: paramsArr[2] ?? serviceDefaultParams?.page,
            },
            service,
          );
      }
    }

    const getUrl = (service, params = {}) => {
      if (!service) return '';

      const serviceDefaultParams = getDefaultParams(service);

      switch(service) {
        case 'beatsavior': return `${service}/${params?.sort ?? serviceDefaultParams?.sort}/${params?.page
            ?? serviceDefaultParams?.page}`;

        case 'accsaber': return `${service}/${params?.type ?? serviceDefaultParams?.type}/${params?.sort ?? serviceDefaultParams?.sort}/${params?.page ?? serviceDefaultParams?.page}`;

        case 'scoresaber': return `${service}/${params?.sort ?? serviceDefaultParams?.sort}/${params?.page
        ?? serviceDefaultParams?.page}`;
      }
    }

    const getCurrentUrl = () => getUrl(currentService, currentServiceParams);
    const getDefaultUrl = service => getUrl(currentService, {})

    return {
      getAvailableServices,
      initFromUrl,
      getCurrentUrl,
      getDefaultUrl,
      get,
      getService: () => currentService,
      getParams: () => currentServiceParams,
      update,
      set,
    }
  }

  let service = null;
  let serviceParams = {};

  const serviceParamsManager = createServiceParamsManager();

  function processInitialParams(params) {
    const serviceInfo = serviceParamsManager.initFromUrl(params);

    service = serviceInfo.service;
    serviceParams = serviceInfo.params;

    return {service, serviceParams}
  }

  processInitialParams(initialParams);

  // TODO: replace with service & serviceFilters
  let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, service, serviceParams);

  const twitchService = createTwitchService();
  let twitchVideos = [];

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

    navigate(`/u/${currentPlayerId}/${serviceParamsManager.getCurrentUrl()}`);
  }

  function onServiceChanged(event) {
    const newService = event?.detail ?? null;
    if (!newService) return;

    serviceParamsManager.set({}, newService)

    navigate(`/u/${currentPlayerId}/${serviceParamsManager.getCurrentUrl()}`);
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
  $: changeParams(initialPlayerId, service, serviceParams)

  $: paramsStore = playerStore ? playerStore.params : null;

  $: currentPlayerId = $paramsStore.currentPlayerId;
  $: currentService = $paramsStore.currentService;
  $: currentServiceParams = $paramsStore.currentServiceParams;

  $: playerIsLoading = playerStore ? playerStore.isLoading : null;
  $: playerError = playerStore ? playerStore.error : null;
  $: skeleton = !$playerStore && $playerIsLoading;
  $: browserTitle = `${$playerStore?.name ?? 'Player'} / ${serviceParamsManager.getCurrentUrl()?.split('/').map(s => capitalize(s)).join(' / ')} - ${ssrConfig.name}`

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

  $: console.error(service, serviceParams);
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
              initialService={$paramsStore.currentService}
              initialServiceParams={$paramsStore.currentServiceParams}
              numOfScores={$playerStore?.scoreStats?.totalPlayCount ?? null}
              on:service-changed={onServiceChanged} on:page-changed={onPageChanged}
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