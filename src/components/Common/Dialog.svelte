<script>
  import {createEventDispatcher} from 'svelte'
  import Button from '../Common/Button.svelte';
  import Modal from "../Common/Modal.svelte";

  const dispatch = createEventDispatcher();

  export let title;
  export let message
  export let closeable = true;
  export let type = 'alert';
  export let okButton = "Ok";
  export let cancelButton = "Cancel";
</script>

<Modal showCloseButton={false} {closeable} on:close={() => dispatch(type === 'alert' ? 'confirm' : 'cancel')}
       width="auto" height="auto">
  <header>
    <slot name="header">
      {title}
    </slot>
  </header>

  <main>
    <slot name="content">
      {#if message && message.length}<p>{message}</p>{/if}
    </slot>
  </main>

  <footer>
    <slot name="footer">
      <span class="left"><slot name="footer-left"></slot></span>

      <span class="right"><slot name="footer-right">
        {#if type === 'alert'}
          <Button label={okButton} type="primary" on:click={() => dispatch('confirm')}/>
        {:else if type === 'confirm'}
          <Button label={okButton} type="primary" on:click={() => dispatch('confirm')}/>
          <Button label={cancelButton} type="default" on:click={() => dispatch('cancel')}/>
        {/if}
      </slot></span>
    </slot>
  </footer>
</Modal>

<style>
    :global('.ss-modal') {
        height: auto;
    }

    header {
        font-size: 1.25em;
        margin-top: .4em;
        margin-bottom: .8em;
        color: var(--alternate);
    }

    main {
        color: var(--textColor);
        overflow-y: initial;
        flex: 1;
    }

    main::-webkit-scrollbar {
        width: .25rem;
    }
    body::-webkit-scrollbar-track {
        background: var(--foreground, #fff);
    }
    main::-webkit-scrollbar-thumb {
        background-color: var(--selected, #3273dc) ;
        border-radius: 6px;
        border: 3px solid var(--selected, #3273dc);
    }

    footer {
        margin-top: 2em;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    footer .left, footer .right {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    footer .right {
        justify-content: flex-end;
    }

    footer :global(.button) {
        margin-right: .25em !important;
    }
</style>