<script>
  import HandAcc from '../HandAcc.svelte'
  import Value from '../../Common/Value.svelte'
  import Badge from '../../Common/Badge.svelte'

  export let stats = null;
</script>

{#if stats}
  <div class="acc">
    <div class="left">
      <HandAcc value={stats.accLeft} cut={stats.leftAverageCut} color={stats.saberAColor} hand="left"/>

      {#if stats.leftTimeDependence}
        <div class="td">
          <Badge onlyLabel={true} color="white" bgColor="rgba(168,32,32,1)">
                <span slot="label">
                  <Value
                    title="Left time dependence"
                    value="{stats.leftTimeDependence}"
                    inline={false} digits={3}
                  />
                </span>
          </Badge>
        </div>
      {/if}
    </div>

    <div class="right">
      <HandAcc value={stats.accRight} cut={stats.rightAverageCut} color={stats.saberBColor} hand="right"/>

      {#if stats.rightTimeDependence}
        <div class="td">
          <Badge onlyLabel={true} color="white" bgColor="rgba(32,100,168,1)">
                <span slot="label">
                  <Value
                    title="Right time dependence"
                    value="{stats.rightTimeDependence}" inline={false} digits={3}
                  />
                </span>
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
        font-size: .75em;
    }

    .right .td {
        text-align: right;
    }

    .td :global(.badge) {
        margin: 0 !important;
        padding: .125em .25em !important;
        width: 2.75em;
    }

    .td :global(.badge .label) {
        font-size: .875em;
    }
</style>