<script>
	import {songStatusesDescription, songStatusesMap, DifficultyStatus} from '../../utils/beatleader/format';
	import createBeatSaverService from '../../services/beatmaps';
	import createPlayerService from '../../services/beatleader/player';
	import {navigate} from 'svelte-routing';
	import {dateFromUnix, formatDateRelative, formatDate, WEEKSECONDS} from '../../utils/date';
	import Avatar from '../Common/Avatar.svelte';

	function navigateToPlayer(player) {
		if (!player) return;

		navigate(`/u/${player.alias ?? player.playerId}`);
	}

	export let songStatus = null;
	export let difficulty = null;

	let responsible = null;
	let player = null;

	let beatSaverService = createBeatSaverService();
	const playerService = createPlayerService();

	async function fetchResponsible(status) {
		if (!status?.responsible) return;

		try {
			player = await playerService.fetchPlayerSaver(status.responsible);
		} catch {}

		if (player == null) {
			responsible = await beatSaverService.getMapper(status.responsible);
		}
	}

	let qualifiedRankedWeek = null;
	let readyToRank = false;
	let thisFriday10amUnix = null;
	let nextFriday10amUnix = null;
	let rankedStatusTitle = null;

	function calculateQualifiedRankedWeek(difficulty) {
		if (!difficulty) return;
		if (difficulty.status != DifficultyStatus.qualified && difficulty.status != DifficultyStatus.ranked) return;
		const now = new Date();
		const day = now.getUTCDay();
		const daysUntilFriday = (5 - day + 7) % 7 || 7;
		let friday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilFriday, 10, 0, 0));
		if (day === 5 && now.getUTCHours() < 10) {
			friday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 10, 0, 0));
		}
		thisFriday10amUnix = Math.floor(friday.getTime() / 1000);
		const fridayEpochStart = 1762509600;
		const weekNumberBase = 169;

		if (difficulty.status == DifficultyStatus.ranked) {
			qualifiedRankedWeek = weekNumberBase + Math.floor((difficulty.rankedTime - fridayEpochStart) / WEEKSECONDS);
			readyToRank = true;
			rankedStatusTitle = 'Ranked on ' + formatDate(dateFromUnix(difficulty.rankedTime));
		} else {
			if (difficulty.qualifiedTime + WEEKSECONDS < thisFriday10amUnix) {
				qualifiedRankedWeek = weekNumberBase + Math.floor((thisFriday10amUnix - fridayEpochStart) / WEEKSECONDS);
				readyToRank = true;
				rankedStatusTitle = 'Will be ranked this Friday at 10:00 UTC';
			} else if (difficulty.status == DifficultyStatus.qualified) {
				nextFriday10amUnix = thisFriday10amUnix + WEEKSECONDS;
				qualifiedRankedWeek = weekNumberBase + Math.floor((nextFriday10amUnix - fridayEpochStart) / WEEKSECONDS);
				readyToRank = false;
				rankedStatusTitle = 'Will be ranked on ' + formatDate(dateFromUnix(nextFriday10amUnix));
			}
		}
	}

	$: calculateQualifiedRankedWeek(difficulty);

	$: status = songStatus.blstatus ?? Object.entries(songStatusesMap).find(map => map[1] == songStatus.status)[0];
	$: fetchResponsible(songStatus);
	$: label = songStatusesDescription?.[status]?.name ?? songStatus.title ?? status;
	$: iconFile = songStatusesDescription?.[status]?.iconFile ?? `${status}-icon`;
	$: color = songStatusesDescription?.[status]?.color ?? songStatus.color ?? 'var(--beatleader-primary)';
	$: gradient =
		songStatusesDescription?.[status]?.gradient ?? songStatus.gradient ?? 'linear-gradient(rgb(26 26 26 / 65%), rgb(16 16 16 / 79%))';
	$: textColor = songStatusesDescription?.[status]?.textColor ?? null;
	$: showIcon = songStatusesDescription?.[status]?.showIcon ?? null;
	$: title = (songStatusesDescription?.[status]?.title ?? songStatus.details ?? '').replace(
		'DATE',
		songStatus?.timeset ? formatDateRelative(dateFromUnix(songStatus?.timeset)) : ''
	);
</script>

{#if qualifiedRankedWeek}
	<div
		class="song-status"
		style="background-color: {readyToRank ? '#eb008c2e' : '#d2d2d22e'}; border: solid 2px {readyToRank ? '#eb008c' : '#d2d2d2'}"
		title={rankedStatusTitle}>
		{#if readyToRank}
			<i class="fa-solid fa-calendar-check" style="margin-left: 0.2em;"></i>
		{:else if songStatus.status == DifficultyStatus.ranked}
			<i class="fa-solid fa-clock" style=" margin-left: 0.2em;"></i>
		{:else}
			<i class="fa-solid fa-clock" style=" margin-left: 0.2em;"></i>
		{/if}
		<span class="status-label" style="margin-left: 0.4em;">
			Batch #{qualifiedRankedWeek}
		</span>
	</div>
{/if}

<div
	class="song-status"
	style="border: solid 2px {color}; background: {gradient} {showIcon ? '' : `, center / cover no-repeat url(${iconFile})`}">
	{#if player}
		<div class="player-info">
			<Avatar {player} title={player.name} on:click={player ? () => navigateToPlayer(player) : null} />
		</div>
	{:else if responsible}
		<a href="https://beatsaver.com/profile/{responsible.id}" class="image is-24x24" title={responsible.name}>
			<img src={responsible.avatar} alt="" />
		</a>
	{:else if showIcon}
		<img class="image" src={iconFile} style="width: 24px; color: {color}" />
	{/if}
	{#if songStatus.link}
		<a class="status-label" href={songStatus.link} {title} style="color: aliceblue !important;">{label}</a>
	{:else}
		<span class="status-label" {title}>{label}</span>
	{/if}
</div>

<style>
	.song-status {
		background-color: #00000061;
		border-radius: 10px;
		padding: 0.3em;
		color: aliceblue;
		font-size: small;
		margin-bottom: 0.2em;
		display: flex;
		align-items: center;
	}

	.status-label {
		margin-left: 0.2em;
		margin-right: 0.2em;
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

	img {
		border-radius: 50%;
		aspect-ratio: 1/1;
	}
</style>
