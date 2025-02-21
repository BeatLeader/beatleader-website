<script>
	import {getContext} from 'svelte';
	import DialogContent from '../Common/DialogContent.svelte';
	import {getNotificationsContext} from 'svelte-notifications';
	import createPlaylistStore from '../../stores/playlists';
	import {configStore} from '../../stores/config';
	import {capitalize} from '../../utils/js';
	import Button from '../Common/Button.svelte';

	export let song;
	export let diffInfo = null;
	export let onchange = () => {};
	export let oncancel = () => {};

	const playlists = createPlaylistStore();
	const {addNotification} = getNotificationsContext();

	let hash;
	let songName;
	let levelAuthorName;

	function updateSongInfo(song) {
		if (!song) {
			hash = null;
			return;
		}

		if (song.id) {
			hash = song.hash;
			songName = song.name;
			levelAuthorName = song.mapper;
		}
	}

	function decapitalizeFirstLetter(string) {
		return string.charAt(0).toLowerCase() + string.slice(1);
	}

	function getSongInfo() {
		return {
			hash,
			songName,
			difficulties: [{name: decapitalizeFirstLetter(diffInfo.diff), characteristic: diffInfo.type}],
			levelAuthorName,
		};
	}

	function handlePlaylistToggle(playlist, index) {
		const playlistSongs = playlist.songs?.filter(el => el.hash == hash);
		const playlistSong = playlistSongs?.length ? playlistSongs[0] : null;

		if (!playlistSong) {
			playlists.add(getSongInfo(), index);
			addNotification({
				text: `Added to ${playlist.playlistTitle}`,
				position: 'top-right',
				type: 'success',
				removeAfter: 2000,
			});
		} else {
			playlists.remove(hash, index);
			addNotification({
				text: `Removed from ${playlist.playlistTitle}`,
				position: 'top-right',
				type: 'success',
				removeAfter: 2000,
			});
		}
	}

	function handleClose(save) {
		if (save) {
			onchange();
		} else {
			oncancel();
		}
	}

	$: updateSongInfo(song);
	$: diffName = diffInfo && diffInfo.diff ? capitalize(diffInfo.diff) : '';
	$: charName = diffInfo && diffInfo.type ? diffInfo.type : '';
</script>

<div class="dialog-container">
	<DialogContent type="alert" title="Select playlists" okButton="Done" okButtonType="primary" on:confirm={() => handleClose(true)}>
		<div slot="content">
			<div class="playlists-list">
				<Button
					iconFa="fas fa-plus"
					title="Create new playlist with this song"
					animated={false}
					on:click={() => playlists.create(getSongInfo())}>
					New Playlist
				</Button>
				{#each $playlists as playlist, i}
					{@const playlistSongs = playlist.songs?.filter(el => el.hash == hash)}
					{@const isInPlaylist = playlistSongs?.length > 0}
					<label class="playlist-item">
						<div class="playlist-item-info">
							<img
								src={playlist.image
									? playlist.image.startsWith('data')
										? playlist.image
										: 'data:image/png;base64,' + playlist.image
									: '/assets/song-default.png'}
								alt="Playlist icon"
								class="playlist-icon" />
							<span>{playlist.playlistTitle}</span>
						</div>
						<input type="checkbox" checked={isInPlaylist} on:change={() => handlePlaylistToggle(playlist, i)} />
					</label>
				{/each}
			</div>
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
		max-height: 40em;
	}

	:global(.wrap) {
		display: contents;
	}
	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
		background-color: rgb(26 26 26) !important;
	}

	.playlist-picker {
		padding: 0.5em;
		background: var(--surface1);
		border-radius: 4px;
		margin-top: 0.5em;
	}

	.playlists-list {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		overflow-y: auto;
		padding: 1em;
		position: relative;
		max-height: 27em;
	}

	.playlist-item {
		display: flex;
		justify-content: space-between;
		gap: 0.5em;
		cursor: pointer;
		padding: 0.3em;
	}

	.playlist-item-info {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.playlist-icon {
		width: 1.5em;
		height: 1.5em;
	}

	.playlist-item:hover {
		background: var(--surface2);
		border-radius: 4px;
	}

	input[type='checkbox'] {
		cursor: pointer;
	}
</style>
