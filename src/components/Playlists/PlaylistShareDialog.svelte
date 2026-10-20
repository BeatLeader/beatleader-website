<script>
	import {onMount} from 'svelte';
	import {getNotificationsContext} from 'svelte-notifications';
	import DialogContent from '../Common/DialogContent.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {debounce} from '../../utils/debounce';

	export let playlist;
	export let store;
	export let close;

	const {addNotification} = getNotificationsContext();

	let shares = null;
	let isPublic = !!playlist.isPublic;
	let query = '';
	let results = [];
	let searching = false;
	let newPlayerCanEdit = false;
	let linkGuid = playlist.linkGuid ?? null;
	let changingMode = false;
	let pendingMode = null;

	const MODES = [
		{id: 'private', icon: 'fas fa-lock', title: 'Private', text: 'Only you and the players below can open it.'},
		{id: 'link', icon: 'fas fa-link', title: 'Anyone with the link', text: "Opens without logging in, but isn't public: nobody can pin it."},
		{id: 'public', icon: 'fas fa-globe', title: 'Public', text: 'Anyone can open it and pin it to their profile.'},
	];

	$: mode = isPublic ? 'public' : linkGuid ? 'link' : 'private';
	$: pageLink = `${window.location.origin}/playlist/${mode === 'link' ? linkGuid : playlist.id}`;
	$: syncLink = playlist.customData?.syncURL;

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 4000 : 2000});
	}

	async function loadShares() {
		try {
			shares = await store.getShares(playlist.id);
		} catch (e) {
			shares = [];
			notify(e.message || 'Failed to load who has access', 'error');
		}
	}

	// Public keeps the link guid, so links already sent work again after switching back to link only
	async function setMode(target, confirmed = false) {
		if (changingMode || target === mode) return;
		if (mode === 'public' && playlist.pinCount > 0 && !confirmed) {
			pendingMode = target;
			return;
		}
		pendingMode = null;
		changingMode = true;
		try {
			if (target === 'public') {
				await store.setPublic(playlist.key, true);
				isPublic = true;
			} else {
				if (isPublic) {
					await store.setPublic(playlist.key, false);
					isPublic = false;
				}
				if (target === 'link' && !linkGuid) linkGuid = await store.setShareLink(playlist.key, true);
				if (target === 'private' && linkGuid) linkGuid = await store.setShareLink(playlist.key, false);
			}
		} catch (e) {
			notify(e.message || 'Failed to change who can open it', 'error');
		}
		changingMode = false;
	}

	async function replaceShareLink() {
		try {
			linkGuid = await store.setShareLink(playlist.key, true);
			notify('New link created, the old one stopped working');
		} catch (e) {
			notify(e.message || 'Failed to replace the link', 'error');
		}
	}

	async function copy(text) {
		try {
			await navigator.clipboard.writeText(text);
			notify('Copied!');
		} catch (e) {
			notify('Copy failed', 'error');
		}
	}

	async function resetSyncLink() {
		try {
			await store.resetLink(playlist.key);
			playlist = store.get().find(p => p.key === playlist.key) ?? playlist;
			notify('New link created, the old one stopped working');
		} catch (e) {
			notify(e.message || 'Failed to reset the link', 'error');
		}
	}

	const search = debounce(async value => {
		const term = value.trim();
		if (term.length < 2) {
			results = [];
			searching = false;
			return;
		}
		let found = [];
		try {
			const response = await fetch(`${BL_API_URL}players?search=${encodeURIComponent(term)}&count=6`).then(r => r.json());
			const taken = new Set([playlist.owner?.id, ...(shares ?? []).map(s => s.player.id)]);
			found = (response?.data ?? []).filter(p => !taken.has(p.id));
		} catch (e) {}
		if (query.trim() !== term) return;
		results = found;
		searching = false;
	}, 300);

	function onQueryInput() {
		searching = true;
		search(query);
	}

	async function addPlayer(player) {
		try {
			await store.setShare(playlist.id, player.id, newPlayerCanEdit);
			results = results.filter(p => p.id !== player.id);
			await loadShares();
			notify(`Shared with ${player.name}`);
		} catch (e) {
			notify(e.message || 'Failed to share', 'error');
		}
	}

	async function setCanEdit(share, canEdit) {
		try {
			await store.setShare(playlist.id, share.player.id, canEdit);
			share.canEdit = canEdit;
			shares = shares;
		} catch (e) {
			notify(e.message || 'Failed to change access', 'error');
			await loadShares();
		}
	}

	async function removePlayer(share) {
		try {
			await store.removeShare(playlist.id, share.player.id);
			shares = shares.filter(s => s !== share);
		} catch (e) {
			notify(e.message || 'Failed to remove access', 'error');
		}
	}

	onMount(loadShares);
</script>

