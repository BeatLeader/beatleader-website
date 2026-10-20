<script>
	import {playlistTypeIcon} from './icons';

	export let replays = false;
	export let size = '1.1em';
</script>

<span class="playlist-type-icon-wrapper" style="width: {size}; height: {size}">{@html playlistTypeIcon(replays, '100%')}</span>

<style>
	.playlist-type-icon-wrapper {
		display: inline-flex;
		flex: none;
		vertical-align: -0.18em;
	}
</style>
