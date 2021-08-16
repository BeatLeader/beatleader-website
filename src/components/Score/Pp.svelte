<script>
  import {configStore} from '../../stores/config'
  import {opt} from '../../utils/js'
  import Value from '../Common/Value.svelte'
  import {formatNumber} from '../../utils/format'

  export let pp = 0;
  export let zero = '-';
  export let withZeroSuffix = false;
  export let weighted = null;
  export let attribution = null;
  export let playerId = null;
  export let color = "var(--ppColour)"
  export let leaderboardId = null;

  $: secondaryMetricsPref = opt($configStore, 'preferences.secondaryPp', 'attribution')
  $: secondaryMetricsType = secondaryMetricsPref === 'attribution' && attribution !== null && attribution !== undefined ? 'attribution' : 'weighted'
  $: secondaryMetrics = secondaryMetricsType === 'attribution' ? attribution : weighted
  $: secondaryMetricsTitle = secondaryMetricsType === 'attribution' ? 'Actual contribution of the score to the total PP' : 'Weighted PP'
</script>

<span class="value" style="--color: {color}"><Value value="{pp}" {zero} {withZeroSuffix} prevValue={secondaryMetrics} withSign={secondaryMetricsType === 'attribution'} prevTitle={secondaryMetricsTitle} prevAbsolute={secondaryMetrics !== null} suffix="pp" {...$$restProps}>
  <svelte:fragment slot="prev" let:formatted let:value>
    {#if secondaryMetricsType === 'attribution'}
      [ {value === 0 ? `+${formatNumber(Math.abs(value))}pp` : formatted} ]
    {:else}
      ( {formatted} )
    {/if}
  </svelte:fragment>
</Value></span>

<style>
    .value {
        color: var(--color) !important;
    }

    small {
        font-size: .8em;
        font-style: italic;
        margin-left: .25em;
    }

</style>