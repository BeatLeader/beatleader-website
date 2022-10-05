<script>
	import ReweightChange from './ReweightChange.svelte';

	export let map;

	let changes = map.changes;

	function updateReweightAndDiff(map) {
		changes = map.changes;
	}

	let showChanges;

	$: updateReweightAndDiff(map);
</script>

{#if changes && changes.length}
	<div class="score-options-section">
		<span
			class="beat-savior-reveal clickable"
			class:opened={showChanges}
			on:click={() => (showChanges = !showChanges)}
			title="Show average difficulty stats">
			{#if showChanges}
				Hide ranking changelog
			{:else}
				Show ranking changelog
			{/if}

			<i class="fas fa-chevron-down" />
		</span>
	</div>
	{#if showChanges}
		{#each changes as change, idx}
			<ReweightChange {change} />
		{/each}
	{/if}
{/if}

<style>
	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}

	:global(.content figure:not(:first-child)) {
		margin-top: 0;
	}

	.score-options-section {
		margin-top: 0.5rem;
	}

	:global(.qualification-description) + .score-options-section {
		margin-top: 1rem;
	}

	.score-options-section :global(+ *) {
		margin-top: 0.5rem;
	}
</style>
