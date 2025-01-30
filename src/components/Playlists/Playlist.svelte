<script>
	import {navigate} from 'svelte-routing';
	import {getContext} from 'svelte';
	import {dndzone} from 'svelte-dnd-action';
	import {fade, fly, slide} from 'svelte/transition';
	import Button from '../Common/Button.svelte';
	import Pager from '../Common/Pager.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import createPlayerService from '../../services/beatleader/player';
	import Song from './Song.svelte';
	import customProtocolCheck from '../../utils/custom-protocol-check';
	import {getNotificationsContext} from 'svelte-notifications';
	import Spinner from '../Common/Spinner.svelte';
	import PlaylistDeleteConfirm from './PlaylistDeleteConfirm.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {configStore} from '../../stores/config';
	import createAccountStore from '../../stores/beatleader/account';
	import {produce} from 'immer';

	export let playlistExport;
	export let sharedPlaylistId = null;
	export let localPlaylistId;
	export let idx;
	export let store;
	export let expanded = false;
	export let currentPlayerId;

	const {addNotification} = getNotificationsContext();
	const {open, close} = getContext('simple-modal');
	const account = createAccountStore();

	let playlist = null;
	let detailsOpened;

	function setPlaylist(playlistExport) {
		if (playlist?.hash != playlistExport?.hash) {
			detailsOpened = false;
		}
		playlist = playlistExport;
	}

	let page = 0;
	let itemsPerPage = $configStore?.playlist?.itemsPerPage ?? 5;
	let savedItemsPerPage = $configStore?.playlist?.itemsPerPage;
	let itemsPerPageValues = [5, 10, 25, 50];

	function storeItemsPerPage(value) {
		savedItemsPerPage = value;
		$configStore = produce($configStore, draft => {
			draft.playlist.itemsPerPage = value;
		});
	}

	function onPageChanged(event) {
		page = event.detail.page;
	}

	let fileinput;
	const changeImage = e => {
		let image = e.target.files[0];
		let reader = new FileReader();
		reader.readAsDataURL(image);
		reader.onload = e => {
			store.updateIcon(localPlaylistId, e.target.result);
			playlist.image = e.target.result;
		};
	};

	function onDetailsButtonClick() {
		detailsOpened = !detailsOpened;
		songList = songList;
	}

	function updateExpanded(expanded) {
		detailsOpened = expanded;
	}

	let titleInput, descriptionInput;
	let redactingTitle = false;
	function onRedactButtonClick() {
		if (redactingTitle && titleInput.value) {
			store.updateTitle(localPlaylistId, titleInput.value);
			playlist.playlistTitle = titleInput.value;
		}
		if (redactingTitle && descriptionInput.value) {
			store.updateDescription(localPlaylistId, descriptionInput.value);
			playlist.playlistDescription = descriptionInput.value;
		}
		redactingTitle = !redactingTitle;
	}

	function sharePlaylist(idx, toShare) {
		store.share(idx, toShare, shareId => {
			playlist.customData.shared = toShare;
			navigate('/playlist/' + shareId);
		});
	}

	let owners = [];
	let canModify = true;
	let canInstall = true;

	async function retrieveOwner(playlist, currentPlayerId) {
		var newOwners = [];
		canModify = true;
		if (playlist?.customData?.owner) {
			if (playlist.customData.owner == 'BeatLeader') {
				canModify = false;
				return;
			}
			if (playlist.customData.owner == 'BeatGames') {
				canModify = false;
				canInstall = false;
				return;
			}

			let ownersIds = playlist.customData.owner.split(',');

			for (let index = 0; index < ownersIds.length; index++) {
				const element = ownersIds[index];

				let playerService = createPlayerService();
				let owner = await playerService.fetchPlayerOrGetFromCache(element);

				if (owner?.playerId + '' != currentPlayerId) {
					canModify = false;
				}
				if (owner) {
					newOwners.push(owner);
				}
			}

			owners = newOwners;
		}
	}

	function updatePage() {
		if (totalItems <= itemsPerPage) {
			page = 0;
		}
	}

	let thinking = false;

	function installOneClick() {
		thinking = true;
		customProtocolCheck(
			'bsplaylist://playlist/' + playlist.customData.syncURL,
			() => {
				thinking = false;
				addNotification({
					html: 'Nothing happened? Check this instruction: <a href="https://beatleader.wiki/en/website/one-click-install">https://beatleader.wiki/en/website/one-click-install</a>',
					position: 'top-right',
					type: 'error',
					removeAfter: 4000,
				});
			},
			() => {
				thinking = false;
				addNotification({
					text: 'Playlist install started!',
					position: 'top-right',
					type: 'success',
					removeAfter: 2000,
				});
			},
			3000
		);
	}

	let playlistsToInstall = '';

	function installQuestOneClick(id) {
		fetch(BL_API_URL + `user/playlist/${id}/toInstall`, {
			method: playlistsToInstall.includes(id) ? 'DELETE' : 'POST',
			credentials: 'include',
		}).then(r => {
			if (playlistsToInstall.includes(id)) {
				playlistsToInstall = playlistsToInstall.replace(id, '');
				addNotification({
					html: "Playlist won't be installed on the game start.",
					position: 'top-right',
					type: 'success',
					removeAfter: 4000,
				});
			} else {
				playlistsToInstall = playlistsToInstall + ',' + id;
				addNotification({
					html: 'Playlist will be installed on the game start. Please use PlaylistManager mod to download songs in it.',
					position: 'top-right',
					type: 'success',
					removeAfter: 4000,
				});
			}
		});
	}

	function updatePlaylistsToInstall(account) {
		playlistsToInstall = account?.playlistsToInstall ?? '';
	}

	const deletePlaylist = async localPlaylistId => {
		open(PlaylistDeleteConfirm, {
			playlistName: playlist.playlistTitle,
			confirm: () => {
				close();
				store.deleteList(localPlaylistId);
			},
			cancel: () => {
				close();
			},
		});
	};

	let songList = [];
	function updateSongList(songs, page, itemsPerPage) {
		songList = songs
			.slice(
				totalItems > itemsPerPage ? page * itemsPerPage : 0,
				(page + 1) * itemsPerPage < totalItems ? (page + 1) * itemsPerPage : totalItems
			)
			.map(s => {
				return {
					id: s?.hash ?? s?.id ?? '',
					song: s,
				};
			});
	}

	function filterUniqueHashes(arr) {
		const seen = new Set();
		return arr.filter(item => {
			if (seen.has(item.id)) {
				return false;
			}
			seen.add(item.id);
			return true;
		});
	}

	function getImageUrl(base64String) {
		let prefix;

		if (base64String.startsWith('iVBORw0KGgo')) {
			prefix = 'data:image/png;base64,';
		} else if (base64String.startsWith('/9j/4')) {
			prefix = 'data:image/jpeg;base64,';
		} else if (base64String.startsWith('R0lGODlh')) {
			prefix = 'data:image/gif;base64,';
		} else if (base64String.startsWith('UklGR')) {
			prefix = 'data:image/webp;base64,';
		} else {
			prefix = 'data:image/png;base64,';
		}

		return prefix + base64String;
	}

	function handleDndConsider(e) {
		songList = filterUniqueHashes(e.detail.items.filter(s => s && !s.page && !s.playlist));
	}
	function handleDndFinalize(e) {
		var newList = e.detail.items.filter(s => s && !s.page && !s.playlist);
		const songHash = e.detail.info.id;
		const song = newList.find(s => s.id == songHash);
		if (song) {
			let index = newList.indexOf(song);
			if (newList.length > itemsPerPage) {
				index -= newList.length - itemsPerPage;
			}
			const objIndex = songs.findIndex(item => item.hash === songHash || item.id === songHash);
			if (objIndex > (page + 1) * itemsPerPage) {
				index += 1;
			}

			store.reorder(localPlaylistId, songHash, page * itemsPerPage + index, song.song);
		}
	}

	function moveUp(song) {
		let index = songs.findIndex(item => item.hash === song.song.hash || item.id === song.song.hash);
		if (index > 0) {
			store.reorder(localPlaylistId, song.song.hash, index - 1, song.song);
		}
	}

	function moveDown(song) {
		let index = songs.findIndex(item => item.hash === song.song.hash || item.id === song.song.hash);
		if (index < songs.length - 1) {
			store.reorder(localPlaylistId, song.song.hash, index + 1, song.song);
		}
	}

	let hoveredToDrop = false;
	let timeout = null;

	function dropToPlaylist(e) {
		clearTimeout(timeout);

		if (e.detail.items.length) {
			hoveredToDrop = true;
			timeout = setTimeout(() => {
				hoveredToDrop = false;
				detailsOpened = !detailsOpened;
			}, 800);
		} else {
			hoveredToDrop = false;
		}
	}

	$: setPlaylist(playlistExport);
	$: songs = playlist.songs;
	$: totalItems = songs.length;
	$: updatePage(songs.length);
	$: updateSongList(songs, page, itemsPerPage);
	$: retrieveOwner(playlist, currentPlayerId);
	$: updateExpanded(expanded);
	$: updatePlaylistsToInstall($account);
	$: if (itemsPerPage != savedItemsPerPage) storeItemsPerPage(itemsPerPage);
	$: playlistId = sharedPlaylistId ?? playlist?.customData?.id;
