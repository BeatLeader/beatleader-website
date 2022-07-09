<script>
  import {createEventDispatcher, onMount} from 'svelte';
  import createPlayerService from '../../services/beatleader/player'
  import {SsrHttpNotFoundError} from '../../network/errors'
  import Autocomplete from '../Common/Autocomplete.svelte'
  import MenuLine from './MenuLine.svelte'
  import queues from '../../network/queues/queues'
  import {MINUTE} from '../../utils/date'

  export let focusField = true;

  const dispatch = createEventDispatcher();

  let value = "";

  const playerService = createPlayerService();

  async function search(query) {

    const response = await playerService.findPlayer(query, queues.PRIORITY.FG_HIGH, {cacheTtl: 5 * MINUTE});

    return response?.data ?? null;
  }

  async function searchFunc(value) {
    if (value.length<1) throw ''

    try {
      const data = await search(value);

      return data ? data : [];
    } catch (err) {
      if (err instanceof SsrHttpNotFoundError) return [];

      throw err;
    }
  }

  async function onItemSelected(item) {
    value = item.playerName;

    dispatch('selected', item.playerId)
  }

  onMount(() => {
    return () => {
      playerService.destroyService();
    }
  })

</script>

<section>
  <Autocomplete bind:value {searchFunc}
                noItemsFound="No players found."
                placeholder="Enter a name..."
                toFocus={focusField}
                on:selected={e => onItemSelected(e.detail)}
  >
    <svelte:fragment slot="row" let:item>
      <MenuLine player={item} />
    </svelte:fragment>
  </Autocomplete>
</section>

<style>
  div.player {
      display: flex;
      justify-content: flex-start;
      align-items: center;
  }

  div.player span.rank {
      width: 4rem;
      min-width: max-content;
      text-align: right;
      padding-right: .5rem;
      flex-basis: 4rem;
      flex-shrink: 0;
      flex-grow: 0;
  }

  div.player span.player {
      white-space: nowrap;
      overflow-x: hidden;
  }

  div.player span.player img {
      margin-right: .125rem;
  }
</style>
