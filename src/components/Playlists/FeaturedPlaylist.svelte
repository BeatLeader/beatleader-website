<script>
	import ContentBox from '../Common/ContentBox.svelte';
	import {fade, fly, slide} from 'svelte/transition';

	export let playlist;
	export let idx = 0;
	export let animationSign = 1;

	function maybe(node, options) {
		if (animationSign) {
			return options.fn(node, options);
		} else {
			return options.fn(node, {duration: 0, delay: 0, easing: () => 0});
		}
	}
</script>

<div in:maybe|global={{fn: fly, x: animationSign * 300, delay: idx * 30, duration: 300}} out:maybe|global={{fn: fade, duration: 100}}>
	<ContentBox cls="featured-playlist-box">
		<a class="featured-playlist-container" href={playlist.playlistLink}>
			<img class="featured-playlist-cover" src={playlist.cover} />

			<div class="featured-playlist-info">
				<span class="featured-playlist-title">{playlist.title}</span>
				{#if playlist.description}
					<span class="featured-playlist-description">{playlist.description}</span>
				{/if}

				{#if playlist.mapCount}
					<span class="featured-playlist-map-count">{playlist.mapCount} maps</span>
				{/if}

				<div class="featured-playlist-owner-container">
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
			</div>
		</a>
	</ContentBox>
</div>

<style>
	:global(.featured-playlist-box) {
		padding: 0 !important;
		width: 32em;
		border-radius: 16px !important;
		overflow: hidden;
	}

	:global(.featured-playlist-box:hover) {
		transform: scale(1.02);
	}

	.featured-playlist-container {
		display: flex;
		align-items: center;
		gap: 0.5em;
		cursor: pointer;
		color: white !important;
		width: 100%;
		height: 100%;
		background-color: #212121;
		padding: 0.5em;
	}

	.featured-playlist-title {
		font-size: larger;
		font-weight: bold;
		text-align: left;
		margin-top: -0.4em;
	}

	.featured-playlist-info {
		display: flex;
		flex-direction: column;
		align-items: baseline;
		justify-content: space-between;
		height: 8em;
	}

	.featured-playlist-map-count {
		font-size: smaller;
	}

	.featured-playlist-description {
		font-size: x-small;
	}

	.featured-playlist-owner {
		padding: 0.2em;
		border-radius: 6px;
	}

	.featured-playlist-cover {
		width: 9em;
		border-radius: 12px;
	}

	.featured-playlist-owner-container {
		display: flex;
		align-items: center;
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
