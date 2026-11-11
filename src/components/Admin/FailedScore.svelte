<script>
	import {createEventDispatcher} from 'svelte';
	import {fade, fly, slide} from 'svelte/transition';
	import {navigate} from 'svelte-routing';
	import {formatNumber} from '../../utils/format';
	import SongInfo from '../Player/SongInfo.svelte';
	import FormattedDate from '../Common/FormattedDate.svelte';
	import SongScoreDetails from '../Player/SongScoreDetails.svelte';
	import Icons from '../Song/Icons.svelte';
	import PlayerPerformance from '../Player/PlayerPerformance.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import Button from '../Common/Button.svelte';
	import ScoreRank from '../Player/ScoreRank.svelte';
	import {failedScoreType} from './failed-score-types';
	import {accountKind, joinedInfo} from './admin-player';

	export let songScore = null;
	export let idx = 0;
	export let store = null;
	export let playerFailedCount = 0;

	const dispatch = createEventDispatcher();

	let showDetails = false;
	let showFullError = false;

	function errorSummary(error) {
		const lines = (error ?? '')
			.split('\n')
			.map(l => l.trim())
			.filter(l => l.length);
		const summary = lines.find(l => !l.startsWith('at ')) ?? lines[0] ?? '';

		return {summary: summary.length > 240 ? summary.slice(0, 240) + '...' : summary, hasMore: lines.length > 1 || summary.length > 240};
	}

	function navigateToPlayer() {
		if (score?.playerId) navigate(`/u/${score.playerId}`);
	}

	$: leaderboard = songScore?.leaderboard ?? null;
	$: score = songScore?.score ?? null;
	$: player = songScore?.player ?? null;
	$: rawPlayer = score?.player ?? null;
	$: playerInfo = player?.playerInfo ?? null;
	$: song = leaderboard?.song;
	$: hash = song?.hash;
	$: diffInfo = leaderboard?.diffInfo;
	$: modifiers = leaderboard?.difficultyBl?.modifierValues ?? null;
	$: type = failedScoreType(score?.type);
	$: account = accountKind(score?.playerId);
	$: joined = joinedInfo(rawPlayer?.createdAt);
	$: totalPlays = rawPlayer?.scoreStats?.totalPlayCount ?? 0;
	$: ({summary, hasMore} = errorSummary(score?.error));
	$: detailsScore = songScore ? {...songScore, score: {...songScore.score, id: null}} : null;
</script>

