<script>
	import {computeModifiedRating} from '../../utils/beatleader/pp';
	import {formatNumber} from '../../utils/format';
	import MapTriangle from '../Common/MapTriangle.svelte';

	export let leaderboard;
	export let mods = null;

	$: modifiers = leaderboard?.modifierValues ?? null;
	$: modifiersRating = leaderboard?.modifiersRating ?? null;
	$: passRating = leaderboard?.passRating ?? null;
	$: accRating = leaderboard?.accRating ?? null;
	$: techRating = leaderboard?.techRating ?? null;
	$: actualModifiers = mods?.map(m => ({name: m, value: 0})) ?? null;
	$: modifiedPassRating = computeModifiedRating(passRating, 'PassRating', modifiersRating, actualModifiers);
	$: modifiedAccRating = computeModifiedRating(accRating, 'AccRating', modifiersRating, actualModifiers);
	$: modifiedTechRating = computeModifiedRating(techRating, 'TechRating', modifiersRating, actualModifiers);

	$: title = `Pass: ${formatNumber(modifiedPassRating)}★${
		modifiedPassRating !== passRating ? ' (' + formatNumber(modifiedPassRating - passRating, 2, true) + '★)' : ''
	}\nAcc: ${formatNumber(modifiedAccRating)}★${
		modifiedAccRating !== accRating ? ' (' + formatNumber(modifiedAccRating - accRating, 2, true) + '★)' : ''
	}\nTech: ${formatNumber(modifiedTechRating)}★${
		modifiedTechRating !== techRating ? ' (' + formatNumber(modifiedTechRating - techRating, 2, true) + '★)' : ''
	}`;
</script>

{#if leaderboard}
	<span data-atropos-offset="4" class="type" {title} on:click>
		<span class="triangle" data-atropos-offset="7">
			<MapTriangle
				mapRating={{...leaderboard, passRating: modifiedPassRating, accRating: modifiedAccRating, techRating: modifiedTechRating}}
				width="2.2em"
				height="2.2em" />
		</span>
	</span>
{/if}

<style>
	.type {
		padding: 0.4em;
		border-radius: 4px;
		height: 2.6em;
		background-color: black;
		display: flex;
		pointer-events: all;
	}
	.triangle {
		margin-top: -0.3em;
	}
</style>
