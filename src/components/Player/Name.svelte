<script>
  export let playerInfo;
</script>

{#if playerInfo?.playerName}
  {#if playerInfo.externalProfileUrl}
    <a href={playerInfo.externalProfileUrl} target="_blank" rel="noopener">{playerInfo.playerName}</a>
  {:else}
    {playerInfo.playerName}
  {/if}
{/if}


<style>
  a {
      color: var(--textColor) !important;
  }
</style>