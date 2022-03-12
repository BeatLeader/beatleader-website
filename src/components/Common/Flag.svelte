<script>
  import {createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();

  export let country;

</script>

{#if country && country.length}
  <img src={`https://beatleader3.azureedge.net/flags/${country ? country.toLowerCase() : '' }.png`} loading="lazy"
       class="country"
       on:click|preventDefault={() => dispatch('flag-click', {country: country.toLowerCase()})}>
{/if}

<style>
  .country {
    width: 1.2em;
  }
</style>