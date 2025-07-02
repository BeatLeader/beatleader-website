<script>
	import scoreStatisticEnhancer from '../../../stores/http/enhancers/scores/scoreStatistic';
	import createStarGeneratorStore from '../../../stores/beatleader/star-generator';
	import {computeModifiedRating, getPPFromAcc} from '../../../utils/beatleader/pp';
	import BeatSaviorDetails from '../../BeatSavior/Details.svelte';
	import ReplayDetails from '../../Score/ReplayDetails.svelte';
	import {modifiersToSpeed} from '../../../utils/beatleader/format';

	export let songScore;

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

			const pp = getPPFromAcc(acc, modifiedPassRating, modifiedAccRating, modifiedTechRating, mode)[0];
			const fcPp = getPPFromAcc(fcAcc, modifiedPassRating, modifiedAccRating, modifiedTechRating, mode)[0];
			const noUnderswingsPp = getPPFromAcc(noUnderswingsAcc, modifiedPassRating, modifiedAccRating, modifiedTechRating, mode)[0];
			const noUnderswingsFcPp = getPPFromAcc(noUnderswingsFcAcc, modifiedPassRating, modifiedAccRating, modifiedTechRating, mode)[0];

			ppUnderswings = {pp, fcPp, noUnderswingsPp, noUnderswingsFcPp};
		}

		underswingsData = e?.detail?.underswingsData ? {...e?.detail?.underswingsData, ...ppUnderswings} : null;
	}

	let beatSavior = null;
	function fetchBeatSavior(songScore) {
		scoreStatisticEnhancer(songScore).then(result => {
			beatSavior = result;
		});
	}

	const starGeneratorStore = createStarGeneratorStore();

	$: leaderboard = songScore?.leaderboard ?? null;
	$: score = songScore?.score ?? null;
	$: fetchBeatSavior(songScore);

	$: hash = leaderboard?.song?.hash;
	$: downloadUrl = leaderboard?.song?.downloadUrl;
	$: diffInfo = leaderboard?.diffInfo;
	$: scale = modifiersToSpeed(score.mods);
	$: exmachinadata = $starGeneratorStore[hash + diffInfo?.diff + diffInfo?.type + scale];
	$: !exmachinadata && starGeneratorStore.fetchExMachina(hash, downloadUrl, diffInfo?.diff, diffInfo?.type, scale);
	$: notes = exmachinadata?.notes;
</script>

{#if songScore}
	<section class="details">
		{#if beatSavior}
			<div class="stats-grid">
				<BeatSaviorDetails {beatSavior} showGrid={score?.replay == null} {replayAccGraphs} {underswingsData} {notes} showAll={true} />

				{#if score?.replay}
					<ReplayDetails {score} on:replay-was-processed={handleReplayWasProcessed} showAll={true} />
				{/if}
			</div>
		{/if}
	</section>
{/if}

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
