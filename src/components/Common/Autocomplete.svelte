<script>
  import {createEventDispatcher, onMount} from 'svelte';
  import Button from './Button.svelte'
  import Error from './Error.svelte'
  import Dropdown from './Dropdown.svelte'

  const dispatch = createEventDispatcher();

  export let value = "";
  export let error = null;
  export let searchFunc = null;
  export let searchOnInput = false;
  export let placeholder = "";
  export let noItemsFound = "No items found";
  export let withButton = true;
  export let toFocus = true; 

  let items = [];
  let isLoading = false;
  let shown = false;
  let inputEl = null;

  async function search(value) {
    if (!searchFunc) return;

    try {
      error = null;
      isLoading = true;
      shown = false;

      items = await searchFunc(value);

      shown = true;
    } catch (err) {
      error = err;
      shown = false;
    } finally {
      isLoading = false;
    }
  }

  function selectItem(item) {
    shown = false;

    value = item;

    dispatch('selected', item)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') search(e.target.value);
  }

  if (value && searchOnInput && searchFunc) search(value);

  onMount(() => {
    if (toFocus && inputEl) inputEl.focus();
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

  <Dropdown {items} {shown} noItems={noItemsFound} on:select={event => selectItem(event.detail)}>
    <svelte:fragment slot="row" let:item>
      <slot name="row" {item}></slot>
    </svelte:fragment>
  </Dropdown>
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
</style>