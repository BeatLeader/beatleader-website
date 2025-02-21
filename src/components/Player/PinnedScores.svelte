<script>
	import ContentBox from '../Common/ContentBox.svelte';
	import PinnedScore from './PinnedScore.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any} playerId
	 * @property {any} [fixedBrowserTitle]
	 * @property {any} pinnedScoresStore
	 * @property {any} [scoresStats]
	 */

	/** @type {Props} */
	let {playerId, fixedBrowserTitle = null, pinnedScoresStore, scoresStats = null} = $props();

	let sortedPinnedScores = $derived(
		$pinnedScoresStore[playerId]?.sort((a, b) => (a?.score?.metadata?.priority ?? 0) - (b?.score?.metadata?.priority ?? 0)) ?? []
	);

	let mywatched = $derived(scoresStats?.watchedReplays);
	let myreplays = $derived(scoresStats?.authorizedReplayWatched + scoresStats?.anonimusReplayWatched);
</script>

{#if sortedPinnedScores?.length}
	<ContentBox cls="pinned-scores-box">
		<section class="pinned-scores">
			<h2>Pinned scores</h2>

			{#each sortedPinnedScores as songScore, idx ((songScore?.id ?? '') + (songScore?.score?.id ?? ''))}
				<PinnedScore {playerId} {songScore} {idx} length={sortedPinnedScores?.length ?? 0} {fixedBrowserTitle} />
			{/each}
		</section>
		{#if scoresStats}
			<div class="views darkened-background">
				<div class="platform-entry">
					<span class="platform-title" title="How many times other players watched my replays">Total:</span>
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
		margin-top: -0.4em;
		margin-bottom: 0.5em;
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
		margin: 0 -1em -1em -1em;
		padding: 0.5em;
		border-radius: 0 0 12px 12px;
	}

	.platform-title {
		font-size: small;
		font-weight: 700;
	}

	:global(.pinned-scores-box) {
		border-radius: 12px !important;
	}

	@media screen and (max-width: 767px) {
		:global(.pinned-scores-box) {
			border-radius: 0 !important;
		}

		.views {
			border-radius: 0;
			margin-left: -0.8em;
			margin-right: -0.8em;
		}
	}
</style>
