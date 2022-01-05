<script>
    import {createEventDispatcher} from 'svelte';
    import Value from "./Value.svelte";

    const dispatch = createEventDispatcher();

    export let label = "";
    export let value = 0;
    export let min = 0;
    export let max = 100;
    export let step = 1;
    export let suffix = "";
    export let disabled = false;
    export let inline = false;

    function onChange() {
        dispatch('change', value)
    }
</script>

<div class={disabled ? 'disabled' : ''} class:inline>
    <span>{label} <Value value={value} suffix={suffix} /></span>
    <div><input {disabled} type="range" min={min} max={max} step={step} bind:value={value} on:input={onChange} /></div>
</div>

<style>
    .disabled {
        color: #888;
    }
    .inline {
        display: flex;
    }
    .inline span {
        margin-left: .5em;
        line-height: 1;
        min-width: 3.5em;
        order: 2
    }
    .inline div {
        order: 1;
    }
    .inline div, .inline div input {
        width: 100%;
    }
</style>