<script>
  import {createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();

  export let items = [];
  export let shown = false;
  export let noItems = null;
</script>

<div class="dropdown-menu" role="menu" class:shown>
  <div class="dropdown-content">
    {#if items && items.length}
      {#each items as item}
        <div class="dropdown-item" on:click={() => dispatch('select', item)}>
          <slot name="row" {item}>
            {item}
          </slot>
        </div>
      {/each}
    {:else if noItems}
      <div class="menu-label">{noItems}</div>
    {/if}
  </div>
</div>

<style>
    .dropdown-menu {
        display: none;
        left: 0;
        right: 0;
        width: 100%;
        max-height: 15rem;
        overflow-y: auto;
        border: 1px solid var(--dimmed);
        border-radius: .25rem;
        padding: 0;
    }

    .dropdown-menu.shown {
        display: block;
    }

    .dropdown-menu::-webkit-scrollbar {
        width: .25rem;
    }
    body::-webkit-scrollbar-track {
        background: var(--foreground, #fff);
    }
    .dropdown-menu::-webkit-scrollbar-thumb {
        background-color: var(--selected, #3273dc) ;
        border-radius: 6px;
        border: 3px solid var(--selected, #3273dc);
    }

    .dropdown-menu .dropdown-content {
        color: var(--textColor);
        background-color: var(--background);
        padding: 0;
    }

    .dropdown-menu .dropdown-item {
        color: inherit;
        text-align: left;
        cursor: pointer;
    }

    .dropdown-menu .dropdown-item:hover {
        background-color: var(--selected);
    }
</style>