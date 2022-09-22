<script>
	import {dateFromUnix, formatDateRelative, formatDate} from '../../utils/date';
	import {DifficultyStatus} from '../../utils/beatleader/format';

	export let map;

	let diff = map.difficulty ?? map.difficultyBl;

	$: mapStatus = diff.status;
</script>

{#if diff}
	{#if mapStatus == DifficultyStatus.nominated}
		<span style="color: white;" title={formatDate(dateFromUnix(diff.nominatedTime))}>
			Nominated {formatDateRelative(dateFromUnix(diff.nominatedTime))}
		</span>
	{:else if mapStatus == DifficultyStatus.qualified}
		<span style="color: white;" title={formatDate(dateFromUnix(diff.qualifiedTime))}>
			Qualified {formatDateRelative(dateFromUnix(diff.qualifiedTime))}
		</span>
	{:else if mapStatus == DifficultyStatus.ranked && diff.rankedTime}
		<span style="color: white;" title={formatDate(dateFromUnix(diff.rankedTime))}>
			Ranked {formatDateRelative(dateFromUnix(diff.rankedTime))}
		</span>
	{/if}
{/if}

<style>
	.type {
		display: inline-block;
		font-weight: 600;
		padding: 1px 2px;
		min-width: 1.5em;
		max-height: 1.5em;
		border-radius: 4px;
		margin-right: 0.5em;
		height: 2em;
	}

	.cram {
		padding: 0;
		margin-right: 0;
		border-radius: 2px;
		height: 1.5em;
	}

	.icon.cram {
		height: 1rem !important;
		width: 1.5rem !important;
	}

	.icon {
		height: 1rem !important;
		width: 1rem !important;
	}
</style>
