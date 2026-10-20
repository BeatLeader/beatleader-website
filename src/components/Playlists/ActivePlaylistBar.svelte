<script>
	import {onMount} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fly} from 'svelte/transition';
	import PlaylistEditDialog from './PlaylistEditDialog.svelte';
	import PlaylistTypeIcon from './PlaylistTypeIcon.svelte';
	import createPlaylistStore, {
		activePlaylistOf,
		canEditPlaylist,
		isReplayPlaylist,
		playlistCover,
		playlistItemCount,
		playlistItemsLabel,
	} from '../../stores/playlists';
	import {configStore} from '../../stores/config';

	export let openModal = null;
	export let closeModal = null;

	const playlists = createPlaylistStore();

	let barEl;
	let navHeight = 44;
	let menuOpen = false;
	let menuTab = 'maps';
	let bump = false;
	let lastCount = null;
	let lastKey = null;

	function select(playlist) {
		playlists.select(playlist);
		menuOpen = false;
	}

	function toggleMenu() {
		if (!menuOpen) menuTab = replays ? 'replays' : 'maps';
		menuOpen = !menuOpen;
	}

	function setMode(option) {
		configStore.setForKey('preferences', {...($configStore?.preferences ?? {}), playlistOption: option});
	}

	function createNew(type) {
		menuOpen = false;
		openModal?.(PlaylistEditDialog, {mode: 'create', presetType: type, makeActive: true, close: () => closeModal?.()});
	}

	function animateCount(active, count) {
		if (active?.key === lastKey && lastCount !== null && count !== lastCount) {
			bump = true;
			setTimeout(() => (bump = false), 300);
		}
		lastKey = active?.key;
		lastCount = count;
	}

	function onWindowClick(e) {
		if (menuOpen && barEl && !barEl.contains(e.target)) menuOpen = false;
	}

	function onKeydown(e) {
		if (e.key === 'Escape') menuOpen = false;
	}

	onMount(() => {
		const nav = document.querySelector('nav');
		if (!nav) return;
		navHeight = nav.offsetHeight;
		const observer = new ResizeObserver(() => (navHeight = nav.offsetHeight));
		observer.observe(nav);
		return () => observer.disconnect();
	});

	$: active = activePlaylistOf($playlists, $configStore);
	$: replays = isReplayPlaylist(active);
	$: url = active && `/playlist/${active.key}`;
	$: count = playlistItemCount(active);
	$: animateCount(active, count);
	$: editable = ($playlists ?? []).filter(p => canEditPlaylist(p) && !p.oneclick);
	$: mapPlaylists = editable.filter(p => !isReplayPlaylist(p));
	$: replayPlaylists = editable.filter(isReplayPlaylist);
	$: menuList = menuTab === 'replays' ? replayPlaylists : mapPlaylists;
	$: pickerMode = $configStore?.preferences?.playlistOption === 'picker';
</script>

<svelte:window on:click={onWindowClick} on:keydown={onKeydown} />

