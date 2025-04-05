<script>
	import ssrConfig from '../ssr-config';
	import {navigate} from 'svelte-routing';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import createPlaylistStore from '../stores/playlists';
	import createAccountStore from '../stores/beatleader/account';
	import Playlist from '../components/Playlists/Playlist.svelte';
	import Pager from '../components/Common/Pager.svelte';
	import Button from '../components/Common/Button.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';
	import {MetaTags} from 'svelte-meta-tags';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import FeaturedPlaylist from '../components/Playlists/FeaturedPlaylist.svelte';
	import FeaturedPlaylistRanked from '../components/Playlists/FeaturedPlaylistRanked.svelte';

	export let page = 1;

	const account = createAccountStore();

	let itemsPerPage = 10;
	let currentPage = page;
	let previousPage = 0;
	let totalItems = 10 * page + 1;

	function onPageChanged(event) {
		previousPage = currentPage;
		currentPage = event.detail.page + 1;

		navigate(`/playlists/featured/${currentPage}`, {replace: true});
	}

	var playlists = [];

	function fetchPlaylists(itemsPerPage, page) {
		fetch(`${BL_API_URL}playlists/featured/paged?page=${page}&count=${itemsPerPage}`)
			.then(res => res.json())
			.then(data => {
				playlists = data.data;
				totalItems = data.metadata.total;
			});
	}

	const tabOptions = [
		{value: 'my-playlists', label: 'My playlists', iconFa: 'fas fa-user', url: '/playlists', cls: 'playlist-tab-button'},
		{value: 'featured', label: 'Featured', iconFa: 'fas fa-star', url: '/playlists/featured/1', cls: 'playlist-tab-button'},
	];
	const currentTab = tabOptions[1];

	function onTabChanged(e) {
		navigate(`/playlists`);
	}

	let rankedPlaylists = [
		{
			id: 'ranked',
			name: 'Ranked',
			description: 'Maps that will give you pp',
			fa: 'fas fa-star',
			color: '#ffd700',
		},
		{
			id: 'qualified',
			name: 'Qualified',
			description: 'Maps about to be ranked',
			fa: 'fas fa-calendar-check',
			color: '#00ff00',
		},
		{
			id: 'nominated',
			name: 'Nominated',
			description: 'Maps in the process of being ranked',
			fa: 'fas fa-rocket',
			color: '#5b008a',
		},
	];

	$: itemsPerPage && fetchPlaylists(itemsPerPage, page);

	$: metaTitle = `Featured playlists / ${ssrConfig.name}`;
	$: description = `
		Beat Saber playlists selection of the community`;
</script>

<svelte:head>
	<title>{metaTitle}</title>
</svelte:head>

<div class="playlist-switcher">
	<TabSwitcher values={tabOptions} value={currentTab} on:change={onTabChanged} class="playlist" />
</div>
<ContentBox cls="featured-playlists-container">
	<div class="ranked-playlists">
		{#each rankedPlaylists as playlist}
			<FeaturedPlaylistRanked {playlist} />
		{/each}
	</div>
	{#if playlists?.length}
		<div class="playlists-container">
			{#each playlists as playlist, idx (playlist?.id)}
				<FeaturedPlaylist {playlist} {idx} animationSign={currentPage >= previousPage ? 1 : -1} />
			{/each}
		</div>
	{/if}

	<Pager currentPage={currentPage - 1} {itemsPerPage} {totalItems} itemsPerPageValues={null} on:page-changed={onPageChanged} />
</ContentBox>

<MetaTags
	title={metaTitle}
	{description}
	openGraph={{
		title: metaTitle,
		description,
		images: [
			{
				url: CURRENT_URL + 'assets/defaultplaylisticon.png',
			},
		],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: metaTitle,
		description,
		image: CURRENT_URL + 'assets/defaultplaylisticon.png',
		imageAlt: metaTitle + ' picture',
	}} />

<style>
	.playlist-switcher {
		margin-left: 0.6em;
	}

	.playlists-container {
		display: flex;
		gap: 1em;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
	}

	.ranked-playlists {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1em;
		flex-wrap: wrap;
	}

	:global(.featured-playlists-container) {
		margin-top: 2.6em !important;
		border-radius: 0 12px !important;
	}

	:global(.playlist-tab-button) {
		margin-bottom: -0.5em !important;
		height: 3.5em;
		border-radius: 12px 12px 0 0 !important;
	}

	:global(.playlist-tab-button span) {
		font-weight: 900;
		text-align: center;
		white-space: break-spaces;
		margin-right: -0.3em;
	}
</style>
