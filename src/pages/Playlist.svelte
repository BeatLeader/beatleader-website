<script>
	import {onMount} from 'svelte';
	import createPlaylistStore, {
		findPlaylist,
		isPlaylistGuid,
		isReplayPlaylist,
		playlistItemCount,
		playlistPageUrl,
	} from '../stores/playlists';
	import Playlist from '../components/Playlists/Playlist.svelte';
	import {fade} from 'svelte/transition';
	import createAccountStore from '../stores/beatleader/account';
	import ssrConfig from '../ssr-config';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import {navigate} from 'svelte-routing';

	export let id;

	const playlists = createPlaylistStore();
	const account = createAccountStore();

	onMount(() => playlists.watch());
	let fetched = null;
	let error = null;

	function load(id) {
		fetched = null;
		error = null;
		const storeOnly = String(id).startsWith('local-') || id === 'oneclick';
		if (storeOnly) return;
		playlists
			.getShared(id, result => (fetched = result))
			.catch(e => {
				error =
					e?.status === 401
						? 'This playlist is private'
						: e?.status === 404
							? isPlaylistGuid(id)
								? "This link doesn't open a playlist. Its owner may have turned it off or replaced it."
								: 'Playlist not found'
							: 'Failed to load the playlist';
			});
	}

	$: document.body.scrollIntoView({behavior: 'smooth'});
	$: load(id);

	$: own = findPlaylist($playlists, fetched?.key ?? id);
	$: playlist = own ?? fetched;
	$: pageUrl = own?.role === 'owner' ? playlistPageUrl(own) : null;
	$: if (pageUrl && pageUrl.toLowerCase() !== `/playlist/${id}`.toLowerCase()) navigate(pageUrl, {replace: true});
	$: replays = isReplayPlaylist(playlist);
	$: totalItems = playlistItemCount(playlist);
	// The image endpoint doesn't take guids
	$: image = isPlaylistGuid(id)
		? playlist?.image?.startsWith('http')
			? playlist.image
			: 'https://beatleader.com/assets/defaultplaylisticon.png'
		: BL_API_URL + 'playlist/image/' + id + '.png';

	$: description = `
		Beat Saber ${replays ? 'replay playlist' : 'playlist'}
		${totalItems} ${replays ? 'replays' : 'songs'}
		${playlist?.playlistDescription ?? ''}`;
</script>

<svelte:head>
	<title>{`Playlist / ${playlist?.playlistTitle} / ${ssrConfig.name}`}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<a class="back" href="/playlists" on:click|preventDefault={() => navigate('/playlists')}
			><i class="fas fa-arrow-left" /> All playlists</a>
		{#if playlist}
			<Playlist sharedPlaylistId={id} currentPlayerId={$account.id} {playlist} playlistKey={own?.key ?? null} store={playlists} />
		{:else if error}
			<ContentBox><p class="error">{error}</p></ContentBox>
		{:else}
			<Spinner />
		{/if}
	</article>
</section>

{#if playlist}
	<MetaTags
		title={playlist.playlistTitle}
		{description}
		openGraph={{
			title: playlist.playlistTitle,
			description,
			images: [
				{
					url: image,
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
			image,
			imageAlt: playlist.playlistTitle + ' picture',
		}} />
{/if}

<style>
	.align-content {
		display: flex;
		justify-content: center;
		min-width: 0;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
		min-width: 0;
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		margin: 0 0 0.5em 0.8em;
		font-size: 0.9em;
		opacity: 0.75;
		color: inherit !important;
	}

	.back:hover {
		opacity: 1;
	}

	.error {
		margin: 2em;
		text-align: center;
	}
</style>
