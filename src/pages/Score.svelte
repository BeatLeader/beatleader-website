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
	import AccuracySpreadChart from '../components/Score/AccuracySpreadChart.svelte';
	import ReplayButton from '../components/Score/ReplayButton.svelte';
	import Profile from '../components/Score/ScorePage/Profile.svelte';
	import LeaderboardHeader from '../components/Score/ScorePage/LeaderboardHeader.svelte';
	import ScoreHeader from '../components/Score/ScorePage/ScoreHeader.svelte';
	import ScoreDetails from '../components/Score/ScorePage/ScoreDetails.svelte';
	import Button from '../components/Common/Button.svelte';
	import ScoreNomination from '../components/Score/ScorePage/ScoreNomination.svelte';
	import SongInfo from '../components/Score/ScorePage/SongInfo.svelte';
	import PlayerInfo from '../components/Score/ScorePage/PlayerInfo.svelte';
	import ScoreMeta from '../components/Score/ScoreMeta.svelte';
	import ssrConfig from '../ssr-config';
	import {navigate} from 'svelte-routing';

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
				leaderboardStore = createLeaderboardStore(score.score.leaderboard.leaderboardId, 'global', Math.ceil(score.score.rank / 10));
			});
	}

	let cinematicsCanvas;

	function drawCinematics(cinematicsCanvas, coverUrl) {
		if (coverUrl && cinematicsCanvas) {
			cinematicsCanvas.style.opacity = 1;
			const context = cinematicsCanvas.getContext('2d');

			const cover = new Image();
			cover.onload = function () {
				context.drawImage(cover, 0, 0, cinematicsCanvas.width, cinematicsCanvas.height);
			};
			cover.src = coverUrl;
		}
	}

	function navigateToPlayer(player) {
		if (!player) return;

		navigate(`/u/${player.alias ?? player.playerId}`);
	}

	$: scoreId && fetchScore(scoreId);
	$: player = score?.player;
	$: leaderboard = $leaderboardStore?.leaderboard;
	$: song = leaderboard?.song;

	$: song && drawCinematics(cinematicsCanvas, song.imageUrl);
	$: difficulty = leaderboard?.difficulty;
	$: scores = $leaderboardStore?.scores?.map(s => ({...s, leaderboard: leaderboard})) ?? null;
</script>

<svelte:head>
	<title>{player?.name ?? 'Player'} on {song?.name ?? 'map'} - {ssrConfig.name}</title>
</svelte:head>

{#if score}
	<div class="score-page" transition:fade>
		<div class="grid-container">
			<!-- <div class="player-column">
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
			</div> -->

			<div class="score-header-box">
				<div class="cinematics">
					<div class="cinematics-canvas">
						<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
					</div>
				</div>
				<SongInfo {score} {leaderboard} />
				<ScoreHeader {score} />
				<PlayerInfo
					{score}
					{player}
					on:click={() => {
						navigateToPlayer(player);
					}} />
			</div>

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

	<ScoreMeta {score} {leaderboard} />
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
		display: flex;
		flex-direction: column;
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

	.score-header-box {
		padding: 0;
		border-radius: 12px;
		background-color: black;
		backdrop-filter: blur(10px);
		--webkit-transofrm: translateZ(0);
		--webkit-perspective: 1000;
		--webkit-backface-visibility: hidden;
		-webkit-backdrop-filter: blur(10px);
		position: relative;
		margin: 4px 10px 18px;
	}

	.cinematics {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		pointer-events: none;
	}

	.cinematics-canvas {
		filter: blur(5em) opacity(0.5) saturate(250%);
		left: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.1) translateZ(0);
		width: 110%;
		z-index: -1;
		height: 110%;
	}

	:global(.graphs-column .score-page-details) {
		padding: 0 0.3em 3px;
		border-radius: 12px;
	}

	:global(.leaderboard-column .score-page-details) {
		padding: 0.4em;
		border-radius: 12px;
	}

	:global(.score-header-box) {
		grid-column: 1 / -1;
	}

	@media (max-width: 1000px) {
		.score-page {
			padding: 1em;
		}
	}

	@media screen and (max-width: 767px) {
		.score-page {
			padding: 0;
		}

		.cinematics-canvas {
			width: 97%;
		}
	}
</style>
