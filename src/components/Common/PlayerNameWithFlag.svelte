<script>
  import {createEventDispatcher} from 'svelte';
  import {opt} from '../../utils/js'
  import Flag from './Flag.svelte'

  export let player;
  export let type = 'scoresaber/recent'
  export let hideFlag = false;

  const dispatch = createEventDispatcher();

  $: country = opt(player, 'playerInfo.countries.0.country')
  $: name = opt(player, 'name')
  $: playerId = opt(player, 'playerId')
</script>

<a href={`/u/${playerId}/${type}/1`} class="player-name clickable has-pointer-events" title={name} on:click|preventDefault>
  {#if !hideFlag}
    <Flag {country} on:flag-click />
  {/if}
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