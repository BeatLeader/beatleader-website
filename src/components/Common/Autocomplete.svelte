<script>
  import {createEventDispatcher, onMount} from 'svelte';
  import Button from './Button.svelte'
  import Error from './Error.svelte'

  const dispatch = createEventDispatcher();

  export let value = "";
  export let error = null;
  export let searchFunc = null;
  export let searchOnInput = false;
  export let placeholder = "";
  export let noItemsFound = "No items found";
  export let withButton = true;

  let items = [];
  let isLoading = false;
  let active = false;
  let inputEl = null;

  async function search(value) {
    if (!searchFunc) return;

    try {
      error = null;
      isLoading = true;
      active = false;

      items = await searchFunc(value);

      active = true;
    } catch (err) {
      error = err;
      active = false;
    } finally {
      isLoading = false;
    }
  }

  function selectItem(item) {
    active = false;

    value = item;

    dispatch('selected', item)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') search(e.target.value);
  }

  if (value && searchOnInput && searchFunc) search(value);

  onMount(() => {
    if (inputEl) inputEl.focus();
  })
</script>

<div class="autocomplete">
  <input bind:this={inputEl} bind:value {placeholder}
         on:input={e => searchOnInput ? search(e.target.value) : null}
         on:keydown={onKeyDown}
         disabled={isLoading}
  />

  {#if withButton}
    <span class="button-cont">
      <Button iconFa="fas fa-search" type="primary" loading={isLoading} disabled={isLoading}
              on:click={() => search(value)}
      />
    </span>
  {/if}

  {#if error}
    <div><Error {error}/></div>
  {/if}

  <div class="dropdown-menu" role="menu" class:active>
    <div class="dropdown-content">
      {#if !items || !items.length}
        <div class="menu-label">{noItemsFound}</div>
      {:else}
        {#each items as item}
          <div class="dropdown-item" on:click={() => selectItem(item)}>
            <slot name="row" {item}>
              {item}
            </slot>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
    div.autocomplete {
        position: relative;
        display: inline-block;
    }

    input {
        min-width: 16rem;
        color: var(--textColor);
        background-color: var(--foreground);
        border: none;
        border-bottom: 1px solid var(--faded);
        outline: none;
    }

    input::placeholder {
        color: var(--faded) !important;
    }

    span.button-cont {
        font-size: .75em;
    }

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

    .dropdown-menu.active {
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