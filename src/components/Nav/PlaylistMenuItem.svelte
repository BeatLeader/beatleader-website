<script>
	export let playlist;
</script>

<section on:click on:keypress title="Select active playlist to modify">
	<img
		class="playlistImage"
		src={playlist.image
			? playlist.image.startsWith('data')
				? playlist.image
				: 'data:image/png;base64,' + playlist.image
			: '/assets/song-default.png'}
		alt="PlaylistImage" />
	<span class="playlistTitle">{playlist?.playlistTitle} - {playlist?.songs?.length} song(s)</span>
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
	}
</style>
