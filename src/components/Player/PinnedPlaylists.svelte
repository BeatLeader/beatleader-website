<script>
	import {navigate} from 'svelte-routing';
	import {getNotificationsContext} from 'svelte-notifications';
	import Button from '../Common/Button.svelte';
	import PlaylistCoverBadge from '../Playlists/PlaylistCoverBadge.svelte';
	import {playlistCover, playlistItemsLabel} from '../../stores/playlists';
	import {orderPinnedPlaylists, pinPlaylist, unpinPlaylist} from '../Playlists/pins';

	export let playerId;
	export let pins = [];
	export let editable = false;
	export let onChange = null;

	const {addNotification} = getNotificationsContext();

	let editingId = null;
	let editingText = '';
	let busy = false;

	function changed(list) {
		pins = list;
		onChange?.(list);
	}

	async function run(action) {
		busy = true;
		try {
			await action();
		} catch (e) {
			addNotification({text: e?.message?.length < 200 ? e.message : 'Something went wrong', position: 'top-right', type: 'error', removeAfter: 4000});
		}
		busy = false;
	}

	function move(index, delta) {
		const target = index + delta;
		if (busy || target < 0 || target >= pins.length) return;
		const list = [...pins];
		[list[index], list[target]] = [list[target], list[index]];
		changed(list);
		run(() => orderPinnedPlaylists(list.map(p => p.playlistId)));
	}

	function startEditing(pin) {
		editingId = pin.playlistId;
		editingText = pin.description ?? '';
	}

	function saveComment(pin) {
		const description = editingText.trim();
		run(async () => {
			await pinPlaylist(pin.playlistId, description);
			changed(pins.map(p => (p === pin ? {...p, description: description || null} : p)));
			editingId = null;
		});
	}

	function unpin(pin) {
		run(async () => {
			await unpinPlaylist(pin.playlistId);
			changed(pins.filter(p => p !== pin));
		});
	}

	function onKeydown(e, pin) {
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveComment(pin);
		if (e.key === 'Escape') editingId = null;
	}
</script>

<div class="pinned-playlists">
	{#each pins as pin, idx (pin.playlistId)}
		{@const playlist = pin.playlist}
		{@const href = `/playlist/${pin.playlistId}`}
		<div class="pinned-playlist" class:unavailable={!pin.available}>
			{#if editable && pins.length > 1}
				<span class="move">
					<button title="Move up" disabled={idx === 0 || busy} on:click={() => move(idx, -1)}><i class="fas fa-chevron-up" /></button>
					<button title="Move down" disabled={idx === pins.length - 1 || busy} on:click={() => move(idx, 1)}><i class="fas fa-chevron-down" /></button>
				</span>
			{/if}

			{#if pin.available && playlist}
				<a class="cover" {href} on:click|preventDefault={() => navigate(href)}>
					<img src={playlistCover({image: playlist.cover})} alt="" loading="lazy" />
					<PlaylistCoverBadge replays={playlist.type === 'replays'} />
				</a>
				<div class="info">
					<a class="pin-title" {href} on:click|preventDefault={() => navigate(href)}>{playlist.title}</a>
					<span class="meta">
						{playlistItemsLabel(playlist, playlist.itemCount)}
						{#if playlist.owner && playlist.owner.id !== playerId}
							{@const ownerUrl = `/u/${playlist.owner.alias ?? playlist.owner.id}`}
							· by
							<a href={ownerUrl} on:click|preventDefault={() => navigate(ownerUrl)}>{playlist.owner.name}</a>
						{/if}
					</span>
				</div>
			{:else}
				<div class="cover placeholder"><i class="fas fa-eye-slash" /></div>
				<div class="info">
					<span class="pin-title muted">This playlist isn't public right now</span>
					<span class="meta">Only you see this: it shows on your profile again if its owner publishes it.</span>
				</div>
			{/if}

			{#if editable}
				<span class="actions buttons-container">
					<span>
						<Button iconFa="fas fa-pen" title={pin.description ? 'Edit the comment' : 'Add a comment'} noMargin={true} on:click={() => startEditing(pin)} />
						<Button iconFa="fas fa-thumbtack" title="Unpin from your profile" type="danger" noMargin={true} on:click={() => unpin(pin)} />
					</span>
				</span>
			{/if}

			{#if editingId === pin.playlistId}
				<div class="comment-edit">
					<!-- svelte-ignore a11y_autofocus -->
					<textarea rows="2" maxlength="300" placeholder="What's it for, why you like it..." bind:value={editingText} on:keydown={e => onKeydown(e, pin)} autofocus />
					<Button iconFa="fas fa-check" title="Save (Ctrl+Enter)" type="primary" noMargin={true} loading={busy} on:click={() => saveComment(pin)} />
					<Button iconFa="fas fa-xmark" title="Cancel (Esc)" noMargin={true} on:click={() => (editingId = null)} />
				</div>
			{:else if pin.description}
				<p class="comment">{pin.description}</p>
			{/if}
		</div>
	{/each}
</div>

<style>
	.pinned-playlists {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
	}

	.pinned-playlist {
		display: grid;
		grid-template-columns: auto auto 1fr auto;
		grid-template-areas: 'move cover info actions' 'move cover comment comment';
		align-items: center;
		column-gap: 0.7em;
		padding: 0.5em;
		border-radius: 10px;
		background-color: color-mix(in srgb, var(--textColor, white) 3%, transparent);
	}

	.unavailable {
		opacity: 0.6;
	}

	.move {
		grid-area: move;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.move button {
		width: 22px;
		height: 14px;
		padding: 0;
		border: none;
		background: transparent;
		color: color-mix(in srgb, var(--textColor, white) 63%, transparent);
		font-size: 11px;
		cursor: pointer;
	}

	.move button:hover:not(:disabled) {
		color: var(--textColor, white);
	}

	.move button:disabled {
		visibility: hidden;
	}

	.cover {
		--cover-badge-size: 1.6em;
		grid-area: cover;
		position: relative;
		display: block;
		width: 4em;
		height: 4em;
		border-radius: 8px;
		overflow: hidden;
		align-self: start;
	}

	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--dimmed);
	}

	.info {
		grid-area: info;
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		min-width: 0;
	}

	.pin-title {
		color: color-mix(in srgb, var(--textColor, white) 87%, transparent) !important;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	a.pin-title:hover {
		text-decoration: underline;
	}

	.muted {
		color: color-mix(in srgb, var(--textColor, white) 64%, transparent) !important;
	}

	.meta {
		font-size: 0.85em;
		color: color-mix(in srgb, var(--textColor, white) 60%, transparent);
	}

	.meta a {
		color: inherit !important;
		text-decoration: underline;
	}

	.actions {
		grid-area: actions;
		display: flex;
		gap: 3px;
		align-self: start;
	}

	.comment,
	.comment-edit {
		grid-area: comment;
		margin: 0.3em 0 0;
	}

	.comment {
		font-size: 0.9em;
		font-style: italic;
		color: color-mix(in srgb, var(--textColor, white) 75%, transparent);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.comment-edit {
		display: flex;
		align-items: flex-start;
		gap: 0.3em;
	}

	.comment-edit textarea {
		flex: 1;
		padding: 0.3em 0.5em;
		border-radius: 0.3em;
		border: 1px solid var(--faded);
		background-color: var(--dimmed);
		color: inherit;
		font-family: inherit;
		resize: vertical;
	}
</style>
