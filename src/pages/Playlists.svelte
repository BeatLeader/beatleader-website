<script>
	import ssrConfig from '../ssr-config';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import createPlaylistStore from '../stores/playlists';
	import createAccountStore from '../stores/beatleader/account';
	import Playlist from '../components/Playlists/Playlist.svelte';
	import Pager from '../components/Common/Pager.svelte';
	import Button from '../components/Common/Button.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';

	export let index;

	const playlists = createPlaylistStore();
	const account = createAccountStore();

	let itemsPerPage = 5;
	let page = 0;
	let itemsPerPageValues = [5, 10, 15];
	let selectedIndex = null;

	let playlistsEl = null;

	function onPageChanged(event) {
		page = event.detail.page;
		selectedIndex = null;
	}

	let fileinput;
	const uploadPlaylist = e => {
		let image = e.target.files[0];
		let reader = new FileReader();
		reader.readAsText(image);
		reader.onload = e => {
			const playlist = JSON.parse(e.target.result);
			if (playlist) {
				playlists.create(null, playlist);
			}
		};
	};

	function updatePage(index) {
		if (Number.isFinite(index)) {
			if (selectedIndex == index) return;

			page = Math.floor(index / itemsPerPage);
			selectedIndex = index;

			setTimeout(() => {
				if (playlistsEl) scrollToTargetAdjusted(playlistsEl.querySelector(`.row-${index}`), 60);
			}, 500);
		} else if (totalItems <= itemsPerPage) {
			page = 0;
		}
	}

	$: totalItems = $playlists.length;
	$: updatePage(parseInt(index, 10), $playlists.length);
</script>

<svelte:head>
	<title>{`Playlists / ${ssrConfig.name}`}</title>
</svelte:head>

<ContentBox>
	<div class="playlistButtonsContainer">
		<Button iconFa="fas fa-plus-square" label="New" on:click={() => playlists.create()} />
		<Button iconFa="fas fa-upload" label="Upload" on:click={() => fileinput.click()} />
		<input style="display:none" type="file" accept=".bplist, .json" on:change={e => uploadPlaylist(e)} bind:this={fileinput} />
	</div>
	{#if $playlists && $playlists.length}
		<div bind:this={playlistsEl} class="song-scores grid-transition-helper">
			{#each $playlists.slice(totalItems > itemsPerPage ? page * itemsPerPage : 0, (page + 1) * itemsPerPage < totalItems ? (page + 1) * itemsPerPage : totalItems) as playlist, pageIdx}
				{@const idx = page * itemsPerPage + pageIdx}
				<Playlist expanded={selectedIndex === idx} accountStore={account} {playlist} {idx} store={playlists} />
			{/each}
		</div>
	{:else}
		<p>No playlists, create or upload one.</p>
	{/if}

	{#if $playlists && $playlists.length > itemsPerPage}
		<Pager bind:currentPage={page} bind:itemsPerPage {totalItems} {itemsPerPageValues} on:page-changed={onPageChanged} />
	{/if}
</ContentBox>