</script>

{#if playlist}
	<div
		class={`playlist-row row-${localPlaylistId ?? 0} ${hoveredToDrop ? 'drag-hover' : ''}`}
		in:fly|global={{x: 300, delay: idx * 30, duration: 500}}
		out:fade|global={{duration: 100}}
		class:with-details={detailsOpened}>
		<div
			use:dndzone={{items: [{id: 'playlist' + localPlaylistId, playlist: true}], dragDisabled: true}}
			on:consider={dropToPlaylist}
			on:finalize={handleDndFinalize}
			class="playlistInfo"
			on:click={() => onDetailsButtonClick()}>
			<Button type="text" iconFa={detailsOpened ? 'fas fa-chevron-down' : 'fas fa-chevron-right'} on:click={() => onDetailsButtonClick()} />
			<div class="imageInput" on:click|stopPropagation={() => fileinput.click()}>
				<img
					class="playlistImage"
					src={playlist.image
						? playlist.image.startsWith('data')
							? playlist.image
							: getImageUrl(playlist.image.replace('base64,', ''))
						: '/assets/song-default.png'}
					alt="PlaylistImage" />
				{#if canModify && !playlist.oneclick}
					<input style="display:none" type="file" accept=".jpg, .jpeg, .png" on:change={e => changeImage(e)} bind:this={fileinput} />
					<span class="imageChange">
						<h3 class="changeLabel">Change</h3>
					</span>
				{/if}
			</div>

			<div class="titleAndButtons">
				<div style="display: grid; width: 90%;">
					<div style="display: flex;">
						{#if redactingTitle}
							<input type="text" value={playlist.playlistTitle} placeholder="Playlist name" class="input-reset" bind:this={titleInput} />
						{:else if !sharedPlaylistId && playlistId}
							<a href="/playlist/{playlistId}" class="playlistTitle">{playlist.playlistTitle}</a>
						{:else}
							<span class="playlistTitle">{playlist.playlistTitle}</span>
						{/if}

						{#if canModify && !playlist.oneclick}
							<Button
								type="text"
								cls="editTitleButton"
								iconFa={redactingTitle ? 'fas fa-check' : 'fas fa-edit'}
								on:click={() => onRedactButtonClick()} />
						{/if}
					</div>

					{#if playlist.oneclick}
						<span class="oneclick-title">This is magic playlist which will be automatically synced by mod. <br />Quest v0.4+.</span>
					{/if}

					{#if (sharedPlaylistId || !canModify) && owners.length}
						{#each owners as owner}
							<div class="player">
								<PlayerNameWithFlag player={owner} />
							</div>
						{/each}
					{/if}

					<span class="songs">{playlist.songs.length} songs</span>
				</div>

				<div class="buttons-container">
					{#if !playlist.oneclick}
						{#if !sharedPlaylistId || canModify}
							<Button
								cls="playlist-delete"
								iconFa="fas fa-trash-alt"
								title="Delete playlist"
								noMargin={true}
								animated={true}
								type="danger"
								on:click={() => deletePlaylist(localPlaylistId)} />
						{/if}
						{#if canModify}
							{#if currentPlayerId}
								{#if playlist.customData?.id}
									{#if playlist.customData?.shared}
										<Button
											cls="playlist-share"
											iconFa="fas fa-share"
											title="Stop sharing playlist"
											noMargin={true}
											animated={true}
											type="lessdanger"
											on:click={() => sharePlaylist(localPlaylistId, false)} />
									{:else}
										<Button
											cls="playlist-share"
											iconFa="fas fa-share"
											title="Share playlist"
											noMargin={true}
											animated={true}
											type="primary"
											on:click={() => sharePlaylist(localPlaylistId, true)} />
									{/if}
								{:else}
									<Spinner />
								{/if}
							{/if}
						{/if}
					{/if}
					{#if canInstall}
						{#if playlistId}
							{#if thinking}
								<Spinner />
							{:else if $configStore?.preferences?.oneclick == 'playlist'}
								<Button
									cls="one-click"
									noMargin={true}
									animated={true}
									type={playlistsToInstall.includes(playlistId) ? 'danger' : 'purple'}
									iconFa="far fa-hand-pointer"
									title={playlistsToInstall.includes(playlistId)
										? 'Do not one-click install this playlist'
										: 'Quest one click install (Mod version 0.8.1+).'}
									on:click={() => installQuestOneClick(playlistId)} />
							{:else}
								<Button
									cls="one-click"
									url="bsplaylist://playlist/https://api.beatleader.xyz/playlist/{playlistId}"
									noMargin={true}
									animated={true}
									type="green"
									iconFa="far fa-hand-pointer"
									title="One click install"
									on:click={() => installOneClick()} />
							{/if}
						{/if}
						<Button
							iconFa="fas fa-download"
							title="Download playlist"
							noMargin={true}
							animated={true}
							type="primary"
							on:click={() => store.download(playlist)} />
					{/if}
				</div>
			</div>
		</div>
		{#if redactingTitle}
			<textarea
				class="playlistDescription"
				cols="40"
				rows="5"
				value={playlist.playlistDescription ?? null}
				placeholder="Playlist description (optional)"
				bind:this={descriptionInput} />
		{:else if playlist.playlistDescription?.length}
			<span class="playlistDescription">{playlist.playlistDescription}</span>
		{/if}
		{#if songList}
			<div
				use:dndzone={{
					items: songList,
					flipDurationMs: 300,
					centreDraggedOnCursor: true,
					dragDisabled: (sharedPlaylistId && !canModify) || ('ontouchstart' in window && window.matchMedia('(max-width: 768px)').matches),
				}}
				on:consider={handleDndConsider}
				on:finalize={handleDndFinalize}
				class="tab">
				{#if detailsOpened}
					{#each songList as song (song.id)}
						<Song
							song={song.song}
							{canModify}
							{store}
							{localPlaylistId}
							on:move-up={() => moveUp(song)}
							on:move-down={() => moveDown(song)} />
					{/each}
				{/if}
			</div>
		{/if}
		{#if detailsOpened && songList && songs}
			<Pager bind:currentPage={page} bind:itemsPerPage {totalItems} {itemsPerPageValues} on:page-changed={onPageChanged} dnd={true} />
		{/if}
	</div>
{/if}

<style>
	.playlist-row {
		border-bottom: 1px solid var(--dimmed);
		padding: 0.5em 0;
	}

	.drag-hover {
		background-color: rgba(49, 49, 49, 0.617);
	}

	.playlistInfo {
		display: flex;
		cursor: pointer;
	}

	.playlistTitle {
		display: block;
		max-width: 80%;
		max-height: 3em;
		overflow: auto;
	}

	.playlistDescription {
		display: block;
		max-height: 4em;
		overflow: auto;
		margin-left: 2.5em;
	}

	textarea.playlistDescription {
		margin-top: 1em;
		margin-left: 1.5em;
	}

	::placeholder {
		color: rgb(0, 0, 0) !important;
		opacity: 1; /* Firefox */
	}

	.titleAndButtons {
		display: flex;
		justify-content: space-between;
		font-size: 1.1em;
		font-weight: 500;
		width: 90%;
		margin: 1em;
	}

	:global(.editTitleButton) {
		padding-bottom: 1.4em !important;
		padding-left: 0.6em !important;
	}

	.playlist-row .icons.up-to-tablet + .main {
		padding-top: 0;
	}

	.playlist-row .main {
		display: flex;
		flex-wrap: nowrap;
		justify-content: space-evenly;
		align-items: center;
	}

	.playlist-row.with-details .main {
		border-bottom: none;
	}

	.playlist-row .main > * {
		margin-right: 1em;
	}

	.playlist-row .main > *:last-child {
		margin-right: 0;
	}

	.playlist-row .main :global(.badge) {
		margin: 0 !important;
		padding: 0.125em 0.25em !important;
		width: 100%;
	}

	.playlist-row .main :global(.badge small) {
		font-size: 0.7em;
		font-weight: normal;
		margin-top: -2px;
	}

	.playlist-row .main :global(.inc),
	.playlist-row :global(.dec) {
		color: inherit;
	}

	.imageInput {
		cursor: pointer;
		display: flex;
		position: relative;
	}

	.playlistImage {
		width: 10em;
		height: fit-content;
		aspect-ratio: 1 / 1;
		min-width: 6em;
		margin-left: 1em;
		margin-top: 1em;
		margin-bottom: 0.5em;
		border-radius: 12px;
	}

	.imageChange {
		transition: opacity 0.2s ease-in-out;
		background-color: rgba(32, 33, 36, 0.6);
		bottom: 0;
		height: 33%;
		left: 0;
		opacity: 0;
		position: absolute;
		right: 0;
		display: flex;
		justify-content: center;
	}

	.imageInput:hover .imageChange {
		opacity: 1;
	}

	.changeLabel {
		top: 30%;
		position: absolute;
	}

	.oneclick-title {
		font-size: 0.8em;
		color: blueviolet;
	}

	.buttons-container {
		display: flex;
		gap: 0.4em;
	}

	:global(.one-click .fa-hand-pointer) {
		width: 1.3em;
	}

	:global(.playlist-share .fas) {
		margin-top: 0.3em;
	}

	:global(.playlist-delete .fas) {
		margin-top: 0.3em;
	}

	@media screen and (max-width: 768px) {
		.titleAndButtons {
			flex-direction: column;
		}
	}
</style>
