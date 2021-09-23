<script>
  import ScoresStats from '../ScoresStats.svelte'
  import SsBadges from '../SsBadges.svelte'
  import SsChart from '../SsChart.svelte'

  export let playerId = null;
  export let scoresStats = null;
  export let accStats = null;
  export let accBadges = null;
  export let ssBadges = null;
  export let skeleton = false;
  export let isCached = false;
  export let rankHistory = null;
</script>

{#if scoresStats || ssBadges || skeleton}
  <div class="stats" class:enhanced={isCached}>
    {#if scoresStats}<ScoresStats stats={scoresStats} {skeleton}/>{/if}
    <div>
      {#if accStats}<ScoresStats stats={accStats}/>{/if}
      {#if accBadges}<ScoresStats stats={accBadges}/>{/if}
    </div>
    {#if ssBadges}<SsBadges badges={ssBadges}/>{/if}
  </div>
{/if}
{#if rankHistory}
  <SsChart {playerId} {rankHistory} />
{/if}

<style>
    @media screen and (min-width: 1200px) {
        .stats.enhanced {
            display: grid;
            grid-template-columns: auto auto;
            grid-gap: 1em;
        }
    }

    @media (max-width: 599px) {
        .stats {
            text-align: center;
        }

        .stats :global(.badges) {
            display: contents;
        }
    }
</style>