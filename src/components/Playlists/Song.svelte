<script>
	import createLeaderboardsService from '../../services/beatleader/leaderboardsMap';
	import {navigate} from 'svelte-routing';
	import {createEventDispatcher} from 'svelte';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import PlaylistVoteCell from './PlaylistVoteCell.svelte';
	import {configStore} from '../../stores/config';
	import {badgesDef, modeDescriptions, starsToBackgroundColor, starsToColor} from '../../utils/beatleader/format';

	export let song;
	export let store;
	export let canModify = false;
	export let playlistKey;
	export let position = null;
	export let first = false;
	export let last = false;
	export let compact = false;

	const leaderboardsService = createLeaderboardsService();
	const dispatch = createEventDispatcher();

	const SHORT_NAMES = {Easy: 'E', Normal: 'N', Hard: 'H', Expert: 'Ex', ExpertPlus: 'E+'};

	let songInfo = null;
	let modes = [];
	let leaderboardUrl = null;
	let notFound = false;
	let editing = false;
	let editingText = '';

	const decapitalizeFirstLetter = string => string.charAt(0).toLowerCase() + string.slice(1);

	const isSelected = (difficulties, difficulty) =>
		!!difficulties?.some(el => el.name == decapitalizeFirstLetter(difficulty.difficultyName) && el.characteristic == difficulty.modeName);

	function groupByMode(leaderboards) {
		const groups = [];
		for (const leaderboard of leaderboards) {
			const {modeName} = leaderboard.difficulty;
			let group = groups.find(g => g.modeName === modeName);
			if (!group) {
				group = {modeName, icon: modeDescriptions[modeName]?.icon, leaderboards: []};
				groups.push(group);
			}
			group.leaderboards.push(leaderboard);
		}
		return groups;
	}

	async function updateSongInfo(mapHash, refresh) {
		if (!mapHash) {
			notFound = true;
			return;
		}
		if (!refresh) songInfo = null;

		const mapResponse = await leaderboardsService.byHashWithScore(mapHash, refresh);
		const info = mapResponse?.info;
		if (!info?.song?.id || info.song.hash.toLowerCase() != mapHash.toLowerCase()) {
			notFound = !songInfo;
			return;
		}

		songInfo = info.song;
		const leaderboards = info.leaderboards.filter(l => l.difficulty.mode <= 7 || isSelected(difficulties, l.difficulty));
		modes = groupByMode(leaderboards);

		const selected = difficulties?.length ? leaderboards.find(l => isSelected(difficulties.slice(0, 1), l.difficulty)) : leaderboards[0];
		leaderboardUrl = selected ? `/leaderboard/global/${selected.id}/1` : null;

		if (!refresh && mapResponse.cached) {
			updateSongInfo(mapHash, true);
		}
	}

	function toggleDifficulty(difficulty) {
		if (!canModify) return;

		const diffInfo = {diff: difficulty.difficultyName, type: difficulty.modeName};
		const action = isSelected(difficulties, difficulty) ? store.removeDiff : store.addDiff;
		action(hash, diffInfo, playlistKey).catch(e => dispatch('error', e));
	}

	function openLeaderboard() {
		if (leaderboardUrl) navigate(leaderboardUrl);
	}

	function remove() {
		const action = song.itemId ? store.removeItem(playlistKey, song.itemId) : store.remove(hash, playlistKey);
		action.catch(e => dispatch('error', e));
	}

	function setEditing(value) {
		editing = value;
		dispatch('editing', value);
	}

	function startEditing() {
		editingText = song.description ?? '';
		setEditing(true);
	}

	function saveDescription() {
		const text = editingText.trim();
		if (text !== (song.description ?? '')) {
			store.updateSongDescription(playlistKey, song, text).catch(e => dispatch('error', e));
		}
		setEditing(false);
	}

	function onNoteKeydown(e) {
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveDescription();
		if (e.key === 'Escape') setEditing(false);
	}

	function orbTitle(difficulty, selected) {
		const diffName = difficulty.difficultyName === 'ExpertPlus' ? 'Expert+' : difficulty.difficultyName;
		const name = difficulty.modeName !== 'Standard' ? `${diffName} (${difficulty.modeName})` : diffName;
		if (!canModify) return selected ? `${name}: in the playlist` : name;
		return selected ? `${name}: in the playlist, click to remove` : `${name}: click to add`;
	}

	const scoreColor = score => badgesDef.find(b => (!b.max || score.accuracy * 100 <= b.max) && (!b.min || score.accuracy * 100 > b.min))?.color;

	$: hash = song.hash;
	$: difficulties = song.difficulties;
	$: updateSongInfo(hash);
