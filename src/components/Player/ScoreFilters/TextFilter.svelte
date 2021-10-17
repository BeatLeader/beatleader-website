<script>
  import {createEventDispatcher} from 'svelte'

  export let open = false;
  export let placeholder = null;

  const dispatch = createEventDispatcher();

  let filterEl = null;

  function onKeyUp(e) {
    const value = e?.target?.value ?? null;
    if (!value?.length) return;

    if (e.code === 'Enter') {
      e.preventDefault()

      dispatch('change', value)
    }
  }

  $: if (open && filterEl) filterEl.focus();
  $: if (!open && filterEl) filterEl.value = '';
</script>

<input type="text" {placeholder} class:open={open} bind:this={filterEl} on:keyup={onKeyUp} />

<style>
    input {
        width: 100%;
        height: 100%;
        line-height: 1;
        color: var(--textColor);
        background-color: transparent;
        border: 1px solid transparent;
        padding: calc(.25em - 1px) .5em calc(.25em - 1px) .5em;
        transition: all 300ms ease-out;
        outline: none;
    }

    input::placeholder {
        color: var(--faded)!important;
    }

    input.open {
        border-color: var(--faded);
    }
</style>