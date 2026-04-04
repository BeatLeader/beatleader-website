<script>
	export let src = '';
	export let title = '';
	export let cls = '';
	export let fixedWidth = false;
</script>

<span
	class={`fa-svg-icon ${fixedWidth ? 'fa-svg-icon--fixed' : ''} ${cls}`.trim()}
	style={`--icon-src: url('${src}')`}
	aria-hidden="true"
	{title} />

<style>
	.fa-svg-icon {
		display: inline-block;
		width: 1em;
		height: 1em;
		line-height: 1;
		flex: 0 0 auto;
		vertical-align: -0.125em;
	}

	.fa-svg-icon--fixed {
		width: 1.25em;
	}

	.fa-svg-icon::before {
		content: '';
		display: block;
		width: 100%;
		height: 100%;
		background-color: currentColor;
		-webkit-mask-image: var(--icon-src);
		mask-image: var(--icon-src);
		-webkit-mask-position: center;
		mask-position: center;
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
		-webkit-mask-size: contain;
		mask-size: contain;
	}
</style>
