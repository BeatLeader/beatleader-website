<script>
  import ssrConfig from '../../../ssr-config'
  import HandAcc from '../HandAcc.svelte'
  import Badge from '../../Common/Badge.svelte'
  import {formatNumber} from '../../../utils/format'

  export let stats = null;
  export let name = null;
  export let compareTo = null;
  export let compareToName = null;
</script>

{#if stats}
  <div class="acc">
    <div class="left">
      <HandAcc value={stats.accLeft} cut={stats.leftAverageCut} color={stats.saberAColor} hand="left" {name}
               compareToValue={compareTo ? compareTo.accLeft : null} compareToCut={compareTo ? compareTo.leftAverageCut : null} {compareToName}
      />

      {#if stats.leftTimeDependence}
        <div class="td">
          <Badge label="TD" title="Left hand time dependence" value={stats.leftTimeDependence}
                 color="white" bgColor={ssrConfig.leftSaberColor}
                 digits={3} fluid={true}>
            <small slot="additional">
              {#if compareTo}{formatNumber(compareTo.leftTimeDependence, 3)}{/if}
            </small>
          </Badge>
        </div>
      {/if}
    </div>

    <div class="right">
      <HandAcc value={stats.accRight} cut={stats.rightAverageCut} color={stats.saberBColor} hand="right" {name}
               compareToValue={compareTo ? compareTo.accRight : null} compareToCut={compareTo ? compareTo.rightAverageCut : null} {compareToName}
      />

      {#if stats.rightTimeDependence}
        <div class="td">
          <Badge label="TD" title="Right hand time dependence" value={stats.rightTimeDependence}
                 color="white" bgColor={ssrConfig.rightSaberColor}
                 digits={3} fluid={true}>
            <small slot="additional">
              {#if compareTo}{formatNumber(compareTo.rightTimeDependence, 3)}{/if}
            </small>
          </Badge>
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
        padding-bottom: .25em;
    }

    small {
        opacity: .5;
        padding: 3px .25em 0 0;
    }
</style>