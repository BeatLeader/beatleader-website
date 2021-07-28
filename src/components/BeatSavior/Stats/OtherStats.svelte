<script>
  import Value from '../../Common/Value.svelte'
  import {opt} from '../../../utils/js'
  import {formatNumber} from '../../../utils/format'

  export let beatSavior = null;

  $: stats = beatSavior ? beatSavior.stats : null;
  $: fc = stats && !stats.miss && !stats.wallHit && !stats.bombHit;

  $: leftBadCuts = opt(beatSavior, 'trackers.hitTracker.leftBadCuts', null)
  $: leftMissedNotes = opt(beatSavior, 'trackers.hitTracker.leftMiss', null)
  $: leftMiss = (leftBadCuts || 0) + (leftMissedNotes || 0)
  $: rightBadCuts = opt(beatSavior, 'trackers.hitTracker.rightBadCuts', null)
  $: rightMissedNotes = opt(beatSavior, 'trackers.hitTracker.rightMiss', null)
  $: rightMiss = (rightBadCuts || 0) + (rightMissedNotes || 0)

  $: totalMissesTitle = `Total misses (left: ${formatNumber(leftMiss, 0)} | right: ${formatNumber(rightMiss, 0)})`
  $: missedNotesTitle = `Missed notes (left: ${formatNumber(leftMissedNotes, 0)} | right: ${formatNumber(rightMissedNotes, 0)})`
  $: badCutsTitle = `Bad cuts (left: ${formatNumber(leftBadCuts, 0)} | right: ${formatNumber(rightBadCuts, 0)})`
</script>

{#if stats}
  <div class="stats">
    {#if !stats.won}
      <span class="block"><strong class:fail={true}>FAIL</strong></span>
    {/if}

      <span title="Max combo" class="block">{#if !fc}<i class="fas fa-cube"></i> {/if}<strong class:full-combo={fc}>{#if fc}FC{:else}<Value value={stats.maxCombo} digits={0} title="Max combo"/>{/if}</strong></span>

    {#if !fc}
      <span title={totalMissesTitle} class="block"><i class="fas fa-ban"></i> <strong><Value value={stats.miss} digits={0} title={totalMissesTitle}/></strong></span>

      <span title={missedNotesTitle} class="block"><i class="fas fa-eye-slash"></i> <strong><Value value={stats.missedNotes} digits={0} title={missedNotesTitle}/></strong></span>

      <span title={badCutsTitle} class="block"><i class="fas fa-times"></i> <strong><Value value={stats.badCuts} digits={0} title={badCutsTitle}/></strong></span>
    {/if}

    <span title="Pauses" class="block"><i class="fas fa-pause-circle"></i> <strong><Value value={stats.nbOfPause} digits={0} title="Pauses"/></strong></span>

    <span title="Bomb hit" class="block"><i class="fas fa-bomb"></i> <strong><Value value={stats.bombHit} digits={0} title="Bomb hit"/></strong></span>

    <span title="Wall hit" class="block"><i class="fas fa-gopuram"></i> <strong><Value value={stats.nbOfWallHit} digits={0} title="Wall hit"/></strong></span>
  </div>
{/if}

<style>
    .stats {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        align-self: flex-start;
        flex-wrap: wrap;
    }

    .stats > * {
        display: inline-block;
        min-width: 5.25em;
        text-align: center;
    }

    .stats .block {
        margin-bottom: 0;
    }

    .full-combo {
        color: darkorange !important;
    }

    .fail {
        color: var(--decrease) !important;
    }
</style>