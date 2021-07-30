<script>
  import {getHumanDiffInfo} from '../../utils/scoresaber/format'
  import Value from '../Common/Value.svelte'

  export let diff;
  export let useShortName = false;
  export let reverseColors = false;
  export let stars = null;

  $: diffInfo = diff ? getHumanDiffInfo(diff) : null;
  $: title = useShortName && diffInfo.type !== 'Standard' ? diffInfo.name: diffInfo.fullName;
</script>

{#if diffInfo}
  <span class="{'diff ' + (reverseColors ? 'reversed' : '')}"
        style="color: {reverseColors ? 'white' : diffInfo.color}; background-color: {reverseColors ? diffInfo.color : 'transparent'}"
        {title}>
    {#if stars}
      <Value value={stars} suffix="*" zero="" {title}/>
    {:else}
      {useShortName ? diffInfo.shortName : diffInfo.fullName}
    {/if}
  </span>
{/if}

<style>
    .diff {
        display: inline-block;
    }

    .reversed {
        font-weight: 600;
        padding: 0 2px;
        min-width: 1.5em;
        max-height: 1.5em;
        border-radius: 2px;
    }
</style>