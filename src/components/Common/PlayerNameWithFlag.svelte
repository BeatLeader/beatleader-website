<script>
  import {opt} from '../../utils/js'

  export let player;

  $: country = opt(player, 'playerInfo.countries.0.country')
  $: name = opt(player, 'name')
</script>

<span class="player-name" title={name} on:click>
  <img src={`https://scoresaber.com/imports/images/flags/${country ? country.toLowerCase() : '' }.png`} loading="lazy">
  <span>{name}</span>
</span>

<style>
    .player-name {
        white-space: nowrap;
        overflow-x: hidden;
    }

    .player-name img {
        margin-right: .125rem;
    }
</style>