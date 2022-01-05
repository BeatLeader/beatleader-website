<script>
    import Value from './Value.svelte';

    export let rank;
    export let subRank;
    export let url;
</script>

<span>#<Value value={rank} zero="-" digits={0} /></span>
{#if subRank}
    <small>
        {#if url}
            <a href="{url}">#<Value value={subRank} zero="-" digits={0} /></a>
        {:else}
            #<Value value={subRank} zero="-" digits={0} />
        {/if}
    </small>
{/if}