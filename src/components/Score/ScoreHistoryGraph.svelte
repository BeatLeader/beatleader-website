<script>
	import {BL_API_URL, BL_REPLAYS_URL, BL_ANALYZER_URL} from '../../network/queues/beatleader/api-queue';
	import {dateFromUnix, formatDate, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import Button from '../Common/Button.svelte';
	import {configStore} from '../../stores/config';
	import Preview from '../Common/Preview.svelte';
	import ScoreHistoryChart from '../Player/Charts/ScoreHistoryChart.svelte';
	import {getContext} from 'svelte';
	import PlayerPerformance from '../Player/PlayerPerformance.svelte';
	import {processScore} from '../../network/clients/beatleader/scores/utils/processScore';
	import createAccountStore from '../../stores/beatleader/account';
	import {isPatron} from '../Player/Overlay/overlay';
	import {colorForEndType, titleForEndType} from '../../utils/attempts';
	import CompactPagination from './CompactPagination.svelte';
	import ScoreHistoryAccGraph from './ScoreHistoryAccGraph.svelte';
	import {Svrollbar} from 'svrollbar';
	import {GLOBAL_LEADERBOARD_TYPE} from '../../utils/format';

	export let score;
	export let leaderboard;

	const account = createAccountStore();

	var history = [];
	var fullhistory = [];
	var canCompare = false;

	function fetchHistory(score, scoreHistoryLegend) {
		fetch(`${BL_API_URL}map/scorestats?playerId=${score.playerId}&leaderboardId=${score.leaderboardId}`, {credentials: 'include'})
			.then(d => d.json())
			.then(scores => {
				var scoresList = scores;
				scoresList.forEach(element => {
					if (!element.replay && element.replayCopy) {
						element.replay = element.replayCopy;
					}
					if (element.modifiers === null) {
						element.strippedMistakes = true;
					}
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

				if (
					score.scoreImprovement &&
					score.scoreImprovement.score &&
					!scoresList.find(s => s.modifiedScore == score.score - score.scoreImprovement.score)
				) {
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

				fullhistory = scoresList;
				history = scoresList.filter(s => {
					return scoreHistoryLegend['y' + (s.type > 1 ? s.type - 1 : '')];
				});

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
		if (document.body.clientWidth < 800 || $configStore.preferences.linkOption == 'newtab') {
			window.open(previewLink, '_blank');
		} else {
			open(Preview, {previewLink});
		}
	};

	let graphPageIndex = 0;

	function onGraphPaginationChange(event) {
		graphPageIndex = event.detail.page;
	}

	let hoveredAttempt = null;

	let battleRoyaleDraft = false;
	let battleRoyaleDraftList = [];

	function startBattleRoyale() {
		let link = `https://royale.beatleader.com/?links=${battleRoyaleDraftList.join(',')}&noRoyale=true&context=${GLOBAL_LEADERBOARD_TYPE}`;
		window.open(link, '_blank');
	}

	function startAnalysis() {
		let link = `https://analyzer.beatleader.com/?link=${battleRoyaleDraftList[0]}&link2=${battleRoyaleDraftList[1]}`;
		window.open(link, '_blank');
	}

	let scrollContainer;

	$: score && fetchHistory(score, $configStore.scoreHistoryLegend);
</script>

{#if fullhistory?.length > 1}
	<div class="history-container">
		<div class="details-box history-box">
			<div class="history-table" bind:this={scrollContainer}>
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
								type="twitter"
								iconFa="fas fa-play"
								label="Analyze!"
								title={isPatron($account?.player?.playerInfo?.role)
									? 'Use the button to the right of timeset for every score to toggle score'
									: 'Requires Patreon subscription'}
								disabled={battleRoyaleDraftList?.length != 2 || !isPatron($account?.player?.playerInfo?.role)}
								on:click={() => startAnalysis()} />
						</div>
						<div>
							<Button
								type="purple"
								iconFa="fas fa-play"
								label="Compare!"
								title="Use the button to the right of timeset for every score to toggle score"
								disabled={!(battleRoyaleDraftList?.length > 1)}
								on:click={() => startBattleRoyale()} />
						</div>
					</div>
				{/if}
				{#each history.sort((a, b) => b.timeset - a.timeset) as score}
					<div
						class="history-item {score.id == hoveredAttempt?.id ? 'hovered-item' : ''}"
						style="--type-color: {colorForEndType(score.type, 0.04)}; --hover-type-color: {colorForEndType(score.type, 0.4)}"
						on:mouseenter={() => (hoveredAttempt = score)}
						on:mouseleave={() => (hoveredAttempt = null)}>
						<div class="history-item-meta">
							<div>
								<span class="history-item-type">{titleForEndType(score.type)} </span>
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
											iconFa="fa-regular fa-square white"
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
									<div>
										{#if $configStore?.visibleScoreIcons?.analyzer !== false}
											<Button
												url={`${BL_ANALYZER_URL}?link=${score?.replay}`}
												on:click={() => showPreview(`${BL_ANALYZER_URL}?link=${score?.replay}`)}
												cls="replay-button-alt{isPatron($account?.player?.playerInfo?.role) ? '' : ' non-subscribed'}"
												icon="<div class='analyzer-icon'></div>"
												title={'Reeplay Analyzer' +
													(isPatron($account?.player?.playerInfo?.role) ? '' : ' (requires Patreon subscription)')}
												noMargin={true} />
										{/if}
										<Button
											url={`${
												$configStore.preferences.webPlayer == 'arcviewer'
													? 'https://allpoland.github.io/ArcViewer/?replayURL='
													: `${BL_REPLAYS_URL}?link=`
											}${score?.replay}`}
											on:click={() =>
												showPreview(
													`${
														$configStore.preferences.webPlayer == 'arcviewer'
															? 'https://allpoland.github.io/ArcViewer/?replayURL='
															: `${BL_REPLAYS_URL}?link=`
													}${score?.replay}`
												)}
											cls="replay-button-alt"
											icon="<div class='replay-icon-alt'></div>"
											title="Replay"
											noMargin={true} />
									</div>
								{/if}
							{/if}
						</div>
						<PlayerPerformance songScore={score.processed ? {score} : processScore(score)} service="beatleader" showDetails={false} />
					</div>
				{/each}
			</div>
			<Svrollbar viewport={scrollContainer} />
		</div>
		<div class="details-box">
			{#if graphPageIndex == 0}
				<ScoreHistoryChart {history} {leaderboard} bind:hoveredAttempt />
			{:else}
				<ScoreHistoryAccGraph {score} history={fullhistory} {leaderboard} />
			{/if}
			{#if canCompare}
				<CompactPagination pageIndex={graphPageIndex} pagesCount={2} on:change={onGraphPaginationChange} />
			{/if}
		</div>
	</div>
{/if}

<style>
	.history-item {
		background-color: var(--type-color);
		margin: 0.5em;
		padding: 0.5em;
		border-radius: 6px;
		box-shadow: 0 2px 10px rgb(0 0 0 / 53%);
	}
	.history-item.hovered-item {
		background-color: var(--hover-type-color);
	}
	.history-item-meta {
		display: flex;
		justify-content: space-between;
	}
	.history-table {
		max-height: 23.4em;
		margin-top: -0.4em;
		overflow-y: scroll;
		width: 100%;
		overflow: scroll;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.history-table::-webkit-scrollbar {
		display: none;
	}
	.details-box.history-box {
		padding-bottom: 0;
		position: relative;
	}
	.details-box {
		margin: 0.4em 0.4em 0.6em;
		padding: 0.4em;
		box-shadow: 0 2px 10px rgb(0 0 0 / 53%);
		border-radius: 0.4em;
		display: flex;
		background: #000000d4;
		overflow: hidden;
	}
	.royale-title-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 1em;
	}
	:global(.history-item .player-performance-badges) {
		display: flex !important;
		flex-wrap: wrap;
		grid-column-gap: 0.1em !important;
		grid-row-gap: 0.1em !important;
	}

	:global(.history-item .with-badge .badge) {
		min-width: 6em;
	}
	:global(.purple) {
		color: rgb(255, 0, 208);
	}
	:global(.white) {
		color: white;
	}
	:global(.non-subscribed) {
		opacity: 0.45 !important;
	}
</style>
