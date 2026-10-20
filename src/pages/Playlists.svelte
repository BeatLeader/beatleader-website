<script>
	import {getContext, onMount} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import {getNotificationsContext} from 'svelte-notifications';
	import {MetaTags} from 'svelte-meta-tags';
	import {produce} from 'immer';
	import ssrConfig from '../ssr-config';
	import createPlaylistStore, {isReplayPlaylist, playlistItemCount} from '../stores/playlists';
	import createAccountStore from '../stores/beatleader/account';
	import {configStore} from '../stores/config';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import AsideBox from '../components/Common/AsideBox.svelte';
	import Button from '../components/Common/Button.svelte';
	import Pager from '../components/Common/Pager.svelte';
	import Select from '../components/Settings/Select.svelte';
	import PlaylistRow from '../components/Playlists/PlaylistRow.svelte';
	import PlaylistEditDialog from '../components/Playlists/PlaylistEditDialog.svelte';
	import PlaylistTypeIcon from '../components/Playlists/PlaylistTypeIcon.svelte';
	import {MAPS_ICON, REPLAYS_ICON} from '../components/Playlists/icons';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';

	export let index = null;

	const playlists = createPlaylistStore();
	const account = createAccountStore();
	const {addNotification} = getNotificationsContext();
	const {open, close} = getContext('simple-modal');

	const typeOptions = [
		{key: 'all', label: 'All', iconFa: 'fas fa-layer-group'},
		{key: 'maps', label: 'Maps', icon: MAPS_ICON},
		{key: 'replays', label: 'Replays', icon: REPLAYS_ICON},
	];
	const ownerOptions = [
		{key: 'all', label: 'All'},
		{key: 'mine', label: 'Mine', iconFa: 'fas fa-user'},
		{key: 'shared', label: 'Shared with me', iconFa: 'fas fa-user-group'},
	];
	const sortOptions = [
		{value: 'created', name: 'Created', icon: 'fa-clock', order: 'desc'},
		{value: 'updated', name: 'Updated', icon: 'fa-pen', order: 'desc'},
		{value: 'title', name: 'Title', icon: 'fa-font', order: 'asc'},
		{value: 'size', name: 'Size', icon: 'fa-layer-group', order: 'desc'},
	];
	const tabOptions = [
		{value: 'my-playlists', label: 'My playlists', iconFa: 'fas fa-user', url: '/playlists', cls: 'playlist-tab-button'},
		{value: 'featured', label: 'Featured', iconFa: 'fas fa-star', url: '/playlists/featured/1', cls: 'playlist-tab-button'},
	];
	const itemsPerPageValues = [5, 10, 20, 50];

	let search = '';
	let typeFilter = typeOptions[0];
	let ownerFilter = ownerOptions[0];
	let sort = 'created';
	let order = 'desc';
	let page = 0;
	let itemsPerPage = $configStore?.playlist?.cardsPerPage ?? 10;
	let expanded = {};
	let fileInput;
	let fileDragOver = false;

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 4000 : 3000});
	}

	function openCreate(type) {
		open(PlaylistEditDialog, {
			mode: 'create',
			presetType: type,
			makeActive: true,
			close: () => close(),
			onDone: created => {
				if (!created) return;
				clearFilters();
				sort = 'created';
				order = 'desc';
				page = 0;
				expanded = {...expanded, [created.key]: true};
			},
		});
	}

	function setSort(option) {
		if (!option?.value || option.value === sort) return;
		sort = option.value;
		order = option.order;
	}

	function clearFilters() {
		search = '';
		typeFilter = typeOptions[0];
		ownerFilter = ownerOptions[0];
	}

	const decapitalizeFirstLetter = string => string.charAt(0).toLowerCase() + string.slice(1);

	async function uploadFile(file) {
		if (!file) return;

		let playlist;
		try {
			playlist = JSON.parse(await file.text());
		} catch (err) {
			notify("Can't read this file, is it a .bplist or .bsorlist?", 'error');
			return;
		}
		if (!playlist) return;

		for (const song of playlist.songs ?? []) {
			for (const diff of song?.difficulties ?? []) {
				if (diff?.name) diff.name = decapitalizeFirstLetter(diff.name);
			}
		}

		try {
			const created = await playlists.create(null, playlist);
			if (created?.skipped) {
				notify(`${created.skipped} items were skipped: deleted, invalid or private replays`, 'warning');
			} else if (created) {
				notify(`Uploaded ${created.playlistTitle}`);
			}
		} catch (err) {
			notify(err?.message?.length < 200 ? err.message : 'Failed to upload the playlist', 'error');
		}
	}

	function onFileInput(e) {
		uploadFile(e.target.files?.[0]);
		e.target.value = '';
	}

	function onFileDragOver(e) {
		if (!e.dataTransfer?.types?.includes('Files')) return;
		e.preventDefault();
		fileDragOver = true;
	}

	function onFileDrop(e) {
		fileDragOver = false;
		uploadFile(e.dataTransfer?.files?.[0]);
	}

	function matches(playlist, search, type, owner) {
		if (type !== 'all' && (type === 'replays') !== isReplayPlaylist(playlist)) return false;
		const shared = playlist.role === 'editor' || playlist.role === 'viewer';
		if (owner === 'mine' && shared) return false;
		if (owner === 'shared' && !shared) return false;
		if (search && !`${playlist.playlistTitle} ${playlist.playlistDescription ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
		return true;
	}

	function sorted(list, all, sort, order) {
		const age = new Map(all.map((p, i) => [p.key, i]));
		const compare = {
			created: (a, b) => age.get(b.key) - age.get(a.key),
			updated: (a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0),
			title: (a, b) => (a.playlistTitle ?? '').localeCompare(b.playlistTitle ?? ''),
			size: (a, b) => playlistItemCount(a) - playlistItemCount(b),
		}[sort];
		const result = [...list].sort(compare);
		return order === 'desc' ? result.reverse() : result;
	}

	function storeItemsPerPage(value) {
		if ($configStore?.playlist?.cardsPerPage === value) return;
		$configStore = produce($configStore, draft => {
			draft.playlist.cardsPerPage = value;
		});
	}

	function resetPage() {
		page = 0;
	}

	onMount(() => playlists.watch());

	onMount(() => {
		if (index) {
			navigate(`/playlist/${index}`, {replace: true});
			return;
		}
		const newType = new URLSearchParams(window.location.search).get('new');
		if (newType) {
			openCreate(newType === 'replays' ? 'replays' : 'maps');
		}
	});

	const isMobile = window.innerWidth < 767;

	$: loggedIn = !!$account?.id;
	$: all = $playlists ?? [];
	$: shown = sorted(
		all.filter(p => matches(p, search.trim(), typeFilter.key, loggedIn ? ownerFilter.key : 'all')),
		all,
		sort,
		order
	);
	$: search, typeFilter, ownerFilter, sort, order, resetPage();
	$: totalItems = shown.length;
	$: if (page > 0 && page * itemsPerPage >= totalItems) page = Math.max(0, Math.ceil(totalItems / itemsPerPage) - 1);
	$: pageItems = shown.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
	$: storeItemsPerPage(itemsPerPage);
	$: activeKey = $configStore?.selectedPlaylistId;
	$: filtersActive = !!search || typeFilter.key !== 'all' || ownerFilter.key !== 'all';

	const metaTitle = `Playlists / ${ssrConfig.name}`;
	const description = 'Beat Saber map and replay playlists';
	const image = CURRENT_URL + 'assets/defaultplaylisticon.png';
</script>

<svelte:head>
	<title>{metaTitle}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<div class="playlist-switcher">
			<TabSwitcher values={tabOptions} value={tabOptions[0]} on:change={() => navigate('/playlists/featured/1')} class="playlist" />
		</div>

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="list-box leaderboard"
			class:file-drag-over={fileDragOver}
			on:dragover={onFileDragOver}
			on:dragleave={() => (fileDragOver = false)}
			on:drop|preventDefault={onFileDrop}>
			<div class="list-toolbar">
				<div class="toolbar-actions">
					<button class="tool-button primary" title="New map or replay playlist" on:click={() => openCreate('maps')}>
						<i class="fas fa-plus" /><span>New playlist</span>
					</button>
					<button class="tool-button" title="Upload a .bplist or .bsorlist file, or drop it on the list" on:click={() => fileInput.click()}>
						<i class="fas fa-upload" /><span>Upload</span>
					</button>
					<input class="hidden" type="file" accept=".bplist, .bsorlist, .json" bind:this={fileInput} on:change={onFileInput} />
				</div>
				<div class="sorting">
					<span>Sort by</span>
					<Select value={sort} options={sortOptions} fontSize="0.8" on:change={e => setSort(e.detail)} />
					<Button
						cls="order-toggle"
						type="text"
						iconFa="fas {order === 'asc' ? 'fa-arrow-up-1-9' : 'fa-arrow-down-9-1'}"
						title={order === 'asc' ? 'Ascending' : 'Descending'}
						on:click={() => (order = order === 'asc' ? 'desc' : 'asc')} />
				</div>
			</div>

			{#if !loggedIn && $account && !$account.loading}
				<p class="notice">
					<i class="fas fa-hard-drive" />
					<span>
						These playlists live in this browser only.
						<a href="/signin" on:click|preventDefault={() => navigate('/signin')}>Log in</a> to sync them, share them and make replay playlists.
					</span>
				</p>
			{/if}

			{#if pageItems.length}
				{#each pageItems as playlist (playlist.key)}
					<PlaylistRow
						{playlist}
						store={playlists}
						active={playlist.key === activeKey}
						currentPlayerId={$account?.id}
						bind:expanded={expanded[playlist.key]} />
				{/each}
				{#if totalItems > itemsPerPageValues[0]}
					<div class="pager-container">
						<Pager bind:currentPage={page} bind:itemsPerPage {totalItems} {itemsPerPageValues} on:page-changed={e => (page = e.detail.page)} />
					</div>
				{/if}
			{:else if all.length}
				<div class="empty">
					<p>No playlists match the filters.</p>
					<button class="tool-button" on:click={clearFilters}><i class="fas fa-filter-circle-xmark" /><span>Clear filters</span></button>
				</div>
			{:else}
				<div class="empty">
					<span class="empty-icon"><PlaylistTypeIcon size="2.5em" /></span>
					<p>No playlists yet.</p>
					<div class="toolbar-actions">
						<button class="tool-button primary" on:click={() => openCreate('maps')}><PlaylistTypeIcon /><span>New map playlist</span></button>
						{#if loggedIn}
							<button class="tool-button replays" on:click={() => openCreate('replays')}><PlaylistTypeIcon replays={true} /><span>New replay playlist</span></button>
						{/if}
					</div>
					<small>or drop a .bplist / .bsorlist file here</small>
				</div>
			{/if}
		</div>
	</article>

	{#if all.length}
		<aside transition:fade|global>
			<AsideBox title="Filters" faicon="fas fa-filter" boolname={isMobile ? 'playlistsFiltersShownMobile' : 'playlistsFiltersShown'}>
				<section class="filter search-filter" class:has-value={search.length}>
					<i class="fas fa-search" />
					<input type="text" class="search" placeholder="Search playlists" bind:value={search} />
				</section>

				<section class="filter">
					<label>Type</label>
					<Switcher values={typeOptions} value={typeFilter} on:change={e => (typeFilter = e.detail)} />
				</section>

				{#if loggedIn}
					<section class="filter">
						<label>Owner</label>
						<Switcher values={ownerOptions} value={ownerFilter} on:change={e => (ownerFilter = e.detail)} />
					</section>
				{/if}

				{#if filtersActive}
					<Button label="Clear filters" iconFa="fas fa-filter-circle-xmark" type="text" noMargin={true} on:click={clearFilters} />
				{/if}
			</AsideBox>
		</aside>
	{/if}
</section>

<MetaTags
	title={metaTitle}
	{description}
	openGraph={{
		title: metaTitle,
		description,
		images: [{url: image}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: metaTitle,
		description,
		image,
		imageAlt: metaTitle + ' picture',
	}} />

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

	aside {
		width: 100%;
		max-width: 27em;
		min-width: 0;
	}

	.playlist-switcher {
		margin-left: 0.6em;
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

	.list-box {
		position: relative;
		margin: 0 10px 16px;
		padding: 0.5em 0.6em 0.3em;
		border-radius: 0 12px 12px 12px;
		background: rgb(26 26 26);
		box-shadow: 0 2px 10px rgb(0 0 0 / 33%);
		outline: 2px dashed transparent;
		transition: outline-color 0.15s;
	}

	.list-box.file-drag-over {
		outline-color: var(--beatleader-primary);
	}

	.list-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		padding: 0 0.1em 0.6em;
	}

	.sorting {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.3em;
		font-size: 0.95em;
	}

	.sorting :global(.order-toggle) {
		margin-bottom: 0 !important;
	}

	.toolbar-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4em;
	}

	/* Centers the icons in the 1.3em box the global `button i` style from Button.svelte gives them */
	.tool-button i,
	.sorting :global(.order-toggle i) {
		line-height: 1.3em;
	}

	.tool-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		height: 2.1em;
		padding: 0 0.9em;
		border: 1px solid color-mix(in srgb, var(--textColor, white) 15%, transparent);
		border-radius: 0.5em;
		background-color: color-mix(in srgb, var(--textColor, white) 7%, transparent);
		color: color-mix(in srgb, var(--textColor, white) 87%, transparent);
		font-family: inherit;
		font-size: 0.9em;
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color 0.15s,
			border-color 0.15s,
			filter 0.15s;
	}

	.tool-button:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 13%, transparent);
		border-color: color-mix(in srgb, var(--textColor, white) 25%, transparent);
	}

	.tool-button.primary {
		border-color: transparent;
		color: white;
		background: linear-gradient(135deg, var(--beatleader-primary), #b3007a);
		box-shadow: 0 2px 8px rgb(235 0 140 / 30%);
	}

	.tool-button.replays {
		border-color: transparent;
		color: white;
		background: linear-gradient(135deg, #2f8fe0, #1f62b0);
	}

	.tool-button.primary:hover,
	.tool-button.replays:hover {
		filter: brightness(1.12);
	}

	.notice {
		display: flex;
		align-items: center;
		gap: 0.6em;
		margin: 0 0 0.6em;
		padding: 0.5em 0.8em;
		border-radius: 8px;
		font-size: 0.9em;
		background-color: color-mix(in srgb, var(--textColor, white) 5%, transparent);
	}

	.pager-container {
		padding: 0 0.2em;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6em;
		padding: 3em 1em;
		border-radius: 12px;
		text-align: center;
	}

	.empty p {
		margin: 0;
		font-size: 1.1em;
	}

	.empty-icon {
		display: flex;
		opacity: 0.3;
	}

	.empty small {
		opacity: 0.55;
	}

	.hidden {
		display: none;
	}

	.filter {
		margin-bottom: 1.2rem;
	}

	.filter label {
		display: block;
		font-weight: 500;
		margin: 0 0 0.5rem;
	}

	.filter :global(.switch-types) {
		justify-content: flex-start;
	}

	.search-filter {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1rem;
		border: 1px solid var(--faded);
		border-radius: 4px;
		background-color: var(--dimmed);
	}

	.search-filter.has-value {
		border-color: rgba(255, 100, 150, 0.5);
	}

	.search-filter:hover,
	.search-filter:focus-within {
		background-color: var(--background);
	}

	.search-filter input {
		flex: 1;
		width: auto;
		padding: 0;
		font-size: 1em;
		line-height: 1.5;
		color: var(--beatleader-primary);
		background-color: transparent;
		border: none;
		outline: none;
	}

	.search-filter input::placeholder {
		color: var(--faded);
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column-reverse;
			align-items: center;
		}

		aside {
			max-width: 65em;
		}
	}

	@media screen and (max-width: 767px) {
		.list-box {
			margin-inline: 0;
		}

		.list-toolbar .tool-button span {
			display: none;
		}

		aside :global(.aside-box) {
			min-width: unset;
		}
	}
</style>
