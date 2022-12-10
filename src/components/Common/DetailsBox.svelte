<script>
    export let box = null;
    export let cls = null;
</script>

<div class="details-box {cls ?? ''}" bind:this={box}>
    <slot/>
</div>

<style>
    .details-box {
        margin: 0.4em 0.4em 0.6em;
        padding: 0.4em;
        box-shadow: 0 2px 10px rgb(0 0 0 / 53%);
        border-radius: 0.4em;
        background: var(--graph-gradient);
    }

    .details-box:hover {
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
    }
</style>
