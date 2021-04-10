<script>
  import Badge from '../Common/Badge.svelte'

  export let stats;
</script>

{#if stats}
  <div class="badges">
    {#each stats as stat}
      <Badge {...stat}/>
    {/each}
  </div>
{/if}