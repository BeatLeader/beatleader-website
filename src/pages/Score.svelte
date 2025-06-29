<script>
	import {processScore} from '../network/clients/beatleader/scores/utils/processScore';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import {fade} from 'svelte/transition';

	import Avatar from '../components/Player/Avatar.svelte';
	import Socials from '../components/Player/Bio/Socials.svelte';
	import Value from '../components/Common/Value.svelte';
	import FormattedDate from '../components/Common/FormattedDate.svelte';
	import Score from '../components/Leaderboard/Score.svelte';
	import AttemptsGraph from '../components/Leaderboard/AttemptsGraph.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import {onMount} from 'svelte';
	import createLeaderboardStore from '../stores/http/http-leaderboard-store';
	import PlayerPerformance from '../components/Player/PlayerPerformance.svelte';
	import SongInfo from '../components/Player/SongInfo.svelte';
	import AccuracySpreadChart from '../components/Score/AccuracySpreadChart.svelte';
	import ReplayButton from '../components/Score/ReplayButton.svelte';
	import Profile from '../components/Score/ScorePage/Profile.svelte';
	import LeaderboardHeader from '../components/Score/ScorePage/LeaderboardHeader.svelte';
	import ScoreHeader from '../components/Score/ScorePage/ScoreHeader.svelte';

	export let scoreId;

	let score = null;
	let leaderboardStore = null;

	function fetchScore(id) {
		score = null;

		fetch(`${BL_API_URL}score/${id}`)
			.then(d => d.json())
			.then(newScore => {
				score = processScore({leaderboard: newScore, ...newScore});
				console.log(score);

				if (score?.leaderboard?.id) {
					leaderboardStore = createLeaderboardStore(score.leaderboard.id, 'global', Math.ceil(score.score.rank / 10));
				}
			});
	}

	onMount(() => {
		scoreId && fetchScore(scoreId);
	});

	$: player = score?.player;
	$: leaderboard = score?.leaderboard;
	$: song = score?.leaderboard?.song;
	$: difficulty = score?.leaderboard?.difficulty;
	$: scores = $leaderboardStore?.scores?.map(s => ({...s, leaderboard: $leaderboardStore?.leaderboard})) ?? null;
</script>

{#if score}
	<div class="score-page" transition:fade>
		<ContentBox>
			<ScoreHeader {score} />
		</ContentBox>
		<div class="grid-container">
			<div class="player-column">
				{#if player}
					<Profile playerData={player} />
				{/if}
			</div>

			<div class="map-column">
				{#if leaderboard}
					<div class="leaderboard-header-box">
						<LeaderboardHeader {leaderboard} />
					</div>
				{/if}

				{#if scores}
					<ContentBox>
						<div class="scores-grid darkened-background grid-transition-helper">
							{#each scores as scoreRow, idx (scoreRow?.score?.id ?? '')}
								<div class:user-score={scoreRow.score.id === score.score.id}>
									<Score
										leaderboardId={score.leaderboard.id}
										score={scoreRow}
										type={'global'}
										highlight={scoreRow.score.id === score.score.id} />
								</div>
							{/each}
						</div>
					</ContentBox>
				{/if}
			</div>

			<div class="graphs-column">
				<ContentBox>
					<h3 class="box-title">Detailed Score</h3>
					<AccuracySpreadChart {score} />
				</ContentBox>
				<ContentBox>
					<h3 class="box-title">Attempts</h3>
					<AttemptsGraph leaderboardId={score.leaderboard.id} />
				</ContentBox>
			</div>
		</div>
	</div>
{:else}
	<div class="spinner-container">
		<Spinner />
	</div>
{/if}

<style>
	.score-page {
		padding: 2em;
	}
	.grid-container {
		display: grid;
		grid-template-columns: 50% 50%;
		gap: 1.5em;
	}
	.player-column,
	.map-column,
	.graphs-column {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
	}

	.box-title {
		margin-top: 0;
	}

	.player-header {
		display: flex;
		align-items: center;
		gap: 1em;
	}
	.player-name-container {
		display: flex;
		flex-direction: column;
	}
	.player-name {
		font-size: 1.5em;
		font-weight: bold;
	}

	.player-stats .stat-line {
		display: flex;
		justify-content: space-between;
		padding: 0.25em 0;
	}

	.map-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.date-and-replay {
		display: flex;
		align-items: center;
		gap: 1em;
		margin-top: 0.5em;
	}

	.scores-grid .user-score {
		background-color: var(--selected-row);
		border-radius: 8px;
	}

	.scores-grid > *:not(:last-child) {
		border-bottom: 1px solid var(--row-separator);
	}
	.scores-grid {
		display: grid;
		grid-template-columns: 1fr;
		max-width: 100%;
		position: relative;
		border-radius: 8px;
		padding: 0.5em 0.6em 0.4em 0.6em;
	}

	.spinner-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 50vh;
	}

	.leaderboard-header-box {
		padding: 0;
		border-radius: 12px;
		background-color: black;
		backdrop-filter: blur(10px);
		--webkit-transofrm: translateZ(0);
		--webkit-perspective: 1000;
		--webkit-backface-visibility: hidden;
		-webkit-backdrop-filter: blur(10px);
		z-index: 0;
		position: relative;
	}

	:global(.player-column .content-box.stats-and-summary-box) {
		margin: 0 !important;
	}

	@media (max-width: 1200px) {
		.grid-container {
			grid-template-columns: 320px 1fr;
			grid-template-areas:
				'player map'
				'graphs graphs';
		}
		.player-column {
			grid-area: player;
		}
		.map-column {
			grid-area: map;
		}
		.graphs-column {
			grid-area: graphs;
			grid-template-columns: 1fr 1fr;
			display: grid;
		}
	}

	@media (max-width: 768px) {
		.grid-container {
			grid-template-columns: 1fr;
			grid-template-areas:
				'player'
				'map'
				'graphs';
		}
		.graphs-column {
			grid-template-columns: 1fr;
		}
	}
</style>
