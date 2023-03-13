<script>
	import {navigate} from 'svelte-routing';
	import {fade, fly, slide} from 'svelte/transition';
	import Button from '../Common/Button.svelte';
	import Pager from '../Common/Pager.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import createPlayerService from '../../services/beatleader/player';
	import Song from './Song.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let playlist;
	export let idx;
	export let store;
	export let expanded = false;
	export let accountStore;
	export let playlistId;

	let page = 0;
	let itemsPerPage = 5;
	let itemsPerPageValues = [5, 10, 15];

	function onPageChanged(event) {
		page = event.detail.page;
	}

	let fileinput;
	const changeImage = e => {
		let image = e.target.files[0];
		let reader = new FileReader();
		reader.readAsDataURL(image);
		reader.onload = e => {
			playlist.image = e.target.result;
			store.set($store);
		};
	};

	let detailsOpened;
	function onDetailsButtonClick() {
		detailsOpened = !detailsOpened;
	}

	function updateExpanded(expanded) {
		detailsOpened = expanded;
	}

	let titleInput;
	let redactingTitle = false;
	function onRedactButtonClick() {
		if (redactingTitle && titleInput.value) {
			playlist.playlistTitle = titleInput.value;
			store.set($store);
		}
		redactingTitle = !redactingTitle;
	}

	function sharePlaylist() {
		store.share(idx, shareId => {
			navigate('/playlist/' + shareId);
		});
	}

	let owners = [];
	let canModify = true;
	let canShare = true;

	async function retrieveOwner(playlist, playerId) {
		var newOwners = [];
		if (playlist?.customData?.owner) {
			canShare = false;
			if (playlist.customData.owner == 'BeatLeader') {
				canModify = false;
				return;
			}

			let ownersIds = playlist.customData.owner.split(',');

			for (let index = 0; index < ownersIds.length; index++) {
				const element = ownersIds[index];

				let playerService = createPlayerService();
				let owner = await playerService.fetchPlayerOrGetFromCache(element);

				if (owner?.playerId != playerId) {
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

	$: songs = playlist.songs;
	$: totalItems = songs.length;
	$: updatePage(songs.length);
	$: retrieveOwner(playlist, $accountStore?.player?.playerId);
	$: updateExpanded(expanded);
	$: description = `
		Beat Saber playlist
		${totalItems} songs
		${owners.length ? `Made by: ${owners.map(o => o.name).join(', ')}` : ''}`;
</script>

{#if playlist}
	<div
		class={`song-score row-${idx}`}
		in:fly={{x: 300, delay: idx * 30, duration: 500}}
		out:fade={{duration: 100}}
		class:with-details={detailsOpened}>
		<div class="playlistInfo">
			<td class="col--details-btn">
				<Button
					type="text"
					iconFa={detailsOpened ? 'fas fa-chevron-down' : 'fas fa-chevron-right'}
					on:click={() => onDetailsButtonClick()} />
			</td>
			<div class="imageInput" on:click={() => fileinput.click()}>
				<img
					class="playlistImage"
					src={playlist.image
						? playlist.image.startsWith('data')
							? playlist.image
							: 'data:image/png;base64,' + playlist.image
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
						<span class="playlistTitle" style="display: {redactingTitle ? 'none' : 'block'};">{playlist.playlistTitle}</span>
						<input
							type="text"
							style="display: {redactingTitle ? 'block' : 'none'};"
							value={playlist.playlistTitle}
							placeholder="Playlist name"
							class="input-reset"
							bind:this={titleInput} />
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

					{#if owners.length}
						{#each owners as owner}
							<div class="player">
								<PlayerNameWithFlag player={owner} />
							</div>
						{/each}
					{/if}

					<span class="songs">{playlist.songs.length} songs</span>
				</div>

				<div>
					{#if !playlist.oneclick}
						{#if canModify}
							<Button iconFa="fas fa-trash-alt" title="Delete playlist" noMargin={true} type="danger" on:click={store.deleteList(idx)} />
						{/if}
						{#if canShare}
							<Button iconFa="fas fa-upload" title="Share playlist" noMargin={true} type="primary" on:click={sharePlaylist(idx)} />
						{/if}
					{/if}
					<Button iconFa="fas fa-download" title="Download playlist" noMargin={true} type="primary" on:click={store.download(playlist)} />
				</div>
			</div>
		</div>

		{#if detailsOpened}
			<div class="tab">
				{#each songs.slice(totalItems > itemsPerPage ? page * itemsPerPage : 0, (page + 1) * itemsPerPage < totalItems ? (page + 1) * itemsPerPage : totalItems) as song, songId}
					<Song {song} {canModify} listId={idx} {store} />
				{/each}
			</div>

			{#if songs && songs.length > itemsPerPage}
				<Pager bind:currentPage={page} bind:itemsPerPage {totalItems} {itemsPerPageValues} on:page-changed={onPageChanged} />
			{/if}
		{/if}
	</div>
	{#if playlistId}
		<MetaTags
			title={playlist.playlistTitle}
			{description}
			openGraph={{
				title: playlist.playlistTitle,
				description,
				images: [
					{
						url: BL_API_URL + 'playlist/image/' + playlistId + '.png',
					},
				],
				site_name: ssrConfig.name,
			}}
			twitter={{
				handle: '@handle',
				site: '@beatleader_',
				cardType: 'summary',
				title: playlist.playlistTitle,
				description,
				image: BL_API_URL + 'playlist/image/' + playlistId + '.png',
				imageAlt: playlist.playlistTitle + ' picture',
			}} />
	{/if}
{/if}

<style>
	.song-score {
		border-bottom: 1px solid var(--dimmed);
		padding: 0.5em 0;
	}

	.playlistInfo {
		display: flex;
	}

	.playlistTitle {
		display: block;
		max-width: 80%;
		max-height: 3em;
		overflow: auto;
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

	.song-score .icons.up-to-tablet + .main {
		padding-top: 0;
	}

	.song-score .main {
		display: flex;
		flex-wrap: nowrap;
		justify-content: space-evenly;
		align-items: center;
	}

	.song-score.with-details .main {
		border-bottom: none;
	}

	.song-score .main > * {
		margin-right: 1em;
	}

	.song-score .main > *:last-child {
		margin-right: 0;
	}

	.song-score .main :global(.badge) {
		margin: 0 !important;
		padding: 0.125em 0.25em !important;
		width: 100%;
	}

	.song-score .main :global(.badge small) {
		font-size: 0.7em;
		font-weight: normal;
		margin-top: -2px;
	}

	.song-score .main :global(.inc),
	.song-score :global(.dec) {
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
</style>
