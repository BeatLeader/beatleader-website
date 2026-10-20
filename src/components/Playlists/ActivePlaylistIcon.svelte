<script>
	import {activePlaylistIcon} from './icons';

	export let size = '1.1em';
</script>

<span class="active-playlist-icon-wrapper" style="width: {size}; height: {size}">{@html activePlaylistIcon('100%')}</span>

<style>
	.active-playlist-icon-wrapper {
		display: inline-flex;
		flex: none;
		vertical-align: -0.18em;
	}
</style>
