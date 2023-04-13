<script>
	import {dateFromUnix, formatDateRelative, formatDate} from '../../utils/date';
	import {getHumanDiffInfo, getIconNameForDiff, getDescriptionForDiff, formatDiffStatus} from '../../utils/beatleader/format';
	import {DifficultyStatus} from '../../utils/beatleader/format';
	import Difficulty from '../Song/Difficulty.svelte';

	export let map;
	export let stars;
	export let viewType;

	let diff = map.difficulty ?? map.difficultyBl;

	$: mapStatus = diff.status;
	$: statusName = formatDiffStatus(mapStatus);
	$: diffInfo = diff ? getHumanDiffInfo(map.diffInfo) : null;
	$: diffColor = diffInfo?.color;
</script>

{#if diff}
	<div class="diff-container {viewType}" style="background-color: {diffColor};" title={diffInfo?.name}>
		<div class="diff-description" data-atropos-offset="3">
			{#if map?.diffInfo?.type != 'Standard'}
				<div class="mode">
					<Difficulty diff={map.diffInfo} pointer={true} hideTitle={true} reverseColors={true} showDiffIcons={true} />
				</div>
			{/if}
			{statusName}
			{#if stars}
				{stars.toFixed(2)} ★
			{/if}
		</div>
		{#if mapStatus == DifficultyStatus.nominated}
			<span class="date-description" title={formatDate(dateFromUnix(diff.nominatedTime))}>
				{formatDateRelative(dateFromUnix(diff.nominatedTime))}
			</span>
		{:else if mapStatus == DifficultyStatus.qualified}
			<span class="date-description" title={formatDate(dateFromUnix(diff.qualifiedTime))}>
				{formatDateRelative(dateFromUnix(diff.qualifiedTime))}
			</span>
		{:else if mapStatus == DifficultyStatus.ranked && diff.rankedTime}
			<span class="date-description" title={formatDate(dateFromUnix(diff.rankedTime))}>
				{formatDateRelative(dateFromUnix(diff.rankedTime))}
			</span>
		{/if}
	</div>
{/if}

<style>
	.diff-container {
		padding: 0.3em;
		border-radius: 0.3em 0;
		pointer-events: all;
	}
	.diff-description {
		color: white;
		font-weight: bolder;
		display: flex;
	}
	.maps-table .diff-description {
		font-size: small;
	}
	.date-description {
		color: gainsboro;
	}
	.maps-table .date-description {
		font-size: x-small;
	}
</style>
