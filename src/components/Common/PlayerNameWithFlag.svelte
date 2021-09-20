<script>
  import {createEventDispatcher} from 'svelte';
  import {opt} from '../../utils/js'
  import Flag from './Flag.svelte'

  export let player;

  const dispatch = createEventDispatcher();

  $: country = opt(player, 'playerInfo.countries.0.country')
  $: name = opt(player, 'name')
  $: playerId = opt(player, 'playerId')
</script>

<a href={`/u/${playerId}/recent/1`} class="player-name clickable has-pointer-events" title={name} on:click|preventDefault>
  <Flag {country} on:flag-click />
  <span>{name}</span>
</a>

<style>
    a {
        color: inherit!important;
    }

    .player-name {
        white-space: nowrap;
        overflow-x: hidden;
    }

    .player-name :global(> img) {
        margin-right: .125rem;
    }
</style>