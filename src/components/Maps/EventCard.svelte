<script>
	export let text;
	export let body;
	export let image;
</script>

<div class="card" style="--background-url: url({image});">
	<h1 class="header">{text}</h1>
	<p class="content">{body}</p>
</div>

<style>
	.card {
		width: 100%;
		padding: 1em;
		border-radius: 12px;
		background: #232323;
		background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.25)), var(--background-url);
		background-position: 50% 21%;
		background-size: 100%;

		box-shadow: 2px 2px 18px 4px rgba(0, 0, 0, 0.25);
		z-index: 3;
	}

	.header {
		color: #fff;
		font-family: Noto Sans SC;
		font-size: 32px;
		font-style: normal;
		font-weight: 700;
		line-height: normal;
		text-align: left;
		margin-top: -0.25em;
		margin-bottom: 0.33em;
	}

	.content {
		color: white;
	}
</style>
