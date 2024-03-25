<script>
	import {configStore} from '../../stores/config';
	import scoreStatisticEnhancer from '../../stores/http/enhancers/scores/scoreStatistic';
	import createStarGeneratorStore from '../../stores/beatleader/star-generator';
	import {computeModifiedRating, getPPFromAcc} from '../../utils/beatleader/pp';
	import BeatSaviorDetails from '../BeatSavior/Details.svelte';
	import LeaderboardStats from '../Leaderboard/LeaderboardStats.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import ReplayDetails from '../Score/ReplayDetails.svelte';
	import {modifiersToSpeed} from '../../utils/beatleader/format';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {processScore} from '../../network/clients/beatleader/scores/utils/processScore';

	export let scoreId;
	export let showMapInfo;
	export let showPredictions;
	export let graphOnly = false;

	let songScore = null;

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

	const starGeneratorStore = createStarGeneratorStore();

	function fetchScore(scoreId) {
		fetch(BL_API_URL + `score/${scoreId}`)
			.then(d => d.json())
			.then(score => {
				songScore = processScore(score);
			});
	}

	$: fetchScore(scoreId);
	$: leaderboard = songScore?.leaderboard ?? null;
	$: score = songScore?.score ?? null;
	$: beatSaviorPromise = songScore && scoreStatisticEnhancer(songScore);

	$: hash = leaderboard?.song?.hash;
	$: downloadUrl = leaderboard?.song?.downloadUrl;
	$: diffInfo = leaderboard?.diffInfo;
	$: scale = songScore && modifiersToSpeed(score.mods);
	$: exmachinadata = showPredictions && $starGeneratorStore[hash + diffInfo?.diff + diffInfo?.type + scale];
	$: !exmachinadata && showPredictions && starGeneratorStore.fetchExMachina(hash, downloadUrl, diffInfo?.diff, diffInfo?.type, scale);
	$: notes = exmachinadata?.notes;
</script>

<section class="details">
	{#if songScore}
		{#if showMapInfo}
			<div class="tab">
				<LeaderboardStats {leaderboard} />
			</div>
		{/if}

		<div class="stats-grid">
			{#await beatSaviorPromise}
				<Spinner />
			{:then beatSavior}
				<BeatSaviorDetails {beatSavior} showGrid={score?.replay == null} {replayAccGraphs} {underswingsData} {notes} {graphOnly} />
			{/await}

			{#if score?.replay && ($configStore?.scoreDetailsPreferences?.showAccChart || $configStore?.scoreDetailsPreferences?.showSliceDetails || $configStore?.scoreDetailsPreferences?.showAccSpreadChart)}
				<ReplayDetails {score} on:replay-was-processed={handleReplayWasProcessed} />
			{/if}
		</div>
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
