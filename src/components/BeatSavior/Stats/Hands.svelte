<script>
  import ssrConfig from '../../../ssr-config'
  import HandAcc from '../HandAcc.svelte'
  import Badge from '../../Common/Badge.svelte'

  export let stats = null;
</script>

{#if stats}
  <div class="acc">
    <div class="left">
      <HandAcc value={stats.accLeft} cut={stats.leftAverageCut} color={stats.saberAColor} hand="left"/>

      {#if stats.leftTimeDependence}
        <div class="td">
          <Badge label="TD" title="Left hand time dependence" value={stats.leftTimeDependence}
                 color="white" bgColor={ssrConfig.leftSaberColor}
                 digits={3} fluid={true} />
        </div>
      {/if}
    </div>

    <div class="right">
      <HandAcc value={stats.accRight} cut={stats.rightAverageCut} color={stats.saberBColor} hand="right"/>

      {#if stats.rightTimeDependence}
        <div class="td">
          <Badge label="TD" title="Right hand time dependence" value={stats.rightTimeDependence}
                 color="white" bgColor={ssrConfig.rightSaberColor}
                 digits={3} fluid={true} />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
    .acc {
        display: inline-flex;
        justify-content: space-between;
        align-items: center;
    }

    .td {
        font-size: .8em;
        margin-top: .25em;
    }

    .right .td {
        text-align: right;
    }

    .td :global(.badge) {
        margin: 0;
    }
</style>