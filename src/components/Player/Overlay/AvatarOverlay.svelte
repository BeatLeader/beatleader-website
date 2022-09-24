<script>
	import {getOverlayByName} from './overlay';

	export let data;

	$: overlayUrl = getOverlayByName(data?.effectName);
</script>

{#if overlayUrl}
	<span
		style={`
			--hue: ${data?.hue ?? 0}deg;
			--saturation: ${data?.saturation ?? 1}
			`}>
		<img class="avatar-overlay" src={overlayUrl} />
	</span>
{/if}

<style>
	.avatar-overlay {
		position: absolute;
		top: -24px;
		left: -24px;
		width: 230px;
		z-index: 3;
		mix-blend-mode: screen;
		filter: hue-rotate(var(--hue, 0deg)) saturate(var(--saturation, 1));
		pointer-events: none;
	}

	@media screen and (max-width: 767px) {
		.avatar-overlay {
			left: calc(50% - 115px);
		}
	}
</style>
