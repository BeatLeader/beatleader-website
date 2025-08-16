<script>
	import {navigate, useLocation} from 'svelte-routing';
	import {fly} from 'svelte/transition';
	import createReepresetStore from '../stores/http/http-reepreset-store';
	import createAccountStore from '../stores/beatleader/account';
	import ssrConfig from '../ssr-config';
	import Pager from '../components/Common/Pager.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {debounce} from '../utils/debounce';
	import createReepresetsService from '../services/beatleader/reepresets';
	import {SsrHttpResponseError} from '../network/errors';
	import PlayerCard from '../components/Ranking/PlayerCard.svelte';
	import PresetInfo from '../components/ReePresets/PresetInfo.svelte';
	import Button from '../components/Common/Button.svelte';
	import Dialog from '../components/Common/Dialog.svelte';
	import Error from '../components/Common/Error.svelte';
	import Commentary from '../components/ReePresets/Commentary.svelte';

	export let presetId;
	export let page = 1;

	const FILTERS_DEBOUNCE_MS = 500;

	document.body.classList.remove('slim');

	const location = useLocation();
	const account = createAccountStore();

	const reepresetService = createReepresetsService();

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	const buildFiltersFromLocation = location => {
		const processString = val => val?.toString() ?? '';

		const params = [{key: 'search', default: '', process: processString}];

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

	const presetsStore = createReepresetStore(presetId, page, currentFilters);

	function changePageAndFilters(presetId, newPage, newLocation) {
		if (!presetId) return;

		currentFilters = buildFiltersFromLocation(newLocation);

		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentPage = newPage;
		presetsStore.fetch(presetId, currentPage, {...currentFilters});
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/preset/${presetId}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`, {preserveScroll: true});
	}

	function navigateToCurrentPageAndFilters() {
		navigate(`/preset/${presetId}/${currentPage}?${buildSearchFromFilters(currentFilters)}`, {preserveScroll: true});
	}

	function onSearchChanged(e) {
		currentFilters.search = e.target.value ?? '';
		navigateToCurrentPageAndFilters();
	}
	const debouncedOnSearchChanged = debounce(onSearchChanged, FILTERS_DEBOUNCE_MS);

	$: document.body.scrollIntoView({behavior: 'smooth'});

	$: isLoading = presetsStore.isLoading;
	$: pending = presetsStore.pending;
	$: numOfItems = $presetsStore ? $presetsStore?.metadata?.total : null;
	$: itemsPerPage = $presetsStore ? $presetsStore?.metadata?.itemsPerPage : 10;

	$: changePageAndFilters(presetId, page, location);

	$: preset = $presetsStore?.container ?? null;
	$: commentsPage = $presetsStore?.data ?? [];

	$: presetOwnerId = preset?.owner ?? null;
	$: isFounder = preset?.id && presetOwnerId === $account?.player?.playerId;

	$: mainPlayerId = $account?.id;
</script>

<svelte:head>
	<title>{preset?.name ?? ''} ReeSabers preset / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content">
		<ContentBox bind:box={boxEl}>
			<PresetInfo
				{preset}
				on:removed={() => navigate('/reepresets?refresh=true')}
				on:added={() => presetsStore.refresh()}
				on:cancel={() => presetsStore.refresh()} />

			{#if $isLoading}<Spinner />{/if}

			{#if preset && !preset.commentsDisabled}
				<Commentary {preset} currentPlayerId={mainPlayerId} />
			{:else}
				Comments are disabled
			{/if}
		</ContentBox>
	</article>
</section>

<style>
	.align-content {
		display: flex;
		align-items: flex-start !important;
		justify-content: center !important;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	.ranking-grid-row {
		display: grid;
		grid-template-columns: auto 2.4em;
		grid-gap: 0.4em;
		align-items: center;
		justify-items: center;
	}

	.players {
		margin-top: 1rem;
		grid-gap: 0.5em;
	}

	.players:not(.with-icons) .ranking-grid-row {
		grid-template-columns: 1fr;
	}

	.players :global(> *:last-child) {
		border-bottom: none !important;
	}
</style>
