<script>
	export let text;
</script>

<div class="discover">
	<h1 class="header">{text}</h1>
</div>

<style>
	.discover {
		width: 100%;
		padding: 1em;
		border-radius: 12px;
		background: rgb(217 24 116);
		background: linear-gradient(130deg, rgb(217 24 116) 0%, rgb(47 36 188) 100%);
		box-shadow: 2px 2px 18px 4px rgba(0, 0, 0, 0.25);
		z-index: 3;
	}

	.header {
		color: #fff;
		font-size: 2.5em;
		font-style: normal;
		font-weight: 700;
		line-height: normal;
		text-align: center;
	}
</style>
