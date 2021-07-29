<script>
  import {formatNumber} from '../../../utils/format'
  import Value from '../../Common/Value.svelte'

  const MAX_BLOCK_VALUE = 115;

  export let accGrid = null;
</script>

{#if accGrid && Array.isArray(accGrid) && accGrid.length === 12}
  <div class="grid">
    {#each accGrid as gridVal}
      <span>
        {#if Number.isFinite(gridVal)}
          <Value value={gridVal} digits={2} title={Number.isFinite(gridVal) ? formatNumber(gridVal/MAX_BLOCK_VALUE*100)+'%' : ''}/>
        {:else}
        {/if}
      </span>
    {/each}
  </div>
{/if}

<style>
    .grid {
        display: inline-grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        grid-gap: .5em;
        font-size: .75em;
        min-height: 12em;
    }

    .grid > span {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--dimmed);
        width: 3.5em;
        height: 3.5em;
    }
</style>