<script>
	import {createEventDispatcher} from 'svelte';
	import {dndzone} from 'svelte-dnd-action';
	import {produce} from 'immer';
	import {getNotificationsContext} from 'svelte-notifications';
	import Pager from '../Common/Pager.svelte';
	import Song from './Song.svelte';
	import PlaylistTypeIcon from './PlaylistTypeIcon.svelte';
	import {configStore} from '../../stores/config';
	import {droppedElsewhere, isTouchLayout, onlyItems, toDndEntries} from './dnd';

	export let playlist;
	export let playlistKey = null;
	export let store;
	export let canModify = false;
	export let embedded = false;
	export let submissions = null;

	const dispatch = createEventDispatcher();
	const {addNotification} = getNotificationsContext();

	const itemsPerPageValues = embedded ? [5, 10, 25] : [5, 10, 25, 50];
	let page = 0;
	let itemsPerPage = embedded ? 5 : ($configStore?.playlist?.itemsPerPage ?? 10);
	let savedItemsPerPage = $configStore?.playlist?.itemsPerPage;
	let list = [];
	let editingId = null;

	function storeItemsPerPage(value) {
		savedItemsPerPage = value;
		$configStore = produce($configStore, draft => {
			draft.playlist.itemsPerPage = value;
		});
	}

	function updateList(songs, page, itemsPerPage) {
		list = toDndEntries(playlistKey ?? `view-${playlist?.id}`, songs.slice(page * itemsPerPage, (page + 1) * itemsPerPage));
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
				const fromIndex = songs.indexOf(entry.item);
				const fromEarlierPage = fromIndex > -1 && fromIndex < pageStart;
				await store.reorder(playlistKey, entry.item.itemId ?? entry.item.hash, pageStart + index - (fromEarlierPage ? 1 : 0));
			} else if (!(await store.copyItem(playlistKey, entry.item, pageStart + index))) {
				addNotification({text: entry.item.replayType ? 'Only maps go here' : 'Already in this playlist', position: 'top-right', type: 'warning', removeAfter: 2000});
			}
		} catch (error) {
			dispatch('error', error);
		} finally {
			updateList(songs, page, itemsPerPage);
		}
	}

	function move(entry, delta) {
		const index = songs.indexOf(entry.item);
		const toIndex = index + delta;
		if (index < 0 || toIndex < 0 || toIndex >= songs.length) return;
		store.reorder(playlistKey, entry.item.itemId ?? entry.item.hash, toIndex).catch(e => dispatch('error', e));
	}

	function onEditing(entry, editing) {
		if (editing) editingId = entry.id;
		else if (editingId === entry.id) editingId = null;
	}

	$: songs = playlist?.songs ?? [];
	$: totalItems = songs.length;
	$: if (page > 0 && page * itemsPerPage >= totalItems) page = Math.max(0, Math.ceil(totalItems / itemsPerPage) - 1);
	$: updateList(songs, page, itemsPerPage);
	$: if (!embedded && itemsPerPage != savedItemsPerPage) storeItemsPerPage(itemsPerPage);
	$: editable = canModify && playlistKey != null;
</script>

<div
	class="items-grid"
	class:empty-zone={!totalItems}
	use:dndzone={{
		items: list,
		flipDurationMs: 250,
		centreDraggedOnCursor: true,
		dragDisabled: editingId != null || isTouchLayout() || (!editable && !embedded),
		dropFromOthersDisabled: !editable,
		dropTargetStyle: {outline: '2px dashed var(--beatleader-primary)', 'border-radius': '8px'},
	}}
	on:consider={handleConsider}
	on:finalize={handleFinalize}>
	{#each list as entry, idx (entry.id)}
		{@const index = page * itemsPerPage + idx}
		<div class="item">
			<Song
				song={entry.item}
				position={submissions ? submissions[index] : index + 1}
				canModify={editable}
				first={index === 0}
				last={index === totalItems - 1}
				compact={embedded}
				{store}
				{playlistKey}
				on:move-up={() => move(entry, -1)}
				on:move-down={() => move(entry, 1)}
				on:editing={e => onEditing(entry, e.detail)}
				on:error />
		</div>
	{/each}
</div>

{#if !totalItems}
	<p class="empty">
		No maps yet.
		{#if editable}
			Drag maps here from your other playlists, or make this playlist active and use the <PlaylistTypeIcon /> button on maps and scores.
		{/if}
	</p>
{:else if totalItems > itemsPerPageValues[0]}
	<Pager bind:currentPage={page} bind:itemsPerPage {totalItems} {itemsPerPageValues} dnd={true} on:page-changed={e => (page = e.detail.page)} />
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
</style>
