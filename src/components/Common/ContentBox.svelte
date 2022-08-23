<script>
	export let box = null;
	export let background = 'var(--foreground)';
	export let cls = null;
</script>

<div class="content-box {cls ?? ''}" bind:this={box} style="--box-background: {background}">
	<slot />
</div>

<style>
	.content-box {
		background-color: var(--box-background, var(--foreground));

		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
		margin: 4px 10px 18px;
		border-radius: 6px;
		padding: 1rem;
		position: relative;
		z-index: 1;
	}

	.content-box:hover {
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
	}

	@media screen and (max-width: 767px) {
		.content-box {
			margin: 4px 0 18px;
			border-radius: 0;
			padding: 1rem 0.8rem;
		}
	}
</style>
