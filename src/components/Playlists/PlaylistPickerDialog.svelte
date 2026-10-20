<script>
	import {getNotificationsContext} from 'svelte-notifications';
	import DialogContent from '../Common/DialogContent.svelte';
	import PlaylistEditDialog from './PlaylistEditDialog.svelte';
	import PlaylistTypeIcon from './PlaylistTypeIcon.svelte';
	import ActivePlaylistIcon from './ActivePlaylistIcon.svelte';
	import createPlaylistStore, {canEditPlaylist, isReplayPlaylist, playlistCover, playlistItemsLabel} from '../../stores/playlists';
	import createAccountStore from '../../stores/beatleader/account';
	import {configStore} from '../../stores/config';
	import {decapitalizeFirstLetter} from '../../utils/js';

	export let song = null;
	export let diffInfo = null;
	export let replay = null;
	export let open;
	export let close;

	const playlists = createPlaylistStore();
	const account = createAccountStore();
	const {addNotification} = getNotificationsContext();

	let tab = null;
	let note = '';
	let busyKey = null;
	let noteTab = null;
	let multipleNotes = false;
	let noteTimer = null;
	let noteSaved = false;

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 4000 : 2000});
	}

	function songItem() {
		return {
			hash: song.hash,
			songName: song.name,
			levelAuthorName: song.mapper,
			difficulties: diffInfo ? [{name: decapitalizeFirstLetter(diffInfo.diff), characteristic: diffInfo.type}] : undefined,
			description: note.trim() || undefined,
		};
	}

	const replayItem = () => ({replayType: replay.replayType, id: replay.id, description: note.trim() || undefined});

	const entryIn = playlist =>
		isReplayPlaylist(playlist)
			? playlist.replays?.find(r => r.replayType === replay?.replayType && r.id == replay?.id)
			: playlist.songs?.find(s => s.hash?.toLowerCase() === song?.hash?.toLowerCase());
	const isIn = playlist => !!entryIn(playlist);
	const noteIn = playlist => entryIn(playlist).description ?? '';

	function loadNote() {
		const notes = [...new Set(list.filter(isIn).map(noteIn))];
		multipleNotes = notes.length > 1;
		note = notes.length === 1 ? notes[0] : '';
		noteSaved = false;
	}

	async function saveNote() {
		clearTimeout(noteTimer);
		noteTimer = null;
		const text = note.trim();
		const targets = list.filter(p => isIn(p) && noteIn(p) !== text);
		if (!targets.length) return;
		try {
			await Promise.all(
				targets.map(p =>
					isReplayPlaylist(p)
						? playlists.updateReplayDescription(p.key, replay.replayType, replay.id, text)
						: playlists.updateSongDescription(p.key, entryIn(p), text)
				)
			);
			multipleNotes = false;
			noteSaved = true;
		} catch (e) {
			notify(e?.message?.length < 200 ? e.message : 'Failed to save the note', 'error');
		}
	}

	function onNoteInput() {
		noteSaved = false;
		clearTimeout(noteTimer);
		noteTimer = setTimeout(saveNote, 700);
	}

	const flushNote = () => noteTimer && saveNote();

	function done() {
		flushNote();
		close();
	}

	// Flush first: saveNote takes its playlists from the current tab's list
	function switchTab(next) {
		flushNote();
		tab = next;
	}

	async function toggle(playlist) {
		busyKey = playlist.key;
		try {
			if (isReplayPlaylist(playlist)) {
				if (isIn(playlist)) {
					await playlists.removeReplay(playlist.key, replay.replayType, replay.id);
				} else {
					await playlists.addReplay(playlist.key, replayItem());
				}
			} else if (isIn(playlist)) {
				await playlists.remove(song.hash, playlist.key);
			} else {
				await playlists.add(songItem(), playlist.key);
			}
		} catch (e) {
			notify(e?.message?.length < 200 ? e.message : 'Failed to update the playlist', 'error');
		}
		busyKey = null;
	}

	function makeActive(playlist) {
		playlists.select(activeKey === playlist.key ? null : playlist);
	}

	function createNew() {
		open(PlaylistEditDialog, {
			mode: 'create',
			presetType: tab,
			item: tab === 'replays' ? replayItem() : songItem(),
			makeActive: true,
			close,
		});
	}

	$: loggedIn = !!$account?.id;
	$: tabs = [...(song ? ['maps'] : []), ...(replay && loggedIn ? ['replays'] : [])];
	$: activeKey = $configStore?.selectedPlaylistId;
	$: activeType = ($playlists ?? []).find(p => p.key === activeKey)?.type;
	$: if (!tab && tabs.length) tab = tabs.includes(activeType) ? activeType : tabs[tabs.length - 1];
	$: list = ($playlists ?? []).filter(p => !p.oneclick && canEditPlaylist(p) && (tab === 'replays') === isReplayPlaylist(p));
	$: inCount = list.filter(isIn).length;
	$: inLabel = inCount === 1 ? 'the playlist' : `the ${inCount} playlists`;
	$: kindLabel = tab === 'replays' ? 'replay' : 'map';
	$: if (tab && tab !== noteTab) {
		noteTab = tab;
		loadNote();
	}
</script>

