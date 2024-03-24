<script>
	export let playlist;
</script>

<div class="featured-playlist-container">
	<a href={playlist.playlistLink}>
		<img class="featured-playlist-cover" src={playlist.cover} />
	</a>
	<span class="featured-playlist-title">{playlist.title}</span>

	<div
		class="featured-playlist-owner"
		style="border: solid 2px white; background: linear-gradient(rgb(26 26 26 / 65%), rgb(16 16 16 / 79%)), center / cover no-repeat url({playlist.ownerCover})">
		{#if playlist.ownerLink}
			<a class="status-label" href={playlist.ownerLink} style="color: aliceblue !important;">{playlist.owner}</a>
		{:else}
			<span class="status-label">{playlist.owner}</span>
		{/if}
	</div>
</div>

<style>
	.featured-playlist-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3em;
	}

	.featured-playlist-title {
		font-size: x-large;
		font-weight: bold;
		text-align: center;
	}

	.featured-playlist-owner {
		padding: 0.2em;
		border-radius: 6px;
	}

	.featured-playlist-cover {
		width: 12em;
	}

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
</style>
