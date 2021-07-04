<script>
  import {createEventDispatcher, onMount} from 'svelte';
  import createPlayerService from '../../services/scoresaber/player'
  import {SsrHttpNotFoundError} from '../../network/errors'
  import Autocomplete from '../Common/Autocomplete.svelte'

  const dispatch = createEventDispatcher();

  let value = "";
  let items = [];

  const playerService = createPlayerService();

  async function search(query) {
    const matches = query.match(/^\s*https:\/\/(?:new\.)?scoresaber.com\/u\/(\d+)/);
    if (matches) {
      dispatch('selected', matches[1])

      return [];
    }

    return playerService.findPlayer(query);
  }

  async function searchFunc(value) {
    if (!value || !value.length || value.trim().length < 4) throw 'Please enter at least 4 characters'

    try {
      const data = await search(value);

      return data && data.players ? data.players : [];
    }
    catch(err) {
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
                placeholder="Enter a name or ScoreSaber profile..."
                on:selected={e => onItemSelected(e.detail)}
  >
    <svelte:fragment slot="row" let:item>
      <div class="player">
        <span class="rank">#{item.rank}</span>
        <span class="player">
          <img src={`https://scoresaber.com/imports/images/flags/${item && item.country ? item.country.toLowerCase() : '' }.png`} loading="lazy">
          <span>{item.playerName}</span>
        </span>
      </div>
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