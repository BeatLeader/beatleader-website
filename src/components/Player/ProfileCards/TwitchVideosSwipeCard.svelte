<script>
	import TwitchVideos from '../TwitchVideos.svelte';

	export let videos = null;
</script>

<div>
	<TwitchVideos {videos} />
</div>

<style>
	div :global(section) {
		padding-left: 0 !important;
		padding-right: 0 !important;
	}

	div :global(section > h3) {
		padding-left: 0 !important;
		padding-right: 0 !important;
	}

	div :global(.videos a) {
		pointer-events: fill;
	}
</style>
