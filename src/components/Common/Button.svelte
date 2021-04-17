<script>
    import {createEventDispatcher} from 'svelte';
    import Spinner from './Spinner.svelte'

    const dispatch = createEventDispatcher();

    export let label = "";
    export let icon;
    export let iconFa;
    export let disabled = false;
    export let type = 'default';
    export let cls = "";
    export let title;
    export let noMargin = false;
    export let color = null;
    export let bgColor = null;
    export let notSelected = false;
    export let options = null;
    export let selectedOption = null;
    export let loading = false;

    if (!selectedOption && options && Array.isArray(options) && options.length) selectedOption = options[0];

    const types = {
        default: {
            color: "#444",
            activeColor: "#222",
            bgColor: "#dbdbdb",
            activeBgColor: "#aaa",
            border: "transparent",
            activeBorder: "transparent",
        },
        primary: {
            color: "#dbdbdb",
            activeColor: "#fff",
            bgColor: "#3273db",
            activeBgColor: "#2366d1",
            border: "transparent",
            activeBorder: "transparent",
        },
        text: {
            color: "var(--textColor)",
            activeColor: "var(--textColor)",
            bgColor: "transparent",
            activeBgColor: "transparent",
            border: "transparent",
            activeBorder: "transparent",
        },
        twitch: {
            color: "#dbdbdb",
            activeColor: "#fff",
            bgColor: "#9146ff",
            activeBgColor: "#8333ff",
            border: "transparent",
            activeBorder: "transparent",
        },
        danger: {
            color: "#dbdbdb",
            activeColor: "#fff",
            bgColor: "red",
            activeBgColor: "#bf0000",
            border: "transparent",
            activeBorder: "transparent",
        },
    }

    $: selectedType = types[type] ? types[type] : types.default;
    $: margin = label && label.length ? ".45em" : "1px"
    $: btnPadding = label && label.length ? "calc(.45em - 1px) 1em" : "calc(.45em - 1px) .25em";
    $: btnMargin = noMargin ? 0 : "0 0 .45em 0";
</script>

<button style="--color:{color ? color : selectedType.color}; --bg-color: {bgColor ? bgColor : selectedType.bgColor}; --border:{selectedType.border};--active-color: {selectedType.activeColor}; --active-bg-color: {selectedType .activeBgColor}; --active-border: {selectedType.activeBorder}; --margin: {margin}; --btn-padding: {btnPadding}; --btn-margin: {btnMargin}" on:click={() => dispatch('click', selectedOption)} {disabled} {title} class={'button ' + (type?type:'default') + ' ' + cls}
 class:not-selected={notSelected}>
    {#if icon}<span class="icon">{@html icon}</span>{/if}
    {#if iconFa && !loading}<i class={iconFa}></i>{/if}
    {#if loading}<i><Spinner /></i>{/if}
    <span>{label}</span>
    <slot></slot>
</button>

<style>
    button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        vertical-align: top;
        padding: var(--btn-padding, calc(.45em - 1px) 1em);
        margin: var(--btn-margin, 0 0 .45em 0);
        text-align: center;
        white-space: nowrap;
        border: 1px solid var(--border, #dbdbdb);
        border-radius: .2em;
        font-size: inherit;
        cursor: pointer;
        color: var(--color, #363636)!important;
        background-color: var(--bg-color, #3273dc)!important;
        outline: none !important;
        box-shadow: none !important;
        transition: opacity .25s;
    }

    button:hover {
        color: var(--active-color, #fff);
        border-color: var(--active-border, #b5b5b5)
    }

    button:active {
        background-color: var(--active-bg-color, #fff);
    }

    button[disabled] {
        cursor: not-allowed;
        opacity: .35;
        color: var(--active-color, white);
        background-color: var(--bg-color, #3273dc);
    }

    button .icon:first-child:not(:last-child), button i:first-child:not(:last-child) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.3em;
        height: 1.3em;
        margin-left: calc(- var(--margin, .45em) - 1px);
        margin-right: var(--margin, .45em);
    }

    button :global(.dropdown-trigger button) {
        color: inherit!important;
        background-color: inherit!important;
    }

    .not-selected {
        opacity: .35;
    }

    .not-selected:hover {
        opacity: 1;
    }

    :global(.button.is-loading::after) {
        border-color: transparent transparent rgba(0,0,0,.7) rgba(0,0,0,.7)!important;
    }

    :global(.button.twitch.is-loading::after) {
        border-color: transparent transparent rgba(219,219,219,1) rgba(219,219,219,1)!important;
    }

    :global(button .icon svg, button i) {
        display: inline-block;
        width: 1.3em;
        height: 1.3em;
        vertical-align: -.125em;
        overflow: visible;
        max-width: 100%;
        max-height: 100%;
        fill: currentColor;
    }
</style>
