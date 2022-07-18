<script>
    import {createEventDispatcher, onDestroy} from 'svelte';
    import Button from '../Common/Button.svelte';
    import {fade, fly} from 'svelte/transition'

    const dispatch = createEventDispatcher();
    const close = () => dispatch('close');

    export let showCloseButton = true;
    export let closeable = true;
    export let width = "calc(100vw - 4em)";
    export let height = "auto";

    let modal;

    const handle_keydown = e => {
        if (closeable && e.key === 'Escape') {
            close();
            return;
        }

        if (e.key === 'Tab') {
            // trap focus
            const nodes = modal.querySelectorAll('*');
            const tabbable = Array.from(nodes).filter(n => n.tabIndex >= 0);

            let index = tabbable.indexOf(document.activeElement);
            if (index === -1 && e.shiftKey) index = 0;

            index += tabbable.length + (e.shiftKey ? -1 : 1);
            index %= tabbable.length;

            tabbable[index].focus();
            e.preventDefault();
        }
    };

    const previously_focused = typeof document !== 'undefined' && document.activeElement;

    if (previously_focused) {
        onDestroy(() => {
            previously_focused.focus();
        });
    }

    $: heightInPx = !isNaN(parseInt(height, 10)) ? parseInt(height, 10) : null;
</script>

<svelte:window on:keydown={handle_keydown}/>

<div class="ss-modal-background" on:click={() => {closeable ? close() : null}} transition:fade></div>

<div class="ss-modal" role="dialog" aria-modal="true" bind:this={modal} style="--width: {width}; --height: {height};"
     transition:fly={{y: heightInPx ? heightInPx : 300}}>
    <div class="inner">
        <slot></slot>
    </div>

    {#if closeable && showCloseButton}
        <Button iconFa="fas fa-times" on:click={close} cls="close"/>
    {/if}
</div>

<style>
    .ss-modal-background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        z-index: 1000;
    }

    .ss-modal {
        position: fixed;
        left: 50%;
        top: 50%;
        width: var(--width);
        height: var(--height);
        min-width: 25em;
        max-width: 60em;
        max-height: 100vh;
        transform: translate(-50%, -50%);
        padding: 1em;
        color: var(--textColor);
        background: var(--background);
        z-index: 2000;
        border-radius: .5em;

        display: flex;
    }

    .ss-modal .inner {
        display: flex;
        flex-direction: column;
        width: 100%;
        flex: 1;
    }

    .ss-modal::-webkit-scrollbar {
        width: .25rem;
    }
    body::-webkit-scrollbar-track {
        background: var(--foreground, #fff);
    }
    .ss-modal::-webkit-scrollbar-thumb {
        background-color: var(--selected, #3273dc) ;
        border-radius: 6px;
        border: 3px solid var(--selected, #3273dc);
    }

    :global(.ss-modal button.close) {
        position: absolute !important;
        top: .5em;
        right: .5em;
        height: auto;
        margin: 0 !important;
        padding: 0 !important;
    }

    @media screen and (max-width: 600px) {
        .ss-modal {
            top: auto;
            left: 0;
            bottom: 0;
            transform: none;
            width: 100%;
            min-width: min(20em, 100vw);
            max-width: none;
            min-height: 12em;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
    }
</style>