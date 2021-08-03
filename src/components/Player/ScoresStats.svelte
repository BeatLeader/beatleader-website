<script>
  import Badge from '../Common/Badge.svelte'
  import Skeleton from '../Common/Skeleton.svelte'

  export let stats;
  export let skeleton = false;
</script>

{#if stats}
  <div class="badges has-text-centered-mobile">
    {#each stats as stat (stat.label+stat.value)}
      <Badge {...stat}/>
    {/each}
  </div>
{:else if skeleton}
  <div class="badges has-text-centered-mobile skeleton">
    {#each Array(5).fill(0) as stat}
      <span class="badge"><Skeleton height="1.5em" /></span>
    {/each}
  </div>
{/if}

<style>
    .badges.skeleton .badge {
        display: inline-block;
        width: 12em;
        margin-right: .5em;
        margin-bottom: .5em;
    }
</style>