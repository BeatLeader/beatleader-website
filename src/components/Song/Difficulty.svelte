<script>
	import {getHumanDiffInfo, getIconNameForDiff, getDescriptionForDiff} from '../../utils/beatleader/format';
	import Value from '../Common/Value.svelte';

	export let diff;
	export let useShortName = false;
	export let reverseColors = false;
	export let stars = null;
	export let starsSuffix = '*';
	export let enabled = true;
	export let pointer = false;
	export let showDiffIcons = false;
	export let hideTitle = false;
	export let nameAndStars = false;

	$: diffColor = enabled ? diffInfo?.color : 'gray';
	$: diffInfo = diff ? getHumanDiffInfo(diff) : null;
	$: title = useShortName && diffInfo?.type !== 'Standard' ? diffInfo?.name : diffInfo?.fullName;
</script>

{#if diffInfo}
	<span
		class={'diff ' + (reverseColors ? 'reversed' : '')}
		style="color: {reverseColors ? 'white' : diffColor}; background-color: {reverseColors ? diffColor : 'transparent'}; {pointer
			? 'cursor: pointer !important'
			: ''}"
		title={!nameAndStars ? title : null}
		on:click>
		{#if showDiffIcons}
			<span class="icon">
				<div class={getIconNameForDiff(diffInfo)} title={getDescriptionForDiff(diffInfo)} />
			</span>
		{/if}

		{#if !hideTitle && (!stars || nameAndStars)}
			{useShortName ? diffInfo.shortName : diffInfo.fullName}
		{/if}

		{#if stars}
			<Value value={stars} suffix={starsSuffix} zero="" title={!nameAndStars ? title : null} />
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

	.icon {
		height: 1rem !important;
		width: 1rem !important;
	}
</style>
