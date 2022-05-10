<script>
  import ScoresStats from './ScoresStats.svelte'

  export let playerId = null;
  export let scoresStats = null;
  export let accBadges = null;
  export let skeleton = false;
</script>

<div class="beatleader-summary">
  {#if scoresStats || skeleton}
    {#if scoresStats}
      <ScoresStats stats={scoresStats} {skeleton}/>
    {/if}
    <div>
      {#if accBadges}
        <ScoresStats stats={accBadges}/>
      {/if}
    </div>
  {/if}
</div>

<style>
</style>