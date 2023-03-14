<script>
	import {getOverlayUrlByName} from '../Player/Overlay/overlay';

	export let player;
	export let overlaySuffix = 'small';

	$: avatar = player?.playerInfo?.avatar;
	$: profileSettings = player?.profileSettings;
	$: overlayUrl = profileSettings?.effectName?.length ? getOverlayUrlByName(profileSettings.effectName, overlaySuffix) : null;
	$: hue = profileSettings?.hue ?? 0;
	$: saturation = profileSettings?.saturation ?? 1;
</script>

{#if avatar}
	<figure class="image is-24x24" on:click>
		<img src={avatar} alt="" />
		{#if overlayUrl}
			<img
				alt="Avatar overlay effect"
				class="overlay"
				src={overlayUrl}
				style={`
			--hue: ${hue}deg;
			--saturation: ${saturation}
			`} />
		{/if}
	</figure>
{/if}

<style>
	figure {
		position: relative;
		overflow: visible !important;
	}

	img {
		border-radius: 50%;
		aspect-ratio: 1/1;
	}

	img.overlay {
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		aspect-ratio: auto;
		max-width: none;
		mix-blend-mode: screen;
		filter: hue-rotate(var(--hue, 0deg)) saturate(var(--saturation, 1));
		overflow: visible !important;
	}
</style>
