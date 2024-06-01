<script>
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {dateFromUnix, formatDate, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import Button from '../Common/Button.svelte';
	import {configStore} from '../../stores/config';
	import Preview from '../Common/Preview.svelte';
	import ScoreHistoryChart from '../Player/Charts/ScoreHistoryChart.svelte';
	import {createEventDispatcher, getContext} from 'svelte';
	import PlayerPerformance from '../Player/PlayerPerformance.svelte';
	import {processScore} from '../../network/clients/beatleader/scores/utils/processScore';

	export let score;
	export let leaderboard;

	var history = [];
	var canCompare = false;

	function fetchHistory(score, scoreHistoryLegend) {
		fetch(`${BL_API_URL}map/scorestats?playerId=${score.playerId}&leaderboardId=${score.leaderboardId}`, {credentials: 'include'})
			.then(d => d.json())
			.then(scores => {
				var scoresList = scores.filter(s => {
					return scoreHistoryLegend['y' + (s.type > 1 ? s.type - 1 : '')];
				});
				if (!scoresList.find(s => s.modifiedScore == score.score)) {
					scoresList.push({
						...score,
						type: 1,
						scoreImprovement: null,
						timeset: score.timepost,
						accuracy: score.acc / 100,
						processed: true,
					});
				}

				if (score.scoreImprovement && !scoresList.find(s => s.modifiedScore == score.score - score.scoreImprovement.score)) {
					const improvement = score.scoreImprovement;
					scoresList.push({
						type: 1,
						timeset: parseInt(improvement.timeset),
						accuracy: (score.acc - improvement.accuracy) / 100,
						modifiedScore: score.score - improvement.score,
						score: score.score - improvement.score,
						rank: score.rank - improvement.rank,
						pp: score.pp - improvement.pp,
						accRight: score.accRight - improvement.accRight,
						accLeft: score.accLeft - improvement.accLeft,
						badCuts: score.badCuts - improvement.badCuts,
						missedNotes: score.missedNotes - improvement.missedNotes,
						bombCuts: score.bombCuts - improvement.bombCuts,
						wallsHit: score.wallsHit - improvement.wallsHit,
						pauses: score.pauses - improvement.pauses,
					});
				}

				history = scoresList;

				var replayCount = 0;
				for (let index = 0; index < history.length; index++) {
					const element = history[index];

					if (element.replay?.length) {
						replayCount++;
					}
					if (replayCount > 1) {
						canCompare = true;
						break;
					}
				}
			});
	}

	function timeToLabel(time) {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return minutes + ':' + seconds.toString().padStart(2, '0');
	}

	const {open} = getContext('simple-modal');
	const showPreview = previewLink => {
		if (document.body.clientWidth < 800) {
			window.open(previewLink, '_blank');
		} else {
			open(Preview, {previewLink});
		}
	};

	function titleForType(type) {
		switch (type) {
			case 1:
				return 'Clear';
			case 2:
				return 'Fail';
			case 3:
				return 'Restart';
			case 4:
				return 'Quit';
			case 5:
				return 'Practice';
		}
	}

	function colorForType(type) {
		switch (type) {
			case 1:
				return 'green';
			case 2:
				return 'red';
			case 3:
				return 'orange';
			case 4:
				return 'white';
			case 5:
				return 'yellow';
		}
	}

	let battleRoyaleDraft = false;
	let battleRoyaleDraftList = [];

	function startBattleRoyale() {
		let link = `https://royale.beatleader.xyz/?links=${battleRoyaleDraftList.join(',')}&noRoyale=true`;
		window.open(link, '_blank');
	}

	$: score && fetchHistory(score, $configStore.scoreHistoryLegend);
</script>

{#if history?.length > 1}
	<div class="history-container">
		<div class="details-box history-box">
			<div class="history-table">
				{#if canCompare}
					<div class="royale-title-container">
						<div>
							<Button
								label={battleRoyaleDraft ? 'Stop comparison' : 'Compare replays'}
								iconFa={battleRoyaleDraft ? 'fas fa-bars' : 'fas fa-list-check'}
								title="Enable toggles for comparison draft"
								on:click={() => (battleRoyaleDraft = !battleRoyaleDraft)} />
						</div>
					</div>
				{/if}
				{#if battleRoyaleDraft}
					<div class="royale-title-container">
						<span class="royale-title">Select scores to compare and click </span>
						<div>
							<Button
								type="purple"
								iconFa="fas fa-play"
								label="Compare!"
								title="Use the button to the right of timeset for every score to toggle score"
								disabled={!battleRoyaleDraftList?.length}
								on:click={() => startBattleRoyale()} />
						</div>
					</div>
				{/if}
				{#each history.sort((a, b) => b.timeset - a.timeset) as score}
					<div class="history-item" style="--type-color: {colorForType(score.type)}">
						<div class="history-item-meta">
							<div>
								<span class="history-item-type">{titleForType(score.type)} </span>
								{#if score.type > 1}
									<span class="history-item-time">at {timeToLabel(score.time)} </span>
								{/if}
								<span
									class="history-item-time"
									style="color: {getTimeStringColor(score.timeset)}"
									title={formatDate(dateFromUnix(score.timeset))}
									>{formatDateRelative(dateFromUnix(score.timeset))}
								</span>
							</div>

							{#if score.replay}
								{#if battleRoyaleDraft}
									{#if !battleRoyaleDraftList.includes(score.replay) && battleRoyaleDraftList.length < 10}
										<Button
											cls="replay-button-alt"
											iconFa="fa-regular fa-square"
											title="Add to comparison"
											noMargin={true}
											on:click={() => (battleRoyaleDraftList = [...battleRoyaleDraftList, score.replay])} />
									{:else if battleRoyaleDraftList.includes(score.replay)}
										<Button
											cls="replay-button-alt"
											iconFa="fa fa-square-check purple"
											title="Remove from comparison"
											noMargin={true}
											on:click={() => (battleRoyaleDraftList = battleRoyaleDraftList.filter(link => link !== score.replay))} />
									{/if}
								{:else}
									<Button
										url={`${
											$configStore.preferences.webPlayer == 'arcviewer'
												? 'https://allpoland.github.io/ArcViewer/?replayURL='
												: 'https://replay.beatleader.xyz/?link='
										}${score?.replay}`}
										on:click={() =>
											showPreview(
												`${
													$configStore.preferences.webPlayer == 'arcviewer'
														? 'https://allpoland.github.io/ArcViewer/?replayURL='
														: 'https://replay.beatleader.xyz/?link='
												}${score?.replay}`
											)}
										cls="replay-button-alt"
										icon="<div class='replay-icon-alt'></div>"
										title="Replay"
										noMargin={true} />
								{/if}
							{/if}
						</div>
						<PlayerPerformance songScore={score.processed ? {score} : processScore(score)} service="beatleader" showDetails={false} />
					</div>
				{/each}
			</div>
		</div>
		<div class="details-box">
			<ScoreHistoryChart {history} {leaderboard} />
		</div>
	</div>
{/if}

<style>
	.history-item {
		border: solid 2px var(--type-color);
		margin: 0.5em;
		padding: 0.5em;
		border-radius: 1em;
	}
	.history-item-meta {
		display: flex;
		justify-content: space-between;
		margin-right: 1.2em;
		margin-left: 1.2em;
	}
	.history-table {
		max-height: 23.4em;
		overflow-y: scroll;
		margin-right: -1.8em;
		padding-right: 0.3em;
	}
	.details-box.history-box {
		padding-bottom: 0;
	}
	.details-box {
		margin: 0.4em 0.4em 0.6em;
		padding: 0.4em;
		box-shadow: 0 2px 10px rgb(0 0 0 / 53%);
		border-radius: 0.4em;
		background: #000000d4;
		overflow: hidden;
	}
	.royale-title-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	:global(.history-item .player-performance-badges) {
		display: flex !important;
		flex-wrap: wrap;
		margin-left: 1.2em;
		margin-right: 1.2em;
		grid-column-gap: 0.1em !important;
		grid-row-gap: 0.1em !important;
	}
	:global(.purple) {
		color: rgb(255, 0, 208);
	}
</style>
