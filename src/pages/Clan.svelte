<script>
	import Button from '../components/Common/Button.svelte';
	import ClanInfo from '../components/Clans/ClanInfo.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import createClanService from '../services/beatleader/clan';
	import createClanStore from '../stores/http/http-clan-store';
	import createAccountStore from '../stores/beatleader/account';
	import {createEventDispatcher} from 'svelte';
	import {debounce} from '../utils/debounce';
	import Dialog from '../components/Common/Dialog.svelte';
	import Error from '../components/Common/Error.svelte';
	import {fly} from 'svelte/transition';
	import Icons from '../components/Song/Icons.svelte';
	import {navigate} from 'svelte-routing';
	import Pager from '../components/Common/Pager.svelte';
	import PlayerCard from '../components/Ranking/PlayerCard.svelte';
	import Rain from '../components/Common/Rain.svelte';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import SongCover from '../components/Player/SongCover.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ssrConfig from '../ssr-config';
	import {SsrHttpResponseError} from '../network/errors';
	import stringify from 'json-stable-stringify';
	import Switcher from '../components/Common/Switcher.svelte';

	export let clanId;
	export let type = 'players';
	export let page = 1;
	export let location;
	export let dontNavigate = false;
	export let dontChangeType = false;

	const FILTERS_DEBOUNCE_MS = 500;

	document.body.classList.remove('slim');

	const account = createAccountStore();

	const clanService = createClanService();

	const dispatch = createEventDispatcher();

	let currentClanId = clanId;

	// FILTERS ---------------------------------------------------------------------------------

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

	function scrollToTop() {
		if (boxEl) scrollToTargetAdjusted(boxEl, 44);
	}

	// TYPES -----------------------------------------------------------------------------------

	let currentType = type;

	let availableTypeOptions = [
		{
			type: 'players',
			label: 'Players',
			iconFa: 'fas fa-user-friends',
			url: `/clan/${currentClanId}/players`,
			filters: {countries: ''},
		},
		{
			type: 'capturedleaderboards',
			label: 'Captured Leaderboards',
			iconFa: 'fas fa-globe-americas',
			url: `/clan/${currentClanId}/capturedleaderboards`,
			filters: {countries: ''},
		}
	]
	let typeOptions = availableTypeOptions.map(to => to);

	const stringifyFilters = (query, keys) =>
		stringify((keys ?? Object.keys(query)).reduce((obj, k) => ({...obj, [k]: query?.[k] ?? ''}), {})).toLowerCase();

	const findCurrentTypeOption = (type, filters) => {
		const exactMatch = typeOptions.find(
			to => to?.type === type && stringifyFilters(to?.filters ?? {}) === stringifyFilters(filters, Object.keys(to?.filters ?? []))
		);
		if (exactMatch) return exactMatch;

		return typeOptions.find(to => to?.type === type) ?? null;
	};

	let currentTypeOption = findCurrentTypeOption(currentType, currentFilters) ?? typeOptions[0];

	// EVENTS ----------------------------------------------------------------------------------

	const clanStore = createClanStore(currentClanId, currentType, page, currentFilters)

	function changeParams(newClanId, newType, newPage, newLocation) {
		if (newLocation === undefined) newLocation = {search: `?${buildSearchFromFilters(currentFilters)}`};

		currentFilters = buildFiltersFromLocation(newLocation);

		currentClanId = newClanId;

		currentType = newType;
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		const newCurrentTypeOption = findCurrentTypeOption(currentType, currentFilters);
		if (newCurrentTypeOption) currentTypeOption = newCurrentTypeOption;

		currentPage = newPage;
		clanStore.fetch(currentClanId, currentType, currentPage, {...currentFilters});
	}

	function changePageAndFilters(clanId, newPage, newLocation) {
		if (!clanId) return;

		currentFilters = buildFiltersFromLocation(newLocation);

		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentPage = newPage;
		clanStore.fetch(clanId, currentPage, {...currentFilters});
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/clan/${currentClanId}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
	}

	function onTypeChanged(event) {
		const newType = event?.detail?.type ?? null;
		if (!newType) return;

		const newFilters = {...currentFilters, ...(event?.detail?.filters ?? null)};
		if (!dontNavigate) navigate(`/clan/${currentClanId}/${newType}/1?${buildSearchFromFilters(newFilters)}`);
		else if (!dontChangeType) changeParams(currentClanId, newType, 1, {search: `?${buildSearchFromFilters(newFilters)}`});

		dispatch('type-changed', {clanId: currentClanId, type: newType, page: currentPage, filters: newFilters});
	}

	function navigateToCurrentPageAndFilters() {
		navigate(`/clan/${currentClanId}/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
	}

	function onSearchChanged(e) {
		currentFilters.search = e.target.value ?? '';
		navigateToCurrentPageAndFilters();
	}
	const debouncedOnSearchChanged = debounce(onSearchChanged, FILTERS_DEBOUNCE_MS);

	const canBeKicked = (clan, player) => clan?.leaderID && clan.leaderID !== player?.playerId;

	let kickedPlayer = null;
	let kickingError = null;
	async function onKick(player) {
		if (!player?.playerId) return;

		try {
			kickingError = null;

			await clanService.kick(player);

			kickedPlayer = null;

			await clanStore.refresh();
		} catch (err) {
			if (err instanceof SsrHttpResponseError) {
				const htmlError = await err.getResponse().text();
				kickingError = htmlError?.length ? htmlError : err;
			} else {
				kickingError = err;
			}
		}
	}

	// REACTIVES -------------------------------------------------------------------------------

	$: changeParams(clanId, type, page, location);

	$: isLoading = clanStore.isLoading;
	$: pending = clanStore.pending;
	$: numOfItems = $clanStore ? $clanStore?.metadata?.total : null;
	$: itemsPerPage = $clanStore ? $clanStore?.metadata?.itemsPerPage : 10;

	//$: changePageAndFilters(currentClanId, page, location);
	$: scrollToTop($pending);

	$: clan = $clanStore?.container ?? null;
	$: playersPage = $clanStore?.data ?? [];
	$: capturesPage = clan?.capturedLeaderboards ?? [];

	$: clanLeaderId = clan?.leaderID ?? null;
	$: isFounder = clan?.id && clanLeaderId === $account?.player?.playerId;

	$: mainPlayerId = $account?.id;
</script>

<svelte:head>
	<title>{clan?.name ?? ''} / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

{#if clan?.tag == 'BSFR' || clan?.tag == 'BB'}
	<Rain baguete={clan?.tag == 'BSFR'} />
{/if}

<section class="align-content">
	<article class="page-content">
		<ContentBox bind:box={boxEl}>
			<ClanInfo
				{clan}
				on:removed={() => navigate('/clans?refresh=true')}
				on:accepted={() => clanStore.refresh()}
				on:left={() => clanStore.refresh()} />

			{#if $isLoading}<Spinner />{/if}

			{#if kickedPlayer}
				<Dialog
					type="confirm"
					title="Are you sure?"
					okButton="Yeah!"
					cancelButton="Hell no!"
					on:confirm={() => onKick(kickedPlayer)}
					on:cancel={() => (kickedPlayer = null)}>
					<div slot="content">
						<div>You will kick <strong>{kickedPlayer?.name ?? '<Unknown player>'}</strong> out of the clan...</div>

						{#if kickingError}
							<Error error={kickingError} />
						{/if}
					</div>
				</Dialog>
			{/if}
			<Switcher values={typeOptions} value={currentTypeOption} on:change={onTypeChanged} />
			{#if currentType === 'players'}
				{#if playersPage?.length}
					<div class="players grid-transition-helper" class:with-icons={isFounder}>
						{#each playersPage as player, idx (player.playerId)}
							<div class="ranking-grid-row" in:fly={{delay: idx * 10, x: 100}}>
								<PlayerCard
									{player}
									playerId={mainPlayerId}
									withCrown={clanLeaderId === player.playerId}
									selectedClanTag={clan?.tag}
									value={player?.playerInfo?.pp}
									valueProps={{suffix: 'pp', zero: '-'}} />

								{#if isFounder && canBeKicked(clan, player)}
									<Button
										iconFa="fas fa-trash-alt"
										title="Kick a player out of the clan"
										type="danger"
										noMargin={true}
										on:click={() => (kickedPlayer = player)} />
								{/if}
							</div>
						{/each}
					</div>

					<Pager
						totalItems={numOfItems}
						{itemsPerPage}
						itemsPerPageValues={null}
						currentPage={currentPage - 1}
						loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
						mode={numOfItems ? 'pages' : 'simple'}
						on:page-changed={onPageChanged} />
				{:else if !$isLoading}
					<p>No clans found.</p>
				{/if}
			{:else if currentType === 'capturedleaderboards'}
				{#if capturesPage?.length}
					<div class="songs grid-transition-helper">
						{#each capturesPage as map, idx (map.id)}
							<div class={`song-line row-${idx}`} in:fly={{delay: idx * 10, x: 100}}>
								<div class="mobile-only">
									{#if map?.song?.hash?.length}
										<Icons hash={map.song.hash} diffInfo={map?.diffInfo} />
									{/if}
								</div>

								<div class="main">
									<SongCover leaderboard={map} url={`/leaderboard/global/${map.id}/1`} />

									<div class="songinfo">
										<a href={`/leaderboard/global/${map.id}/1`} on:click|preventDefault={() => navigate(`/leaderboard/global/${map.id}/1`)}>
											<span class="name">{map?.song?.name} {map?.song?.subName}</span>
											<div class="author">{map?.song?.author} <small>{map?.song?.mapper}</small></div>
										</a>
									</div>

									{#if map?.plays}
										<div>
											{map?.plays} plays
										</div>
									{/if}

									<!--{#if currentFilters.sortBy == 'timestamp'}
										<MapTimesetDescription {map} />
									{/if}-->

									{#if map?.song?.hash?.length}
										<div class="tablet-and-up">
											<Icons hash={map.song.hash} diffInfo={{diff: map?.difficulty?.difficultyName, type: map?.difficulty?.modeName}} />
										</div>
									{/if}
								</div>

								<!--{#if map?.myScore}
									<SongScore
										playerId={map.myScore.playerId}
										songScore={processScore({leaderboard: map, ...map.myScore})}
										showSong={false}
										noIcons={true}
										inList={false}
										{idx}
										service={'beatleader'} />
								{/if}-->
							</div>
						{/each}
					</div>

					<Pager
						totalItems={capturesPage.length}
						{itemsPerPage}
						itemsPerPageValues={null}
						currentPage={currentPage - 1}
						loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
						mode={capturesPage.length ? 'pages' : 'simple'}
						on:page-changed={onPageChanged} />
				{:else}
					<p>No captured leaderboards found.</p>
				{/if}
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

	



	/* .align-content {
		display: flex;
		justify-content: flex-end !important;
	} */

	.page-content {
		max-width: 65em;
		width: 100%;
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
		margin: 0.75rem 0;
	}

	aside .filter.disabled label {
		cursor: help;
	}

	aside label span {
		color: var(--beatleader-primary);
	}

	aside select {
		background-color: transparent;
		margin-bottom: 0.25em;
	}

	aside select option {
		color: var(--textColor);
		background-color: var(--background);
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

	aside h2:not(:first-of-type) {
		margin-top: 1.5em;
	}

	aside :global(.rangeSlider.pip-labels) {
		margin-top: 1.5em;
		margin-bottom: 4em;
	}

	input::placeholder {
		color: var(--faded) !important;
	}

	.songs :global(> *:last-child) {
		border-bottom: none !important;
	}

	.song-line {
		border-bottom: 1px solid var(--row-separator);
		padding: 0.5em 0;
	}

	.song-line .icons.up-to-tablet + .main {
		padding-top: 0;
	}

	.song-line .main {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		grid-column-gap: 0.75em;
	}

	.song-line .main > *:last-child {
		margin-right: 0;
	}

	.songinfo {
		flex-grow: 1;
		text-align: left;
		font-size: 0.95rem;
		font-weight: 500;
	}

	.songinfo {
		color: var(--alternate);
	}

	.songinfo small {
		margin-left: 0.25em;
		font-size: 0.75em;
		color: var(--ppColour);
	}

	.icons {
		width: 7em;
		font-size: 0.75em;
		text-align: right;
		margin-right: 0;
		margin-bottom: 0.5em;
	}

	.icons:empty {
		margin-bottom: 0 !important;
	}

	.icons :global(> *) {
		margin-bottom: 0.25em !important;
	}

	.playlist-buttons {
		display: flex;
		margin-top: 1em;
		column-gap: 0.5em;
		flex-wrap: wrap;
	}

	.duplicateDiffsContainer {
		display: flex;
	}

	#duplicateDiffs {
		width: auto;
	}

	:global(.playlist-button) {
		height: 1.6em;
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column-reverse;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}
	}

	@media screen and (max-width: 767px) {
		.icons {
			margin-bottom: 0.5em;
			width: 100%;
		}

		.playlist-buttons {
			flex-direction: column;
		}
	}

	@media screen and (max-width: 520px) {
		.song-line .main {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			grid-column-gap: 0.75em;
		}

		.songinfo {
			text-align: center;
		}
	}
</style>