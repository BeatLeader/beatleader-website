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

	$: playlists.getShared(id, result => {
		playlist = result;
	});
</script>

<svelte:head>
	<title>{`Playlist / ${playlist?.playlistTitle} / ${ssrConfig.name}`}</title>
</svelte:head>

<ContentBox>
	{#if playlist}
		<Playlist accountStore={account} expanded={true} {playlist} idx={0} store={playlists} />
	{:else}
		<Spinner />
	{/if}
</ContentBox>
