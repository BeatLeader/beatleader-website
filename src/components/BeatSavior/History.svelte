<script>
  import {createEventDispatcher} from 'svelte'
  import {opt} from '../../utils/js'
  import {formatDate} from '../../utils/date'
  import FormattedDate from '../Common/FormattedDate.svelte'
  import Accuracy from '../Common/Accuracy.svelte'
  import {padNumber} from '../../utils/format'

  export let runs;
  export let selectedId;
  export let bestId;

  const dispatch = createEventDispatcher();

  let itemsEl = null;

  function processRuns(runs) {
    if (!runs || !runs.length) return null;

    return runs.map(run => {
      const acc = opt(run, 'trackers.scoreTracker.rawRatio')
      const percentage = opt(run, 'trackers.scoreTracker.modifiedRatio')
      const mods = opt(run, 'trackers.scoreTracker.modifiers', [])
      const won = opt(run, 'trackers.winTracker.won', false)
      const endTime = opt(run, 'trackers.winTracker.endTime', null);
      const timeSet = run.timeSet

      let failedAt = null;
      if (endTime && !won) {
        let minutes = padNumber(Math.floor(endTime / 60));
        let seconds = padNumber(Math.round(endTime - minutes * 60));
        if (seconds >= 60) {
          minutes = padNumber(minutes + 1)
          seconds = padNumber(0);
        }

        failedAt = `${minutes}:${seconds}`
      }

      if (!acc || !percentage || !timeSet) return null;

      return {...run, name: formatDate(timeSet), acc: acc * 100, percentage: percentage * 100, won, mods, failedAt}
    })
      .filter(run => run)
  }

  function scrollToBestId(selectedId) {
    if (!selectedId || !itemsEl) return;

    const selectedEl = itemsEl.querySelector(`[data-id="${selectedId}"]`);
    if (!selectedEl) return;

    const {top: itemsElRectTop} = itemsEl.getBoundingClientRect();
    const {top: selectedElTop} = selectedEl.getBoundingClientRect();

    itemsEl.parentNode.scrollTo({
      top: selectedElTop - itemsElRectTop,
      left: 0,
      behavior: 'smooth'
    });
  }

  $: processedRuns = processRuns(runs)
  $: if(itemsEl && selectedId && bestId === selectedId) scrollToBestId(bestId)
</script>

{#if processedRuns && processedRuns.length}
  <section bind:this={itemsEl}>
    {#each processedRuns as run (run.beatSaviorId)}
      <div data-id={run.beatSaviorId} class="item" class:selected={run.beatSaviorId === selectedId}
           on:click={() => dispatch('selected', run)}
      >
        <Accuracy score={run} noSecondMetric={true}>
          <small slot="label-before">
            <FormattedDate date={run.timeSet} absolute={true}/>
          </small>
          <small class:fail={!run.won} class:best={run.beatSaviorId === bestId} slot="label-after">
            {#if !run.won}
              {#if run.failedAt}
                FAILED AT {run.failedAt}
              {:else}
                FAIL
              {/if}
            {:else if run.beatSaviorId === bestId}
              BEST
            {/if}
          </small>
        </Accuracy>
      </div>
    {/each}
  </section>
{/if}

<style>
    section :global(.badge) {
        width: 100%;
    }

    small {
        display: block;
        white-space: nowrap;
        font-weight: normal;
    }

    .item {
        opacity: .4;
        transition: opacity 200ms;
        cursor: pointer !important;
    }

    .item.selected, .item:hover {
        opacity: 1;
    }

    .item:hover {
        opacity: .75;
    }

    .item :global(*) {
      cursor: pointer!important;
    }

    .fail, .best {
        font-size: .75em;
        font-weight: 500;
        color: var(--decrease);
    }

    .best {
        color: var(--increase);
    }

</style>