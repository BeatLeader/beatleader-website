<script>
	export let previewLink;

	let iframe;
</script>

<iframe
	class="previewFrame"
	title=""
	src={previewLink}
	allowfullscreen
	bind:this={iframe}
	on:load={() => {
		const newLocation = iframe.contentWindow.location.href;
		window.location.href = newLocation;
	}} />

<style>
	.previewFrame {
		width: 90vw;
		height: 65vh;
		border-radius: 0.6em;
	}
</style>
