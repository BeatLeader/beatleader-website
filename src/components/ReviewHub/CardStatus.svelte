<script>
  export let status;
</script>

{#if status && status !== 0}
  <div>
    {#if status === 1}
      <span>Nominated</span>
    {:else if status === 2}
      <span>Not Nominated</span>
    {:else}
      <span>Status {status}</span>
    {/if}
    
  </div>
{/if}

<style>
  div {
    display: flex;
    height: 24px;
    background-color: #323232;
    border-radius: 6px;
    padding-left: 0.4em;
    padding-right: 0.4em;
    line-height: 170%;
  }

  span {
    color: #e9e9e9;
    margin-top: -0.1em;
  }

</style>