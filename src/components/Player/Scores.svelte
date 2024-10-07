<script>
	import {createEventDispatcher} from 'svelte';
	import createScoresStore from '../../stores/http/http-scores-store.js';
	import createAccountStore from '../../stores/beatleader/account';
	import createPlaylistStore from '../../stores/playlists';
	import {navigate} from 'svelte-routing';
	import {opt} from '../../utils/js';
	import {getContext} from 'svelte';
	import {scrollToTargetAdjusted} from '../../utils/browser';
	import SongScore from './SongScore.svelte';
	import Error from '../Common/Error.svelte';
	import ScoreServiceSwitcher from './ScoreServiceSwitcher.svelte';
	import ScoresPager from './ScoresPager.svelte';
	import stringify from 'json-stable-stringify';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import OpDeletionDialog from './OPDeletionDialog.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue.js';
	import {configStore} from '../../stores/config.js';

	const dispatch = createEventDispatcher();
	const {open, close} = getContext('simple-modal');

	export let playerId = null;
	export let playerAlias = null;
	export let player = null;
	export let initialState = null;
	export let initialStateType = null;
	export let initialService = 'scores';
	export let initialServiceParams = {};
	export let numOfScores = null;
	export let fixedBrowserTitle = null;
	export let withPlayers = false;
	export let noIcons = false;
	export let unconstrainedPager = false;

	let scoresStore = createScoresStore(playerId, initialService, initialServiceParams, initialState, initialStateType);

	const account = createAccountStore();
	const playlists = createPlaylistStore();

	let scoresBoxEl = null;

	function changeParams(newPlayerId, newService, newServiceParams) {
		if (!newPlayerId) return null;

		scoresStore.fetch(newServiceParams, newService, newPlayerId);

		return {playerId: newPlayerId, service: newService, serviceParams: newServiceParams};
	}

	let currentPage = 1;
	let previousPage = 1;

	function onPageChanged(event) {
		if (!(event?.detail?.initial ?? false)) scrollToTop();

		const page = (event?.detail?.page ?? 0) + 1;

		previousPage = currentPage;
		currentPage = page;

		if (!(event?.detail?.initial ?? false)) {
			dispatch('page-changed', page);
		}
	}

	function unconstrainedPageChanged(newPage) {
		previousPage = currentPage;
		currentPage = newPage;
		dispatch('page-changed', newPage);
	}

	function onServiceParamsChanged(event) {
		if (!event?.detail) return;

		dispatch('service-params-changed', event.detail);
	}

	function onServiceChanged(event) {
		if (!event?.detail) return;

		scrollToTop();

		dispatch('service-changed', event.detail);
	}

	function scrollToTop() {
		if (scoresBoxEl) scrollToTargetAdjusted(scoresBoxEl, 44);
	}

	let currentService = null;
	let lastService = '';
	function updateService(scoresStore) {
		if (!scoresStore) return;

		const newService = scoresStore.getService();
		if (lastService !== newService) currentService = newService;

		lastService = newService;
	}

	let currentServiceParams = null;
	let lastServiceParams = '';
	function updateServiceParams(scoresStore) {
		if (!scoresStore) return;

		const newServiceParams = stringify(scoresStore.getServiceParams());
		if (lastServiceParams !== newServiceParams) currentServiceParams = scoresStore.getServiceParams();

		lastServiceParams = newServiceParams;
	}

	let searchToPlaylist = false;
	let makingPlaylist = false;
	let mapCount = 100;
	let duplicateDiffs = false;
	function generatePlaylist() {
		makingPlaylist = true;
		playlists.generatePlayerPlaylist(mapCount, playerId, {...currentServiceParams, duplicateDiffs}, () => {
			navigate('/playlists');
		});
	}

	$: changeParams(playerId, initialService, initialServiceParams, initialState, initialStateType);
	$: $scoresStore, updateService(scoresStore);
	$: $scoresStore, updateServiceParams(scoresStore);
	$: page = currentServiceParams?.page ?? null;
	$: totalScores = (scoresStore => (scoresStore && scoresStore.getTotalScores ? scoresStore.getTotalScores() : null))(
		scoresStore,
		$scoresStore
	);
	$: pending = scoresStore ? scoresStore.pending : null;
	$: error = scoresStore ? scoresStore.error : null;
	$: isMain = playerId && $account?.id === playerId;

	$: scoresStore && scoresStore.fetch(currentServiceParams, currentService);
	$: pagerTotalScores = totalScores !== null && totalScores !== undefined ? totalScores : numOfScores;

	$: itemsPerPage = (itemsPerPage => (itemsPerPage && itemsPerPage.getItemsPerPage ? scoresStore.getItemsPerPage() : null))(
		scoresStore,
		$scoresStore
	);

	let waiting = false;

	function removeOPScores() {
		waiting = true;
		fetch(BL_API_URL + 'user/hideopscores', {
			credentials: 'include',
			method: 'POST',
		}).then(() => {
			waiting = false;
			document.location.reload();
		});
	}

	function showRemoveOP() {
		open(OpDeletionDialog, {
			confirm: () => {
				close();
				removeOPScores();
			},
			cancel: () => {
				close();
			},
		});
	}

	$: OPScores = isMain && $scoresStore?.length && $scoresStore.find(s => s.score?.mods?.includes('OP'));
