<script>
	import Atropos from 'atropos/svelte';
	import AchievementDetailsContent from './AchievementDetailsContent.svelte';

	export let achievement;
	export let showDetails = true;
	export let in3d = true;
</script>

{#if in3d}
	<Atropos rotateXMax={5} rotateYMax={5} rotateTouch="scroll-y">
		<AchievementDetailsContent {achievement} {showDetails} />
	</Atropos>
{:else}
	<AchievementDetailsContent {achievement} {showDetails} />
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
