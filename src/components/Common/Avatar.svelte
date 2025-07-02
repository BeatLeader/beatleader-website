<script>
	import {getOverlayUrlByName} from '../Player/Overlay/overlay';

	export let player = null;
	export let clan = null;
	export let overlaySuffix = 'small';
	export let title = null;
	export let cls = 'is-24x24';
	export let big = false;

	$: avatar = player?.playerInfo?.avatar;
	$: avatarUrl = avatar?.includes('beatleader') && !big ? avatar.replace(avatar.split('.')[avatar.split('.').length - 1], 'webp') : avatar;
	$: clanAvatar = clan?.icon ?? null;
	$: profileSettings = player?.profileSettings;
	$: overlayUrl = profileSettings?.effectName?.length ? getOverlayUrlByName(profileSettings.effectName, overlaySuffix) : null;
	$: overlaySize = overlaySuffix === 'small' ? '200%' : '150%';
	$: overlayOffset = overlaySuffix === 'small' ? '-50%' : '-25%';
	$: hue = profileSettings?.hue ?? 0;
	$: saturation = profileSettings?.saturation ?? 1;
</script>

{#if avatar}
	<figure class="image {cls}" {title} on:click>
		<img src={avatarUrl} loading="lazy" alt="" />
		{#if overlayUrl}
			<img
				alt="Avatar overlay effect"
				class="overlay"
				src={overlayUrl}
				style:--hue={`${hue}deg`}
				style:--saturation={saturation}
				style:--size={overlaySize}
				style:--offset={overlayOffset}
				loading="lazy" />
		{/if}
	</figure>
{:else if clan}
	<figure class="image {cls}" on:click>
		<img src={clanAvatar} loading="lazy" alt="" />
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
		top: var(--offset, -50%);
		left: var(--offset, -50%);
		width: var(--size, 200%);
		height: var(--size, 200%);
		aspect-ratio: auto;
		max-width: none;
		mix-blend-mode: screen;
		filter: hue-rotate(var(--hue, 0deg)) saturate(var(--saturation, 1));
		overflow: visible !important;
	}
</style>
