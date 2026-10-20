<script>
	import {getContext} from 'svelte';
	import {getNotificationsContext} from 'svelte-notifications';
	import Button from '../Common/Button.svelte';
	import PlaylistPickerDialog from './PlaylistPickerDialog.svelte';
	import createPlaylistStore, {activePlaylistOf, isReplayPlaylist} from '../../stores/playlists';
	import {playlistTypeIcon} from './icons';
	import {configStore} from '../../stores/config';
	import {capitalize, decapitalizeFirstLetter} from '../../utils/js';

	export let song = null;
	export let diffInfo = null;
	export let replay = null;
	export let animated = true;
	export let variant = 'default';

	const {open, close} = getContext('simple-modal');
	const {addNotification} = getNotificationsContext();
	const playlists = createPlaylistStore();

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 4000 : 2000});
	}

	function openPicker() {
		open(PlaylistPickerDialog, {song, diffInfo, replay, open, close: () => close()});
	}

	const songItem = () => ({
		hash: song.hash,
		songName: song.name,
		levelAuthorName: song.mapper,
		difficulties: diffInfo ? [{name: decapitalizeFirstLetter(diffInfo.diff), characteristic: diffInfo.type}] : [],
	});

	async function run(action, message) {
		try {
			await action();
			notify(message);
		} catch (e) {
			notify(e?.message?.length < 200 ? e.message : 'Failed to update the playlist', 'error');
		}
	}

	// Button dispatches without the native event, so Shift is read from the click being handled
	function onClick() {
		if (!state || window.event?.shiftKey) {
			openPicker();
			return;
		}

		const title = active.playlistTitle;
		switch (state) {
			case 'add-map':
				run(() => playlists.add(songItem(), active.key), `Added to ${title}`);
				break;
			case 'remove-map':
				run(() => playlists.remove(song.hash, active.key), `Removed from ${title}`);
				break;
			case 'add-diff':
				run(() => playlists.addDiff(song.hash, diffInfo, active.key), `Added ${diffName} to ${title}`);
				break;
			case 'remove-diff':
				run(() => playlists.removeDiff(song.hash, diffInfo, active.key), `Removed ${diffName} from ${title}`);
				break;
			case 'add-replay':
				run(() => playlists.addReplay(active.key, {replayType: replay.replayType, id: replay.id}), `Added to ${title}`);
				break;
			case 'remove-replay':
				run(() => playlists.removeReplay(active.key, replay.replayType, replay.id), `Removed from ${title}`);
				break;
		}
	}

	function stateFor(active, song, diffInfo, replay, pickerMode) {
		if (!active || pickerMode) return null;

		if (isReplayPlaylist(active)) {
			if (!replay) return null;
			return active.replays?.some(r => r.replayType === replay.replayType && r.id == replay.id) ? 'remove-replay' : 'add-replay';
		}

		if (!song?.hash) return null;
		const entry = active.songs?.find(s => s.hash?.toLowerCase() === song.hash.toLowerCase());
		if (!entry) return 'add-map';
		if (!diffInfo) return 'remove-map';

		const key = capitalize(diffInfo.diff) + diffInfo.type;
		const entries = entry.difficulties?.map(d => capitalize(d.name) + d.characteristic) ?? [];
		if (entries.length === 1 && entries[0] === key) return 'remove-map';
		return entries.includes(key) ? 'remove-diff' : 'add-diff';
	}

	const TITLES = {
		'add-map': 'Add to',
		'remove-map': 'Remove from',
		'add-diff': 'Add this difficulty to',
		'remove-diff': 'Remove this difficulty from',
		'add-replay': 'Add this replay to',
		'remove-replay': 'Remove this replay from',
	};

	$: active = activePlaylistOf($playlists, $configStore);
	$: pickerMode = $configStore?.preferences?.playlistOption === 'picker';
	$: state = stateFor(active, song, diffInfo, replay, pickerMode);
	$: diffName = diffInfo ? capitalize(diffInfo.diff) : '';
	$: removing = state?.startsWith('remove');
	$: alt = variant === 'alt';
	$: buttonType = !alt && removing ? (state === 'remove-diff' ? 'lessdanger' : 'danger') : 'default';
	$: altColor = !removing ? 'white' : state === 'remove-diff' ? '#ffb86b' : '#ff6b6b';
	$: icon = alt ? `<div class='playlist-list-icon'></div>` : playlistTypeIcon(state ? isReplayPlaylist(active) : !song && replay);
	$: title = state ? `${TITLES[state]} ${active.playlistTitle} (Shift+click to pick another playlist)` : 'Add to playlist...';
	$: cls = ['playlist-add-button', alt && 'replay-button-alt playlist-button-alt', state && 'playlist-button-direct']
		.filter(Boolean)
		.join(' ');
</script>

<Button
	{icon}
	{title}
	{animated}
	{cls}
	noMargin={true}
	type={buttonType}
	color={alt ? altColor : null}
	bgColor={alt ? 'transparent' : null}
	on:click={onClick} />

<style>
	:global(.playlist-button-direct) {
		position: relative;
	}

	:global(.playlist-button-direct)::after {
		content: '';
		position: absolute;
		top: 2px;
		right: 2px;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background-color: var(--beatleader-primary);
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
		pointer-events: none;
	}

	:global(.playlist-button-alt.playlist-button-direct)::after {
		top: 0;
		right: 0;
	}

	/* Same height as the neighbouring links, which keep Bulma's 2.25em .button height */
	:global(button.playlist-button-alt) {
		height: 2.25em;
	}

	/* Same box as .replay-icon-alt next to it; a mask so it takes the button's color */
	:global(.playlist-list-icon) {
		--list-mask: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Ccircle%20cx='6'%20cy='7.5'%20r='1.6'/%3E%3Ccircle%20cx='6'%20cy='12'%20r='1.6'/%3E%3Ccircle%20cx='6'%20cy='16.5'%20r='1.6'/%3E%3Crect%20x='9.5'%20y='6.4'%20width='9.5'%20height='2.2'%20rx='1.1'/%3E%3Crect%20x='9.5'%20y='10.9'%20width='9.5'%20height='2.2'%20rx='1.1'/%3E%3Crect%20x='9.5'%20y='15.4'%20width='9.5'%20height='2.2'%20rx='1.1'/%3E%3C/svg%3E")
			center / contain no-repeat;
		margin-left: -0.5em;
		margin-bottom: 0.5em;
		width: 130%;
		height: 130%;
		background-color: currentColor;
		-webkit-mask: var(--list-mask);
		mask: var(--list-mask);
	}
</style>