</script>

<div class="song-row" class:compact class:editable={canModify}>
	{#if position != null}
		<span class="position">#{position}</span>
	{/if}
	<PlaylistVoteCell itemId={song.itemId} />

	{#if canModify}
		<div class="row-actions">
			<button class="move" title="Move up" disabled={first} on:click={() => dispatch('move-up')}><i class="fas fa-chevron-up" /></button>
			<div class="buttons-container">
				<span>
					<Button iconFa="fas fa-trash-alt" title="Remove from the playlist" type="danger" noMargin={true} on:click={remove} />
				</span>
			</div>
			<button class="move" title="Move down" disabled={last} on:click={() => dispatch('move-down')}><i class="fas fa-chevron-down" /></button>
		</div>
	{/if}

	{#if songInfo}
		<a href={leaderboardUrl} class="cover-link" on:click|preventDefault={openLeaderboard}>
			<img loading="lazy" class="cover" src={songInfo.coverImage} alt="" />
		</a>
	{:else}
		<div class="cover placeholder">
			{#if notFound}<i class="fas fa-question" />{:else}<Spinner />{/if}
		</div>
	{/if}

	<div class="info">
		{#if songInfo}
			<a href={leaderboardUrl} class="name" on:click|preventDefault={openLeaderboard}>
				{songInfo.name}
				{#if songInfo.subName}<span class="subname">{songInfo.subName}</span>{/if}
			</a>
			<span class="author">{songInfo.author} <span class="mapper">· {songInfo.mapper}</span></span>
		{:else if notFound}
			<span class="name">{song.songName ?? 'Unknown map'}</span>
			<span class="author">{song.levelAuthorName ?? ''} · not on BeatLeader</span>
		{:else}
			<span class="name">{song.songName ?? ''}</span>
		{/if}
		{#if editing}
			<div class="note-edit">
				<!-- svelte-ignore a11y_autofocus -->
				<textarea
					rows="2"
					maxlength="500"
					placeholder="Note for this map, e.g. what to practice on it (optional)"
					bind:value={editingText}
					on:keydown={onNoteKeydown}
					autofocus />
				<Button iconFa="fas fa-check" title="Save (Ctrl+Enter)" type="primary" noMargin={true} on:click={saveDescription} />
				<Button iconFa="fas fa-xmark" title="Cancel (Esc)" noMargin={true} on:click={() => setEditing(false)} />
			</div>
		{:else if song.description}
			<span class="note">{song.description}</span>
		{/if}
	</div>

	{#if canModify}
		<div class="note-action buttons-container">
			<span>
				<Button iconFa="fas fa-pen" title={song.description ? 'Edit the note' : 'Add a note'} noMargin={true} on:click={startEditing} />
			</span>
		</div>
	{/if}

	{#if songInfo}
		<div class="modes">
			{#each modes as mode (mode.modeName)}
				<div class="mode-pill" title={mode.modeName}>
					{#if mode.icon}<i class="mode-icon {mode.icon}" />{/if}
					{#each mode.leaderboards as leaderboard (leaderboard.id)}
						{@const selected = isSelected(difficulties, leaderboard.difficulty)}
						<button
							class="diff-orb"
							class:selected
							disabled={!canModify}
							title={orbTitle(leaderboard.difficulty, selected)}
							style="background-color: {starsToBackgroundColor(leaderboard.difficulty, $configStore)}; color: {starsToColor(leaderboard.difficulty, $configStore)}"
							on:click={() => toggleDifficulty(leaderboard.difficulty)}>
							{#if leaderboard.myScore?.accuracy}
								<span
									class="my-score"
									title="Your score: {(leaderboard.myScore.accuracy * 100).toFixed(2)}%"
									style="background-color: {scoreColor(leaderboard.myScore)}; border-color: {leaderboard.myScore.fullCombo ? 'yellow' : 'white'}" />
							{/if}
							{#if leaderboard.difficulty.stars}
								{leaderboard.difficulty.stars.toFixed(1)}<span class="star">★</span>
							{:else}
								{SHORT_NAMES[leaderboard.difficulty.difficultyName] ?? leaderboard.difficulty.difficultyName}
							{/if}
						</button>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.song-row {
		display: flex;
		align-items: center;
		gap: 0.7em;
		padding: 0.4em 0.3em;
		border-radius: 6px;
		transition: background-color 0.15s;
	}

	.song-row:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 4%, transparent);
	}

	.position {
		flex: none;
		min-width: 2.4em;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.cover-link {
		flex: none;
		display: flex;
	}

	.cover {
		flex: none;
		width: 3.2em;
		height: 3.2em;
		border-radius: 6px;
		object-fit: cover;
	}

	.compact .cover {
		width: 2.6em;
		height: 2.6em;
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
		min-width: 0;
	}

	.name {
		color: color-mix(in srgb, var(--textColor, white) 80%, transparent) !important;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	a.name:hover {
		text-decoration: underline;
	}

	.subname {
		color: color-mix(in srgb, var(--textColor, white) 58%, transparent);
		font-size: 0.8em;
		font-weight: normal;
		margin-left: 0.3em;
	}

	.author {
		color: color-mix(in srgb, var(--textColor, white) 64%, transparent);
		font-size: 0.85em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mapper {
		color: color-mix(in srgb, var(--textColor, white) 50%, transparent);
	}

	.note {
		font-size: 0.85em;
		font-style: italic;
		color: color-mix(in srgb, var(--textColor, white) 69%, transparent);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.note-edit {
		display: flex;
		gap: 0.3em;
		align-items: flex-start;
		margin-top: 0.2em;
	}

	.note-edit textarea {
		flex: 1;
		padding: 0.3em 0.5em;
		border-radius: 0.3em;
		border: 1px solid var(--faded);
		background-color: var(--dimmed);
		color: inherit;
		font-family: inherit;
		resize: vertical;
	}

	.note-action {
		display: flex;
		flex: none;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.song-row:hover .note-action,
	.note-action:focus-within {
		opacity: 1;
	}

	.modes {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.3em;
		max-width: 50%;
	}

	.mode-pill {
		display: flex;
		align-items: center;
		gap: 0.3em;
		padding: 0.2em 0.25em 0.2em 0.35em;
		border-radius: 12px;
		background-color: #00000069;
	}

	.mode-icon {
		display: block;
		width: 1.1em;
		height: 1.1em;
		margin-right: 0.1em;
	}

	.diff-orb {
		display: flex;
		align-items: center;
		gap: 0.05em;
		min-height: 1.6em;
		padding: 0.15em 0.4em 0.18em;
		border: none;
		border-radius: 0.8em;
		font-size: 0.7em;
		font-weight: 600;
		font-family: inherit;
		line-height: 1;
		opacity: 0.35;
		filter: saturate(0.4);
		transition:
			opacity 0.15s,
			filter 0.15s,
			box-shadow 0.15s;
	}

	.diff-orb.selected {
		opacity: 1;
		filter: none;
		box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--textColor, white) 69%, transparent);
	}

	.diff-orb:disabled {
		cursor: default;
	}

	.editable .diff-orb:not(:disabled) {
		cursor: pointer;
	}

	.editable .diff-orb:not(:disabled):hover {
		opacity: 0.85;
		filter: none;
	}

	.editable .diff-orb.selected:not(:disabled):hover {
		opacity: 0.75;
	}

	.star {
		font-size: 0.9em;
	}

	.my-score {
		width: 0.9em;
		height: 0.9em;
		margin-right: 0.15em;
		border-radius: 50%;
		border: 2px solid white;
	}

	.row-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		flex: none;
		opacity: 0.35;
		transition: opacity 0.15s;
	}

	.song-row:hover .row-actions,
	.row-actions:focus-within {
		opacity: 1;
	}

	.move {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 12px;
		padding: 0;
		border: none;
		font-size: 11px;
		color: color-mix(in srgb, var(--textColor, white) 63%, transparent);
		background: transparent;
		cursor: pointer;
		transition: color 0.15s;
	}

	.move:hover {
		color: var(--textColor, white);
	}

	.move:disabled {
		visibility: hidden;
	}

	@media (hover: none) {
		.row-actions,
		.note-action {
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		.song-row {
			flex-wrap: wrap;
		}

		.position {
			min-width: 2em;
		}

		.modes {
			max-width: none;
			justify-content: flex-start;
			flex-basis: 100%;
			padding-left: 2.7em;
		}

		.editable .modes {
			padding-left: calc(2.7em + 22px + 0.7em);
		}
	}
</style>
