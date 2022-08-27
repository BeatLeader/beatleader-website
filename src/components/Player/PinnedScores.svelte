<script>
	import ContentBox from '../Common/ContentBox.svelte';
	import PinnedScore from './PinnedScore.svelte';

	export let pinnedScores;
	export let playerId;
	export let modifiers;
</script>

{#if pinnedScores?.length}
	<ContentBox>
		<section class="pinned-scores">
			<h2>Pinned scores</h2>

			{#each pinnedScores as songScore ((songScore?.id ?? '') + (songScore?.score?.id ?? ''))}
				<PinnedScore {playerId} {modifiers} {songScore} />
			{/each}
		</section>
	</ContentBox>
{/if}

<style>
	.pinned-scores h2 {
		font-size: 1.125em;
	}

	.pinned-scores :global(.score-in-list) {
		border-bottom: none !important;
	}

	.pinned-scores :global(.score:last-child) {
		padding-bottom: 0;
	}
</style>
