<script>
  import {createEventDispatcher} from 'svelte'
  import Button from './Button.svelte'
  import Spinner from './Spinner.svelte'

  export let pendingText = 'Working...';
  export let confirmedOperation = null;

  const dispatch = createEventDispatcher();

  async function onConfirm() {
    if (!confirmedOperation) return;

    await confirmedOperation();

    confirmedOperation = null;

    dispatch('completed');
  }

  function onCancelPendingOperation() {
    confirmedOperation = null;

    dispatch('cancel');
  }

</script>

{#if !pendingText}
  {#if confirmedOperation}
    <h3 class="confirm title is-6">Are you sure?</h3>
    <Button label="Yeah!" iconFa="fas fa-check" type="danger" on:click={onConfirm}/>
    <Button label="Hell no!" iconFa="fas fa-ban" type="default" on:click={onCancelPendingOperation}/>
  {:else}
    <slot/>
  {/if}
{:else}
  <Spinner/>
  {pendingText}
{/if}

<style>
    .confirm.title {
        margin-bottom: .25rem;
    }
</style>