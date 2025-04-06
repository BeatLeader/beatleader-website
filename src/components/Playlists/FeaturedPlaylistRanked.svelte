<script>
	export let playlist;
</script>

<a href={`/playlist/${playlist.id}`} class="featured-playlist-ranked" style="background-color: {playlist.color}2e;">
	<i class={playlist.fa} style="color: {playlist.color};"></i>
	<div class="playlist-info">
		<h3 class="playlist-name">{playlist.name}</h3>
		<p class="playlist-description">{playlist.description}</p>
	</div>
</a>

<style>
	i {
		font-size: 2.5em;
	}
	.playlist-name {
		font-size: large;
		font-weight: bold;
	}
	.featured-playlist-ranked {
		display: flex;
		align-items: center;
		gap: 1em;
		padding: 1em;
		border-radius: 1em;
		box-shadow: rgba(0, 0, 0, 0.25) 2px 2px 18px 4px;
		cursor: pointer;
		user-select: none;
		border-radius: 12px;
		overflow: hidden;
	}

	.featured-playlist-ranked:hover {
		transform: scale(1.02);
		box-shadow: rgba(0, 0, 0, 0.45) 2px 2px 18px 4px;
	}

	.playlist-info {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		color: white !important;
	}
</style>
