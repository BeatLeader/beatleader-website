<script>
	import {getNotificationsContext} from 'svelte-notifications';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import customProtocolCheck from '../../utils/custom-protocol-check';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {configStore} from '../../stores/config';
	import createAccountStore from '../../stores/beatleader/account';
	import {isReplayPlaylist} from '../../stores/playlists';

	export let playlist;
	export let playlistId = null;

	const {addNotification} = getNotificationsContext();
	const account = createAccountStore();

	let installing = false;
	let playlistsToInstall = '';

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 4000 : 2000});
	}

	function installPc() {
		installing = true;
		customProtocolCheck(
			installLink,
			() => {
				installing = false;
				addNotification({
					html: 'Nothing happened? Check this instruction: <a href="https://beatleader.wiki/en/website/one-click-install">https://beatleader.wiki/en/website/one-click-install</a>',
					position: 'top-right',
					type: 'error',
					removeAfter: 4000,
				});
			},
			() => {
				installing = false;
				notify('Playlist install started!');
			},
			3000
		);
	}

	function installQuest() {
		const queued = playlistsToInstall.includes(id);
		fetch(BL_API_URL + `user/playlist/${id}/toInstall`, {method: queued ? 'DELETE' : 'POST', credentials: 'include'}).then(() => {
			if (queued) {
				playlistsToInstall = playlistsToInstall.replace(id, '');
				notify("Playlist won't be installed on the game start.");
			} else {
				playlistsToInstall = playlistsToInstall + ',' + id;
				notify('Playlist will be installed on the game start. Use PlaylistManager mod to download its songs.');
			}
		});
	}

	$: id = playlistId ?? playlist?.id ?? playlist?.customData?.id;
	$: canInstall = !isReplayPlaylist(playlist) && id && playlist?.customData?.owner != 'BeatGames';
	$: installLink = 'bsplaylist://playlist/' + (playlist?.customData?.syncURL ?? `https://api.beatleader.com/playlist/${id}`);
	$: questInstall = $configStore?.preferences?.oneclick == 'playlist';
	$: playlistsToInstall = $account?.playlistsToInstall ?? '';
	$: queued = !!id && playlistsToInstall.includes(id);
</script>

{#if canInstall}
	{#if installing}
		<Spinner />
	{:else if questInstall}
		<Button
			iconFa="far fa-hand-pointer"
			title={queued ? "Don't install on the next game start" : 'Install on the next game start (Quest mod 0.8.1+)'}
			type={queued ? 'danger' : 'purple'}
			animated={true}
			noMargin={true}
			on:click={installQuest} />
	{:else}
		<Button
			url={installLink}
			iconFa="far fa-hand-pointer"
			title="One click install (PlaylistManager)"
			animated={true}
			noMargin={true}
			on:click={installPc} />
	{/if}
{/if}
