<script>
  import Value from '../Common/Value.svelte'

  export let pp = 0;
  export let zero = '-';
  export let withZeroSuffix = false;
  export let weighted = null;
  export let playerId = null;
  export let color = "var(--ppColour)"
  export let leaderboardId = null;
</script>

<span class="value" style="--color: {color}"><Value value="{pp}" {zero} {withZeroSuffix} prevValue={weighted} prevTitle="Weighted PP" prevAbsolute={!!weighted} suffix="pp" {...$$restProps}>
  <svelte:fragment slot="prev" let:formatted>({formatted})</svelte:fragment>
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