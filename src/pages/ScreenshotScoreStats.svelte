<script>
	import {configStore} from '../stores/config';
	import scoreStatisticEnhancer from '../stores/http/enhancers/scores/scoreStatistic';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import {processScore} from '../network/clients/beatleader/scores/utils/processScore';
	import {GLOBAL_LEADERBOARD_TYPE} from '../utils/format';
	import {modifiersToSpeed} from '../utils/beatleader/format';
	import BeatSaviorDetails from '../components/BeatSavior/Details.svelte';
	import ReplayDetails from '../components/Score/ReplayDetails.svelte';

	export let scoreId;
	export let graphOnly = false;

	let songScore = null;
	let beatSavior = null;

	async function fetchScore(scoreId) {
		const fetchedScore = await fetch(`${BL_API_URL}score/${scoreId}?leaderboardContext=${GLOBAL_LEADERBOARD_TYPE}`).then(r => r.json());
		songScore = processScore({leaderboard: fetchedScore, ...fetchedScore});
		beatSavior = await scoreStatisticEnhancer(songScore);
	}

	$: fetchScore(scoreId);
	$: score = songScore?.score ?? null;
	$: leaderboard = songScore?.leaderboard ?? null;
	$: playedNjs = leaderboard?.difficultyBl?.njs ? leaderboard.difficultyBl.njs * modifiersToSpeed(score.mods) : null;
</script>

{#if beatSavior}
	<section class="stats-grid">
		<BeatSaviorDetails {beatSavior} showGrid={score?.replay == null} njs={playedNjs} {graphOnly} />

		{#if score?.replay && ($configStore?.scoreDetailsPreferences?.showAccChart || $configStore?.scoreDetailsPreferences?.showSliceDetails || $configStore?.scoreDetailsPreferences?.showAccSpreadChart)}
			<ReplayDetails {score} />
		{/if}
	</section>
{/if}

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-items: center;
		padding-top: 0.4em;
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
