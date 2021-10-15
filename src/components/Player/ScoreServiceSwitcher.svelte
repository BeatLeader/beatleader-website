<script>
  import {createEventDispatcher} from 'svelte'
  import createBeatSaviorService from '../../services/beatsavior'
  import createAccSaberService from '../../services/accsaber'
  import Switcher from '../Common/Switcher.svelte'

  export let playerId = null;
  export let service = 'scoresaber';
  export let loadingService = null;

  const dispatch = createEventDispatcher();

  const beatSaviorService = createBeatSaviorService();
  const accSaberService = createAccSaberService();

  let availableServiceNames = ['scoresaber'];

  const allServices = [
    {id: 'scoresaber', label: 'Score Saber', icon: '<div class="scoresaber-icon"></div>', url: `/u/${playerId}/scoresaber/recent/1`},
    {id: 'beatsavior', label: 'Beat Savior', icon: '<div class="beatsavior-icon"></div>', url: `/u/${playerId}/beatsavior/recent/1`},
    {id: 'accsaber', label: 'AccSaber', icon: '<div class="accsaber-icon"></div>', url: `/u/${playerId}/accsaber/recent/1`},
  ];

  async function updateAvailableServiceNames(playerId) {
    const additionalServices = (await Promise.all([
        beatSaviorService.isDataForPlayerAvailable(playerId).then(r => r ? 'beatsavior' : null),
        accSaberService.isDataForPlayerAvailable(playerId).then(r => r ? 'accsaber' : null),
      ])
    ).filter(s => s);

    if (additionalServices?.length) availableServiceNames = ['scoresaber'].concat(additionalServices);
  }

  function onServiceChanged(event) {
    if (!event?.detail?.id) return;

    dispatch('change', event.detail.id)
  }

  $: updateAvailableServiceNames(playerId)
  $: availableServices = allServices.filter(s => availableServiceNames.includes(s?.id))

  $: serviceObj = availableServices.find(s => s.id === service);
  $: loadingServiceObj = availableServices.find(s => s.id === loadingService)
</script>

<Switcher values={availableServices} value={serviceObj} on:change={onServiceChanged} loadingValue={loadingServiceObj} />

<style>

</style>