<div class="dialog-container">
	<DialogContent type="alert" title="Add to playlist" okButton="Done" okButtonType="primary" on:confirm={done}>
		<div slot="content" class="picker">
			{#if tabs.length > 1}
				<div class="pl-tabs" role="tablist">
					<button role="tab" class:selected={tab === 'maps'} on:click={() => switchTab('maps')}>
						<PlaylistTypeIcon /> Map
						<small>{diffInfo?.diff ?? ''}</small>
					</button>
					<button role="tab" class:selected={tab === 'replays'} on:click={() => switchTab('replays')}>
						<PlaylistTypeIcon replays={true} /> Replay
						<small>{replay?.replayType === 'attempt' ? 'attempt' : 'score'}</small>
					</button>
				</div>
			{/if}

			<textarea
				class="note"
				rows="2"
				maxlength="500"
				placeholder={multipleNotes
					? `Its notes differ between the ${inCount} playlists that have it; type one to use everywhere`
					: tab === 'replays'
						? 'Note for this replay, e.g. what to watch for (optional)'
						: 'Note for this map, e.g. what to practice on it (optional)'}
				bind:value={note}
				on:input={onNoteInput}
				on:blur={flushNote} />
			{#if inCount}
				<small class="note-hint">
					{#if noteSaved}
						<i class="fas fa-check" /> Saved to {inLabel} that have it
					{:else}
						Note changes save to {inLabel} that have it, and go with new adds
					{/if}
				</small>
			{/if}

			<div class="pl-list">
				{#each list as playlist (playlist.key)}
					{@const inPlaylist = isIn(playlist)}
					<div class="pl-row" class:in={inPlaylist}>
						<button class="pl-row-main" disabled={busyKey === playlist.key} on:click={() => toggle(playlist)}>
							<img src={playlistCover(playlist)} alt="" class="pl-row-cover" loading="lazy" />
							<span class="pl-row-text">
								<span class="pl-row-title">{playlist.playlistTitle}</span>
								<small>{playlistItemsLabel(playlist)}{playlist.role === 'editor' ? ' · shared with you' : ''}</small>
							</span>
							<i class={inPlaylist ? 'fas fa-check-circle state' : 'far fa-circle state'} />
						</button>
						<button
							class="make-active"
							class:active={activeKey === playlist.key}
							title={activeKey === playlist.key ? 'Active playlist, click to deactivate' : 'Make active: add buttons put items here'}
							on:click={() => makeActive(playlist)}>
							<ActivePlaylistIcon size="1.2em" />
						</button>
					</div>
				{:else}
					<p class="empty">No {kindLabel} playlists yet.</p>
				{/each}
			</div>

			<button class="new" on:click={createNew}>
				<i class="fas fa-plus" /> New {kindLabel} playlist
			</button>
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
		width: min(28em, 85vw);
	}

	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.7em;
	}

	.pl-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.3em;
		padding: 0.25em;
		border-radius: 0.6em;
		background-color: rgba(0, 0, 0, 0.3);
	}

	.pl-tabs button {
		padding: 0.45em;
		border: none;
		border-radius: 0.45em;
		background: transparent;
		color: inherit;
		cursor: pointer;
		opacity: 0.7;
	}

	.pl-tabs button.selected {
		background-color: var(--dimmed);
		opacity: 1;
	}

	.pl-tabs small {
		opacity: 0.6;
		margin-left: 0.2em;
	}

	.note {
		padding: 0.4em 0.6em;
		border-radius: 0.4em;
		border: 1px solid var(--dimmed);
		background-color: rgba(0, 0, 0, 0.25);
		color: inherit;
		font-family: inherit;
		resize: vertical;
	}

	.note-hint {
		margin-top: -0.4em;
		font-size: 0.78em;
		opacity: 0.6;
	}

	.pl-list {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
		max-height: 22em;
		overflow-y: auto;
	}

	.pl-row {
		display: flex;
		align-items: center;
		border-radius: 0.5em;
	}

	.pl-row:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 5%, transparent);
	}

	.pl-row-main {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
		padding: 0.35em 0.5em;
		border: none;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.pl-row-cover {
		width: 2.4em;
		height: 2.4em;
		border-radius: 0.35em;
		object-fit: cover;
		flex: none;
	}

	.pl-row-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.pl-row-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pl-row-text small {
		opacity: 0.6;
	}

	.state {
		font-size: 1.2em;
		opacity: 0.5;
	}

	.pl-row.in .state {
		color: var(--increase);
		opacity: 1;
	}

	.make-active {
		display: flex;
		align-items: center;
		padding: 0.4em 0.6em;
		border: none;
		background: transparent;
		color: inherit;
		cursor: pointer;
		opacity: 0.45;
	}

	.make-active:hover,
	.make-active.active {
		opacity: 1;
	}

	.make-active.active {
		color: #ffd24d;
	}

	.empty {
		margin: 0.5em;
		opacity: 0.7;
	}

	.new {
		align-self: flex-start;
		padding: 0.45em 0.9em;
		border-radius: 0.45em;
		border: 1px dashed var(--faded);
		background: transparent;
		color: inherit;
		cursor: pointer;
	}

	.new:hover {
		border-color: var(--beatleader-primary);
	}

	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
	}
</style>
