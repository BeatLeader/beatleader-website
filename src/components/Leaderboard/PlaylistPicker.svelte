<script>
	import Select from 'svelte-select';
	import {onMount} from 'svelte';
	import {createEventDispatcher} from 'svelte';
	import PlaylistPickerMultiItem from './PlaylistPickerMultiItem.svelte';
	import PlaylistPickerItem from './PlaylistPickerItem.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import PickerBlock from '../Common/PickerBlock.svelte';
	import createPlaylistStore from '../../stores/playlists';

	export let playlistIds = [];
	export let placeholder = 'Playlists';
	export let icon = null;

	const dispatch = createEventDispatcher();
	const playlists = createPlaylistStore();
	let listOpen = false;

	let items = [];
	let selectedIds = [];
	let activeTab = 'featured';
	let featuredItems = [];

	async function fetchFeaturedPlaylists() {
		const response = await fetch(`${BL_API_URL}playlists/featured`);
		const playlists = await response.json();
		return playlists.map(playlist => ({
			value: playlist.playlistLink.split('/').pop(),
			label: playlist.title,
			cover: playlist.cover,
			owner: playlist.owner,
			ownerCover: playlist.ownerCover,
			...playlist,
		}));
	}

	async function fetchLocalPlaylists(store) {
		return store
			.map(playlist => ({
				value: playlist.customData?.id,
				label: playlist.playlistTitle,
				cover: playlist.image
					? playlist.image.startsWith('data')
						? playlist.image
						: 'data:image/png;base64,' + playlist.image
					: '/assets/song-default.png',
				owner: 'Local',
				ownerCover: null,
				isLocal: true,
				...playlist,
			}))
			.filter(playlist => playlist.value);
	}

	async function loadFeaturedPlaylists() {
		const playlists = await fetchFeaturedPlaylists();
		featuredItems = playlists;
		if (activeTab === 'featured') {
			items = featuredItems;
		}
	}

	async function loadLocalPlaylists(store) {
		const localPlaylists = await fetchLocalPlaylists(store);
		if (activeTab === 'local') {
			items = localPlaylists;
		}
	}

	function switchTab(tab) {
		activeTab = tab;
		if (tab === 'featured') {
			items = featuredItems;
		} else {
			loadLocalPlaylists($playlists);
		}
	}

	function addItems(store) {
		if (!featuredItems.length) {
			loadFeaturedPlaylists();
		}
		loadLocalPlaylists(store);
	}

	function onSelect(e) {
		selectedIds = e?.detail?.map(i => i.value) ?? [];
		if (
			playlistIds.length != selectedIds.length ||
			!selectedIds.every((id, index) => index < playlistIds.length && id == playlistIds[index])
		) {
			dispatch('change', selectedIds);
		}
	}

	const itemFilter = (label, filterText) => label.toLowerCase().includes(filterText.toLowerCase());

	onMount(() => {
		let fetchedBase = false;
		document.getElementById('playlistsInput').onclick = () => {
			if (!fetchedBase) {
				fetchedBase = true;
				addItems($playlists);
			}
		};
	});

	$: playlistIds?.length && addItems($playlists);
	$: value = items?.length && playlistIds?.length && playlistIds != [''] ? items.filter(i => (playlistIds ?? []).includes(i.value)) : null;

	function handleTabClick(tab, e) {
		e.preventDefault();
		e.stopPropagation();
		switchTab(tab);
		// Re-focus the select input after switching tabs
		document.querySelector('.select-wrapper .selectContainer input')?.focus();
	}
</script>

<PickerBlock {icon} hasValue={!!playlistIds?.filter(id => id?.length)?.length} open={listOpen}>
	<div class="select-wrapper">
		<div class="tabs-dropdown">
			<button class:activetab={activeTab === 'featured'} on:click={e => handleTabClick('featured', e)}> Featured </button>
			<button class:activetab={activeTab === 'local'} on:click={e => handleTabClick('local', e)}> Local </button>
		</div>
		<Select
			id="playlistsInput"
			{value}
			{items}
			{itemFilter}
			Item={PlaylistPickerItem}
			MultiSelection={PlaylistPickerMultiItem}
			{placeholder}
			isSearchable={true}
			isMulti={true}
			bind:listOpen
			on:select={onSelect}
			on:clear />
	</div>
</PickerBlock>

<style>
	.select-wrapper {
		position: relative;
		width: 100%;
	}

	.tabs-dropdown {
		position: absolute;
		bottom: 100%;
		left: 0;
		right: 0;
		display: none;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		z-index: 8;
		transition: opacity 0.2s;
		backdrop-filter: blur(5px);
		padding: 0.5em 0.5em 0;
		border-radius: 8px 8px 0 0;
	}

	:global(.select-wrapper:has(.selectContainer.focused) .tabs-dropdown) {
		display: flex;
	}

	.tabs-dropdown button {
		flex: 1;
		padding: 0.5rem 1rem;
		background: #333;
		border: none;
		border-radius: 4px;
		color: #fff;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.tabs-dropdown button:hover {
		background: #444;
	}

	.tabs-dropdown button.activetab {
		background: #555;
	}

	:global(.selectContainer) {
		width: 100%;
	}
</style>
