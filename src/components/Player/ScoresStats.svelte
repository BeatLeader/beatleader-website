<script>
  import Badge from '../Common/Badge.svelte'

  export let stats;
</script>

{#if stats}
  <div class="badges has-text-centered-mobile">
    {#each stats as stat}
      <Badge {...stat}/>
    {/each}
  </div>
{/if}

<style>
    @media (max-width: 599px) {
        .badges :global(.badge) {
            display: flex;
            width: 100%;
        }

        .badges :global(.badge .label) {
            flex-grow: 1;
            min-width: fit-content;
        }

        .badges :global(.badge .value) {
            width: 7rem!important;
            min-width: fit-content;
        }
    }
</style>