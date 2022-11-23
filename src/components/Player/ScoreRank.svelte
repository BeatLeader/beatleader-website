<script>
	import {tweened} from 'svelte/motion';
	import {cubicOut} from 'svelte/easing';
	import Value from '../Common/Value.svelte';
	import {BL_CDN} from '../../network/queues/beatleader/page-queue';
	import {getHeadsetForHMD, describePlatform, getControllerForEnum} from '../../utils/beatleader/format';

	export let rank;
	export let country;
	export let countryRank;
	export let countryRankTotal;
	export let showCountryTotal = false;
	export let inline = true;

	export let hmd = null;
	export let platform = null;
	export let controller = null;

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

	$: headset = getHeadsetForHMD(hmd);
	$: controllerDescription = getControllerForEnum(controller).length > 0 ? ' with ' + getControllerForEnum(controller) : '';
	$: platformDescription = describePlatform(platform);
	$: title = headset?.name + controllerDescription + (platformDescription?.description ? '\n' + platformDescription?.description : '');
	$: headsetStyle = `width: 1.2em; filter: ${headset?.color}`;
</script>

<span class="val">
	<i class="fas fa-globe-americas" />
	<strong class="value">
		<Value value={$currentRank} prefix="#" zero="-" digits={0} />
	</strong>

	{#if headset}
		<img src={'/assets/' + headset.icon} alt={headset.name} {title} style={headsetStyle} />
	{/if}
</span>

{#if country}
	<span class="val" style="display:{inline ? 'inline' : 'block'};">
		<img src={`${BL_CDN}/flags/${country}.png`} alt="" />
		<strong
			class="value"
			title={!showCountryTotal && country && $currentCountryRank && countryRankTotal
				? `#${$currentCountryRank} / ${countryRankTotal}`
				: ''}>
			<Value value={$currentCountryRank} prefix="#" zero="-" digits={0} />
			{#if showCountryTotal}<Value value={countryRankTotal} prefix="/" zero="-" digits={0} />{/if}
		</strong>
	</span>
{/if}

<style>
	.val {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.val > *:not(:last-child) {
		margin-right: 0.25em;
	}
</style>
