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
	import ScoreDetails from '../components/Score/ScorePage/ScoreDetails.svelte';
	import Button from '../components/Common/Button.svelte';
	import {getContext} from 'svelte';
	import ScoreNomination from '../components/Score/ScorePage/ScoreNomination.svelte';

	const {open, close} = getContext('simple-modal');

	export let scoreId;

	let score = null;
	let leaderboardStore = null;

	let nominationStatus = null;

	function fetchScore(id) {
		score = null;

		fetch(`${BL_API_URL}score/${id}`)
			.then(d => d.json())
			.then(newScore => {
				score = processScore({leaderboard: newScore, ...newScore});
				console.log(score);
				leaderboardStore = createLeaderboardStore(score.score.leaderboard.leaderboardId, 'global', Math.ceil(score.score.rank / 10));
			});

		fetch(`${BL_API_URL}score/nominations/${id}`, {credentials: 'include'}).then(async d => {
			if (d.status == 200) {
				nominationStatus = parseInt(await d.text());
			}
		});
	}

	let nominationError = null;

	function postVote(value) {
		nominationError = null;
		fetch(`${BL_API_URL}score/nominate/${scoreId}/?description=${encodeURIComponent(value)}`, {
			credentials: 'include',
			method: 'POST',
		}).then(async d => {
			if (d.status == 200) {
				fetchScore(scoreId);
			} else {
				nominationError = await d.text();
			}
		});
	}

	function openNomination() {
		open(ScoreNomination, {
			confirm: value => {
				close();
				postVote(value);
			},
			cancel: () => {
				close();
			},
		});
	}

	$: scoreId && fetchScore(scoreId);
	$: player = score?.player;
	$: leaderboard = $leaderboardStore?.leaderboard;
	$: song = leaderboard?.song;
	$: difficulty = leaderboard?.difficulty;
	$: scores = $leaderboardStore?.scores?.map(s => ({...s, leaderboard: leaderboard})) ?? null;
</script>

{#if score}
	<div class="score-page" transition:fade>
		<div class="grid-container">
			<div class="player-column">
				{#if player}
					<Profile {player} />
				{/if}
			</div>

			<div class="map-column">
				{#if leaderboard}
					<div class="leaderboard-header-box">
						<LeaderboardHeader {leaderboard} />
					</div>
				{/if}
			</div>

			<ContentBox cls="score-header-box">
				<ScoreHeader {score} />
			</ContentBox>

			{#if nominationStatus}
				<div class="nomination-container">
					{#if nominationError}
						<span class="error-description">{nominationError}</span>
					{:else if nominationStatus == 1}
						<Button
							title="Nominate this for the Score Of The Week"
							label="Nominate"
							iconFa="fas fa-award"
							on:click={() => {
								openNomination();
							}} />
					{:else}
						<span
							>You nominated this score for the "Score Of The Week". Check Cube Community Youtube Channel on Wednesday for results.</span>
					{/if}
				</div>
			{/if}

			<div class="graphs-column" style="grid-column: 1 / -1">
				<ContentBox cls="score-page-details">
					<ScoreDetails songScore={score} />
				</ContentBox>
			</div>

			<div class="leaderboard-column" style="grid-column: 1 / -1">
				{#if scores}
					<ContentBox cls="score-page-details">
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
		grid-template-columns: calc(50% - 1em) calc(50% - 1em);
		column-gap: 1.5em;
	}
	.player-column,
	.map-column,
	.graphs-column {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
	}

	.player-column {
		margin-right: -1em;
		margin-top: -1px;
	}

	.nomination-container {
		grid-column: 1 / -1;
		display: flex;
		justify-content: center;
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
		z-index: -1;
		position: relative;
	}

	:global(.graphs-column .score-page-details) {
		padding: 0 0.3em 3px;
		border-radius: 12px;
		margin-right: 0;
	}

	:global(.leaderboard-column .score-page-details) {
		padding: 0.4em;
		border-radius: 12px;
		margin-right: 0;
	}

	:global(.score-header-box) {
		grid-column: 1 / -1;
		margin-right: 0 !important;
	}

	:global(.player-column .content-box.stats-and-summary-box) {
		margin: 0 !important;
	}
</style>
