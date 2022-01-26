<script>
  import {opt} from '../../../utils/js'
  import createAccSaberService from '../../../services/accsaber'
  import MiniRanking from '../../Ranking/Mini.svelte'
  import AccSaberMiniRanking from '../../Ranking/AccSaberMini.svelte'

  export let player = null;

  const accSaberService = createAccSaberService();

  $: accSaberAvailable = accSaberService.isDataForPlayerAvailable(player.playerId)
</script>

<div class="mini-ranking">
  <div>
    <MiniRanking rank={opt(player, 'playerInfo.rank')} numOfPlayers={5} on:height-changed />
  </div>

  {#each opt(player, 'playerInfo.countries', []) as countryInfo (countryInfo.country)}
    <div>
      <MiniRanking rank={countryInfo.rank} country={countryInfo.country} numOfPlayers={5} on:height-changed />
    </div>
  {/each}

  {#if accSaberAvailable} 
    <div>
      <AccSaberMiniRanking playerId={player.playerId} category="overall" numOfPlayers={5} />
    </div>
  {/if}
</div>

<style>
    .mini-ranking {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 1rem;
    }

    .mini-ranking :global(section) {
        padding-left: 0!important;
        padding-right: 0!important;
    }

    .mini-ranking :global(section > h3) {
        padding-left: 0!important;
        padding-right: 0!important;
    }

    @media (max-width: 1023px) {
        .mini-ranking {
            grid-template-columns: 1fr;
        }
    }
</style>