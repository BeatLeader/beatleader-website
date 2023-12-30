<script>
	import createPlaylistStore from '../stores/playlists';
	import Playlist from '../components/Playlists/Playlist.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import ssrConfig from '../ssr-config';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';

	export let id;

	const playlists = createPlaylistStore();
	const account = createAccountStore();
	var playlist = null;
	var localPlaylistId = null;

	$: document.body.scrollIntoView({behavior: 'smooth'});
	$: playlists.getShared(id, (result, resultId) => {
		playlist = result;
		localPlaylistId = resultId;
	});
</script>

<svelte:head>
	<title>{`Playlist / ${playlist?.playlistTitle} / ${ssrConfig.name}`}</title>
</svelte:head>

<ContentBox>
	{#if playlist}
		<Playlist
			sharedPlaylistId={id}
			currentPlayerId={$account.id}
			expanded={true}
			playlistExport={playlist}
			{localPlaylistId}
			idx={0}
			store={playlists} />
	{:else}
		<Spinner />
	{/if}
</ContentBox>