<div class="dialog-container">
	<DialogContent type="alert" title={`Share "${playlist.playlistTitle}"`} okButton="Done" okButtonType="primary" on:confirm={close}>
		<div slot="content" class="share-content">
			<section>
				<div class="section-label">Who can open it</div>
				<div class="modes" role="radiogroup">
					{#each MODES as option (option.id)}
						<button
							class="visibility mode-{option.id}"
							class:on={mode === option.id}
							role="radio"
							aria-checked={mode === option.id}
							disabled={changingMode}
							on:click={() => setMode(option.id)}>
							<span class="visibility-icon"><i class={option.icon} /></span>
							<span class="visibility-text">
								<b>{option.title}</b>
								<small>{option.text}</small>
							</span>
							<span class="check" aria-hidden="true"><i class="fas fa-check" /></span>
						</button>
					{/each}
				</div>
			</section>
			{#if pendingMode}
				<div class="pin-warning">
					<p>
						<i class="fas fa-thumbtack" />
						{playlist.pinCount === 1 ? '1 player has' : `${playlist.pinCount} players have`} it pinned to their profile. While it isn't public
						it's hidden there, and it comes back if you make it public again.
					</p>
					<div class="pin-warning-actions">
						<button class="make-private" on:click={() => setMode(pendingMode, true)}>
							{pendingMode === 'link' ? 'Switch to link only' : 'Make private'}
						</button>
						<button on:click={() => (pendingMode = null)}>Keep public</button>
					</div>
				</div>
			{/if}

			<section>
				<div class="section-label">Links</div>
				<div class="link-row">
					<span class="link-label">Page</span>
					<input class="field" readonly value={pageLink} on:focus={e => e.target.select()} />
					<button class="small-btn" title="Copy page link" on:click={() => copy(pageLink)}><i class="fas fa-copy" /></button>
					{#if mode === 'link'}
						<button class="small-btn warn" title="Replace the link: the old one stops working" on:click={replaceShareLink}><i class="fas fa-rotate" /></button>
					{/if}
				</div>
				{#if mode === 'private'}
					<small class="hint">Opens for you and the players below. Pick "Anyone with the link" to share it without adding players.</small>
				{:else if mode === 'link'}
					<small class="hint">Anyone you send this link to can open the page, watch it in the web player and download it.</small>
				{/if}
				{#if syncLink}
					<div class="link-row">
						<span class="link-label">Sync</span>
						<input class="field" readonly value={syncLink} on:focus={e => e.target.select()} />
						<button class="small-btn" title="Copy sync link" on:click={() => copy(syncLink)}><i class="fas fa-copy" /></button>
						<button class="small-btn warn" title="Reset the sync link" on:click={resetSyncLink}><i class="fas fa-rotate" /></button>
					</div>
					<small class="hint">
						The sync link opens the playlist without logging in and is embedded in downloaded files, so anyone who has it keeps read access even
						after you remove them below. Reset it to cut those copies off.
					</small>
				{/if}
			</section>

			<section>
				<div class="section-label">Players with access {#if shares?.length}<span class="count">{shares.length}</span>{/if}</div>
				{#if shares === null}
					<Spinner />
				{:else if !shares.length}
					<small class="hint">Nobody yet. Players you add see this playlist in their own list.</small>
				{:else}
					{#each shares as share (share.player.id)}
						<div class="player-row">
							<img class="avatar" src={share.player.avatar} alt="" loading="lazy" />
							<span class="player-name"><PlayerNameWithFlag player={share.player} /></span>
							<button
								class="role-chip"
								class:edit={share.canEdit}
								title="Editors can add, remove and reorder items, and change the title, description and cover. Click to switch."
								on:click={() => setCanEdit(share, !share.canEdit)}>
								<i class={share.canEdit ? 'fas fa-user-pen' : 'fas fa-eye'} />
								{share.canEdit ? 'Can edit' : 'Can view'}
							</button>
							<button class="small-btn danger" title="Remove access" on:click={() => removePlayer(share)}><i class="fas fa-xmark" /></button>
						</div>
					{/each}
				{/if}
			</section>

			<section>
				<div class="section-label">Add player</div>
				<div class="add-row">
					<label class="search-field">
						<i class="fas fa-search" />
						<input type="text" placeholder="Player name or profile ID" bind:value={query} on:input={onQueryInput} />
					</label>
					<button
						class="role-chip"
						class:edit={newPlayerCanEdit}
						title="Access new players get, click to switch"
						on:click={() => (newPlayerCanEdit = !newPlayerCanEdit)}>
						<i class={newPlayerCanEdit ? 'fas fa-user-pen' : 'fas fa-eye'} />
						{newPlayerCanEdit ? 'Can edit' : 'Can view'}
					</button>
				</div>
				{#if searching}
					<Spinner />
				{:else}
					{#each results as player (player.id)}
						<button class="player-row result" title="Share with {player.name}" on:click={() => addPlayer(player)}>
							<img class="avatar" src={player.avatar} alt="" loading="lazy" />
							<span class="player-name">{player.name}</span>
							<i class="fas fa-plus" />
						</button>
					{/each}
				{/if}
			</section>
		</div>
	</DialogContent>
</div>

<style>
	.pin-warning {
		margin-top: 0.6em;
		padding: 0.6em 0.8em;
		border-radius: 0.5em;
		color: #ffd24d;
		background-color: #ffd24d14;
	}

	.pin-warning p {
		margin: 0 0 0.5em;
	}

	.pin-warning-actions {
		display: flex;
		gap: 0.8em;
	}

	.pin-warning-actions button {
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		font-family: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.pin-warning-actions .make-private {
		color: #ff6b6b;
	}

	.dialog-container {
		margin: 1em;
		width: min(34em, 85vw);
	}

	/* Short enough that the modal around it (100vh - 4rem) never scrolls too */
	.share-content {
		display: flex;
		flex-direction: column;
		gap: 1.1em;
		max-height: min(36em, calc(100vh - 4rem - 11em));
		overflow-y: auto;
	}

	/* Centers icons in the 1.3em box Button.svelte gives them globally */
	button i {
		line-height: 1.3em;
		text-align: center;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 0.45em;
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: 0.4em;
		font-size: 0.75em;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.6;
	}

	.count {
		padding: 0 0.45em;
		border-radius: 1em;
		background-color: var(--dimmed);
	}

	.modes {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
	}

	.visibility {
		--mode-color: 150, 150, 150;
		display: flex;
		align-items: center;
		gap: 0.8em;
		width: 100%;
		padding: 0.55em 0.9em;
		border-radius: 0.6em;
		border: 1px solid var(--dimmed);
		background-color: color-mix(in srgb, var(--textColor, white) 3%, transparent);
		color: inherit;
		font-family: inherit;
		font-size: inherit;
		text-align: left;
		cursor: pointer;
	}

	.visibility:hover:not(.on) {
		background-color: color-mix(in srgb, var(--textColor, white) 7%, transparent);
	}

	.visibility:disabled {
		cursor: progress;
	}

	.mode-link {
		--mode-color: 63, 167, 255;
	}

	.mode-public {
		--mode-color: 66, 177, 41;
	}

	.visibility.on {
		border-color: rgba(var(--mode-color), 0.6);
		background-color: rgba(var(--mode-color), 0.08);
	}

	.check {
		visibility: hidden;
		color: rgb(var(--mode-color));
	}

	.visibility.on .check {
		visibility: visible;
	}

	.visibility-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.2em;
		height: 2.2em;
		border-radius: 50%;
		background-color: var(--dimmed);
	}

	.visibility.on .visibility-icon {
		background-color: rgba(var(--mode-color), 0.5);
	}

	.visibility-text {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.visibility-text small,
	.hint {
		font-size: 0.8em;
		opacity: 0.65;
	}

	.link-row,
	.add-row,
	.player-row {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.link-label {
		width: 2.8em;
		font-size: 0.85em;
		opacity: 0.7;
	}

	.field,
	.search-field {
		flex: 1;
		min-width: 0;
		height: 2.1em;
		padding: 0 0.6em;
		border-radius: 0.45em;
		border: 1px solid var(--dimmed);
		background-color: rgba(0, 0, 0, 0.25);
		color: inherit;
		font-size: 0.9em;
	}

	.search-field {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.search-field i {
		opacity: 0.5;
	}

	.search-field input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		color: inherit;
	}

	.small-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 2.1em;
		height: 2.1em;
		border: none;
		border-radius: 0.45em;
		background-color: color-mix(in srgb, var(--textColor, white) 8%, transparent);
		color: inherit;
		cursor: pointer;
	}

	.small-btn:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 16%, transparent);
	}

	.small-btn.warn:hover {
		background-color: rgba(255, 170, 0, 0.45);
	}

	.small-btn.danger:hover {
		background-color: rgba(233, 78, 54, 0.55);
	}

	.avatar {
		width: 1.8em;
		height: 1.8em;
		border-radius: 50%;
		flex: none;
	}

	.player-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.role-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		flex: none;
		height: 1.9em;
		padding: 0 0.7em;
		border-radius: 1em;
		border: 1px solid var(--dimmed);
		background: transparent;
		color: inherit;
		font-size: 0.8em;
		cursor: pointer;
	}

	.role-chip.edit {
		border-color: rgba(63, 167, 255, 0.6);
		background-color: rgba(63, 167, 255, 0.15);
	}

	.result {
		width: 100%;
		padding: 0.3em 0.5em;
		border: none;
		border-radius: 0.45em;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.result:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 7%, transparent);
	}

	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
	}
</style>
