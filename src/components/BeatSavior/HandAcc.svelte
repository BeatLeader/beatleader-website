<script>
  import config from '../../config'
  import {formatNumber} from '../../utils/format'
  import Donut from '../Common/Donut.svelte'

  const MAX_BLOCK_VALUE = 115;

  export let value;
  export let cut;
  export let color;
  export let hand = "left";

  function getRgba(color) {
    const keys = ['r', 'g', 'b', 'a']

    const isOk = color && keys.reduce((ok, key) => ok && Number.isFinite(color[key]) && color[key] >= 0 && color[key] <= 1, true);
    if (!isOk) return hand === 'left' ? config.leftSaberColor : config.rightSaberColor;

    return 'rgba(' + keys.reduce((prev, key) => prev.concat(key !== 'a' ? Math.round(color[key] * 255) : color[key]), []) + ')';
  }

  $: accValue = Number.isFinite(value) && value >= 0 && value <= 115 ? value : 0;
  $: percentage = accValue / MAX_BLOCK_VALUE;
  $: rgba = getRgba(color);
  $: cutsRounded = cut && Array.isArray(cut) ? cut.map(c => Number.isFinite(c) ? formatNumber(c) : 0) : null;
</script>

{#if cutsRounded}
<section class={hand}>
  {#if cutsRounded && hand === 'left'}
    <div class="cuts">
      {#each cutsRounded as c, idx}
        <span title={idx === 0 ? 'Before' : (idx === 1 ? 'Accuracy' : 'After')}>{c}</span>
      {/each}
    </div>
  {/if}

  <div class="donut">
    <Donut value={value} {percentage} color={rgba}/>
  </div>

  {#if cutsRounded && hand === 'right'}
    <div class="cuts">
      {#each cutsRounded as c, idx}
        <span title={idx === 0 ? 'Before' : (idx === 1 ? 'Accuracy' : 'After')}>{c}</span>
      {/each}
    </div>
  {/if}
</section>
{/if}


<style>
    section {
        display: inline-flex;
    }

    .cuts {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        font-size: .875em;
        text-align: center;
    }

    .donut {
        width: 4.5em;
        margin: 0 .5em;
    }
</style>