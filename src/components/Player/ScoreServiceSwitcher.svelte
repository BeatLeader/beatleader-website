<script>
  import {createEventDispatcher} from 'svelte'
  import createScoresService from '../../services/scoresaber/scores'
  import createBeatSaviorService from '../../services/beatsavior'
  import createAccSaberService from '../../services/accsaber'
  import Switcher from '../Common/Switcher.svelte'
  import ScoreServiceFilters from './ScoreServiceFilters.svelte'
  import TextFilter from './ScoreFilters/TextFilter.svelte'
  import SelectFilter from './ScoreFilters/SelectFilter.svelte'

  export let playerId = null;
  export let service = 'scoresaber';
  export let serviceParams = {sort: 'recent', order: 'desc'}
  export let loadingService = null;
  export let loadingServiceParams = null;

  const dispatch = createEventDispatcher();

  const scoresService = createScoresService();
  const beatSaviorService = createBeatSaviorService();
  const accSaberService = createAccSaberService();

  let availableServiceNames = ['scoresaber'];
  let accSaberCategories = null;

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
      switcherComponent: Switcher,
      switcherComponentProps: {
        values: [
          {id: 'recent', 'label': 'Recent', iconFa: 'fa fa-clock', url: `/u/${playerId}/beatsavior/recent/1`},
          {id: 'acc', 'label': 'Acc', iconFa: 'fa fa-crosshairs', url: `/u/${playerId}/beatsavior/acc/1`},
          {id: 'mistakes', 'label': 'Mistakes', iconFa: 'fa fa-times', url: `/u/${playerId}/beatsavior/mistake/1`},
        ],
      },
      onSwitcherChange: event => {
        if (!event?.detail?.id) return null;

        dispatch('service-params-change', {sort: event?.detail?.id})
      },
    },
    {
      id: 'accsaber',
      label: 'AccSaber',
      icon: '<div class="accsaber-icon"></div>',
      url: `/u/${playerId}/accsaber/recent/1`,
      switcherComponent: Switcher,
      switcherValueKey: 'type',
      onSwitcherChange: event => {
        if (!event?.detail?.id) return null;

        dispatch('service-params-change', {type: event?.detail?.id})
      },
    },
  ];

  async function updateAvailableServiceNames(playerId) {
    accSaberCategories = null;

    const additionalServices = (await Promise.all([
        scoresService.isDataForPlayerAvailable(playerId).then(r => r ? 'scoresaber-cached' : null),
        beatSaviorService.isDataForPlayerAvailable(playerId).then(r => r ? 'beatsavior' : null),
        accSaberService.isDataForPlayerAvailable(playerId).then(r => r ? 'accsaber' : null),
      ])
    ).filter(s => s);

    if (additionalServices?.length) availableServiceNames = ['scoresaber'].concat(additionalServices);

    if (additionalServices.includes('accsaber')) accSaberCategories = await accSaberService.getCategories();
  }

  function updateAvailableServices(avaiableServiceNames, service, loadingService, serviceParams, loadingServiceParams, accSaberCategories) {
    return allServices
      .filter(s => availableServiceNames.includes(s?.id))
      .map(s => {
        if (s?.id !== service || !s?.switcherComponent) return s;

        switch (service) {
          case 'scoresaber':
            if (availableServiceNames.includes('scoresaber-cached')) {
              console.error('TODO: SCORESABER add sort by acc/rank/stars to switcherComponentProps')

              s.filters = [
                {
                  component: TextFilter,
                  props: {
                    id: 'search',
                    iconFa: 'fa fa-search',
                    title: 'Search by song/artist/mapper name',
                    placeholder: 'Enter song name...'
                  }
                },
                {
                  component: SelectFilter,
                  props: {
                    id: 'songType',
                    iconFa: 'fa fa-cubes',
                    title: 'Filter by map type',
                    values: [
                      {id: null, name: 'All'},
                      {id: 'ranked', name: 'Ranked only'},
                      {id: 'unranked', name: 'Unranked only'},
                    ]
                  }
                },
                {
                  component: SelectFilter,
                  props: {
                    id: 'diff',
                    iconFa: 'fa fa-chart-line',
                    title: 'Filter by map difficulty',
                    values: [
                      {id: null, name: 'All'},
                      {id: 'easy', name: 'Easy'},
                      {id: 'normal', name: 'Normal'},
                      {id: 'hard', name: 'Hard'},
                      {id: 'expert', name: 'Expert'},
                      {id: 'expertplus', name: 'Expert+'},
                    ]
                  }
                }
              ];
            }
            break;

          case 'beatsavior':
            s.filters = [
              {
                component: TextFilter,
                props: {
                  id: 'search',
                  iconFa: 'fa fa-search',
                  title: 'Search by song/artist/mapper name',
                }
              }
            ];
            break;

          case 'accsaber':
            s.filters = [
              {
                component: TextFilter,
                props: {
                  id: 'search',
                  iconFa: 'fa fa-search',
                  title: 'Search by song/artist/mapper name',
                }
              }
            ];

            if (accSaberCategories?.length)
              s.switcherComponentProps = {
                values: accSaberCategories.map(c => ({
                  id: c.name,
                  'label': c.displayName ?? c.name,
                  url: `/u/${playerId}/${service}/${c.name}/recent/1`,
                })),
              }
            break;
        }


        if (!s?.switcherComponentProps) return s;

        const key = s?.switcherValueKey ?? 'sort';

        s.switcherComponentProps.value = s.switcherComponentProps?.values?.length
          ? s.switcherComponentProps.values.find(v => v?.id === serviceParams?.[key])
          : null;

        s.switcherComponentProps.loadingValue = s.switcherComponentProps?.values?.length
          ? s.switcherComponentProps.values.find(v => v?.id === loadingServiceParams?.[key])
          : null;

        return s;
      })
  }

  function onServiceChanged(event) {
    if (!event?.detail?.id) return;

    dispatch('service-change', event.detail.id)
  }

  function onFiltersChanged(event) {
    const newFilters = event?.detail ?? {}

    const {sort, order, ...filters} = newFilters;

    const changesToPush = {
      ...(sort? {sort} : null),
      ...(order? {order} : null),
      ...(filters ? {filters} : {filters: {}})
    }

    dispatch('service-params-change', changesToPush)
  }

  $: updateAvailableServiceNames(playerId)
  $: availableServices = updateAvailableServices(availableServiceNames, service, loadingService, serviceParams, loadingServiceParams, accSaberCategories)

  $: serviceObj = availableServices.find(s => s.id === service);
  $: loadingServiceObj = availableServices.find(s => s.id === loadingService)
</script>

<nav>
  <Switcher values={availableServices} value={serviceObj} on:change={onServiceChanged}
            loadingValue={loadingServiceObj}/>

  {#if serviceObj?.switcherComponent && serviceObj?.switcherComponentProps}
    <svelte:component this={serviceObj.switcherComponent} {...serviceObj.switcherComponentProps}
                      on:change={serviceObj.onSwitcherChange ?? null}
    />
  {/if}

  {#if serviceObj?.filters}
    {#key `${playerId}${service}`}
      <ScoreServiceFilters filters={serviceObj.filters} on:change={onFiltersChanged}/>
    {/key}
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