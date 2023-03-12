<script>
	export let playlist;
	export let songsCounter = true;
</script>

<section on:click title={`${playlist?.playlistTitle} - ${playlist?.songs?.length} song(s)`}>
	<img
		class="playlistImage"
		src={playlist.image
			? playlist.image.startsWith('data')
				? playlist.image
				: 'data:image/png;base64,' + playlist.image
			: '/assets/song-default.png'}
		alt="PlaylistImage" />
	{#if songsCounter}
		<span class="playlistTitle">{playlist?.playlistTitle} - {playlist?.songs?.length} song(s)</span>
	{:else}
		<span class="playlistTitle">{playlist?.playlistTitle}</span>
	{/if}
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
