<script>
  import {opt} from '../../utils/js'

  export let player = null;
  export let withRank = true;

  $: rank = opt(player, 'playerInfo.rank')
  $: country = opt(player, 'playerInfo.countries.0.country')
</script>

{#if player}
<div class="player">
  {#if withRank}
    <span class="rank">#{rank}</span>
  {/if}
  <span class="player">
    <img src={`https://scoresaber.com/imports/images/flags/${country ? country.toLowerCase() : '' }.png`} loading="lazy">
    <span>{player.name}</span>
  </span>
</div>
{/if}

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