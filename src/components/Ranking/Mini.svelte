<script>
  import {createEventDispatcher} from 'svelte'
  import createRankingService from '../../services/beatleader/ranking'
  import {opt} from '../../utils/js'
  import {navigate} from 'svelte-routing'
  import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte'
  import Value from '../Common/Value.svelte'
  import Spinner from '../Common/Spinner.svelte'
  import Flag from '../Common/Flag.svelte'
  import {fade} from 'svelte/transition'

  const dispatch = createEventDispatcher();

  export let rank = null;
  export let country = null;
  export let numOfPlayers = 5;

  let rankingService = createRankingService();
  let miniRanking = null;

  let isLoading = false;
  let comparePp = null;

  const prevTitle = "vs ${value}"

  async function onParamsChanged(rank, country, numOfPlayers) {
    try {
      miniRanking = null;
      comparePp = null;

      if (!rank) return;

      isLoading = true;

      const ranking = await rankingService.getMiniRanking(rank, country, numOfPlayers);
      if (!ranking) return;

      comparePp = opt(ranking.find(p =>(country ? opt(p, 'playerInfo.countries.0.rank') : opt(p, 'playerInfo.rank')) === rank), 'playerInfo.pp')
      miniRanking = ranking

      dispatch('height-changed');
    } finally {
      isLoading = false
    }
  }

  $: onParamsChanged(rank, country, numOfPlayers)
</script>

{#if miniRanking || isLoading}
  <section transition:fade>
    <h3 class="title is-6">
      {#if country}
        <Flag {country}/>
      {:else}
        <i class="fas fa-globe-americas svelte-1pb1u1r"></i>
      {/if}
      <span>{country ? 'Country' : 'Global'} ranking</span>
      {#if isLoading}
        <Spinner/>
      {/if}
    </h3>
    {#if miniRanking}
      <div class="players">
        {#each miniRanking as player}
          <div class="rank">
            <Value value={country ? opt(player, 'playerInfo.countries.0.rank') : opt(player, 'playerInfo.rank')} zero="" digits={0} prefix="#"/>
          </div>

          <PlayerNameWithFlag {player} on:click={() => navigate(`/u/${player.playerId}/beatleader/date/1`)}/>

          <div class="pp">
            <Value value={opt(player, 'playerInfo.pp')} prevValue={comparePp} zero="" suffix="pp" {prevTitle} />
          </div>
        {/each}
      </div>
    {/if}
  </section>
{/if}

<style>
    section {
        width: 100%;

        padding: .5em;
        font-size: .875em;
    }

    h3 {
        padding: .25em;
        margin-bottom: .75em !important;
    }

    h3 > span {
        margin-left: .25em;
    }

    .players {
        display: grid;
        grid-template-columns: auto 1fr auto;
        grid-row-gap: .25em;
    }

    .players :global(> *) {
        border-bottom: 1px solid var(--dimmed);
        padding: .125em .25em;
    }


    .rank {
        text-align: right;
    }

    .rank :global(.value) {
      font-weight: bold;
    }

    .players :global(.player-name) {
        overflow-x: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .pp {
        display: inline-flex;
        align-items: center;
        min-width: 10.75em;
        color: var(--ppColour);
    }

    .pp :global(> :nth-child(2)) {
        margin-left: .5em;
    }
</style>