{#if songScore}
	<div
		class="song-score {type.tone}"
		in:fly|global={{x: 300, delay: idx * 30, duration: 500}}
		out:fade|global={{duration: 100}}
		class:with-details={showDetails}>
		<div class="icons up-to-tablet">
			<Icons {song} {diffInfo} replayLink={score.replay} altReplay={true} />
		</div>

		<div class="main">
			<span class="rank">
				<ScoreRank
					rank={score.rank}
					countryRank={0}
					countryRankTotal={null}
					country={score.country}
					hmd={score.hmd}
					platform={rawPlayer?.scoreStats?.platform} />
				<div class="timeset tablet-and-up">
					<FormattedDate date={score.timeSet} />
				</div>
			</span>

			<span class="timeset mobile-only">
				<FormattedDate date={score.timeSet} />
			</span>

			<span class="song">
				<SongInfo
					{leaderboard}
					{score}
					rank={score.rank}
					{hash}
					replayLink={score.replay}
					category={leaderboard?.categoryDisplayName ?? null}
					playerId={score.playerId} />
			</span>

			<div class="score-options-section">
				<button
					class="beat-savior-reveal"
					class:opened={showDetails}
					on:click={() => (showDetails = !showDetails)}
					title="Show details"
					aria-label="Show details">
					<i class="fas fa-chevron-down"></i>
				</button>
			</div>

			<PlayerPerformance service="scores" {songScore} {showDetails} {modifiers} />
		</div>

		<div class="failure">
			<div class="failed-player">
				<Avatar {player} cls="is-32x32 clickable" on:click={navigateToPlayer} />
				<div class="player-info">
					<PlayerNameWithFlag {player} on:click={navigateToPlayer} />
					<div class="meta">
						{#if account}
							<span class="chip" title={account.title}><i class={account.icon}></i> {account.name}</span>
						{/if}
						{#if joined}
							<span class="chip" class:warning={joined.fresh} title="Joined {joined.date.toLocaleString()}">joined {joined.relative}</span>
						{/if}
						{#if playerInfo?.rank}
							<span class="chip" title="Global rank and pp"
								>#{formatNumber(playerInfo.rank, 0)} · {formatNumber(playerInfo.pp ?? 0, 2)}pp</span>
						{/if}
						<span class="chip" title="Scores on the leaderboards"
							>{formatNumber(totalPlays, 0)} {totalPlays == 1 ? 'score' : 'scores'}</span>
						<button
							class="chip clickable"
							class:warning={playerFailedCount > 1}
							title="Show all failed scores of the player"
							on:click={() => dispatch('search', score.playerId)}>
							{formatNumber(playerFailedCount, 0)} failed
						</button>
						{#if playerInfo?.banned}
							<span class="chip danger" title={playerInfo.banDescription ?? ''}>banned</span>
						{/if}
						{#if playerInfo?.bot}
							<span class="chip">bot</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="reason">
				<span class="type {type.tone}" title={type.title}><i class="fas {type.icon}"></i> {type.name}</span>
				<span class="error">{summary}</span>
				{#if hasMore}
					<button class="more" on:click={() => (showFullError = !showFullError)}>{showFullError ? 'Hide' : 'Full error'}</button>
				{/if}
				{#if score.falsePositive}
					<span class="chip">Marked false positive by the player</span>
				{/if}
			</div>

			<div class="action-buttons">
				<Button title="Delete the failed score" label="Delete" noMargin={true} type="danger" on:click={() => store.deleteScore(score.id)} />
				{#if score.replay?.length}
					<Button title="Run the checks again" label="Retry" noMargin={true} type="primary" on:click={() => store.retryScore(score.id)} />
					<Button
						title="Post the score without the checks"
						label="Allow"
						noMargin={true}
						type="green"
						on:click={() => store.retryScore(score.id, true)} />
				{/if}
			</div>
		</div>

		{#if showFullError}
			<pre class="full-error" transition:slide|global>{score.error}</pre>
		{/if}

		{#if showDetails}
			<div transition:slide|global>
				<SongScoreDetails playerId={score.playerId} songScore={detailsScore} />
			</div>
		{/if}
	</div>
{/if}

<style>
	.song-score {
		border-bottom: 1px solid var(--row-separator);
		border-left: 3px solid transparent;
		padding: 0.6em 0.4em 0.6em 0.6em;
	}

	.song-score.review {
		border-left-color: var(--beatleader-primary, #eb008c);
	}

	.song-score.suspicious {
		border-left-color: #ff6b6b;
	}

	.song-score.technical {
		border-left-color: #e8c34a;
	}

	.song-score .icons.up-to-tablet + .main {
		padding-top: 0;
	}

	.song-score .main {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		grid-column-gap: 0.4em;
	}

	.song-score .main > *:last-child {
		margin-right: 0;
	}

	.song-score .main :global(.badge) {
		margin: 0 !important;
		padding: 0.125em 0.25em !important;
		width: 100%;
	}

	.song-score .main :global(.badge small) {
		font-size: 0.7em;
		font-weight: normal;
		margin-top: -2px;
	}

	.song-score .main :global(.inc),
	.song-score :global(.dec) {
		color: inherit;
	}

	.rank {
		width: 5.5em;
		text-align: center;
	}

	.song {
		flex-grow: 1;
		min-width: 15.25em;
	}

	.timeset {
		width: 8.5em;
		text-align: center;
	}

	.timeset :global(small) {
		line-height: 1;
	}

	.rank .timeset {
		width: auto;
		min-width: 7em;
		font-size: 0.8em;
	}

	.score-options-section {
		display: grid;
		justify-items: center;
		margin: 0.3em;
	}

	.beat-savior-reveal {
		align-self: end;
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		cursor: pointer;
		transition: transform 500ms;
		transform-origin: 0.42em 0.8em;
	}

	.beat-savior-reveal.opened {
		transform: rotateZ(180deg);
	}

	.icons {
		width: 100%;
		font-size: 0.75em;
		text-align: right;
		margin-right: 0;
		margin-bottom: 0.5em;
	}

	.icons:empty {
		margin-bottom: 0 !important;
	}

	.failure {
		display: grid;
		grid-template-columns: minmax(14em, 22em) 1fr auto;
		align-items: center;
		gap: 0.5em 1em;
		margin-top: 0.6em;
	}

	.failed-player {
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
	}

	.failed-player :global(figure) {
		flex-shrink: 0;
	}

	.player-info {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		min-width: 0;
		font-weight: 600;
	}

	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.3em;
		font-size: 0.75em;
		font-weight: normal;
	}

	.chip,
	.type {
		padding: 0.1em 0.45em;
		border: none;
		border-radius: 4px;
		white-space: nowrap;
		color: inherit;
		font: inherit;
		background-color: color-mix(in srgb, var(--textColor, white) 10%, transparent);
	}

	button.chip {
		cursor: pointer;
	}

	button.chip:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 20%, transparent);
	}

	.chip.warning {
		color: #e8c34a;
	}

	.chip.danger {
		color: #ff6b6b;
	}

	.reason {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.4em 0.6em;
		min-width: 0;
		font-size: 0.9em;
	}

	.type {
		font-size: 0.9em;
	}

	.type.review {
		color: var(--beatleader-primary, #eb008c);
	}

	.type.suspicious {
		color: #ff6b6b;
	}

	.type.technical {
		color: #e8c34a;
	}

	.error {
		min-width: 0;
		opacity: 0.85;
		word-break: break-word;
	}

	.more {
		padding: 0;
		border: none;
		background: none;
		color: var(--faded, #999);
		font-size: 0.9em;
		text-decoration: underline;
		cursor: pointer;
	}

	.full-error {
		max-height: 20em;
		margin: 0.5em 0 0;
		padding: 0.6em 0.8em;
		overflow: auto;
		border-radius: 6px;
		background-color: color-mix(in srgb, var(--textColor, white) 5%, transparent);
		color: inherit;
		font-size: 0.75em;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.action-buttons {
		display: flex;
		gap: 0.5em;
		font-size: 0.85rem;
	}

	@media screen and (max-width: 767px) {
		.song-score .main {
			flex-wrap: wrap;
		}

		.rank,
		.timeset {
			padding-bottom: 0.5em !important;
		}

		.song {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			width: 100%;
			margin-right: 0;
			padding-bottom: 0.75em;
		}

		.failure {
			grid-template-columns: 1fr;
		}
	}
</style>
