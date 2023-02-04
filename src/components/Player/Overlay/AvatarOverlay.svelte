<script>
	import {getOverlayUrlByName} from './overlay';

	export let data;
	export let withCover;

	let overlayUrl = null;

	function onOverlayChange(effectName) {
		if (!effectName?.length) {
			overlayUrl = null;
			return;
		}

		overlayUrl = getOverlayUrlByName(effectName, 'preview');

		const fullUrl = getOverlayUrlByName(effectName);

		const img = new Image();
		img.src = fullUrl;
		img.onload = () => (overlayUrl = fullUrl);
	}

	$: onOverlayChange(data?.effectName);
</script>

{#if overlayUrl}
	<span
		style={`
			--hue: ${data?.hue ?? 0}deg;
			--saturation: ${data?.saturation ?? 1}
			`}>
		<img class="avatar-overlay {withCover ? "with-cover" : ""}" src={overlayUrl} />
	</span>
{/if}

<style>
	.avatar-overlay {
		position: absolute;
		top: -21px;
		left: -21px;
		width: 224px;
		z-index: 3;
		mix-blend-mode: screen;
		filter: hue-rotate(var(--hue, 0deg)) saturate(var(--saturation, 1));
		pointer-events: none;
	}

	.with-cover {
		top: 92px !important;
	}

	@media screen and (max-width: 767px) {
		.avatar-overlay {
			left: calc(50% - 112px);
		}
	}
</style>
