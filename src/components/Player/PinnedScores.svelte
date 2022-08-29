<script>
	import pinnedScoresStore from '../../stores/pinned-scores';
	import ContentBox from '../Common/ContentBox.svelte';
	import PinnedScore from './PinnedScore.svelte';

	export let playerId;
	export let fixedBrowserTitle = null;

	$: sortedPinnedScores = $pinnedScoresStore?.sort((a, b) => (a?.score?.metadata?.priority ?? 0) - (b?.score?.metadata?.priority ?? 0));
</script>

{#if $pinnedScoresStore?.length}
	<ContentBox>
		<section class="pinned-scores">
			<h2>Pinned scores</h2>

			{#each sortedPinnedScores as songScore, idx ((songScore?.id ?? '') + (songScore?.score?.id ?? ''))}
				<PinnedScore {playerId} {songScore} {idx} length={$pinnedScoresStore?.length ?? 0} {fixedBrowserTitle} />
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
