<script>
	import {getNotificationsContext} from 'svelte-notifications';
	import DialogContent from '../Common/DialogContent.svelte';
	import PlaylistTypeIcon from './PlaylistTypeIcon.svelte';
	import createPlaylistStore, {playlistCover} from '../../stores/playlists';
	import createAccountStore from '../../stores/beatleader/account';

	export let mode = 'create';
	export let playlist = null;
	export let presetType = 'maps';
	export let item = null;
	export let makeActive = true;
	export let onDone = () => {};
	export let close = () => {};

	const playlists = createPlaylistStore();
	const account = createAccountStore();
	const {addNotification} = getNotificationsContext();

	const MAX_COVER_BYTES = 5 * 1024 * 1024;

	let type = mode === 'edit' ? playlist?.type ?? 'maps' : presetType;
	let title = mode === 'edit' ? playlist?.playlistTitle ?? '' : '';
	let description = mode === 'edit' ? playlist?.playlistDescription ?? '' : '';
	let isPublic = false;
	let coverFile = null;
	let coverPreview = mode === 'edit' ? playlistCover(playlist) : null;
	let saving = false;
	let fileInput;

	const types = [
		{value: 'maps', title: 'Map playlist', description: 'Maps and difficulties. Installs to the game with PlaylistManager.'},
		{value: 'replays', title: 'Replay playlist', description: 'Scores and attempts to watch, each with an optional note.'},
	];

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 4000 : 2500});
	}

	function pickCover(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > MAX_COVER_BYTES) {
			notify('Cover can be up to 5MB', 'error');
			return;
		}
		coverFile = file;
		const reader = new FileReader();
		reader.onload = e => (coverPreview = e.target.result);
		reader.readAsDataURL(file);
	}

	async function submit() {
		if (!canSubmit) return;
		saving = true;

		try {
			if (mode === 'create') {
				const created = await playlists.createPlaylist({
					type,
					title,
					description,
					image: coverFile ? coverPreview : null,
					isPublic: loggedIn && isPublic,
					songs: type === 'maps' && item ? [item] : [],
					replays: type === 'replays' && item ? [item] : [],
				});
				if (created?.skipped) {
					notify("The replay couldn't be added: it's private or was deleted", 'warning');
				}
				if (created && makeActive) {
					await playlists.select(created);
				}
				notify(`Created ${created?.playlistTitle ?? 'playlist'}`);
				close();
				onDone(created);
			} else {
				if (title.trim() !== playlist.playlistTitle || description.trim() !== (playlist.playlistDescription ?? '')) {
					await playlists.updateDetails(playlist.key, {title: title.trim(), description: description.trim()});
				}
				if (coverFile) {
					await playlists.updateIcon(playlist.key, coverFile);
				}
				close();
				onDone(playlist);
			}
		} catch (e) {
			notify(e?.message?.length < 200 ? e.message : 'Failed to save the playlist', 'error');
		}
		saving = false;
	}

	$: loggedIn = !!$account?.id;
	$: if (!loggedIn && type === 'replays' && mode === 'create') type = 'maps';
	$: canSubmit = !saving && title.trim().length > 0;
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title={mode === 'create' ? 'New playlist' : 'Edit playlist'}
		okButton={mode === 'create' ? 'Create' : 'Save'}
		okButtonDisabled={!canSubmit}
		on:confirm={submit}
		on:cancel={close}>
		<form slot="content" class="edit-content" on:submit|preventDefault={submit}>
			{#if mode === 'create' && !item}
				<div class="types">
					{#each types as option}
						{@const disabled = option.value === 'replays' && !loggedIn}
						<button
							type="button"
							class="type-card"
							class:selected={type === option.value}
							{disabled}
							title={disabled ? 'Log in to make replay playlists' : option.title}
							on:click={() => (type = option.value)}>
							<span class="type-icon"><PlaylistTypeIcon replays={option.value === 'replays'} size="1.6em" /></span>
							<span class="type-title">{option.title}</span>
							<span class="type-description">{disabled ? 'Log in to make replay playlists.' : option.description}</span>
						</button>
					{/each}
				</div>
			{:else if mode === 'create'}
				<p class="starts-with">
					<PlaylistTypeIcon replays={type === 'replays'} />
					New {type === 'replays' ? 'replay' : 'map'} playlist, starting with this {item.replayType ? 'replay' : 'map'}.
				</p>
			{/if}

			<div class="main-fields">
				<button type="button" class="cover" title="Choose a cover image" on:click={() => fileInput.click()}>
					<img src={coverPreview ?? '/assets/defaultplaylisticon.png'} alt="Cover" />
					<span class="cover-overlay"><i class="fas fa-image" /> {coverFile || mode === 'edit' ? 'Change' : 'Add cover'}</span>
				</button>
				<input class="hidden" type="file" accept=".jpg, .jpeg, .png, .gif" bind:this={fileInput} on:change={pickCover} />

				<div class="text-fields">
					<label>
						<span>Title</span>
						<!-- svelte-ignore a11y_autofocus -->
						<input type="text" maxlength="200" placeholder={type === 'replays' ? 'Best runs of the week' : 'Maps to practice'} bind:value={title} autofocus />
					</label>
					<label>
						<span>Description <small>optional</small></span>
						<textarea rows="4" maxlength="2000" placeholder="What is this playlist about?" bind:value={description} />
					</label>
				</div>
			</div>

			{#if mode === 'create'}
				<div class="options">
					{#if loggedIn}
						<label class="option">
							<input type="checkbox" bind:checked={isPublic} />
							<span>Public <small>anyone can open it and pin it to their profile</small></span>
						</label>
					{/if}
					<label class="option">
						<input type="checkbox" bind:checked={makeActive} />
						<span>Make it the active playlist <small>add buttons on maps and scores put items here</small></span>
					</label>
				</div>
			{/if}
			<button type="submit" class="hidden" />
		</form>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
		width: min(36em, 85vw);
	}

	.edit-content {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.hidden {
		display: none;
	}

	.types {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6em;
	}

	.type-card {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: auto auto;
		column-gap: 0.6em;
		row-gap: 0.15em;
		align-items: center;
		text-align: left;
		padding: 0.7em 0.8em;
		border-radius: 0.6em;
		border: 2px solid var(--dimmed);
		background-color: color-mix(in srgb, var(--textColor, white) 3%, transparent);
		color: inherit;
		cursor: pointer;
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}

	.type-icon {
		grid-row: span 2;
		display: flex;
		opacity: 0.8;
	}

	.type-card:hover:not(:disabled) {
		background-color: color-mix(in srgb, var(--textColor, white) 7%, transparent);
	}

	.type-card.selected {
		border-color: var(--beatleader-primary);
		background-color: rgba(235, 0, 140, 0.1);
	}

	.type-card.selected .type-icon {
		color: var(--beatleader-primary);
		opacity: 1;
	}

	.type-card:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.type-title {
		font-weight: 600;
	}

	.type-description {
		font-size: 0.8em;
		opacity: 0.75;
		line-height: 1.25;
	}

	.starts-with {
		margin: 0;
		opacity: 0.85;
	}

	.starts-with :global(.playlist-type-icon-wrapper) {
		color: var(--beatleader-primary);
		margin-right: 0.3em;
	}

	.main-fields {
		display: flex;
		gap: 1em;
	}

	.cover {
		position: relative;
		flex: none;
		width: 8.5em;
		height: 8.5em;
		padding: 0;
		border: none;
		border-radius: 0.6em;
		overflow: hidden;
		cursor: pointer;
		background-color: var(--dimmed);
	}

	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.cover-overlay {
		position: absolute;
		inset: auto 0 0 0;
		padding: 0.35em;
		font-size: 0.8em;
		color: white;
		background-color: rgba(0, 0, 0, 0.6);
		opacity: 0.85;
		transition: opacity 0.15s;
	}

	.cover:hover .cover-overlay {
		opacity: 1;
	}

	.text-fields {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.6em;
		min-width: 0;
	}

	.text-fields label {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		font-size: 0.85em;
	}

	.text-fields label > span {
		opacity: 0.8;
	}

	.text-fields input,
	.text-fields textarea {
		font-size: 1.15em;
		padding: 0.4em 0.6em;
		border-radius: 0.4em;
		border: 1px solid var(--dimmed);
		background-color: rgba(0, 0, 0, 0.25);
		color: inherit;
		font-family: inherit;
		resize: vertical;
	}

	.text-fields input:focus,
	.text-fields textarea:focus {
		outline: none;
		border-color: var(--beatleader-primary);
	}

	small {
		opacity: 0.65;
		font-size: 0.85em;
		margin-left: 0.3em;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
	}

	.option {
		display: flex;
		align-items: baseline;
		gap: 0.5em;
		cursor: pointer;
	}

	@media screen and (max-width: 600px) {
		.types {
			grid-template-columns: 1fr;
		}

		.main-fields {
			flex-direction: column;
			align-items: center;
		}

		.text-fields {
			width: 100%;
		}
	}

	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
	}
</style>
