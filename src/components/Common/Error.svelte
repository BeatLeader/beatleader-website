<script>
  export let error;

  function getMessage(error) {
    if (error instanceof TypeError) return 'Download error';

    return error?.toString() ?? 'Unknown error';
  }

  $: message = getMessage(error)
</script>

{#if message}
  <span>{message}</span>
{/if}

<style>
    span {
        font-weight: 500;
        color: var(--decrease, 'red');
    }
</style>