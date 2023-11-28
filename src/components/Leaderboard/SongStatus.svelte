<script>
	import {songStatusesDescription, songStatusesMap} from '../../utils/beatleader/format';

	export let songStatus = null;

	$: status = Object.entries(songStatusesMap).find(map => map[1] == songStatus.status)[0];
	$: console.log(status);
	$: label = songStatusesDescription?.[status]?.name ?? status;
	$: iconFile = songStatusesDescription?.[status]?.iconFile ?? `${status}-icon`;
	$: color = songStatusesDescription?.[status]?.color ?? 'var(--beatleader-primary';
	$: textColor = songStatusesDescription?.[status]?.textColor ?? null;
	$: title = songStatusesDescription?.[status]?.title ?? null;
</script>

<div
	class="song-status"
	style="border: solid 2px {color}; background: linear-gradient(rgb(26 26 26 / 65%), rgb(16 16 16 / 79%)), center / cover no-repeat url({iconFile})">
	{#if songStatus.link}
		<a href={songStatus.link} {title} style="color: aliceblue !important;">{label}</a>
	{:else}
		<span {title}>{label}</span>
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
	}
</style>
