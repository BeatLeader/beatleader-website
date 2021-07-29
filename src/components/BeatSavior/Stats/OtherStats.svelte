<script>
  import config from '../../../config'
  import {opt} from '../../../utils/js'
  import {formatNumber} from '../../../utils/format'
  import Value from '../../Common/Value.svelte'
  import Badge from '../../Common/Badge.svelte'

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
  <div class="stats" style="--left-saber-color: {config.leftSaberColor}; --right-saber-color: {config.rightSaberColor}">
    {#if !stats.won}
      <Badge color="red" bgColor="var(--dimmed)" fluid={true} onlyLabel={true}>
        <svelte:fragment slot="label">
          FAIL
        </svelte:fragment>
      </Badge>
    {/if}

    {#if !fc}
      <Badge label="Max combo" value={stats.maxCombo}  color="white" bgColor="var(--dimmed)" fluid={true} digits={0} />
    {:else}
      <Badge color="darkorange" bgColor="var(--dimmed)" fluid={true} onlyLabel={true}>
        <svelte:fragment slot="label">
          FC
        </svelte:fragment>
      </Badge>
    {/if}

    <Badge label="Pauses" value={stats.pauses} digits={0} color="white" bgColor="var(--dimmed)" fluid={true} />

    {#if !fc}
      <Badge label="Total misses" color="white" bgColor="var(--dimmed)" fluid={true}>
        <svelte:fragment slot="value">
          <Value value={stats.miss} digits={0} zero="-"/>
          {#if stats.miss}
            <span class="left addon"><Value value={leftMiss} digits={0}/></span>
            <span class="right addon"><Value value={rightMiss} digits={0}/></span>
          {/if}
        </svelte:fragment>
      </Badge>
      <Badge label="Missed notes" color="white" bgColor="var(--dimmed)" fluid={true}>
        <svelte:fragment slot="value">
          <Value value={stats.missedNotes} digits={0} />
          {#if stats.missedNotes}
            <span class="left addon"><Value value={leftMissedNotes} digits={0}/></span>
            <span class="right addon"><Value value={rightMissedNotes} digits={0}/></span>
          {/if}
        </svelte:fragment>
      </Badge>
      <Badge label="Bad cuts" color="white" bgColor="var(--dimmed)" fluid={true}>
        <svelte:fragment slot="value">
          <Value value={stats.badCuts} digits={0} />
          {#if stats.badCuts}
            <span class="left addon"><Value value={leftBadCuts} digits={0}/></span>
            <span class="right addon"><Value value={rightBadCuts} digits={0}/></span>
          {/if}
        </svelte:fragment>
      </Badge>

      <Badge label="Bomb hit" value={stats.bombHit} digits={0} color="white" bgColor="var(--dimmed)" fluid={true} />
      <Badge label="Wall hit" value={stats.wallHit} digits={0} color="white" bgColor="var(--dimmed)" fluid={true} />
    {/if}
  </div>
{/if}

<style>
    .stats {
        display: flex;
        justify-content: center;
        align-items: center;
        align-self: flex-start;
        flex-wrap: wrap;
    }

    .stats > * {
        display: inline-block;
        min-width: 5.25em;
        text-align: center;
    }

    .stats :global(.badge .value) {
        font-weight: 500;
    }

    .stats .block {
        margin-bottom: 0;
    }

    .stats .addon {
        padding: 0 .25em;
        margin-left: .5em;
        border-radius: 4px;
        background-color: var(--foreground);
        font-size: .7em;
        font-weight: normal;
    }
    .stats .addon + .addon {
        margin-left: 0;
    }
    .stats .addon.left {
        background-color: var(--left-saber-color);
    }
    .stats .addon.right {
        background-color: var(--right-saber-color);
    }
</style>