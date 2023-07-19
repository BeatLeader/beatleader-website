<script>
	import Avatar from '../Common/Avatar.svelte';
	import Badge from '../Common/Badge.svelte';
	import ClanBadges from '../Player/ClanBadges.svelte';
	import ClanName from '../Clans/ClanName.svelte';
	import {getContext} from 'svelte';
	import {fade, fly} from 'svelte/transition';
	import {flip} from 'svelte/animate';
	import {getTimeStringColor} from '../../utils/date';
	import {navigate} from 'svelte-routing';
	import {opt} from '../../utils/js';

	import Score from '../Leaderboard/Score.svelte';
	import Value from '../Common/Value.svelte';

	// Badges
	import Pp from '../Common/PerformanceBadge/Pp.svelte'

	export let leaderboardId = null;
	export let battleRoyaleDraft = false;
	export let battleRoyaleDraftList = [];
	export let cr = null
	export let fixedBrowserTitle = null;
	export let modifiers = null;
	export let noReplayInLeaderboard = false;
	export let selectedMetric = null;
	export let sortBy = 'rank';
	export let type = 'beatleader';


	const MAX_ROYALE_LIST_LENGTH = 10;

	const {open} = getContext('simple-modal');

	function navigateToClan(clanTag) {
		if (!clanTag) return;

		navigate(`/clan/${clanTag}/players/1?`);
	}

	let showClanRankingScores = false
</script>

