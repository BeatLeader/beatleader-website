<script>
	import PlaylistTypeIcon from './PlaylistTypeIcon.svelte';

	export let replays = false;
</script>

<span class="cover-badge" title={replays ? 'Replay playlist' : 'Map playlist'}><PlaylistTypeIcon {replays} size="1.2em" /></span>

<style>
	/* The padding centers the icon in the patch's square part, 24 of its 30 units */
	.cover-badge {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		font-size: calc(var(--cover-badge-size, 2.6em) / 2.6);
		width: 2.6em;
		height: 2.6em;
		padding: 0 0.52em 0.52em 0;
		color: white;
		background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Cpath d='M0 0H30Q24 0 24 6V16Q24 24 16 24H6Q0 24 0 30Z' fill-opacity='0.6'/%3E%3C/svg%3E") 0 0 / 100% 100% no-repeat;
	}
</style>
