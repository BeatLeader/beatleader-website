<script>
	import {getContext} from 'svelte';
	import Atropos from 'atropos/svelte';
	import AchievementDetailsContent from './AchievementDetailsContent.svelte';
	import AchievementPopup from './AchievementPopup.svelte';

	export let achievement;
	export let showDetails = true;
	export let in3d = true;

	const {open} = getContext('simple-modal');
	const showPopup = () => {
		open(AchievementPopup, {achievement});
	};
</script>

{#if in3d}
	<Atropos rotateXMax={5} rotateYMax={5} rotateTouch="scroll-y">
		<AchievementDetailsContent {achievement} {showDetails} on:click={showPopup} />
	</Atropos>
{:else}
	<AchievementDetailsContent {achievement} {showDetails} on:click={showPopup} />
{/if}

<style>
	:global(.atropos-inner) {
		overflow: visible !important;
	}
	:global(.atropos-scale) {
		pointer-events: none;
	}

	:global(.atropos-rotate) {
		pointer-events: all;
	}
</style>
