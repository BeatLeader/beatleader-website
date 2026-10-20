<script>
	import {navigate} from 'svelte-routing';
	import {votePercent} from './votes';
	import {capitalize} from '../../utils/js';

	export let vote;

	const SHORT_NAMES = {Easy: 'E', Normal: 'N', Hard: 'H', Expert: 'Ex', ExpertPlus: 'E+'};

	const shortDifficulty = (name, mode) => (SHORT_NAMES[name] ?? name) + (mode && mode !== 'Standard' ? ` ${mode}` : '');

	const difficultyLabel = option =>
		option.difficultyName
			? shortDifficulty(option.difficultyName, option.modeName)
			: (option.difficulties ?? []).map(d => shortDifficulty(capitalize(d.name), d.characteristic)).join(', ');

	const optionUrl = option =>
		option.replayType === 'score' && option.replayId
			? `/score/${option.replayId}`
			: option.leaderboardId
				? `/leaderboard/global/${option.leaderboardId}/1`
				: null;

	$: visible = vote.resultsVisible;
	$: options = visible ? [...(vote.options ?? [])].sort((a, b) => b.votes - a.votes || a.position - b.position) : (vote.options ?? []);
	$: top = visible ? Math.max(0, ...options.map(o => o.votes ?? 0)) : 0;
</script>

<div class="vote-results">
	{#if !visible}
		<p class="hidden-note">Results show {vote.results === 'voted' ? 'once you vote' : 'when the vote ends'}.</p>
	{/if}
	{#each options as option, idx (option.id)}
		{@const percent = visible ? votePercent(option.votes, vote.voterCount) : 0}
		{@const url = optionUrl(option)}
		{@const mine = vote.myChoices?.includes(option.id)}
		{@const diffs = difficultyLabel(option)}
		<div class="result-row" class:winner={top > 0 && option.votes === top}>
			<span class="rank">{visible ? `#${idx + 1}` : ''}</span>
			{#if option.cover}
				<img class="cover" src={option.cover} alt="" loading="lazy" />
			{:else}
				<span class="cover placeholder"><i class="fas fa-music" /></span>
			{/if}
			<div class="info">
				<a class="name" href={url} on:click|preventDefault={() => url && navigate(url)}>
					{option.replayType ? `${option.playerName ?? 'Unknown player'} on ${option.songName ?? 'a deleted map'}` : (option.songName ?? 'Unknown map')}
				</a>
				<span class="sub">
					{#if !option.replayType && option.mapper}{option.mapper}{/if}
					{#if diffs}<span class="diffs">{diffs}</span>{/if}
					{#if option.replayType === 'attempt'}<span class="diffs">attempt</span>{/if}
					{#if mine}<span class="mine"><i class="fas fa-check" /> your pick</span>{/if}
				</span>
				{#if visible}
					<span class="bar"><span class="fill" style="width: {percent}%" /></span>
				{/if}
			</div>
			{#if visible}
				<span class="count"><b>{option.votes}</b> <span class="percent">{percent}%</span></span>
			{/if}
		</div>
	{/each}
</div>

<style>
	.vote-results {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
	}

	.hidden-note {
		margin: 0 0 0.3em;
		font-size: 0.85em;
		opacity: 0.7;
	}

	.result-row {
		display: flex;
		align-items: center;
		gap: 0.7em;
		padding: 0.35em 0.4em;
		border-radius: 6px;
	}

	.result-row.winner {
		background-color: #9b6dff1c;
	}

	.rank {
		flex: none;
		min-width: 2.2em;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.cover {
		flex: none;
		width: 2.6em;
		height: 2.6em;
		border-radius: 6px;
		object-fit: cover;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--dimmed);
		opacity: 0.7;
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		min-width: 0;
	}

	.name {
		color: color-mix(in srgb, var(--textColor, white) 80%, transparent) !important;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name:hover {
		text-decoration: underline;
	}

	.sub {
		display: flex;
		flex-wrap: wrap;
		gap: 0 0.6em;
		font-size: 0.8em;
		color: color-mix(in srgb, var(--textColor, white) 60%, transparent);
	}

	.diffs {
		color: color-mix(in srgb, var(--textColor, white) 73%, transparent);
	}

	.mine {
		color: #b896ff;
	}

	.bar {
		height: 0.3em;
		border-radius: 1em;
		background-color: color-mix(in srgb, var(--textColor, white) 10%, transparent);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		border-radius: 1em;
		background-color: #9b6dff;
	}

	.count {
		flex: none;
		min-width: 4em;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.percent {
		opacity: 0.6;
		font-size: 0.85em;
	}
</style>
