<script>
  import {configStore} from '../../stores/config'
  import {opt} from '../../utils/js'
  import Value from '../Common/Value.svelte'
  import {formatNumber} from '../../utils/format'
  import {hoverable} from '../../svelte-utils/actions/hoverable'

  export let pp = 0;
  export let zero = '-';
  export let withZeroSuffix = false;
  export let weighted = null;
  export let attribution = null;
  export let playerId = null;
  export let color = "var(--ppColour)"
  export let leaderboardId = null;
  export let whatIf = null;

  let tooltipOpacity = 0;

  const onHover = () => tooltipOpacity = 1;
  const onUnhover = () => tooltipOpacity = 0;

  $: secondaryMetricsPref = opt($configStore, 'preferences.secondaryPp', 'attribution')
  $: secondaryMetricsType = secondaryMetricsPref === 'attribution' && attribution !== null && attribution !== undefined ? 'attribution' : 'weighted'
  $: secondaryMetrics = secondaryMetricsType === 'attribution' ? attribution : weighted
  $: secondaryMetricsTitle = secondaryMetricsType === 'attribution' ? 'Actual contribution of the score to the total PP' : 'Weighted PP'
</script>

<span class="pp" style="--color: {color}">
  {#if whatIf}<span class="whatif-tooltip" style="--opacity: {tooltipOpacity}">
    If you play like this:
    <span class="whatif-value">
      {formatNumber(whatIf.currentTotalPp)} + <strong>{formatNumber(whatIf.diff)}</strong> =<strong class="total">{formatNumber(whatIf.newTotalPp)}pp</strong>
    </span>
  </span>{/if}

  <span class="value">
    <Value value="{pp}" {zero} {withZeroSuffix} prevValue={secondaryMetrics}
           prevWithSign={secondaryMetricsType === 'attribution'} prevTitle={secondaryMetricsTitle}
           prevAbsolute={secondaryMetrics !== null} suffix="pp" {...$$restProps}>
      <span slot="value" let:formatted class="main-value"  class:whatIfAvailable={whatIf} use:hoverable on:hover={onHover} on:unhover={onUnhover}>
        {formatted} <i class="far fa-question-circle"></i>
      </span>
      <svelte:fragment slot="prev" let:formatted let:value>
        {#if secondaryMetricsType === 'attribution'}
          [ {value === 0 ? `+${formatNumber(Math.abs(value))}pp` : formatted} ]
        {:else}
          ( {formatted} )
        {/if}
      </svelte:fragment>
    </Value>
  </span>
</span>

<style>
    .pp {
        color: var(--color) !important;
    }

    .value :global(.prev) {
        min-width: max-content;
    }

    .whatIfAvailable {
        cursor: help;
    }

    .main-value > i {
        display: none;
    }

    .whatIfAvailable > i {
        display: inline;
        position: absolute;
        top: .1em;
        right: .1em;
        font-size: .75em;
    }

    .whatif-tooltip {
        position: absolute;
        top: 2em;
        left: .5em;
        z-index: 10;
        width: 18em;
        padding: .25em;
        font-size: .875em;
        font-weight: normal;
        text-align: center;
        color: var(--textColor);
        background-color: var(--foreground);
        border: 1px solid var(--faded);
        opacity: var(--opacity);
        transition: opacity 300ms;
        pointer-events: none;
    }

    .whatif-tooltip .whatif-value {
        display: block;
    }

    .whatif-value .total {
        color: var(--increase)!important;
    }
</style>