{#if active}
	<div class="active-bar" class:replays style="top: {navHeight}px" bind:this={barEl} transition:fly={{y: -20, duration: 200}}>
		<a class="bar-identity" href={url} on:click|preventDefault={() => navigate(url)} title="Open the playlist">
			<img class="bar-cover" src={playlistCover(active)} alt="" />
			<span class="bar-kicker">
				<span class="bar-kicker-text">{pickerMode ? 'Active' : 'Adding to'}</span>
			</span>
			<span class="bar-title">{active.playlistTitle}</span>
			<span class="bar-type" title={replays ? 'Replay playlist' : 'Map playlist'}><PlaylistTypeIcon {replays} /></span>
		</a>
		<span class="bar-count" class:bump>{playlistItemsLabel(active, count)}</span>
		<span class="bar-hint">
			{#if pickerMode}
				Playlist buttons open the playlist picker
			{:else}
				{replays ? 'Playlist buttons on scores add replays here' : 'Playlist buttons on maps add them here'}
			{/if}
		</span>

		<div class="bar-actions">
			<div class="mode-toggle" role="radiogroup" aria-label="What playlist buttons do">
				<button
					role="radio"
					aria-checked={!pickerMode}
					class:on={!pickerMode}
					title="Playlist buttons add straight to this playlist (Shift+click opens the picker)"
					on:click={() => setMode('selected')}>
					<i class="fas fa-bolt" /><span class="bar-label">Add here</span>
				</button>
				<button role="radio" aria-checked={pickerMode} class:on={pickerMode} title="Playlist buttons open the playlist picker" on:click={() => setMode('picker')}>
					<i class="far fa-window-restore" /><span class="bar-label">Pop up</span>
				</button>
			</div>
			<button class="bar-button" class:open={menuOpen} title="Switch the active playlist" on:click={toggleMenu}>
				<i class="fas fa-right-left" /><span class="bar-label">Switch</span><i class="fas fa-chevron-down chevron" />
			</button>
			<button class="bar-button close" title="Stop adding to this playlist" on:click={() => playlists.select(null)}>
				<i class="fas fa-xmark" />
			</button>
		</div>

		{#if menuOpen}
			<div class="bar-menu" transition:fly={{y: -8, duration: 120}}>
				<div class="bar-menu-tabs" role="tablist">
					<button role="tab" class:selected={menuTab === 'maps'} on:click={() => (menuTab = 'maps')}>
						<PlaylistTypeIcon /> Maps <small>{mapPlaylists.length}</small>
					</button>
					<button role="tab" class:selected={menuTab === 'replays'} on:click={() => (menuTab = 'replays')}>
						<PlaylistTypeIcon replays={true} /> Replays <small>{replayPlaylists.length}</small>
					</button>
				</div>
				<div class="bar-menu-list">
					{#each menuList as playlist (playlist.key)}
						<button class="bar-menu-item" class:current={playlist.key === active.key} on:click={() => select(playlist)}>
							<img src={playlistCover(playlist)} alt="" loading="lazy" />
							<span class="bar-menu-title">{playlist.playlistTitle}</span>
							<small>{playlistItemCount(playlist)}</small>
						</button>
					{:else}
						<p class="bar-menu-empty">No {menuTab === 'replays' ? 'replay' : 'map'} playlists you can add to yet.</p>
					{/each}
				</div>
				<div class="bar-menu-footer">
					<button class="bar-menu-link" on:click={() => createNew(menuTab)}>
						<i class="fas fa-plus" /> New playlist
					</button>
					<button
						class="bar-menu-link"
						on:click={() => {
							menuOpen = false;
							navigate('/playlists');
						}}>
						<i class="fas fa-table-cells-large" /> All playlists
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.active-bar {
		position: sticky;
		z-index: 49;
		display: flex;
		align-items: center;
		gap: 0.8em;
		height: 2.6rem;
		padding: 0 0.8em 0 0;
		background-color: var(--foreground);
		border-bottom: 1px solid var(--dimmed);
		box-shadow: 0 6px 10px rgba(0, 0, 0, 0.2);
		border-left: 4px solid var(--beatleader-primary);
	}

	.active-bar.replays {
		border-left-color: #3fa7ff;
	}

	.bar-identity {
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
		height: 100%;
		padding-left: 0.6em;
		color: inherit !important;
	}

	.bar-cover {
		width: 1.8rem;
		height: 1.8rem;
		border-radius: 0.3em;
		object-fit: cover;
		flex: none;
	}

	.bar-kicker {
		display: inline-flex;
		align-items: center;
		font-size: 0.75em;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.65;
		white-space: nowrap;
	}

	.bar-title {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bar-type {
		display: inline-flex;
		flex: none;
		opacity: 0.65;
	}

	.bar-identity:hover .bar-title {
		text-decoration: underline;
	}

	.bar-count {
		flex: none;
		padding: 0.1em 0.55em;
		border-radius: 1em;
		font-size: 0.8em;
		background-color: var(--dimmed);
		transition: transform 0.3s cubic-bezier(0.38, 0.19, 0, 0.81);
	}

	.bar-count.bump {
		transform: scale(1.25);
	}

	.bar-hint {
		font-size: 0.75em;
		opacity: 0.5;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.bar-actions {
		display: flex;
		align-items: center;
		gap: 0.3em;
		margin-left: auto;
		flex: none;
	}

	.bar-button {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		height: 1.9rem;
		padding: 0 0.7em;
		border: 1px solid var(--dimmed);
		border-radius: 0.4em;
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-size: 0.85em;
	}

	.bar-button:hover,
	.bar-button.open {
		background-color: var(--dimmed);
	}

	.chevron {
		font-size: 0.75em;
		opacity: 0.7;
	}

	.bar-button.close {
		border-color: transparent;
	}

	.mode-toggle {
		display: inline-flex;
		height: 1.9rem;
		padding: 2px;
		border: 1px solid var(--dimmed);
		border-radius: 0.4em;
	}

	.mode-toggle button {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0 0.6em;
		border: none;
		border-radius: 0.3em;
		background: transparent;
		color: inherit;
		font-size: 0.8em;
		opacity: 0.6;
		cursor: pointer;
	}

	.mode-toggle button:hover {
		opacity: 0.9;
	}

	.mode-toggle button.on {
		background-color: var(--dimmed);
		opacity: 1;
	}

	.bar-menu {
		position: absolute;
		top: calc(100% + 0.3em);
		right: 0.8em;
		width: min(22em, calc(100vw - 1.6em));
		display: flex;
		flex-direction: column;
		max-height: min(26em, 70vh);
		padding: 0.4em;
		border-radius: 0.6em;
		border: 1px solid var(--dimmed);
		background-color: var(--foreground);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
	}

	.bar-menu-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.3em;
		flex: none;
		margin-bottom: 0.3em;
		padding: 0.25em;
		border-radius: 0.5em;
		background-color: rgba(0, 0, 0, 0.3);
	}

	.bar-menu-tabs button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4em;
		padding: 0.4em;
		border: none;
		border-radius: 0.4em;
		background: transparent;
		color: inherit;
		font-size: 0.85em;
		opacity: 0.7;
		cursor: pointer;
	}

	.bar-menu-tabs button.selected {
		background-color: var(--dimmed);
		opacity: 1;
	}

	.bar-menu-tabs small {
		opacity: 0.6;
	}

	.bar-menu-list {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.bar-menu-empty {
		margin: 0.6em;
		font-size: 0.85em;
		opacity: 0.6;
	}

	.bar-menu-item {
		display: flex;
		align-items: center;
		gap: 0.6em;
		width: 100%;
		padding: 0.35em 0.6em;
		border: none;
		border-radius: 0.4em;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.bar-menu-item:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 6%, transparent);
	}

	.bar-menu-item.current {
		background-color: rgba(235, 0, 140, 0.15);
	}

	.bar-menu-item img {
		width: 1.8em;
		height: 1.8em;
		border-radius: 0.3em;
		object-fit: cover;
	}

	.bar-menu-title {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bar-menu-item small {
		opacity: 0.55;
	}

	.bar-menu-footer {
		flex: none;
		display: flex;
		gap: 0.3em;
		margin-top: 0.3em;
		padding-top: 0.4em;
		border-top: 1px solid var(--dimmed);
	}

	.bar-menu-link {
		flex: 1;
		padding: 0.45em;
		border: none;
		border-radius: 0.4em;
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-size: 0.85em;
	}

	.bar-menu-link:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 6%, transparent);
	}

	@media screen and (max-width: 767px) {
		.bar-hint,
		.bar-kicker-text,
		.bar-label {
			display: none;
		}
	}
</style>
