<script>
	import {navigate} from 'svelte-routing';
	import {BL_REPLAYS_URL} from '../../network/queues/beatleader/api-queue';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import {formatNumber} from '../../utils/format';
	import {getDiffNameColor} from '../../utils/beatleader/format';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';

	export let score;
	export let live = true;

	function diffLabel(name) {
		return (name ?? '').replace('Plus', '+');
	}

	$: leaderboard = score?.leaderboard;
	$: leaderboardId = leaderboard?.id ?? score?.leaderboardId;
	$: playerId = score?.player?.id ?? score?.playerId;
	$: replayUrl = score?.replay?.length ? `${BL_REPLAYS_URL}?link=${score.replay}` : null;
</script>

<div class="deletion-score">
	{#if leaderboard?.coverImage}
		<img class="cover" src={leaderboard.coverImage} alt="" loading="lazy" />
	{:else}
		<div class="cover empty"><i class="fas fa-music" /></div>
	{/if}

	<div class="details">
		<a
			class="song"
			href="/leaderboard/global/{leaderboardId}/1"
			on:click|preventDefault={() => navigate(`/leaderboard/global/${leaderboardId}/1`)}>
			<span class="song-name">{leaderboard?.songName ?? leaderboardId ?? 'Unknown map'}</span>
			{#if leaderboard?.songSubName}<span class="muted">{leaderboard.songSubName}</span>{/if}
		</a>
		<div class="line">
			{#if leaderboard?.difficultyName}
				<span class="diff" style="background-color: {getDiffNameColor(leaderboard.difficultyName) ?? 'var(--faded)'}">
					{diffLabel(leaderboard.difficultyName)}{#if leaderboard.ranked && leaderboard.stars}&nbsp;{formatNumber(
							leaderboard.stars
						)}★{/if}
				</span>
				{#if leaderboard.modeName && leaderboard.modeName !== 'Standard'}<span class="muted">{leaderboard.modeName}</span>{/if}
			{/if}
			{#if leaderboard?.mapper}<span class="muted">by {leaderboard.mapper}</span>{/if}
		</div>
		<div class="line">
			{#if score?.player}
				<PlayerNameWithFlag player={score.player} on:click={() => navigate(`/u/${playerId}`)} />
				{#if score.player.banned}<span class="banned">banned</span>{/if}
			{:else if playerId}
				<a href="/u/{playerId}" on:click|preventDefault={() => navigate(`/u/${playerId}`)}>{playerId}</a>
			{/if}
		</div>
	</div>

	<div class="stats">
		{#if Number.isFinite(score?.accuracy)}
			<div class="stat-line">
				<b>{formatNumber(score.accuracy * 100)}%</b>
				{#if score.pp > 0}<span class="pp">{formatNumber(score.pp)}pp</span>{/if}
				{#if score.rank}<span class="muted">#{score.rank}</span>{/if}
			</div>
		{/if}
		{#if score?.modifiers?.length}<div class="muted">{score.modifiers}</div>{/if}
		{#if score?.timepost}
			<div class="muted" title={dateFromUnix(score.timepost)?.toLocaleString()}>
				set {formatDateRelative(dateFromUnix(score.timepost))}
			</div>
		{/if}
		<div class="links">
			{#if live && score?.id}
				<a
					href="/score/{score.id}"
					title="Score page"
					aria-label="Score page"
					on:click|preventDefault={() => navigate(`/score/${score.id}`)}><i class="fas fa-up-right-from-square" /></a>
			{/if}
			{#if replayUrl}
				<a href={replayUrl} target="_blank" rel="noreferrer" title="Watch the replay" aria-label="Watch the replay"
					><i class="fas fa-play" /></a>
				<a href={score.replay} title="Download the replay" aria-label="Download the replay"><i class="fas fa-download" /></a>
			{/if}
		</div>
	</div>
</div>

<style>
	.deletion-score {
		display: grid;
		grid-template-columns: 3.2em 1fr auto;
		gap: 0.7em;
		align-items: center;
		min-width: 0;
	}

	.cover {
		width: 3.2em;
		height: 3.2em;
		border-radius: 0.4em;
		object-fit: cover;
	}

	.cover.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #ffffff12;
		color: var(--faded);
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		min-width: 0;
	}

	.song {
		color: inherit;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.song-name {
		font-weight: 600;
	}

	.line {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.4em;
		font-size: 0.9em;
		min-width: 0;
	}

	.diff {
		padding: 0 0.4em;
		border-radius: 0.3em;
		color: white;
		font-size: 0.85em;
		white-space: nowrap;
	}

	.stats {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.1em;
		text-align: right;
		font-size: 0.9em;
	}

	.stat-line {
		display: flex;
		gap: 0.5em;
		white-space: nowrap;
	}

	.pp {
		color: var(--ppColour, #8992e8);
	}

	.links {
		display: flex;
		gap: 0.7em;
		margin-top: 0.15em;
	}

	.links a {
		color: var(--faded);
	}

	.links a:hover {
		color: var(--textColor, white);
	}

	.muted {
		color: var(--faded, #999);
	}

	.banned {
		padding: 0 0.35em;
		border-radius: 0.3em;
		background-color: #ff6b6b33;
		color: #ff8f8f;
		font-size: 0.8em;
	}

	@media screen and (max-width: 600px) {
		.deletion-score {
			grid-template-columns: 2.6em 1fr;
		}

		.cover {
			width: 2.6em;
			height: 2.6em;
		}

		.stats {
			grid-column: 1 / -1;
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			justify-content: flex-start;
			gap: 0.6em;
			text-align: left;
		}
	}
</style>