</script>

<div bind:this={scoresBoxEl}>
	{#if $error}
		<div><Error error={$error} /></div>
	{/if}

	<ScoreServiceSwitcher
		{playerId}
		{playerAlias}
		{player}
		service={currentService}
		serviceParams={currentServiceParams}
		loadingService={$pending?.service}
		loadingServiceParams={$pending?.serviceParams}
		on:service-change={onServiceChanged}
		on:service-params-change={onServiceParamsChanged} />

	<div class="darkened-background scores-container">
		{#if $scoresStore && $scoresStore.length}
			<div class="song-scores grid-transition-helper">
				{#each $scoresStore as songScore, idx ((songScore?.id ?? songScore?.score?.leaderboardId ?? '') + (songScore?.score?.timeset ?? songScore?.score?.score ?? '') + (songScore?.score?.attemptsCount ?? '') + currentService + (songScore?.timeSet ?? songScore?.player?.playerId ?? ''))}
					<SongScore
						{playerId}
						{songScore}
						{fixedBrowserTitle}
						{idx}
						service={currentService}
						{withPlayers}
						{noIcons}
						animationSign={currentPage >= previousPage ? 1 : -1}
						additionalStat={currentServiceParams?.sort} />
				{/each}
			</div>
		{:else}
			<p>No scores.</p>
		{/if}

		{#if currentService == 'scores' && $configStore.profileParts.scoresToPlaylist}
			<Button
				cls={pagerTotalScores > itemsPerPage ? 'scores-playlist-button' : 'scores-playlist-button-relative'}
				iconFa="fas fa-list"
				type={searchToPlaylist ? 'danger' : 'default'}
				label={searchToPlaylist ? 'Cancel' : 'To Playlist!'}
				on:click={() => (searchToPlaylist = !searchToPlaylist)} />
			{#if searchToPlaylist}
				{#if makingPlaylist}
					<Spinner />
				{:else}
					<span>Maps count:</span>
					<RangeSlider
						range
						min={0}
						max={1000}
						step={1}
						values={[mapCount]}
						hoverable
						float
						pips
						pipstep={100}
						all="label"
						on:change={event => {
							mapCount = event.detail.values[0];
						}} />
					<div class="duplicateDiffsContainer">
						<input type="checkbox" id="duplicateDiffs" label="Duplicate map per diff" bind:checked={duplicateDiffs} />
						<label for="duplicateDiffs" title="Will include every diff as a separate map entry">Duplicate map per diff</label>
					</div>
					<Button cls="playlist-button" iconFa="fas fa-wand-magic-sparkles" label="Generate playlist" on:click={() => generatePlaylist()} />
				{/if}
			{/if}
		{/if}
	</div>

	{#if unconstrainedPager}
		{#if Number.isFinite(page)}
			<div class="unconstrained-pager">
				<Button
					type="primary"
					iconFa="fas fa-angle-left"
					square={true}
					squareSize="1.5em"
					disabled={$pending?.serviceParams?.page || page == 1}
					on:click={() => unconstrainedPageChanged(page - 1)} />
				{#if $pending?.serviceParams?.page}
					<Spinner />
				{:else}
					{page}
				{/if}
				<Button
					type="primary"
					square={true}
					squareSize="1.5em"
					iconFa="fas fa-angle-right"
					disabled={$pending?.serviceParams?.page || !$scoresStore || $scoresStore.length < itemsPerPage}
					on:click={() => unconstrainedPageChanged(page + 1)} />
			</div>
		{/if}
	{:else if Number.isFinite(page) && (!Number.isFinite(pagerTotalScores) || pagerTotalScores > 0)}
		<ScoresPager
			{playerId}
			service={currentService}
			serviceParams={currentServiceParams}
			totalItems={pagerTotalScores}
			currentPage={page - 1}
			fixedItemsPerPage={itemsPerPage}
			loadingPage={$pending?.serviceParams?.page ? $pending.serviceParams.page - 1 : null}
			on:page-changed={onPageChanged} />
	{/if}

	{#if OPScores}
		{#if waiting}
			<Spinner />
		{:else}
			<Button label="Remove OP scores" type="danger" iconFa="fas fa-trash-alt" on:click={showRemoveOP} />
		{/if}
	{/if}
</div>

<style>
	.song-scores :global(> *:last-child) {
		border-bottom: none !important;
	}

	:global(.scores-playlist-button) {
		height: 1.6em;
		position: absolute !important;
		right: 1em;
		margin-top: 1.1em !important;
	}

	:global(.scores-playlist-button-relative) {
		height: 1.6em;
		margin-top: 0.6em !important;
	}

	.duplicateDiffsContainer {
		display: flex;
	}

	.scores-container {
		padding: 0.5em;
		border-radius: 8px;
	}

	.unconstrained-pager {
		display: flex;
		gap: 0.5em;
		margin-top: 0.5em;
		margin-bottom: -0.6em;
	}

	:global(.unconstrained-pager .fas) {
		margin-top: -0.4em;
	}

	#duplicateDiffs {
		width: auto;
	}
	@media screen and (max-width: 768px) {
		:global(.scores-playlist-button) {
			margin-top: 9em !important;
			right: auto;
		}
	}
</style>
