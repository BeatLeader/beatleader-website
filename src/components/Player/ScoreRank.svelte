<script>
  import {tweened} from 'svelte/motion';
  import {cubicOut} from 'svelte/easing';
  import Value from '../Common/Value.svelte'
  import {SS_HOST} from '../../network/scoresaber/page'

  export let rank;
  export let country;
  export let countryRank;
  export let countryRankTotal;
  export let showCountryTotal = false;
  export let inline = true;

  const currentRank = tweened(rank, {
    duration: 500,
    easing: cubicOut,
  });

  const currentCountryRank = tweened(countryRank, {
    duration: 500,
    easing: cubicOut,
  });

  $: {
    currentRank.set(rank);
  }

  $: {
    currentCountryRank.set(countryRank);
  }
</script>

<span class="val">
<i class="fas fa-globe-americas"></i>
<span class="value"><Value value={$currentRank} prefix="#" zero="-" digits={0}/></span>
</span>

{#if country}
<span class="val" style="display:{inline ? 'inline' : 'block'};">
	<img src={`${SS_HOST}/imports/images/flags/${country}.png`}/>
	<span class="value"
        title={!showCountryTotal && country && $currentCountryRank && countryRankTotal ? `#${$currentCountryRank} / ${countryRankTotal}` : ''}>
		<Value value={$currentCountryRank} prefix="#" zero="-" digits={0}/>
    {#if showCountryTotal}<Value value={countryRankTotal} prefix="/" zero="-" digits={0}/>{/if}
	</span>
</span>
{/if}

<style>
	.val {
		display: inline-flex;
		align-items: center;
	}

	.val > *:not(:last-child) {
		margin-right: .25em;
	}
</style>