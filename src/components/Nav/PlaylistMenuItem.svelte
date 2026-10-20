<script>
	import {isReplayPlaylist, playlistCover, playlistItemsLabel} from '../../stores/playlists';
	import PlaylistTypeIcon from '../Playlists/PlaylistTypeIcon.svelte';
	import ActivePlaylistIcon from '../Playlists/ActivePlaylistIcon.svelte';

	export let playlist;
	export let active = false;
</script>

<section on:click title={active ? 'Active playlist, click to stop adding to it' : 'Make active: playlist buttons add here'}>
	<img class="playlistImage" src={playlistCover(playlist)} alt="PlaylistImage" loading="lazy" />
	<span class="type"><PlaylistTypeIcon replays={isReplayPlaylist(playlist)} /></span>
	<span class="playlistTitle">{playlist?.playlistTitle}</span>
	<small>{playlistItemsLabel(playlist)}</small>
	{#if active}<span class="active"><ActivePlaylistIcon /></span>{/if}
</section>

<style>
	section {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.playlistImage {
		height: 1.5em;
		width: 1.5em;
	}

	.playlistTitle {
		position: relative;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.type,
	small {
		opacity: 0.6;
		font-size: 0.8em;
		white-space: nowrap;
	}

	.active {
		color: #ffd24d;
	}
</style>
