<script>
	import {navigate} from 'svelte-routing';
	import createPlaylistStore from '../../stores/playlists';
	import {configStore} from '../../stores/config';
	import Badge from '../Common/Badge.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import Button from '../Common/Button.svelte';

	const playlists = createPlaylistStore();

	var badgeScale = 1;
	var lastPlaylist = null;

	function animateBadge(songsCount, playlist) {
		if (songsCount) {
			if (playlist !== lastPlaylist) {
				lastPlaylist = playlist;
				return;
			}
			badgeScale = 1.2;
			setTimeout(() => {
				badgeScale = 1;
			}, 300);
		}
	}

	$: selectedPlaylist = $configStore?.selectedPlaylist;
	$: playlist = $playlists?.[selectedPlaylist] ?? null;
	$: songsCount = playlist?.songs?.length;
	$: animateBadge(songsCount, playlist);
</script>

{#if playlist}
	<section class="playlist-cart">
		<ContentBox cls="selected-playlist-box">
			<div class="unselect">
				<Button cls="unselect-playlist-button" iconFa="fa fa-xmark" title="Unselect playlist" on:click={() => playlists.select(null)} />
			</div>
			<a
				class="clickable-ref"
				title={playlist.playlistTitle}
				href="/playlists/{selectedPlaylist}"
				on:click|preventDefault={() => {
					navigate(`/playlists/${selectedPlaylist}`);
				}}>
				<img
					class="playlistImage"
					src={playlist.image
						? playlist.image.startsWith('data')
							? playlist.image
							: 'data:image/png;base64,' + playlist.image
						: '/assets/song-default.png'}
					alt="PlaylistImage" />
			</a>
			<div class="playlist-map-count" style="scale: {badgeScale};">
				<Badge label={songsCount} bgColor="red" onlyLabel={true} />
			</div>
		</ContentBox>
	</section>
{/if}

<style>
	.playlist-cart {
		position: fixed;
		bottom: 2em;
		left: 2em;
		display: flex;
		z-index: 10;
	}

	.playlist-map-count {
		position: absolute;
		bottom: -0.25em;
		left: 0.3em;
		transition: scale 0.3s cubic-bezier(0.38, 0.19, 0, 0.81);
	}

	.unselect {
		position: absolute;
		right: -0.5em;
		top: -0.5em;
	}

	.playlistImage {
		height: 5em;
		width: 5em;
		margin-bottom: -0.6em;
	}

	.clickable-ref {
		cursor: pointer !important;
	}

	:global(.selected-playlist-box) {
		padding: 0 !important;
		margin: 0 !important;
	}

	:global(.unselect-playlist-button) {
		border-radius: 50% !important;
		width: 1.5em;
		padding: 0 !important;
		height: 1.5em;
	}

	:global(.playlist-map-count .label) {
		padding: 0 0.1em 0 0.1em !important;
	}
</style>
