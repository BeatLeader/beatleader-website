<script>
  import {navigate} from "svelte-routing";
  import createConfigService from '../services/config'
  import {onMount} from 'svelte'

  onMount(async () => {
    const mainPlayerId = await createConfigService().getMainPlayerId();

    navigate(mainPlayerId ? `/u/${mainPlayerId}` : '/search')
  })
</script>