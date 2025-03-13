<script>
	import {getContext} from 'svelte';
	import AchievementDetailsContent from './AchievementDetailsContent.svelte';
	import AchievementPopup from './AchievementPopup.svelte';

	export let achievement;
	export let showDetails = true;
	export let in3d = true;

	const atroposImport = () => import('atropos/svelte').then(m => m.default);

	const {open} = getContext('simple-modal');
	const showPopup = () => {
		open(AchievementPopup, {achievement});
	};
</script>

{#if in3d}
	{#await atroposImport()}
		<div class="loading-container">
			<AchievementDetailsContent {achievement} {showDetails} on:click={showPopup} />
		</div>
	{:then Atropos}
		<svelte:component this={Atropos} rotateXMax={5} rotateYMax={5} rotateTouch="scroll-y">
			<AchievementDetailsContent {achievement} {showDetails} on:click={showPopup} />
		</svelte:component>
	{/await}
{:else}
	<AchievementDetailsContent {achievement} {showDetails} on:click={showPopup} />
{/if}

<style>
	.loading-container {
		display: flex;
	}

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
