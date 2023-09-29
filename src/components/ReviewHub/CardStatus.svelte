<script>
  export let status = 2;
</script>

{#if status !== 0}
  <div>
    {#if status === 1}
      <h1>Nominated</h1>
    {:else if status === 2}
      <h1>Not Nominated</h1>
    {/if}
    
  </div>
{/if}

<style>
  div {
    display: flex;
    height: 24px;
    padding-right: 0.3em;
    background-color: #323232;
    border-radius: 6px;
    padding-left: 0.4em;
    padding-right: 0.4em;
    line-height: 170%;
  }

  h1 {
    margin-top: -0.1em;
  }

</style>