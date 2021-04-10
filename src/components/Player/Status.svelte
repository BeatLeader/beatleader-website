<script>
  export let playerInfo;
</script>

{#if playerInfo.banned}<span class="status banned">Banned</span>{/if}
{#if playerInfo.inactive}<span class="status inactive">Inactive</span>{/if}

<style>
    .status {
        border-left: 1px solid var(--dimmed);
        padding-left: .75rem;
        margin-left: .5rem;
    }

    .banned {
        color: var(--decrease);
    }

    .inactive {
        color: var(--faded);
    }
</style>