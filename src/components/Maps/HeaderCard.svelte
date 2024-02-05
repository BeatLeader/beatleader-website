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
		background: #232323;
		box-shadow: 2px 2px 18px 4px rgba(0, 0, 0, 0.25);
		z-index: 3;
	}

	.header {
		color: #fff;
		font-family: Noto Sans SC;
		font-size: 42px;
		font-style: normal;
		font-weight: 700;
		line-height: normal;
		text-align: center;
	}
</style>
