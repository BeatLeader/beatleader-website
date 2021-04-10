<script>
  import {fade} from 'svelte/transition'

  export let badges;
</script>

{#if badges}
  <div class="ss-badges" transition:fade={{ duration: 500 }}>
    {#each badges as badge (badge.src)}
      <img src={badge.src} alt={badge.title} title={badge.title}/>
    {/each}
  </div>
{/if}

<style>
    .ss-badges {
        max-width: 90%;
        display: flex;
        flex-wrap: wrap;
    }

    .ss-badges img {
        margin-right: .5rem;
        margin-bottom: .25rem;
    }
</style>