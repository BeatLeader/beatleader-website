<script>
	import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/beatleader/consts';
	import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../../utils/accsaber/consts';
	import {configStore} from '../../stores/config';
	import scoreStatisticEnhancer from '../../stores/http/enhancers/scores/scoreStatistic';
	import createStarGeneratorStore from '../../stores/beatleader/star-generator';
	import {computeModifiedRating, getPPFromAcc} from '../../utils/beatleader/pp';
	import BeatSaviorDetails from '../BeatSavior/Details.svelte';
	import LeaderboardPage from '../../pages/Leaderboard.svelte';
	import LeaderboardStats from '../Leaderboard/LeaderboardStats.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import ReplayDetails from '../Score/ReplayDetails.svelte';
	import {modifiersToSpeed} from '../../utils/beatleader/format';
	import ScoreHistoryGraph from '../Score/ScoreHistoryGraph.svelte';

	export let playerId;
	export let songScore;
	export let fixedBrowserTitle = null;
	export let noSsLeaderboard = false;
	export let showAccSaberLeaderboard = false;

	let replayAccGraphs = null;
	let underswingsData = null;

	function handleReplayWasProcessed(e) {
		replayAccGraphs = e?.detail?.accGraphsData ?? null;

		let ppUnderswings = {pp: null, fcPp: null, noUnderswingsPp: null, noUnderswingsFcPp: null};
		if (
			e?.detail?.underswingsData?.noUnderswingsAcc &&
			songScore?.score?.pp &&
			songScore?.score?.acc &&
			(!songScore?.score?.mods?.length || songScore?.leaderboard?.difficultyBl?.modifiersRating)
		) {
			const passRating = songScore?.leaderboard?.difficultyBl?.passRating;
			const accRating = songScore?.leaderboard?.difficultyBl?.accRating;
			const techRating = songScore?.leaderboard?.difficultyBl?.techRating;

			const modifiersRating = songScore?.leaderboard?.difficultyBl?.modifiersRating;
			const actualModifiers = songScore?.score?.mods?.map(m => ({name: m, value: 0}));
			const mode = songScore?.leaderboard?.difficultyBl?.modeName?.toLowerCase();

			const acc = songScore?.score?.acc / 100;
			const fcAcc = e.detail.underswingsData.fcAcc / 100;
			const noUnderswingsAcc = e.detail.underswingsData.noUnderswingsAcc / 100;
			const noUnderswingsFcAcc = e.detail.underswingsData.noUnderswingsFcAcc / 100;

			const modifiedPassRating = computeModifiedRating(passRating, 'PassRating', modifiersRating, actualModifiers);
			const modifiedAccRating = computeModifiedRating(accRating, 'AccRating', modifiersRating, actualModifiers);
			const modifiedTechRating = computeModifiedRating(techRating, 'TechRating', modifiersRating, actualModifiers);

			const pp = getPPFromAcc(acc, modifiedPassRating, modifiedAccRating, modifiedTechRating, mode);
			const fcPp = getPPFromAcc(fcAcc, modifiedPassRating, modifiedAccRating, modifiedTechRating, mode);
			const noUnderswingsPp = getPPFromAcc(noUnderswingsAcc, modifiedPassRating, modifiedAccRating, modifiedTechRating, mode);
			const noUnderswingsFcPp = getPPFromAcc(noUnderswingsFcAcc, modifiedPassRating, modifiedAccRating, modifiedTechRating, mode);

			ppUnderswings = {pp, fcPp, noUnderswingsPp, noUnderswingsFcPp};
		}

		underswingsData = e?.detail?.underswingsData ? {...e?.detail?.underswingsData, ...ppUnderswings} : null;
	}

	let inBuiltLeaderboardPage = null;

	function updateInBuiltLeaderboardPage(rank, scoresPerPage) {
		if (!rank) {
			inBuiltLeaderboardPage = null;
			return;
		}

		inBuiltLeaderboardPage = Math.floor((rank - 1) / scoresPerPage) + 1;
	}

	const starGeneratorStore = createStarGeneratorStore();

	$: leaderboard = songScore?.leaderboard ?? null;
	$: score = songScore?.score ?? null;
	$: beatSaviorPromise = scoreStatisticEnhancer(songScore);

	$: hash = leaderboard?.song?.hash;
	$: downloadUrl = leaderboard?.song?.downloadUrl;
	$: diffInfo = leaderboard?.diffInfo;
	$: showPredictions = $configStore?.scoreDetailsPreferences?.showPredictedAcc;
	$: scale = modifiersToSpeed(score.mods);
	$: exmachinadata = showPredictions && $starGeneratorStore[hash + diffInfo?.diff + diffInfo?.type + scale];
	$: !exmachinadata && showPredictions && starGeneratorStore.fetchExMachina(hash, downloadUrl, diffInfo?.diff, diffInfo?.type, scale);
	$: notes = exmachinadata?.notes;

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
				<BeatSaviorDetails {beatSavior} showGrid={score?.replay == null} {replayAccGraphs} {underswingsData} {notes} />
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
		{#if $configStore?.scoreDetailsPreferences?.showHistory}
			<div class="stats-grid">
				<ScoreHistoryGraph {score} {leaderboard} />
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