{#if cr}
	<div class={'player-score'}>
		<div class="mobile-first-line">
			<div class="rank with-badge">
				<Badge
					onlyLabel={true}
					color="white"
					bgColor={cr?.clanRank === 1
						? 'darkgoldenrod'
						: cr?.clanRank === 2
						? '#888'
						: cr?.clanRank === 3
						? 'saddlebrown'
						: cr?.clanRank >= 10000
						? 'small'
						: 'var(--dimmed)'}>
					<span slot="label">
						#<Value value={cr?.clanRank} digits={0} zero="?" />
					</span>
				</Badge>
			</div>

			<div class="player">
				<Avatar clan={cr.clan} />
				<ClanName
					clan={cr.clan}
					on:click={cr.clan ? () => navigateToClan(cr.clan.tag) : null} />
					<ClanBadges clanInput={cr.clan}/>
			</div>
			<div class="timeset above-tablet">
				<span style="color: {getTimeStringColor(cr?.lastUpdateTime ?? '')}; ">
					{cr.lastUpdateTime}
				</span>
			</div>
			<div class="timeset mobile-only">
				<span style="color: {getTimeStringColor(cr?.lastUpdateTime ?? '')}; ">
					{cr?.lastUpdateTimeShort ?? ''}
				</span>
			</div>
		</div>
		<div class="mobile-second-line">
			<div class="score-options-section">
				<span
					class="beat-savior-reveal clickable"
					class:opened={showClanRankingScores}
					on:click={() => (showClanRankingScores = !showClanRankingScores)}
					title="Show Scores">
					{#if showClanRankingScores}
						Hide Scores
					{:else}
						Show Scores
					{/if}
					<i class="fas fa-chevron-down" />
				</span>
			</div>
			
			<!-- TODO: cr.clanpp is an aggregate of pp from all the scores set from this clan on this leaderboard
			<div class='badge'>
				<Badge 
					onlyLabel={true} 
					color="white" 
					bgColor={'#888'}>
					<span slot="label">
						<Pp pp={cr.clanpp}/>
					</span>
				</Badge>
			</div> -->

			<!-- TODO: cr.clanAverageAcc is the average accuracy value of all scores set from this clan on this leaderboard
			<Badge
				onlyLabel={true}
				color="white"
				bgColor={'#888'}>
				<span slot="label">
					<Value value={cr?.clanAverageAcc} digits={0} zero="?" suffix='%' />
				</span>
			</Badge> -->

			<!-- TODO: cr.clanTotalScore is the aggregate of score from all the scores set from this clan on this leaderboard
			<Badge 
				onlyLabel={true} 
				color="white" 
				bgColor={'#888'}>
				<span slot="label">
					<Value value={cr?.clanTotalScore} digits={0} zero="?" />
				</span>
			</Badge> -->
		</div>
	</div>
	{#if showClanRankingScores}
		<div class="scores-subgrid grid-transition-helper">
		{#each opt(cr, 'scores') as score, idx ((opt(score, 'score.id', '')) + (opt(score, 'player.playerId', '')))}
			<div
				class={`row-${idx}`}
				class:user-score={score?.isUserScore}
				class:user-score-top={score?.userScoreTop}
				in:fly={!score?.isUserScore ? {x: 200, delay: idx * 20, duration: 500} : {duration: 300}}
				out:fade={!score?.isUserScore ? {duration: 100} : {duration: 300}}
				animate:flip={score?.isUserScore ? {duration: 300} : {duration: 300}}>
				<Score
					{leaderboardId}
					{score}
					{type}
					{modifiers}
					{fixedBrowserTitle}
					{battleRoyaleDraft}
					{battleRoyaleDraftList}
					sortBy={sortBy}
					on:royale-add={e => (battleRoyaleDraftList = [...battleRoyaleDraftList, e.detail])}
					on:royale-remove={e => (battleRoyaleDraftList = battleRoyaleDraftList.filter(pId => pId !== e.detail))} />
			</div>
		{/each}
	</div>
	{/if}
{/if}

<style>
	.badge {
		position: relative;
		display: inline-flex;
		justify-content: space-around;
		align-items: center;
		color: var(--color, #eee);
		background-color: var(--background-color, #222);
		margin: 0 0.5em 0.5em 0;
		padding: 0.125em;
		border-radius: 0.25em;
		transition: opacity 0.25s;
	}

	.player-score {
		display: flex;
		flex-direction: row;
		grid-gap: 0.4em;
		padding: 0.2em 0;
		min-width: 19em;
	}

	.scores-subgrid {
		display: grid;
		grid-template-columns: 1fr;
		max-width: 100%;
		position: relative;
		padding-left: 2em;
	}

	.scores-subgrid > *:not(:last-child) {
		border-bottom: 1px solid var(--row-separator);
	}

	.mobile-first-line {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
		flex-grow: 1;
		min-width: 0;
	}

	.mobile-second-line {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
		min-width: max-content;
	}

	.player-score.highlight {
		background: linear-gradient(45deg, #defb6996, transparent, transparent);
		border-radius: 4px;
		padding: 0.2em;
		margin: 0 -0.2em;
		max-width: 130%;
	}

	.player-score .rank {
		font-size: 0.875em;
		min-width: 2em;
		flex: none;
	}

	.player-score .player {
		display: flex;
		grid-gap: 0.4em;
		flex: 1;
	}

	.player-score .timeset {
		text-align: center;
		min-width: 6.9em;
		flex-basis: fit-content;
	}

	.player-score .replay {
		height: 1.8em;
		min-width: fit-content;
		margin-right: 0.25em;
		flex: none;
	}

	.player-score .pp {
		min-width: 5.5em;
		flex: none;
	}

	.player-score .percentage {
		min-width: 4.5em;
		flex: none;
	}

	.player-score .score {
		min-width: 5em;
		flex: none;
	}

	.player-score .timeset {
		text-align: right;
		min-width: fit-content;
	}

	.player-score :global(.with-badge .badge) {
		margin: 0 !important;
		padding: 0.125em 0.25em !important;
		width: 100%;
		height: 100%;
	}

	.player-score .player > :global(.clan-badges .badge) {
		margin-right: 0.15em !important;
		padding: 0 !important;
		font-size: 0.8em !important;
	}

	.player-score .player > :global(.clan-badges) {
		height: 1.2em !important;
	}

	.player-score :global(.badge small) {
		display: block;
		font-size: 0.7em;
		font-weight: normal;
		margin-top: -2px;
	}

	.player-score :global(.inc),
	.song-score :global(.dec) {
		color: inherit;
	}

	.player-score .player :global(.player-name) {
		cursor: pointer;
	}

	.player-score .player :global(figure) {
		width: 1.5em;
		height: 1.5em;
		min-width: 1.5em;
	}

	.player-score .player :global(.player-name) {
		overflow-x: hidden;
		text-overflow: ellipsis;
	}

	.with-badge {
		height: 100%;
		text-align: center;
	}

	.pp.with-badge {
		position: relative;
	}

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}

	.player-score :global(.player-performance-badges .with-badge) {
		min-width: 6em;
	}

	.bot {
		background-color: #8080804d;
	}

	:global(.bot-badge .badge) {
		margin: 0 !important;
		height: 1.2em;
		font-size: 0.9em !important;
	}

	@media screen and (max-width: 767px) {
		.player-score {
			flex-direction: column;
		}

		.player-score .replay {
			order: 1;
		}

		.player-score .pp {
			flex-grow: 1;
		}

		.player-score .percentage {
			flex-grow: 1;
		}

		.player-score .score {
			flex-grow: 1;
		}

		:global(.player .clan-badges) {
			display: none;
		}

		.mobile-second-line :global(.player-performance) {
			width: 100%;
		}
	}
</style>

<!--  OLD CODE THAT WOULD DISPLAY RANKING OF CLANS
										<div class={'player-score'}>
											<div class="mobile-first-line">
												<div class="rank with-badge">
													<Badge
														onlyLabel={true}
														color="white"
														bgColor={'darkgoldenrod'}>
														<span slot="label">
															#<Value value={cr.clanRank} digits={0} zero="?" />
														</span>
													</Badge>
												</div>
												<div class="player">
													<Avatar clan={cr.clan} />
													<ClanName
														clan={cr.clan}
														on:click={cr.clan ? () => navigateToClan(cr.clan.tag) : null} />
														<ClanBadges clanInput={cr.clan}/>
												</div>
												<div class="timeset above-tablet">
													<span style="color: {getTimeStringColor(cr?.lastUpdateTime ?? '')}; ">
														{cr.lastUpdateTime}
													</span>
												</div>
												<div class="timeset mobile-only">
													<span style="color: {getTimeStringColor(cr?.lastUpdateTime ?? '')}; ">
														{cr?.lastUpdateTimeShort ?? ''}
													</span>
												</div>
											</div>
											<div class="mobile-second-line">
												<div class="score-options-section">
													<span
														class="beat-savior-reveal clickable"
														class:opened={showClanRankingScores}
														on:click={() => (showClanRankingScores = !showClanRankingScores)}
														title="Show Scores">
														{#if showClanRankingScores}
															Hide Scores
														{:else}
															Show Scores
														{/if}
														<i class="fas fa-chevron-down" />
													</span>
												</div>
												<div class="pp with-badge">
													<Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
														<span slot="label">
															<Pp
																pp={cr.clanpp}
																inline={false}
																color="white" />
														</span>
													</Badge>
												</div>
												<div class="percentage with-badge">
													<ClanAccuracy accuracy={cr.clanAverageAcc} />
												</div>
												<div class="score with-badge">
													<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
														<span slot="label">
															<Value value={cr.clanTotalScore} inline={false} digits={0} />
														</span>
													</Badge>
												</div>
											</div>
										</div>
-->


<!-- OLD CODE THAT WOULD SHOW WHEN YOU EXPANDED CLAN RANKING SCORE
											<div class="scores-subgrid grid-transition-helper">
											{#each opt(cr, 'scores') as score, idx ((opt(score, 'score.id', '')) + (opt(score, 'player.playerId', '')))}
												<div
													class={`row-${idx}`}
													class:user-score={score?.isUserScore}
													class:user-score-top={score?.userScoreTop}
													in:fly={!score?.isUserScore ? {x: 200, delay: idx * 20, duration: 500} : {duration: 300}}
													out:fade={!score?.isUserScore ? {duration: 100} : {duration: 300}}
													animate:flip={score?.isUserScore ? {duration: 300} : {duration: 300}}>
													<div class={'player-score'}>
														<div class="mobile-first-line">
															<i class="fa-solid fa-arrow-right"></i>
															<div class="rank with-badge">
																<Badge
																	onlyLabel={true}
																	color="white"
																	bgColor={opt(score, 'score.rank') === 1
																		? 'darkgoldenrod'
																		: opt(score, 'score.rank') === 2
																		? '#888'
																		: opt(score, 'score.rank') === 3
																		? 'saddlebrown'
																		: opt(score, 'score.rank') >= 10000
																		? 'small'
																		: 'var(--dimmed)'}>
																	<span slot="label">
																		#<Value value={opt(score, 'score.rank')} digits={0} zero="?" />
																	</span>
																</Badge>
															</div>
															<div class="player">
																<Avatar player={score.player} />
																<PlayerNameWithFlag
																	player={score.player}
																	type={type === 'accsaber' ? 'accsaber/date' : null}
																	on:click={score.player ? () => navigateToPlayer(score.player.playerId) : null} />
										
																<ClanBadges player={score.player} />
															</div>
															<div class="timeset above-tablet">
																<span style="color: {getTimeStringColor(opt(score, 'score.timeSetString', ''))}; ">
																	{opt(score, 'score.timeSetString', '-')}
																</span>
															</div>
															<div class="timeset mobile-only">
																<span style="color: {getTimeStringColor(opt(score, 'score.timeSetString', ''))}; ">
																	{score?.score?.timeSetStringShort ?? ''}
																</span>
															</div>
														</div>
														<div class="mobile-second-line">
															{#if !noReplayInLeaderboard && type !== 'accsaber'}
																<div class="replay">
																	{#if batleRoyaleDraft}
																		{#if !draftList.includes(score.player.playerId) && draftList.length < 10}
																			<Button
																				cls="replay-button-alt"
																				icon="<div class='battleroyalejoin-icon'></div>"
																				title="Join battle royal"
																				noMargin={true}
																				on:click={() => {
																					draftList.push(score.player.playerId);
																					draftList = draftList;
																				}} />
																		{:else if draftList.includes(score.player.playerId)}
																			<Button
																				cls="replay-button-alt"
																				icon="<div class='battleroyalestop-icon'></div>"
																				title="Remove from battle royal"
																				noMargin={true}
																				on:click={() => (draftList = draftList.filter(el => el != score.player.playerId))} />
																		{/if}
																	{:else}
																		<Button
																			url={`https://replay.beatleader.xyz/?scoreId=${score?.score.id}`}
																			on:click={showPreview(`https://replay.beatleader.xyz/?scoreId=${score?.score.id}`)}
																			cls="replay-button-alt"
																			icon="<div class='replay-icon-alt'></div>"
																			title="Replay"
																			noMargin={true} />
										
																		<span
																			class="beat-savior-reveal clickable"
																			class:opened={openedDetails.includes(score?.score?.id)}
																			on:click={() => toggleOpen(score?.score?.id)}
																			title="Show details">
																			<i class="fas fa-chevron-down" />
																		</span>
																	{/if}
																</div>
															{/if}
															{#if type === 'accsaber' || opt(score, 'score.pp')}
																<div class="pp with-badge">
																	<Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
																		<span slot="label">
																			{#if type === 'accsaber'}
																				<Pp
																					playerId={opt(score, 'player.playerId')}
																					pp={opt(score, 'score.ap')}
																					weighted={opt(score, 'score.weightedAp')}
																					zero={formatNumber(0)}
																					withZeroSuffix={true}
																					inline={false}
																					suffix="AP"
																					color="white" />
																			{:else}
																				<Pp
																					playerId={opt(score, 'player.playerId')}
																					{leaderboardId}
																					pp={opt(score, 'score.pp')}
																					whatIf={opt(score, 'score.whatIfPp')}
																					inline={false}
																					color="white" />
																			{/if}
																		</span>
																	</Badge>
																</div>
															{/if}
															<div class="percentage with-badge">
																<Accuracy score={score.score} showPercentageInstead={type !== 'accsaber'} showMods={false} />
															</div>
															<div class="score with-badge">
																<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
																	<span slot="label">
																		<Value value={opt(score, 'score.score')} inline={false} digits={0} />
										
																		<small title={describeModifiersAndMultipliers(opt(score, 'score.mods'), modifiers)}
																			>{opt(score, 'score.mods') ? score.score.mods.join(', ') : ''}</small>
																	</span>
																</Badge>
															</div>
														</div>
													</div>
												</div>
											{/each}
										</div>
-->