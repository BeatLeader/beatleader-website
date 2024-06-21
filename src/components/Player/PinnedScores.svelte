<script>
	import ContentBox from '../Common/ContentBox.svelte';
	import PinnedScore from './PinnedScore.svelte';

	export let playerId;
	export let fixedBrowserTitle = null;
	export let pinnedScoresStore;
	export let scoresStats = null;

	$: sortedPinnedScores = $pinnedScoresStore[playerId]?.sort(
		(a, b) => (a?.score?.metadata?.priority ?? 0) - (b?.score?.metadata?.priority ?? 0)
	);
	$: console.log(scoresStats);
	$: mywatched = scoresStats?.watchedReplays;
	$: myreplays = scoresStats?.authorizedReplayWatched;
</script>

{#if sortedPinnedScores?.length}
	<ContentBox>
		<section class="pinned-scores">
			<h2>Pinned scores</h2>

			{#each sortedPinnedScores as songScore, idx ((songScore?.id ?? '') + (songScore?.score?.id ?? ''))}
				<PinnedScore {playerId} {songScore} {idx} length={sortedPinnedScores?.length ?? 0} {fixedBrowserTitle} />
			{/each}
		</section>
		{#if scoresStats}
			<div class="views">
				<div class="platform-entry">
					<span class="platform-title" title="How many times other players watched my replays">My replays:</span>
					{myreplays} views
				</div>
				<div class="platform-entry">
					<span class="platform-title" title="How many replays I watched">I watched:</span>
					{mywatched} replays
				</div>
			</div>
		{/if}
	</ContentBox>
{/if}

<style>
	.pinned-scores h2 {
		font-size: 1.125em;
		text-align: center;
	}

	.pinned-scores :global(.score-in-list) {
		border-bottom: none !important;
	}

	.pinned-scores :global(.score:last-child) {
		padding-bottom: 0;
	}

	.views {
		display: flex;
		justify-content: center;
		gap: 1em;
		background: black;
		margin: 0 -1em -1em -1em;
		padding: 0.5em;
		border-radius: 0 0 12px 12px;
	}

	.platform-title {
		font-size: small;
		font-weight: 700;
	}
</style>
