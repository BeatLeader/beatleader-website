<script>
	import {songStatusesDescription, songStatusesMap} from '../../utils/beatleader/format';
	import createBeatSaverService from '../../services/beatmaps';
	import createPlayerService from '../../services/beatleader/player';
	import {navigate} from 'svelte-routing';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import Avatar from '../Common/Avatar.svelte';

	function navigateToPlayer(player) {
		if (!player) return;

		navigate(`/u/${player.alias ?? player.playerId}`);
	}

	export let songStatus = null;

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

	$: status = songStatus.blstatus ?? Object.entries(songStatusesMap).find(map => map[1] == songStatus.status)[0];
	$: fetchResponsible(songStatus);
	$: label = songStatusesDescription?.[status]?.name ?? songStatus.title ?? status;
	$: iconFile = songStatusesDescription?.[status]?.iconFile ?? `${status}-icon`;
	$: color = songStatusesDescription?.[status]?.color ?? songStatus.color ?? 'var(--beatleader-primary)';
	$: gradient =
		songStatusesDescription?.[status]?.gradient ?? songStatus.gradient ?? 'linear-gradient(rgb(26 26 26 / 65%), rgb(16 16 16 / 79%))';
	$: textColor = songStatusesDescription?.[status]?.textColor ?? null;
	$: title = (songStatusesDescription?.[status]?.title ?? songStatus.details ?? '').replace(
		'DATE',
		songStatus?.timeset ? formatDateRelative(dateFromUnix(songStatus?.timeset)) : ''
	);
</script>

<div class="song-status" style="border: solid 2px {color}; background: {gradient}, center / cover no-repeat url({iconFile})">
	{#if player}
		<div class="player-info">
			<Avatar {player} title={player.name} on:click={player ? () => navigateToPlayer(player) : null} />
		</div>
	{:else if responsible}
		<a href="https://beatsaver.com/profile/{responsible.id}" class="image is-24x24" title={responsible.name}>
			<img src={responsible.avatar} alt="" />
		</a>
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

	img {
		border-radius: 50%;
		aspect-ratio: 1/1;
	}
</style>
