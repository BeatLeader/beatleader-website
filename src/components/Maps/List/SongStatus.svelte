<script>
	import {songStatusesDescription, songStatusesMap, DifficultyStatus} from '../../../utils/beatleader/format';
	import {dateFromUnix, formatDateRelative, formatDate, WEEKSECONDS} from '../../../utils/date';

	export let songStatus = null;
	export let difficulty = null;

	let qualifiedRankedWeek = null;
	let readyToRank = false;
	let thisFriday10amUnix = null;
	let nextFriday10amUnix = null;

	function calculateQualifiedRankedWeek(difficulty) {
		qualifiedRankedWeek = null;
		if (!difficulty) return;
		if (difficulty.status != DifficultyStatus.qualified) return;
		const now = new Date();
		const day = now.getUTCDay();
		const daysUntilFriday = (5 - day + 7) % 7 || 7;
		let friday = new Date(Date.UTC(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate() + daysUntilFriday,
			10, 0, 0
		));
		if (day === 5 && now.getUTCHours() < 10) {
			friday = new Date(Date.UTC(
				now.getUTCFullYear(),
				now.getUTCMonth(),
				now.getUTCDate(),
				10, 0, 0
			));
		}

		thisFriday10amUnix = Math.floor(friday.getTime() / 1000);
		const fridayEpochStart = 1762509600;
		const weekNumberBase = 169;
		if (difficulty.qualifiedTime + WEEKSECONDS < thisFriday10amUnix) {
			qualifiedRankedWeek = weekNumberBase + Math.floor((thisFriday10amUnix - fridayEpochStart) / WEEKSECONDS);
			readyToRank = true;
		} else {
			nextFriday10amUnix = thisFriday10amUnix + WEEKSECONDS;
			qualifiedRankedWeek = weekNumberBase + Math.floor((nextFriday10amUnix - fridayEpochStart) / WEEKSECONDS);
			readyToRank = false;
		}
	}

	$: status = songStatus.blstatus ?? Object.entries(songStatusesMap).find(map => map[1] == songStatus.status)[0];
	$: label = songStatusesDescription?.[status]?.name ?? songStatus.title ?? status;
	$: color = songStatusesDescription?.[status]?.color ?? songStatus.color ?? 'var(--beatleader-primary)';
	$: title = (songStatusesDescription?.[status]?.title ?? songStatus.details ?? '').replace(
		'DATE',
		songStatus?.timeset ? formatDateRelative(dateFromUnix(songStatus?.timeset)) : ''
	);
	$: calculateQualifiedRankedWeek(difficulty);
</script>

{#if qualifiedRankedWeek}
	<div class="qualified-ranked-week" style="background-color: {readyToRank ? '#eb008c' : '#d2d2d2'}">
		Batch #{qualifiedRankedWeek}
		{#if readyToRank}
			<i class="fa-solid fa-calendar-check" style="margin-left: 0.2em;" title={"Will be ranked this Friday at 10:00 UTC"}></i>
		{:else}
			<i class="fa-solid fa-clock" style=" margin-left: 0.2em;" title={"Will be ranked on " + formatDate(dateFromUnix(nextFriday10amUnix))}></i>
		{/if}
	</div>
{/if}

<div class="song-status" style="background-color: {color}ee">
	
	<span class="status-label" {title}>{label}</span>
</div>

<style>
	.song-status {
		border-radius: 0.6em;
		padding: 0.1em 0.18em;
		color: #2e383c;
		font-size: 0.8em;
		display: flex;
		align-items: center;
		font-weight: 600;
	}

	.qualified-ranked-week {
		border-radius: 0.6em;
		padding: 0.1em 0.28em;
		color: #2e383c;
		font-size: 0.8em;
		display: flex;
		align-items: center;
		font-weight: 600;
	}

	.status-label {
		margin-left: 0.2em;
		margin-right: 0.2em;
	}

	img {
		border-radius: 50%;
		aspect-ratio: 1/1;
	}
</style>
