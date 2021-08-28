<script>
    import {createEventDispatcher} from 'svelte';
    import Button from './Button.svelte';

    const dispatch = createEventDispatcher();

    export let accept;
    export let disabled = false;
</script>

<Button {...$$props}>
    <input type="file" {accept} {disabled} on:change />
</Button>

<style>
    input[type=file] {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        outline: none;
        opacity: 0;
    }
</style>
