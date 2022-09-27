<script>
	import {getOverlayUrlByName} from '../Player/Overlay/overlay';

	export let player;

	$: avatar = player?.playerInfo?.avatar;
	$: profileSettings = player?.profileSettings;
	$: overlayUrl = profileSettings?.effectName?.length ? getOverlayUrlByName(profileSettings.effectName, 'small') : null;
	$: hue = profileSettings?.hue ?? 0;
	$: saturation = profileSettings?.saturation ?? 1;
</script>

{#if avatar}
	<figure class="image is-24x24" on:click>
		<img src={avatar} alt="" />
		{#if overlayUrl}
			<img
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
	}

	img {
		border-radius: 50%;
		aspect-ratio: 1/1;
	}

	img.overlay {
		position: absolute;
		top: -12px;
		left: -12px;
		width: 48px;
		height: 48px;
		aspect-ratio: auto;
		max-width: none;
		mix-blend-mode: screen;
		filter: hue-rotate(var(--hue, 0deg)) saturate(var(--saturation, 1));
	}
</style>
