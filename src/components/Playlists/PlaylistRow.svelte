<script>
	import {getContext} from 'svelte';
	import {dndzone} from 'svelte-dnd-action';
	import {navigate} from 'svelte-routing';
	import {slide} from 'svelte/transition';
	import {cubicOut} from 'svelte/easing';
	import {getNotificationsContext} from 'svelte-notifications';
	import Button from '../Common/Button.svelte';
	import PlaylistSongs from './PlaylistSongs.svelte';
	import ReplayPlaylistItems from './ReplayPlaylistItems.svelte';
	import PlaylistCoverBadge from './PlaylistCoverBadge.svelte';
	import ActivePlaylistIcon from './ActivePlaylistIcon.svelte';
	import PlaylistInstallButton from './PlaylistInstallButton.svelte';
	import PlaylistEditDialog from './PlaylistEditDialog.svelte';
	import PlaylistDeleteConfirm from './PlaylistDeleteConfirm.svelte';
	import {canEditDetails, canEditPlaylist, isReplayPlaylist, playlistCover, playlistItemsLabel, playlistPageUrl, voteRunning} from '../../stores/playlists';
	import {timeLeft} from './votes';
	import {onlyItems} from './dnd';
	import {activePlaylistIcon} from './icons';

	export let playlist;
	export let store;
	export let active = false;
	export let expanded = false;
	export let currentPlayerId = null;

	const {addNotification} = getNotificationsContext();
	const modal = getContext('simple-modal');

	let dropItems = [];
	let hoverTimer = null;
	let dragOver = false;

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 4000 : 2000});
	}

	function notifyError(e) {
		notify(e?.message?.length && e.message.length < 200 ? e.message : 'Something went wrong, the playlist was reloaded', 'error');
	}

	function open() {
		navigate(url);
	}

	function toggleActive() {
		store.select(active ? null : playlist);
		if (!active) notify(replays ? 'Playlist buttons on scores now add replays here' : 'Playlist buttons on maps now add them here');
	}

	function openEdit() {
		modal.open(PlaylistEditDialog, {mode: 'edit', playlist, close: () => modal.close()});
	}

	function openDelete() {
		modal.open(PlaylistDeleteConfirm, {
			playlistName: playlist.playlistTitle,
			leave: !isOwner,
			pinCount: isOwner ? (playlist.pinCount ?? 0) : 0,
			confirm: () => {
				modal.close();
				store.deleteList(playlist.key).catch(notifyError);
			},
			cancel: () => modal.close(),
		});
	}

	function onHeaderClick(e) {
		if (e.target.closest('a, button, input')) return;
		expanded = !expanded;
	}

	function resetDropZone() {
		clearTimeout(hoverTimer);
		hoverTimer = null;
		dragOver = false;
		dropItems = [{id: `drop-${playlist.key}`, placeholder: true}];
	}

	function onDropConsider(e) {
		dropItems = e.detail.items;
		dragOver = onlyItems(e.detail.items).length > 0;
		if (dragOver && !expanded && !hoverTimer) {
			hoverTimer = setTimeout(() => {
				expanded = true;
				hoverTimer = null;
			}, 700);
		} else if (!dragOver) {
			clearTimeout(hoverTimer);
			hoverTimer = null;
		}
	}

	async function onDropFinalize(e) {
		const entry = onlyItems(e.detail.items)[0];
		resetDropZone();
		if (!entry || entry.from === playlist.key) return;

		try {
			if (await store.copyItem(playlist.key, entry.item)) {
				notify(`Added to ${playlist.playlistTitle}`);
			} else {
				const wrongKind = !!entry.item.replayType !== replays;
				notify(wrongKind ? (replays ? 'Only replays go here' : 'Only maps go here') : 'Already in this playlist', 'warning');
			}
		} catch (error) {
			notifyError(error);
		}
	}

	resetDropZone();

	$: url = playlistPageUrl(playlist);
	$: replays = isReplayPlaylist(playlist);
	$: editable = canEditPlaylist(playlist);
	$: canActivate = editable && !playlist.oneclick;
	$: isOwner = playlist.role === 'owner' || playlist.role === 'local';
	$: cover = playlistCover(playlist);
	$: showOwner = playlist.owner && playlist.owner.id != currentPlayerId;
	$: visibility = playlist.role === 'local' ? 'Local' : playlist.oneclick ? 'One-click' : playlist.isPublic ? 'Public' : playlist.linkGuid ? 'Unlisted' : 'Private';
	$: visibilityIcon = {Local: 'fas fa-hard-drive', 'One-click': 'fas fa-wand-magic-sparkles', Public: 'fas fa-globe', Unlisted: 'fas fa-link', Private: 'fas fa-lock'}[visibility];
