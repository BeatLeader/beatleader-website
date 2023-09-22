<script>
	import {useLocation} from 'svelte-routing';
	import createPlaylistStore from '../stores/playlists';
	import Playlist from '../components/Playlists/Playlist.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import ssrConfig from '../ssr-config';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';

	export let id;

	const location = useLocation();

	const playlists = createPlaylistStore();
	const account = createAccountStore();
	var playlist = null;

	$: document.body.scrollIntoView({behavior: 'smooth'});
	$: playlists.getShared(id, result => {
		playlist = result;
	});
</script>

<svelte:head>
	<title>{`Playlist / ${playlist?.playlistTitle} / ${ssrConfig.name}`}</title>
</svelte:head>

<ContentBox>
	{#if playlist}
		<Playlist playlistId={id} accountStore={account} expanded={true} {playlist} idx={0} store={playlists} />
	{:else}
		<Spinner />
	{/if}
</ContentBox>
