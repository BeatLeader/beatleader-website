<script>
	import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/beatleader/consts';
	import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../../utils/accsaber/consts';
	import {configStore} from '../../stores/config';
	import scoreStatisticEnhancer from '../../stores/http/enhancers/scores/scoreStatistic';
	import BeatSaviorDetails from '../BeatSavior/Details.svelte';
	import LeaderboardPage from '../../pages/Leaderboard.svelte';
	import LeaderboardStats from '../Leaderboard/LeaderboardStats.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import ReplayDetails from '../Score/ReplayDetails.svelte';

	export let playerId;
	export let songScore;
	export let fixedBrowserTitle = null;
	export let noSsLeaderboard = false;
	export let showAccSaberLeaderboard = false;

	let replayAccGraphs = null;
	let underswingsData = null;

	function handleReplayWasProcessed(e) {
		replayAccGraphs = e?.detail?.accGraphsData ?? null;
		underswingsData = e?.detail?.underswingsData ?? null;
	}

	let inBuiltLeaderboardPage = null;

	function updateInBuiltLeaderboardPage(rank, scoresPerPage) {
		if (!rank) {
			inBuiltLeaderboardPage = null;
			return;
		}

		inBuiltLeaderboardPage = Math.floor((rank - 1) / scoresPerPage) + 1;
	}

	$: leaderboard = songScore?.leaderboard ?? null;
	$: score = songScore?.score ?? null;
	$: beatSaviorPromise = scoreStatisticEnhancer(songScore);

	$: updateInBuiltLeaderboardPage(
		score && score.rank ? score.rank : null,
		showAccSaberLeaderboard ? ACCSABER_LEADERBOARD_SCORES_PER_PAGE : LEADERBOARD_SCORES_PER_PAGE
	);
</script>

<section class="details">
	{#if songScore}
		{#if $configStore?.scoreDetailsPreferences?.showMapInfo}
			<div class="tab">
				<LeaderboardStats {leaderboard} />
			</div>
		{/if}

		<div class="stats-grid">
			{#await beatSaviorPromise}
				<Spinner />
			{:then beatSavior}
				<BeatSaviorDetails {beatSavior} showGrid={score?.replay == null} {replayAccGraphs} {underswingsData} />
			{/await}

			{#if score?.replay && ($configStore?.scoreDetailsPreferences?.showAccChart || $configStore?.scoreDetailsPreferences?.showSliceDetails || $configStore?.scoreDetailsPreferences?.showAccSpreadChart)}
				<ReplayDetails {score} on:replay-was-processed={handleReplayWasProcessed} />
			{/if}
		</div>

		{#if showAccSaberLeaderboard}
			<div class="tab">
				<LeaderboardPage
					leaderboardId={leaderboard.leaderboardId}
					type="accsaber"
					page={inBuiltLeaderboardPage}
					autoScrollToTop={false}
					showStats={false}
					dontNavigate={true}
					withoutDiffSwitcher={true}
					withoutHeader={true}
					{fixedBrowserTitle}
					higlightedScore={score} />
			</div>
		{:else if !noSsLeaderboard && $configStore?.scoreDetailsPreferences?.showLeaderboard}
			<div class="tab">
				<LeaderboardPage
					leaderboardId={leaderboard.leaderboardId}
					type="global"
					page={inBuiltLeaderboardPage}
					autoScrollToTop={false}
					showStats={false}
					dontNavigate={true}
					withoutDiffSwitcher={true}
					withoutHeader={true}
					{fixedBrowserTitle}
					higlightedScore={score} />
			</div>
		{/if}
	{/if}
</section>

<style>
	.details {
		display: flex;
		flex-direction: column;
		grid-row-gap: 0.2em;
		padding-top: 0.4em;
	}

	.tab {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
	}

	.tab > :global(*) {
		grid-area: 1 / 1 / 1 / 1;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-items: center;
	}

	.stats-grid :global(> *) {
		display: contents !important;
	}

	.stats-grid :global(> * > *) {
		align-self: stretch;
	}

	@media screen and (max-width: 767px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
