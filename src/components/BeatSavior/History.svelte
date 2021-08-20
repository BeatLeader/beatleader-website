<script>
  import {createEventDispatcher} from 'svelte'
  import {opt} from '../../utils/js'
  import {formatDate} from '../../utils/date'
  import {formatNumber, padNumber} from '../../utils/format'
  import FormattedDate from '../Common/FormattedDate.svelte'
  import Accuracy from '../Common/Accuracy.svelte'

  export let runs;
  export let selectedId;
  export let bestId;
  export let compareToId;

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

      const name = `${formatDate(timeSet)} / ${formatNumber(acc*100)}%${!won ? ` / FAILED AT ${failedAt}` : `${run.beatSaviorId === bestId ? ' / BEST' : ''}`}`

      return {...run, name, acc: acc * 100, percentage: percentage * 100, won, mods, failedAt}
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

  async function onSelectChange(e) {
    const selectedItem = processedRuns ? processedRuns.find(r => r.beatSaviorId === selectedId) : null;
    if (!selectedItem) return;

    dispatch('selected', selectedItem)
  }

  $: processedRuns = processRuns(runs)
  $: if(itemsEl && selectedId && bestId === selectedId) scrollToBestId(bestId)
</script>

{#if processedRuns && processedRuns.length}
  <div class="scroll-wrapper">
    <section bind:this={itemsEl}>
      {#each processedRuns as run (run.beatSaviorId)}
        <div data-id={run.beatSaviorId} class="item"
             class:selected={run.beatSaviorId === selectedId} class:compare={run.beatSaviorId === compareToId}
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
          <i class="fas fa-balance-scale-left"></i>
        </div>
      {/each}
    </section>
  </div>

  <div class="select-wrapper">
    <select bind:value={selectedId} on:change={onSelectChange}>
      {#each processedRuns as run (run.beatSaviorId)}
        <option value={run.beatSaviorId}>{run.name}</option>
      {/each}
    </select>
  </div>
{/if}

<style>
    .scroll-wrapper {
        width: 100%;
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        margin-top: .25em;
    }

    .select-wrapper {
        display: none;
        font-size: 1em;
    }

    section :global(.badge) {
        width: 100%;
    }

    .scroll-wrapper::-webkit-scrollbar {
        width: .25rem;
    }
    body::-webkit-scrollbar-track {
        background: var(--foreground, #fff);
    }
    .scroll-wrapper::-webkit-scrollbar-thumb {
        background-color: var(--selected, #3273dc) ;
        border-radius: 6px;
        border: 3px solid var(--selected, #3273dc);
    }

    small {
        display: block;
        white-space: nowrap;
        font-weight: normal;
    }

    .item {
        position: relative;
        opacity: .25;
        transition: opacity 200ms;
        cursor: pointer !important;
    }

    .item.selected {
        opacity: 1;
    }

    .item > i.fas {
        display: none;
        position: absolute;
        right: .25em;
        bottom: 1em;
        font-size: .75em;
    }

    .item:hover:not(.selected) {
        opacity: .6;
    }

    .item.compare > i.fas {
        display: inline;
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

    :global(.switch-types .button) {
        margin-bottom: 0!important;
    }

    :global(.switch-types .button i) {
        align-items: flex-end!important;
    }

    @media screen and (max-width: 767px) {
        .scroll-wrapper {
            display: none;
        }

        .select-wrapper {
            display: inline-block;
            flex: 1;
            margin-left: .5em;
        }

        select {
            width: 100%;
            max-width: 100%;
            height: 100%;
        }
    }

</style>