<script>
	import {navigate} from 'svelte-routing';
	import {createEventDispatcher} from 'svelte';
	import {fade, fly} from 'svelte/transition';
	import createPresetsStore from '../stores/http/http-reepresets-store';
	import createAccountStore from '../stores/beatleader/account';
	import createPresetService from '../services/beatleader/reepresets';
	import {debounce} from '../utils/debounce';
	import ssrConfig from '../ssr-config';
	import Pager from '../components/Common/Pager.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import Button from '../components/Common/Button.svelte';
	import PresetInfo from '../components/ReePresets/PresetInfo.svelte';
	import PresetInfoSmall from '../components/ReePresets/PresetInfoSmall.svelte';

	export let page = 1;
	export let location;

	const FILTERS_DEBOUNCE_MS = 500;

	document.body.classList.remove('slim');
	const dispatch = createEventDispatcher();
	const presetService = createPresetService();

	let createMode = false;
	let createError = null;
	let createIsSaving = false;

	let shouldBeForceRefreshed = new URLSearchParams(location?.search ?? '')?.get('refresh') ?? false;

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	const buildFiltersFromLocation = location => {
		const processString = val => val?.toString();

		const params = [
			{key: 'search', default: '', process: processString},
			{key: 'sortBy', default: 'likes', process: processString},
			{key: 'order', default: 'desc', process: processString},
		];

		const searchParams = new URLSearchParams(location?.search ?? '');

		return params.reduce(
			(cum, param) => ({
				...cum,
				[param.key]: param.process(searchParams.get(param.key)) ?? param.default,
			}),
			{}
		);
	};
	const buildSearchFromFilters = filters => {
		if (!filters) return '';

		const searchParams = new URLSearchParams();
		Object.entries(filters).forEach(([key, value]) => searchParams.append(key, value));

		return searchParams.toString();
	};

	let currentPage = page;
	let currentFilters = buildFiltersFromLocation(location);
	let boxEl = null;

	const presetsStore = createPresetsStore(page, currentFilters);

	function changePageAndFilters(newPage, newLocation, force) {
		shouldBeForceRefreshed = false;

		currentFilters = buildFiltersFromLocation(newLocation);

		sortValues = sortValues1.map(v => {
			let result = {...v};
			if (result.id == currentFilters.sortBy) {
				result.iconFa = `fa fa-long-arrow-alt-${currentFilters.order === 'asc' ? 'up' : 'down'}`;
				sortValue = result;
			}

			return result;
		});

		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentPage = newPage;
		presetsStore.fetch(currentPage, {...currentFilters}, force);
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/reepresets/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`, {preserveScroll: true});
	}

	function navigateToCurrentPageAndFilters() {
		navigate(`/reepresets/${currentPage}?${buildSearchFromFilters(currentFilters)}`, {preserveScroll: true});
	}

	function onSearchChanged(e) {
		currentFilters.search = e.target.value ?? '';
		navigateToCurrentPageAndFilters();
	}

	const debouncedOnSearchChanged = debounce(onSearchChanged, FILTERS_DEBOUNCE_MS);

	function onPresetClick(preset) {
		if (!preset?.id) return;

		navigate(`/reepreset/${preset.id}`);
	}

	async function onPresetAddedOrRemoved() {
		await presetsStore.refresh();
		createMode = false;
	}

	const account = createAccountStore();

	let sortValues1 = [
		{id: 'date', label: 'Date', title: 'Sort by Date', iconFa: 'fa fa-clock'},
		{id: 'downloads', label: 'Downloads', title: 'Sort by downloads count', iconFa: 'fa fa-floppy-disk'},
		{id: 'likes', label: 'Likes', title: 'Sort by likes', iconFa: 'fa fa-heart'},
		{id: 'comments', label: 'Comments', title: 'Sort by comments count', iconFa: 'fa fa-message'},
	];
	let sortValues = sortValues1;
	let sortValue = sortValues[0];

	function onSortChange(event) {
		if (!event?.detail?.id) return null;

		if (currentFilters.sortBy == event.detail.id) {
			currentFilters.order = currentFilters.order === 'asc' ? 'desc' : 'asc';
		} else {
			currentFilters.sortBy = event.detail.id;
		}

		navigateToCurrentPageAndFilters();
	}

	$: document.body.scrollIntoView({behavior: 'smooth'});

	$: isLoading = presetsStore.isLoading;
	$: pending = presetsStore.pending;
	$: numOfPresets = $presetsStore ? $presetsStore?.metadata?.total : null;
	$: itemsPerPage = $presetsStore ? $presetsStore?.metadata?.itemsPerPage : 10;

	$: changePageAndFilters(page, location, shouldBeForceRefreshed);

	$: presetsPage = $presetsStore?.data ?? [];
</script>

<svelte:head>
	<title>ReeSabers Presets / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<ContentBox bind:box={boxEl}>
			<h1 class="title is-5">
				ReeSabers Presets

				{#if $isLoading}
					<Spinner />
				{/if}
			</h1>

			{#if createMode}
				<ContentBox>
					<PresetInfo
						enableCreateMode={true}
						on:added={onPresetAddedOrRemoved}
						on:removed={onPresetAddedOrRemoved}
						on:cancel={() => {
							createMode = false;
						}} />
				</ContentBox>
			{:else if $account?.player}
				<Button
					iconFa="fas fa-bullhorn"
					label="Publish new preset"
					type="primary"
					on:click={() => {
						createMode = true;
					}} />
			{/if}

			{#if presetsPage?.length}
				<div class="presets grid-transition-helper">
					{#each presetsPage as preset, idx (preset.id)}
						<div class={`preset-line row-${idx}`} in:fly|global={{delay: idx * 10, x: 100}}>
							<div class="main" on:click={() => onPresetClick(preset)}>
								<PresetInfoSmall {preset} />
							</div>
						</div>
					{/each}
				</div>

				<Pager
					totalItems={numOfPresets}
					{itemsPerPage}
					itemsPerPageValues={null}
					currentPage={currentPage - 1}
					loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
					mode={numOfPresets ? 'pages' : 'simple'}
					on:page-changed={onPageChanged} />
			{:else if !$isLoading}
				<p>No presets found.</p>
			{/if}
		</ContentBox>
	</article>

	<aside>
		<ContentBox>
			<h2 class="title is-5">Filters</h2>

			<section class="filter">
				<label>Author/Preset Name</label>
				<input type="text" placeholder="Search for preset..." value={currentFilters.search} on:input={debouncedOnSearchChanged} />
			</section>

			<Switcher values={sortValues} value={sortValue} on:change={onSortChange} />
		</ContentBox>
	</aside>
</section>

<style>
	.align-content {
		display: flex;
		justify-content: flex-end !important;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
		overflow: visible;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	aside {
		width: 25em;
	}

	aside .filter {
		margin-bottom: 1.5rem;
		transition: opacity 300ms;
	}

	aside .filter.disabled {
		opacity: 0.25;
	}

	aside label {
		display: block;
		font-weight: 500;
		margin-bottom: 1rem;
	}

	aside .filter.disabled label {
		cursor: help;
	}

	aside label span {
		color: var(--beatleader-primary);
	}

	aside input {
		width: 100%;
		font-size: 1em;
		color: var(--beatleader-primary);
		background-color: var(--foreground);
		border: none;
		border-bottom: 1px solid var(--faded);
		outline: none;
	}

	aside :global(.switch-types) {
		justify-content: flex-start;
	}

	input::placeholder {
		color: var(--faded) !important;
	}

	.presets :global(> *:last-child) {
		border-bottom: none !important;
	}

	.preset-line {
		border-bottom: 1px solid var(--row-separator);
		padding: 0.5em 0;
	}

	.preset-line:last-child {
		border-bottom: none;
	}

	.presets .preset-line:hover {
		background-color: var(--dimmed);
		cursor: pointer;
	}

	.preset-line .icons.up-to-tablet + .main {
		padding-top: 0;
	}

	.preset-line .main {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		grid-column-gap: 0.75em;
	}

	.preset-line .main > *:last-child {
		margin-right: 0;
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}
	}
</style>
