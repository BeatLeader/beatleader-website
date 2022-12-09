<script>
	export let playlist;
	export let songsCounter = false;
</script>

<figure>
	<div class="playlistInfo">
		<img
			class="playlistImage"
			src={playlist.image
				? playlist.image.startsWith('data')
					? playlist.image
					: 'data:image/png;base64,' + playlist.image
				: '/assets/song-default.png'}
			alt="PlaylistImage" />
		{#if songsCounter}
			<span class="playlistTitle">{playlist.playlistTitle} - {playlist.songs.length} songs</span>
		{:else}
			<span class="playlistTitle">{playlist.playlistTitle}</span>
		{/if}
	</div>
</figure>

<style>
	.playlistImage {
		height: 1.5em;
		width: 1.5em;
	}

	.playlistTitle {
		bottom: 0.3em;
		position: relative;
	}
</style>
