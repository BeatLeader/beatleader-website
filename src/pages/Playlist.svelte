<script>
	import createPlaylistStore from '../stores/playlists';
	import Playlist from '../components/Playlists/Playlist.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import ssrConfig from '../ssr-config';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';

	export let id;

	const playlists = createPlaylistStore();
	const account = createAccountStore();
	var playlist = null;
	var localPlaylistId = null;

	function onPlaylistsRefresh(store, localPlaylistId) {
		if (localPlaylistId !== null) {
			playlist = store[localPlaylistId];
		}
	}

	$: document.body.scrollIntoView({behavior: 'smooth'});
	$: playlists.getShared(id, (result, resultId) => {
		playlist = result;
		localPlaylistId = resultId;
	});

	$: onPlaylistsRefresh($playlists, localPlaylistId);
	$: songs = playlist?.songs;
	$: totalItems = songs?.length;

	$: description = `
		Beat Saber playlist
		${totalItems} songs
		${playlist?.playlistDescription ?? ''}`;
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

{#if playlist}
	<MetaTags
		title={playlist.playlistTitle}
		{description}
		openGraph={{
			title: playlist.playlistTitle,
			description,
			images: [
				{
					url: BL_API_URL + 'playlist/image/' + id + '.png',
				},
			],
			siteName: ssrConfig.name,
		}}
		twitter={{
			handle: '@handle',
			site: '@beatleader_',
			cardType: 'summary',
			title: playlist.playlistTitle,
			description,
			image: BL_API_URL + 'playlist/image/' + id + '.png',
			imageAlt: playlist.playlistTitle + ' picture',
		}} />
{/if}
