<script>
	import Accuracy from '../Common/PerformanceBadge/Accuracy.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import Badge from '../Common/Badge.svelte';
	import ClanBadges from '../Player/ClanBadges.svelte';
	import ClanName from '../Clans/ClanName.svelte';
	import {fade, fly} from 'svelte/transition';
	import {flip} from 'svelte/animate';
	import {getContext} from 'svelte';
	import {getTimeStringColor} from '../../utils/date';
	import {navigate} from 'svelte-routing';
	import {opt} from '../../utils/js';
	import Pp from '../Common/PerformanceBadge/Pp.svelte'
	import Score from '../Leaderboard/Score.svelte';
	import Value from '../Common/Value.svelte';

	export let leaderboardId = null;
	export let battleRoyaleDraft = false;
	export let battleRoyaleDraftList = [];
	export let cr = null
	export let fixedBrowserTitle = null;
	export let modifiers = null;
	export let sortBy = 'rank';
	export let type = 'beatleader';

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
				<!-- TODO: REVERT BEFORE PROD -->
				<ClanName
					clan={cr.clan}
					on:click={cr.clan ? () => navigateToClan(cr.clan.tag) : null} />
					<ClanBadges clanInput={cr.clan}/>
			</div>
			<div class="timeset above-tablet">
				<span style="color: {getTimeStringColor(cr?.lastUpdateTimeNumber ?? '')}; ">
					{cr?.lastUpdateTime}
				</span>
			</div>
			<div class="timeset mobile-only">
				<span style="color: {getTimeStringColor(cr?.lastUpdateTimeNumber ?? '')}; ">
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
					<i class="fas fa-chevron-down" />
				</span>
			</div>

			<span class="with-badge pp">
				<Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
					<span slot="label">
						<Pp
							pp={cr.clanpp}
							inline={false}
							color="white" />
					</span>
				</Badge>
			</span>

			<span class="with-badge acc">
				<Accuracy accuracyOverride={cr?.clanAverageAcc} showMods={false}/>
			</span>

			<span class="with-badge score">
				<Badge
					onlyLabel={true} 
					color="white" 
					bgColor={'var(--dimmed)'}>
					<span slot="label">
						<Value value={cr?.clanTotalScore} inline={false} digits={0} suffix=''/>
					</span>
				</Badge>
			</span>
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
	.pp {
		min-width: 5em;
	}

	.acc {
		min-width: 4em;
	}

	.acc :global(.badge .label) {
		min-width: fit-content;
	}

	.score {
		min-width: 5.25em;
	}

	.with-badge {
		text-align: center;
	}

	.with-badge :global(.badge) {
		height: 100%;
	}

	.with-badge :global(.badge > .label small) {
		font-size: 0.875em !important;
	}

	:global(*:not(.compare) > .badge.nominated-pp) {
		border: 2px dashed #ffffffb3;
		--badge-color: transparent !important;
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

	.player-score .pp {
		min-width: 5.5em;
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