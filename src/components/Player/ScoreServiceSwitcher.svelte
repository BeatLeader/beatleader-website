<script>
  import {createEventDispatcher} from 'svelte'
  import createBeatSaviorService from '../../services/beatsavior'
  import createAccSaberService from '../../services/accsaber'
  import Switcher from '../Common/Switcher.svelte'

  export let playerId = null;
  export let service = 'scoresaber';
  export let serviceParams = {sort: 'recent'}
  export let loadingService = null;
  export let loadingServiceParams = null;

  const dispatch = createEventDispatcher();

  const beatSaviorService = createBeatSaviorService();
  const accSaberService = createAccSaberService();

  let availableServiceNames = ['scoresaber'];

  const allServices = [
    {
      id: 'scoresaber',
      label: 'Score Saber',
      icon: '<div class="scoresaber-icon"></div>',
      url: `/u/${playerId}/scoresaber/recent/1`,
      switcherComponent: Switcher,
      switcherComponentProps: {
        values: [
          {id: 'recent', 'label': 'Recent', iconFa: 'fa fa-clock', url: `/u/${playerId}/scoresaber/recent/1`},
          {id: 'top', 'label': 'Top', iconFa: 'fa fa-cubes', url: `/u/${playerId}/scoresaber/top/1`},
        ],
      },
      onSwitcherChange: event => {
        if (!event?.detail?.id) return null;

        dispatch('service-params-change', {sort: event?.detail?.id})
      },
    },
    {
      id: 'beatsavior',
      label: 'Beat Savior',
      icon: '<div class="beatsavior-icon"></div>',
      url: `/u/${playerId}/beatsavior/recent/1`,
    },
    {
      id: 'accsaber',
      label: 'AccSaber',
      icon: '<div class="accsaber-icon"></div>',
      url: `/u/${playerId}/accsaber/recent/1`,
    },
  ];

  async function updateAvailableServiceNames(playerId) {
    const additionalServices = (await Promise.all([
        beatSaviorService.isDataForPlayerAvailable(playerId).then(r => r ? 'beatsavior' : null),
        accSaberService.isDataForPlayerAvailable(playerId).then(r => r ? 'accsaber' : null),
      ])
    ).filter(s => s);

    if (additionalServices?.length) availableServiceNames = ['scoresaber'].concat(additionalServices);
  }

  function updateAvailableServices(avaiableServiceNames, service, loadingService, serviceParams, loadingServiceParams) {
    return allServices
      .filter(s => availableServiceNames.includes(s?.id))
      .map(s => {
        if (s?.id !== service || !s?.switcherComponent || !s?.switcherComponentProps) return s;

        s.switcherComponentProps.value = s?.switcherComponentProps?.values?.length
          ? s.switcherComponentProps.values.find(v => v?.id === serviceParams?.sort)
          : null;

        s.switcherComponentProps.loadingValue = s?.switcherComponentProps?.values?.length
          ? s.switcherComponentProps.values.find(v => v?.id === loadingServiceParams?.sort)
          : null;

        return s;
      })
  }

  function onServiceChanged(event) {
    if (!event?.detail?.id) return;

    dispatch('service-change', event.detail.id)
  }

  $: updateAvailableServiceNames(playerId)
  $: availableServices = updateAvailableServices(availableServiceNames, service, loadingService, serviceParams, loadingServiceParams)

  $: serviceObj = availableServices.find(s => s.id === service);
  $: loadingServiceObj = availableServices.find(s => s.id === loadingService)
</script>

<nav>
  <Switcher values={availableServices} value={serviceObj} on:change={onServiceChanged}
            loadingValue={loadingServiceObj}/>

  {#if serviceObj?.switcherComponent}
    <svelte:component this={serviceObj.switcherComponent} {...serviceObj.switcherComponentProps}
                      on:change={serviceObj.onSwitcherChange ?? null}
    />
  {/if}

  {#if serviceObj?.filters}
    <span>TODO: service filters</span>
  {/if}
</nav>

<style>
    nav {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        flex-wrap: wrap;
    }

    nav :global(> *) {
        margin-bottom: 1rem;
    }
</style>