<script>
	import {createEventDispatcher, getContext} from 'svelte';
	import {dndzone} from 'svelte-dnd-action';
	import {navigate} from 'svelte-routing';
	import {getNotificationsContext} from 'svelte-notifications';
	import Button from '../Common/Button.svelte';
	import Badge from '../Common/Badge.svelte';
	import Value from '../Common/Value.svelte';
	import Pager from '../Common/Pager.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import Preview from '../Common/Preview.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Accuracy from '../Common/PerformanceBadge/Accuracy.svelte';
	import Difficulty from '../Song/Difficulty.svelte';
	import PlaylistTypeIcon from './PlaylistTypeIcon.svelte';
	import PlaylistVoteCell from './PlaylistVoteCell.svelte';
	import {playlistTypeIcon} from './icons';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import {BL_REPLAYS_URL} from '../../network/queues/beatleader/api-queue';
	import {configStore} from '../../stores/config';
	import {playlistAccessId} from '../../stores/playlists';
	import {droppedElsewhere, isTouchLayout, onlyItems, toDndEntries} from './dnd';

	export let playlist;
	export let playlistKey = null;
	export let store;
	export let canModify = false;
	export let embedded = false;

	const dispatch = createEventDispatcher();
	const {open} = getContext('simple-modal');
	const {addNotification} = getNotificationsContext();

	const END_TYPES = {1: 'Clear', 2: 'Fail', 3: 'Restart', 4: 'Quit', 5: 'Practice'};
	const itemsPerPageValues = embedded ? [5, 10, 25] : [10, 25, 50];

	let hydrated = {};
	let loading = false;
	let loadedReplaySet = null;
	let page = 0;
	let itemsPerPage = itemsPerPageValues[0];
	let list = [];
	let editingId = null;
	let editingText = '';

	const replayKey = (replayType, replayId) => `${replayType}-${replayId}`;

	async function hydrate(playlist) {
		if (!playlist?.id) return;

		const replaySet = playlist.replays.map(r => replayKey(r.replayType, r.id)).sort().join(',');
		if (replaySet === loadedReplaySet) return;
		loadedReplaySet = replaySet;

		loading = !Object.keys(hydrated).length;
		try {
			const items = await store.getReplays(playlist);
			hydrated = Object.fromEntries(items.map(i => [replayKey(i.replayType, i.replayId), i]));
		} catch (e) {
			dispatch('error', e);
		}
		loading = false;
	}

	function updateList(replays, page, itemsPerPage) {
		list = toDndEntries(playlistKey ?? `view-${playlist?.id}`, replays.slice(page * itemsPerPage, (page + 1) * itemsPerPage));
	}

	function handleConsider(e) {
		list = onlyItems(e.detail.items);
	}

	async function handleFinalize(e) {
		const {items, info} = e.detail;
		const entries = onlyItems(items);
		const index = entries.findIndex(entry => entry.id === info.id);
		const entry = entries[index];
		const pageStart = page * itemsPerPage;

		try {
			if (droppedElsewhere(info) || !entry || !editable) return;

			if (entry.from === playlistKey) {
				// Dropping on a page number brings the item to that page, so one from an earlier page shifts this page up by one
				const fromIndex = replays.indexOf(entry.item);
				const fromEarlierPage = fromIndex > -1 && fromIndex < pageStart;
				if (entry.item.itemId) await store.reorder(playlistKey, entry.item.itemId, pageStart + index - (fromEarlierPage ? 1 : 0));
			} else if (!(await store.copyItem(playlistKey, entry.item, pageStart + index))) {
				addNotification({text: entry.item.replayType ? 'Already in this playlist' : 'Only replays go here', position: 'top-right', type: 'warning', removeAfter: 2000});
			}
		} catch (error) {
			dispatch('error', error);
		} finally {
			updateList(replays, page, itemsPerPage);
		}
	}

	function move(item, toIndex) {
		if (toIndex < 0 || toIndex >= replays.length) return;
		store.reorder(playlistKey, item.itemId, toIndex).catch(e => dispatch('error', e));
	}

	function remove(item) {
		store.removeItem(playlistKey, item.itemId).catch(e => dispatch('error', e));
	}

	function startEditing(item) {
		editingId = item.itemId;
		editingText = item.description ?? '';
	}

	function saveDescription(item) {
		const text = editingText.trim();
		if (text !== (item.description ?? '')) {
			store.updateItemDescription(playlistKey, item.itemId, text).catch(e => dispatch('error', e));
		}
		editingId = null;
	}

	function onNoteKeydown(e, item) {
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveDescription(item);
		if (e.key === 'Escape') editingId = null;
	}

	function pageUrl(data) {
		if (data?.scoreId) return `/score/${data.scoreId}`;
		return data?.leaderboard ? `/leaderboard/global/${data.leaderboard.id}/1` : null;
	}

	function watchUrl(data, webPlayer, playlistId) {
		const replay = data?.replay;
		const scoreId = data?.scoreId;
		switch (webPlayer) {
			case 'arcviewer':
				if (replay) return `https://allpoland.github.io/ArcViewer/?replayURL=${replay}`;
				return scoreId ? `https://allpoland.github.io/ArcViewer/?scoreID=${scoreId}` : null;
			case 'chroviewer':
				if (replay) return `https://chroviewer.com/?replayUrl=${replay}`;
				return scoreId ? `https://chroviewer.com/?scoreIdBL=${scoreId}` : null;
			default:
				if (playlistId && data?.replayType == 'score' && scoreId) return `${BL_REPLAYS_URL}?playlist=${playlistId}&scoreId=${scoreId}`;
				if (replay) return `${BL_REPLAYS_URL}?${playlistId ? `playlist=${playlistId}&` : ''}link=${replay}`;
				return scoreId ? `${BL_REPLAYS_URL}?scoreId=${scoreId}` : null;
		}
	}

	function watch(url) {
		if (window.event?.ctrlKey || window.event?.metaKey || document.body.clientWidth < 800 || $configStore.preferences.linkOption == 'newtab') {
			window.open(url, '_blank');
		} else {
			open(Preview, {previewLink: url});
		}
	}

	function go(url) {
		if (url) navigate(url);
	}

	$: hydrate(playlist);
	$: replays = playlist?.replays ?? [];
	$: totalItems = replays.length;
	$: if (page > 0 && page * itemsPerPage >= totalItems) page = Math.max(0, Math.ceil(totalItems / itemsPerPage) - 1);
	$: updateList(replays, page, itemsPerPage);
	$: editable = canModify && playlistKey != null;
	$: webPlayer = $configStore?.preferences?.webPlayer;
