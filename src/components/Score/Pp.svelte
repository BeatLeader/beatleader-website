<script>
  import Value from '../Common/Value.svelte'

  export let pp = 0;
  export let prevPp = null;
  export let zero = '-';
  export let withZeroSuffix = false;
  export let weighted = null;
  export let playerId = null;
</script>

<span
  class="value"><Value value="{pp}" {zero} {withZeroSuffix} prevValue={prevPp} suffix="pp" {...$$restProps} /></span>
{#if weighted !== null && weighted !== undefined}
  <small>(<Value value="{weighted}" {zero} {withZeroSuffix} suffix="pp" {...$$restProps}/>)</small>
{/if}

<style>
  .value {
      color: var(--ppColour) !important;
  }

  small {
      font-size: .8em;
      font-style: italic;
      margin-left: .25em;
  }

</style>