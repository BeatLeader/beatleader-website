<script>
	import {songStatusesDescription, songStatusesMap} from '../../../utils/beatleader/format';
	import {dateFromUnix, formatDateRelative} from '../../../utils/date';

	export let songStatus = null;

	$: status = songStatus.blstatus ?? Object.entries(songStatusesMap).find(map => map[1] == songStatus.status)[0];
	$: label = songStatusesDescription?.[status]?.name ?? songStatus.title ?? status;
	$: color = songStatusesDescription?.[status]?.color ?? songStatus.color ?? 'var(--beatleader-primary)';
	$: title = (songStatusesDescription?.[status]?.title ?? songStatus.details ?? '').replace(
		'DATE',
		songStatus?.timeset ? formatDateRelative(dateFromUnix(songStatus?.timeset)) : ''
	);
</script>

<div class="song-status" style="background-color: {color}ee">
	<span class="status-label" {title}>{label}</span>
</div>

<style>
	.song-status {
		border-radius: 0.7em;
		padding: 0.2em;
		color: #000000b3;
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
