<script>
  import {opt} from '../../../utils/js'
  import MiniRanking from '../../Ranking/Mini.svelte'

  export let playerInfo = null;

</script>

<div class="mini-ranking">
  <div>
    <MiniRanking rank={opt(playerInfo, 'rank')} numOfPlayers={5} />
  </div>

  {#each opt(playerInfo, 'countries', []) as countryInfo (countryInfo.country)}
    <div>
      <MiniRanking rank={countryInfo.rank} country={countryInfo.country} numOfPlayers={5} />
    </div>
  {/each}
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