</script>

<div class="playlist-card-wrapper map-card-wrapper" class:expanded class:active class:drag-over={dragOver}>
	<div class="playlist-card map-card">
		<div class="cinematics">
			<div class="cinematics-canvas">
				<div class="cinematics-image" style="background-image: url({cover})" />
			</div>
		</div>

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="card-header"
			title={expanded ? null : 'Click to unwrap'}
			on:click={onHeaderClick}
			use:dndzone={{items: dropItems, dragDisabled: true, dropFromOthersDisabled: !editable, morphDisabled: true, dropTargetStyle: {}}}
			on:consider={onDropConsider}
			on:finalize={onDropFinalize}>
			<div class="cover-wrap">
				<a class="card-cover" href={url} on:click|preventDefault={open} tabindex="-1" title="Open the playlist">
					<img src={cover} alt="" loading="lazy" />
					<PlaylistCoverBadge {replays} />
				</a>
				{#if canActivate}
					<div class="active-toggle" class:on={active}>
						<Button
							icon={activePlaylistIcon('1.5em')}
							title={active ? 'Active: playlist buttons on maps and scores add here. Click to stop' : 'Make active: playlist buttons on maps and scores add here'}
							square={true}
							squareSize="2.2em"
							bgColor={active ? '#ffd24d' : null}
							color={active ? '#222' : null}
							animated={!active}
							noMargin={true}
							on:click={toggleActive} />
					</div>
				{/if}
			</div>

			<div class="card-main">
				<h1 class="card-title-line">
					<a class="card-name" href={url} on:click|preventDefault={open}>{playlist.playlistTitle}</a>
				</h1>
				<span class="card-author">{playlist.playlistDescription || (replays ? 'Replay playlist' : 'Map playlist')}</span>
				{#if showOwner}
					<div class="card-owner">
						<span class="owner-pill" title="Owner">
							{#if playlist.owner.avatar}<img src={playlist.owner.avatar} alt="" loading="lazy" />{/if}
							{playlist.owner.name}
						</span>
					</div>
				{/if}
			</div>

			<div class="card-side">
				<div class="icons-container">
					<div class="buttons-container">
						<span>
							<PlaylistInstallButton {playlist} />
							<Button
								iconFa="fas fa-download"
								title="Download the {replays ? '.bsorlist' : '.bplist'} file"
								animated={true}
								noMargin={true}
								on:click={() => store.download(playlist)} />
							{#if canEditDetails(playlist) && !playlist.oneclick}
								<Button iconFa="fas fa-pen" title="Edit title, description and cover" animated={true} noMargin={true} on:click={openEdit} />
							{/if}
							{#if !playlist.oneclick}
								<Button
									iconFa={isOwner ? 'fas fa-trash-alt' : 'fas fa-right-from-bracket'}
									title={isOwner ? 'Delete the playlist' : 'Remove it from your playlists'}
									type="danger"
									animated={true}
									noMargin={true}
									on:click={openDelete} />
							{/if}
						</span>
					</div>
				</div>
			</div>
		</div>

		<div class="card-bottom bottom-container-background" class:expanded>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="card-band" title={expanded ? null : 'Click to unwrap'} on:click={onHeaderClick}>
				<div class="card-pills">
					<span class="info-pill" title={visibility}><i class={visibilityIcon} /> {visibility}</span>
					{#if playlist.role === 'editor'}
						<span class="info-pill shared" title="Shared with you, you can edit it"><i class="fas fa-user-pen" /> Can edit</span>
					{:else if playlist.role === 'viewer'}
						<span class="info-pill shared" title="Shared with you"><i class="fas fa-user-group" /> Shared</span>
					{/if}
					{#if voteRunning(playlist)}
						<span class="info-pill vote-pill" title="A vote runs on it, its items can't change until it ends">
							<i class="fas fa-square-poll-vertical" /> Vote{playlist.vote.endsAt ? ` · ${timeLeft(playlist.vote.endsAt)} left` : ''}
						</span>
					{/if}
					{#if playlist.source}
						<span class="info-pill follow-pill" title="Its maps are a search's results, run again when it syncs (at most hourly)"><i class="fas fa-satellite-dish" /> Follows a search</span>
					{/if}
					{#if active}
						<span class="info-pill active-pill" title="Playlist buttons on maps and scores add here"><ActivePlaylistIcon /> Active</span>
					{/if}
				</div>
				<span class="band-count">{playlistItemsLabel(playlist)}</span>
				<button class="expand-toggle" class:expanded title={expanded ? 'Wrap' : 'Unwrap to see and drag its items'} aria-label={expanded ? 'Wrap' : 'Unwrap'} on:click={() => (expanded = !expanded)}>
					<i class="fas fa-chevron-down" />
				</button>
			</div>

			{#if expanded}
				<div class="card-items" transition:slide={{duration: 300, easing: cubicOut}}>
					{#if replays}
						<ReplayPlaylistItems {playlist} playlistKey={playlist.key} {store} canModify={editable} embedded={true} on:error={e => notifyError(e.detail)} />
					{:else}
						<PlaylistSongs {playlist} playlistKey={playlist.key} {store} canModify={editable} embedded={true} on:error={e => notifyError(e.detail)} />
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.playlist-card-wrapper {
		position: relative;
		width: 100%;
		margin-bottom: 0.8em;
		border-radius: 12px;
		background-color: #000000;
		transition: box-shadow 0.2s;
	}

	.playlist-card-wrapper.active {
		box-shadow: 0 0 0 2px #ffd24d;
	}

	.playlist-card-wrapper.drag-over {
		box-shadow: 0 0 0 2px var(--beatleader-primary);
	}

	.playlist-card {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
	}

	.cinematics {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.cinematics-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		filter: blur(5em) opacity(0.5) saturate(250%);
		transform: scale(1.1) translateZ(0);
		pointer-events: none;
	}

	.cinematics-image {
		position: absolute;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
	}

	.card-header {
		position: relative;
		display: flex;
		align-items: stretch;
		gap: 0.8em;
		padding: 0.5em;
		cursor: pointer;
	}

	.cover-wrap {
		--cover-badge-size: 2.6em;
		position: relative;
		flex: none;
		align-self: flex-start;
		z-index: 2;
	}

	.card-cover {
		position: relative;
		display: block;
		width: 9em;
		aspect-ratio: 1;
		border-radius: 8px;
		overflow: hidden;
	}

	.active-toggle {
		position: absolute;
		left: 0.4em;
		bottom: 0.4em;
		display: flex;
	}

	.active-toggle :global(.button) {
		padding: 0;
		border-radius: 7px;
		box-shadow: 0 2px 6px #00000080;
	}

	.active-toggle.on :global(.button) {
		box-shadow:
			0 0 0 2px #0000004d,
			0 0 14px #ffd24d99;
	}

	.card-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		background: #222;
	}

	.card-main {
		flex: 1;
		align-self: flex-start;
		display: flex;
		flex-direction: column;
		gap: 0.2em;
		min-width: 0;
		max-height: 6.9em;
		overflow: hidden;
		z-index: 1;
	}

	.card-title-line {
		margin: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		text-transform: none;
		letter-spacing: normal;
		line-height: 1.3;
	}

	.card-name {
		color: color-mix(in srgb, var(--textColor, white) 80%, transparent) !important;
		font-size: 1.3em;
		font-weight: 600;
	}

	.card-name:hover {
		text-decoration: underline;
	}

	.card-author {
		color: color-mix(in srgb, var(--textColor, white) 64%, transparent);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-word;
	}

	.card-owner {
		display: flex;
		font-size: 0.85em;
	}

	/* Pulled up behind the lower part of the cover, which .cover-wrap keeps on top */
	.card-bottom {
		position: relative;
		z-index: 1;
		margin-top: -2.4em;
		border-radius: 0 0 12px 12px;
		background-color: #0000004f;
		transition: background-color 0.2s;
	}

	.card-bottom.expanded {
		background-color: #00000085;
	}

	.card-band {
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-height: 2.4em;
		padding: 0.3em 0.5em 0.3em 10em;
		cursor: pointer;
	}

	.card-pills {
		flex: 1;
		display: flex;
		gap: 0.3em;
		min-width: 0;
		overflow: hidden;
		font-size: 0.85em;
		mask-image: linear-gradient(90deg, white 0%, white 90%, transparent);
	}

	.band-count {
		flex: none;
		font-size: 0.9em;
		font-weight: 600;
		color: color-mix(in srgb, var(--textColor, white) 85%, transparent);
		white-space: nowrap;
	}

	.owner-pill,
	.info-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		padding: 0.3em 0.5em 0.3em 0.3em;
		border-radius: 0.6em;
		color: white;
		background-color: #20202073;
		white-space: nowrap;
	}

	.info-pill {
		padding-left: 0.5em;
		color: #ffffffb0;
	}

	.info-pill.shared,
	.info-pill.follow-pill {
		color: #9fd3ff;
	}

	.info-pill.active-pill {
		color: #ffd24d;
	}

	.info-pill.vote-pill {
		color: #c9b0ff;
	}

	.owner-pill img {
		width: 1.45em;
		aspect-ratio: 1;
		border-radius: 100%;
	}

	.card-side {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: calc(-22px - 0.5em);
		opacity: 0;
		z-index: 1;
		transition:
			margin-right 0.15s,
			opacity 0.15s;
	}

	.playlist-card-wrapper:hover .card-side,
	.card-side:focus-within {
		margin-right: 0;
		opacity: 1;
	}

	@media (hover: none) {
		.card-side {
			margin-right: 0;
			opacity: 1;
		}
	}

	.icons-container .buttons-container {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.expand-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		padding: 0;
		border: none;
		border-radius: 50%;
		color: color-mix(in srgb, var(--textColor, white) 63%, transparent);
		background: transparent;
		cursor: pointer;
		transition:
			transform 0.2s,
			color 0.15s;
	}

	.expand-toggle:hover {
		color: var(--textColor, white);
		background-color: color-mix(in srgb, var(--textColor, white) 10%, transparent);
	}

	.expand-toggle.expanded {
		transform: rotate(180deg);
	}

	/* Global styles make button icons 1.3em tall, this centers the glyph in them */
	.expand-toggle i {
		line-height: 1.3em;
	}

	.card-items {
		position: relative;
		padding: 0 0.6em 0.4em;
		cursor: default;
	}

	@media screen and (max-width: 767px) {
		.card-header {
			padding: 0.4em 0.4em 0.15em;
			gap: 0.5em;
		}

		.card-cover {
			width: 6.5em;
		}

		.cover-wrap {
			--cover-badge-size: 2em;
		}

		.active-toggle {
			left: 0.3em;
			bottom: 0.3em;
			font-size: 0.8em;
		}

		.card-side {
			margin-right: 0;
		}

		.icons-container {
			transform: scale(0.75);
			transform-origin: top right;
		}

		.card-main {
			max-height: 4.9em;
		}

		.card-owner {
			font-size: 0.75em;
		}

		.card-bottom {
			margin-top: -1.9em;
		}

		.card-band {
			min-height: 2em;
			padding: 0.2em 0.4em 0.2em 7.3em;
			gap: 0.4em;
		}

		.band-count {
			font-size: 0.8em;
		}

		.card-name {
			font-size: 1.1em;
		}

		.card-author {
			font-size: 0.9em;
			-webkit-line-clamp: 1;
			line-clamp: 1;
		}

		.card-pills {
			font-size: 0.7em;
		}
	}
</style>