</script>

{#if loading}
	<Spinner />
{:else}
	<div
		class="items-grid"
		class:empty-zone={!totalItems}
		use:dndzone={{
			items: list,
			flipDurationMs: 250,
			dragDisabled: editingId != null || isTouchLayout() || (!editable && !embedded),
			dropFromOthersDisabled: !editable,
			dropTargetStyle: {outline: '2px dashed var(--beatleader-primary)', 'border-radius': '8px'},
		}}
		on:consider={handleConsider}
		on:finalize={handleFinalize}>
		{#each list as entry, idx (entry.id)}
			{@const item = entry.item}
			{@const index = page * itemsPerPage + idx}
			{@const itemEditable = editable && item.itemId}
			{@const data = hydrated[replayKey(item.replayType, item.id)]}
			{@const url = pageUrl(data)}
			{@const watchLink = watchUrl(data, webPlayer, playlistAccessId(playlist))}
			<div class="item">
				<div class="replay-row" class:compact={embedded} class:editable={itemEditable} class:hidden-row={!data || data.hidden}>
					<span class="position">#{index + 1}</span>
					<PlaylistVoteCell itemId={item.itemId} />

					{#if itemEditable}
						<div class="move-actions">
							<button class="move" title="Move up" disabled={index === 0} on:click={() => move(item, index - 1)}>
								<i class="fas fa-chevron-up" />
							</button>
							<div class="buttons-container">
								<span>
									<Button iconFa="fas fa-trash-alt" title="Remove from the playlist" type="danger" noMargin={true} on:click={() => remove(item)} />
								</span>
							</div>
							<button class="move" title="Move down" disabled={index === totalItems - 1} on:click={() => move(item, index + 1)}>
								<i class="fas fa-chevron-down" />
							</button>
						</div>
					{/if}

					{#if data && !data.hidden}
						<a href={url} class="cover-link" on:click|preventDefault={() => go(url)} title="Open the score">
							<img class="cover" src={data.leaderboard?.coverImage ?? '/assets/song-default.png'} alt="" loading="lazy" />
						</a>
						<div class="info">
							<div class="player-line">
								{#if data.player?.avatar}<img class="avatar" src={data.player.avatar} alt="" loading="lazy" />{/if}
								{#if data.player}<PlayerNameWithFlag player={data.player} />{/if}
								{#if item.replayType === 'attempt'}
									<span class="attempt" title="Attempt: a play that isn't on the leaderboard">{END_TYPES[data.endType] ?? 'Attempt'}</span>
								{/if}
							</div>
							<div class="map-line">
								<a href={url} class="song-name" on:click|preventDefault={() => go(url)} title="Open the score">
									{data.leaderboard?.songName ?? 'Unknown map'}
								</a>
								{#if data.leaderboard}
									<Difficulty
										diff={{type: data.leaderboard.modeName, diff: data.leaderboard.difficultyName, stars: data.leaderboard.stars}}
										useShortName={true}
										reverseColors={true}
										hideTitle={true} />
								{/if}
							</div>
							{#if editingId === item.itemId}
								<div class="note-edit">
									<!-- svelte-ignore a11y_autofocus -->
									<textarea
										rows="2"
										maxlength="500"
										placeholder="What to watch for in this replay (optional)"
										bind:value={editingText}
										on:keydown={e => onNoteKeydown(e, item)}
										autofocus />
									<Button iconFa="fas fa-check" title="Save (Ctrl+Enter)" type="primary" noMargin={true} on:click={() => saveDescription(item)} />
									<Button iconFa="fas fa-xmark" title="Cancel (Esc)" noMargin={true} on:click={() => (editingId = null)} />
								</div>
							{:else if item.description}
								<span class="note">{item.description}</span>
							{/if}
						</div>

						{#if data.timepost && !embedded}
							<span class="timeset" style="color: {getTimeStringColor(data.timepost)}" title={dateFromUnix(data.timepost).toLocaleString()}>
								{formatDateRelative(dateFromUnix(data.timepost))}
							</span>
						{/if}

						<div class="row-actions buttons-container">
							<span>
								{#if itemEditable}
									<Button iconFa="fas fa-pen" title={item.description ? 'Edit the note' : 'Add a note'} noMargin={true} on:click={() => startEditing(item)} />
								{/if}
								{#if watchLink}
									<Button
										url={watchLink}
										on:click={() => watch(watchLink)}
										icon={playlistTypeIcon(true, '1.2em')}
										title="Watch the replay"
										noMargin={true} />
								{/if}
							</span>
						</div>

						<div class="performance">
							{#if data.pp > 0}
								<Badge onlyLabel={true} color="white" bgColor="var(--ppColour)" title="Performance points">
									<span slot="label"><Value value={data.pp} suffix="pp" inline={false} /></span>
								</Badge>
							{/if}
							<Accuracy score={{acc: data.accuracy * 100, mods: data.modifiers ? data.modifiers.split(',') : []}} secondary={null} />
						</div>
					{:else}
						<div class="cover placeholder"><i class={data ? 'fas fa-eye-slash' : 'fas fa-ellipsis'} /></div>
						<div class="info">
							<span class="song-name muted">{data ? 'This replay is private or was deleted' : 'Loading...'}</span>
							{#if item.description}
								<span class="note">{item.description}</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if !totalItems}
		<p class="empty">
			No replays yet.
			{#if editable}
				Drag replays here from your other playlists, or make this playlist active and use the <PlaylistTypeIcon replays={true} /> button on scores.
			{/if}
		</p>
	{:else if totalItems > itemsPerPageValues[0]}
		<Pager bind:currentPage={page} bind:itemsPerPage {totalItems} {itemsPerPageValues} dnd={true} on:page-changed={e => (page = e.detail.page)} />
	{/if}
{/if}

<style>
	.items-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		border-radius: 8px;
		min-height: 1em;
	}

	.items-grid.empty-zone {
		min-height: 3em;
	}

	.item:not(:last-child) {
		border-bottom: 1px solid var(--row-separator);
	}

	.empty {
		margin: 0.5em 0 1em;
		text-align: center;
		opacity: 0.7;
	}

	.replay-row {
		display: flex;
		align-items: center;
		gap: 0.7em;
		padding: 0.4em 0.3em;
		border-radius: 6px;
		transition: background-color 0.15s;
	}

	.replay-row:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 4%, transparent);
	}

	.hidden-row {
		opacity: 0.65;
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
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1em;
		min-width: 0;
	}

	.player-line,
	.map-line {
		display: flex;
		align-items: center;
		gap: 0.45em;
		min-width: 0;
	}

	.avatar {
		width: 1.4em;
		height: 1.4em;
		border-radius: 50%;
		flex: none;
	}

	.attempt {
		padding: 0 0.4em;
		border-radius: 0.3em;
		font-size: 0.75em;
		color: white;
		background-color: var(--dimmed);
	}

	.song-name {
		color: color-mix(in srgb, var(--textColor, white) 64%, transparent) !important;
		font-size: 0.9em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	a.song-name:hover {
		color: color-mix(in srgb, var(--textColor, white) 80%, transparent) !important;
		text-decoration: underline;
	}

	.muted {
		opacity: 0.8;
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

	.timeset {
		flex: none;
		white-space: nowrap;
	}

	.move-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		flex: none;
		opacity: 0.35;
		transition: opacity 0.15s;
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

	.row-actions {
		display: flex;
		align-items: center;
		gap: 3px;
		flex: none;
		min-width: calc(44px + 3px);
		justify-content: flex-end;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.replay-row:hover .move-actions,
	.move-actions:focus-within,
	.replay-row:hover .row-actions,
	.row-actions:focus-within {
		opacity: 1;
	}

	@media (hover: none) {
		.move-actions,
		.row-actions {
			opacity: 1;
		}
	}

	.performance {
		display: flex;
		gap: 0.3em;
		flex: none;
		min-width: 13em;
		justify-content: flex-end;
	}

	.performance :global(.badge) {
		margin: 0 !important;
		min-width: 6em;
	}

	.compact .performance {
		min-width: 0;
	}

	@media screen and (max-width: 768px) {
		.replay-row {
			flex-wrap: wrap;
			row-gap: 0.25em;
		}

		/* Line break: pp, acc and the date go to a second line */
		.replay-row::after {
			content: '';
			order: 4;
			flex-basis: 100%;
		}

		.position {
			min-width: 2em;
		}

		.performance {
			order: 5;
			min-width: 0;
			justify-content: flex-start;
			padding-left: 2.7em;
		}

		.editable .performance {
			padding-left: calc(2.7em + 22px + 0.7em);
		}

		.performance :global(.badge) {
			min-width: 0;
		}

		.timeset {
			order: 6;
			margin-left: auto;
			font-size: 0.85em;
		}
	}
</style>
