<script>
  import {createEventDispatcher} from 'svelte'
  import createScoresService from '../../services/beatleader/scores'
  import createBeatSaviorService from '../../services/beatsavior'
  import createAccSaberService from '../../services/accsaber'
  import Switcher from '../Common/Switcher.svelte'
  import ScoreServiceFilters from './ScoreServiceFilters.svelte'
  import TextFilter from './ScoreFilters/TextFilter.svelte'
  import SelectFilter from './ScoreFilters/SelectFilter.svelte'

  export let playerId = null;
  export let service = 'beatleader';
  export let serviceParams = {sort: 'date', order: 'desc'}
  export let loadingService = null;
  export let loadingServiceParams = null;

  const dispatch = createEventDispatcher();

  const scoresService = createScoresService();
  const beatSaviorService = createBeatSaviorService();
  const accSaberService = createAccSaberService();

  let availableServiceNames = ['beatleader'];
  let accSaberCategories = null;

  const allServices = [
    {
      id: 'beatleader',
      label: 'BeatLeader',
      icon: '<div class="beatleader-icon"></div>',
      url: `/u/${playerId}/beatleader/date/1`,
      switcherComponents: [
        {
          component: Switcher,
          props: {
            values: [
              {id: 'date', 'label': 'Date', title: 'Sort by date', iconFa: 'fa fa-clock', url: `/u/${playerId}/beatleader/date/1`},
              {id: 'pp', 'label': 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes', url: `/u/${playerId}/beatleader/pp/1`},
              {id: 'acc', 'label': 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs', url: `/u/${playerId}/beatleader/acc/1`},
              {id: 'rank', 'label': 'Rank', title: 'Sort by rank',iconFa: 'fa fa-list-ol', url: `/u/${playerId}/beatleader/rank/1`},
              {id: 'stars', 'label': 'Stars', title: 'Sort by song stars', iconFa: 'fa fa-star', url: `/u/${playerId}/beatleader/stars/1`},
            ],
          },
          key: 'sort',
          onChange: event => {
            if (!event?.detail?.id) return null;

            dispatch('service-params-change', {sort: event.detail.id, ...(serviceParams?.sort === event.detail.id ? {order: serviceParams?.order === 'asc' ? 'desc' : 'asc'} : null)})
          }
        }
      ],
    },
    {
      id: 'beatsavior',
      label: 'Beat Savior',
      icon: '<div class="beatsavior-icon"></div>',
      url: `/u/${playerId}/beatsavior/date/1`,
      switcherComponents: [
        {
          component: Switcher,
          props: {
            values: [
              {id: 'date', 'label': 'Date', iconFa: 'fa fa-clock', url: `/u/${playerId}/beatsavior/date/1`},
              {id: 'acc', 'label': 'Acc', iconFa: 'fa fa-crosshairs', url: `/u/${playerId}/beatsavior/acc/1`},
              {id: 'mistakes', 'label': 'Mistakes', iconFa: 'fa fa-times', url: `/u/${playerId}/beatsavior/mistake/1`},
            ],
          },
          key: 'sort',
          onChange: event => {
            if (!event?.detail?.id) return null;

            dispatch('service-params-change', {sort: event.detail.id, ...(serviceParams?.sort === event.detail.id ? {order: serviceParams?.order === 'asc' ? 'desc' : 'asc'} : null)})
          }
        },
      ],
    },
    {
      id: 'accsaber',
      label: 'AccSaber',
      icon: '<div class="accsaber-icon"></div>',
      url: `/u/${playerId}/accsaber/date/1`,
      switcherComponents: [
        {
          component: Switcher,
          key: 'type',
          onChange: event => {
            if (!event?.detail?.id) return null;

            dispatch('service-params-change', {type: event?.detail?.id})
          },
        },
        {
          component: Switcher,
          key: 'sort',
          props: {
            values: [
              {id: 'ap', 'label': 'AP', iconFa: 'fa fa-cubes'},
              {id: 'date', 'label': 'Date', iconFa: 'fa fa-clock'},
              {id: 'acc', 'label': 'Acc', iconFa: 'fa fa-crosshairs'},
              {id: 'rank', 'label': 'Rank', iconFa: 'fa fa-list-ol'},
            ],
          },
          onChange: event => {
            if (!event?.detail?.id) return null;

            dispatch('service-params-change', {sort: event.detail.id, ...(serviceParams?.sort === event.detail.id ? {order: serviceParams?.order === 'asc' ? 'desc' : 'asc'} : null)})
          },
        },
      ],
    },
  ];

  async function updateAvailableServiceNames(playerId) {
    accSaberCategories = null;

    const additionalServices = (await Promise.all([
        scoresService.isDataForPlayerAvailable(playerId).then(r => r ? 'beatleader-cached' : null),
        beatSaviorService.isDataForPlayerAvailable(playerId).then(r => r ? 'beatsavior' : null),
        accSaberService.isDataForPlayerAvailable(playerId).then(r => r ? 'accsaber' : null),
      ])
    ).filter(s => s);

    if (additionalServices?.length) availableServiceNames = ['beatleader'].concat(additionalServices);

    if (additionalServices.includes('accsaber')) accSaberCategories = await accSaberService.getCategories();
  }

  function updateAvailableServices(avaiableServiceNames, service, loadingService, serviceParams, loadingServiceParams, accSaberCategories) {
    const commonFilters = [
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

    return allServices
      .filter(s => availableServiceNames.includes(s?.id))
      .map(s => {
        if (s?.id !== service || !s?.switcherComponents?.length) return s;

        const serviceDef = {...s};
        serviceDef.switcherComponents = serviceDef.switcherComponents.map(c => ({...c, props: {...c?.props, ...(c?.props?.values ? {values: c.props.values.map(v => ({...v}))} : null)}}));

        const currentSortButton = serviceDef.switcherComponents.find(c => c.key === 'sort')?.props?.values?.find(b => b?.id === serviceParams?.sort);
        if (currentSortButton?.iconFa) {
          currentSortButton.iconFa = `fa fa-long-arrow-alt-${serviceParams?.order === 'asc' ? 'up' : 'down'}`;
        }

        switch (service) {
          case 'beatleader':
            if (availableServiceNames.includes('beatleader')) {
              serviceDef.filters = [...commonFilters]
                .concat([
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
                      ],
                    },
                  },
                ]);
            }
            break;

          case 'beatsavior':
            serviceDef.filters = [...commonFilters];
            break;

          case 'accsaber':
            serviceDef.filters = [...commonFilters];

            if (accSaberCategories?.length) {
              const typeComponent = serviceDef.switcherComponents.find(c => c?.key === 'type');
              if (typeComponent)
                typeComponent.props = {
                  values: accSaberCategories.map(c => ({
                    id: c.name,
                    'label': c.displayName ?? c.name,
                    url: `/u/${playerId}/${service}/${c.name}/date/1`,
                  })),
                }
            }
            break;
        }

        serviceDef.switcherComponents = serviceDef.switcherComponents
          .filter(c => c?.props)
          .map(c => {
            const key = c?.key ?? 'sort';

            [
              {propKey: 'value', compareObj: serviceParams},
              {propKey: 'loadingValue', compareObj: loadingServiceParams},
            ].forEach(o => c.props[o.propKey] = c.props?.values?.find(v => v?.id === o.compareObj?.[key]) ?? null)

            return c;
          })

        if (!serviceDef?.switcherComponents?.length) return null;

        return serviceDef;
      })
      .filter(s => s)
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

  {#if serviceObj?.switcherComponents?.length}
    {#each serviceObj.switcherComponents as component (`${serviceObj?.id ?? ''}${component.key ?? 'sort'}`)}
      <svelte:component this={component.component} {...component.props}
                        on:change={component.onChange ?? null}
      />
    {/each}
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
        align-items: flex-start;
        flex-wrap: wrap;
    }

    nav :global(> *) {
        margin-bottom: 1rem;
        margin-right: .75rem;
    }

    nav :global(> *:last-child) {
        margin-right: 0;
    }
</style>