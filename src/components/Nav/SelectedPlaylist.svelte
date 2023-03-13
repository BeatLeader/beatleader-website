<script>
	import Badge from '../Common/Badge.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import {navigate} from 'svelte-routing';
	import Button from '../Common/Button.svelte';

	export let playlists;
	export let selectedPlaylist;

	$: playlist = $playlists[selectedPlaylist];
</script>

{#if playlist}
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
		<div class="playlist-map-count">
			<Badge label={playlist.songs?.length} bgColor="red" onlyLabel={true} />
		</div>
	</ContentBox>
{/if}

<style>
	.playlist-map-count {
		position: absolute;
		bottom: -0.25em;
		left: 0.3em;
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
