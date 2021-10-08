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
        <div class="td badge-stat">
          <Badge label="TD" title="Left hand time dependence" value={stats.leftTimeDependence}
                 color="white" bgColor={ssrConfig.leftSaberColor}
                 digits={3} fluid={true}>
            <small slot="additional">
              {#if compareTo}{formatNumber(compareTo.leftTimeDependence, 3)}{/if}
            </small>
          </Badge>
        </div>
      {/if}
      {#if stats.leftPreswing}
        <div class="preswing badge-stat">
          <Badge label="PRE" title="Left hand preswing" value={stats.leftPreswing * 100}
                 color="white" bgColor={ssrConfig.leftSaberColor}
                 digits={2} suffix="%" fluid={true}>
            <small slot="additional">
              {#if compareTo}{formatNumber(compareTo.leftPreswing * 100, 2)}%{/if}
            </small>
          </Badge>
        </div>
      {/if}
      {#if stats.leftPostswing}
        <div class="postswing badge-stat">
          <Badge label="POST" title="Left hand postswing" value={stats.leftPostswing * 100}
                 color="white" bgColor={ssrConfig.leftSaberColor}
                 digits={2} suffix="%" fluid={true}>
            <small slot="additional">
              {#if compareTo}{formatNumber(compareTo.leftPostswing * 100, 2)}%{/if}
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
        <div class="td badge-stat">
          <Badge label="TD" title="Right hand time dependence" value={stats.rightTimeDependence}
                 color="white" bgColor={ssrConfig.rightSaberColor}
                 digits={3} fluid={true}>
            <small slot="additional">
              {#if compareTo}{formatNumber(compareTo.rightTimeDependence, 3)}{/if}
            </small>
          </Badge>
        </div>
      {/if}
      {#if stats.rightPreswing}
        <div class="preswing badge-stat">
          <Badge label="PRE" title="Right hand preswing" value={stats.rightPreswing * 100}
                 color="white" bgColor={ssrConfig.rightSaberColor}
                 digits={2} suffix="%" fluid={true}>
            <small slot="additional">
              {#if compareTo}{formatNumber(compareTo.rightPreswing * 100, 2)}%{/if}
            </small>
          </Badge>
        </div>
      {/if}
      {#if stats.rightPostswing}
        <div class="postswing badge-stat">
          <Badge label="POST" title="Right hand postswing" value={stats.rightPostswing * 100}
                 color="white" bgColor={ssrConfig.rightSaberColor}
                 digits={2} suffix="%" fluid={true}>
            <small slot="additional">
              {#if compareTo}{formatNumber(compareTo.rightPostswing * 100, 2)}%{/if}
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

    .badge-stat {
        font-size: .8em;
        margin-top: .25em;
    }

    .right .badge-stat {
        text-align: right;
    }

    .badge-stat :global(.badge) {
        margin: 0;
        padding-bottom: .25em;
        width: 95%;
        justify-content: flex-start;
    }

    .right .badge-stat :global(.badge) {
        justify-content: flex-end;
    }

    .badge-stat :global(.badge .value) {
        flex-grow: 1;
    }

    .badge-stat :global(.badge .label) {
        min-width: 3.5em!important;
        text-align: left;
    }

    .right .badge-stat :global(.badge .label) {
        min-width: 3.5em!important;
        text-align: right;
    }

    small {
        opacity: .5;
        padding: 3px .25em 0 0;
    }
</style>