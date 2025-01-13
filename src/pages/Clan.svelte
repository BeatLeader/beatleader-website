<script>
	import {navigate} from 'svelte-routing';
	import {fly, fade} from 'svelte/transition';
	import {flip} from 'svelte/animate';
	import createClanStore from '../stores/http/http-clan-store';
	import createClanWithMapsStore from '../stores/http/http-clan-with-maps-store';
	import createAccountStore from '../stores/beatleader/account';
	import ssrConfig from '../ssr-config';
	import Pager from '../components/Common/Pager.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {debounce} from '../utils/debounce';
	import createClanService from '../services/beatleader/clan';
	import {SsrHttpResponseError} from '../network/errors';
	import PlayerCard from '../components/Ranking/PlayerCard.svelte';
	import ClanInfo from '../components/Clans/ClanInfo.svelte';
	import Button from '../components/Common/Button.svelte';
	import Dialog from '../components/Common/Dialog.svelte';
	import Error from '../components/Common/Error.svelte';
	import Rain from '../components/Common/Rain.svelte';
	import RandomRain from '../components/Common/RandomRain.svelte';
	import ClanRankingSong from '../components/Leaderboard/ClanRankingSong.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import {processBoolFilter} from '../utils/filters';
	import ClanMeta from '../components/Clans/ClanMeta.svelte';
	import ClanChart from '../components/Clans/ClanChart.svelte';
	import ScoreServiceFilters from '../components/Player/ScoreServiceFilters.svelte';
	import SelectFilter from '../components/Player/ScoreFilters/SelectFilter.svelte';
	import ClanSkillTriangle from '../components/Clans/ClanSkillTriangle.svelte';

	export let clanId;
	export let page = 1;
	export let maps = false;
	export let location;

	const FILTERS_DEBOUNCE_MS = 500;

	document.body.classList.remove('slim');
	const account = createAccountStore();

	const clanService = createClanService();

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	const processString = val => val?.toString();

	const params = [
		{key: 'search', default: '', process: processString},
		{key: 'sortBy', default: 'pp', process: processString},
		{key: 'order', default: 'desc', process: processString},
		{key: 'primary', default: false, process: processBoolFilter},
		{key: 'playedStatus', default: null, process: processString},
	];

	const buildFiltersFromLocation = location => {
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
		Object.entries(filters).forEach(([key, value]) => {
			if (params.find(p => p.key == key).default != value) {
				searchParams.append(key, value);
			}
		});

		return searchParams.toString();
	};

	let currentPage = page;
	let currentFilters = buildFiltersFromLocation(location);
	let boxEl = null;

	const clanWithMapsStore = createClanWithMapsStore(clanId, page, currentFilters);
	const clanWithPlayersStore = createClanStore(clanId, page, currentFilters);

	var clanStore = maps ? clanWithMapsStore : clanWithPlayersStore;

	function changePageAndFilters(newMaps, newPage, newCurrentFilters, replace, setUrl = true) {
		currentFilters = newCurrentFilters;

		sortValues = sortValues1
			.filter(sv => !sv.hideFor || !sv.hideFor.includes(newMaps ? 'maps' : 'players'))
			.map(v => {
				let result = {...v};
				if (result.id == currentFilters.sortBy) {
					result.iconFa = `fa fa-long-arrow-alt-${currentFilters.order === 'asc' ? 'up' : 'down'}`;
					sortValue = result;
				}

				return result;
			});
		if (!sortValues.find(sv => sv.id == currentFilters.sortBy)) {
			currentFilters.sortBy = 'pp';
		}

		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		if (setUrl) {
			const query = buildSearchFromFilters(currentFilters);
			const url = `/clan${newMaps ? '/maps/' : '/'}${clanId}/${currentPage}${query.length ? '?' : ''}${query}`;
			if (replace) {
				window.history.replaceState({}, '', url);
			} else {
				window.history.pushState({}, '', url);
			}
		}

		maps = newMaps;
		clanStore = newMaps ? clanWithMapsStore : clanWithPlayersStore;

		currentPage = newPage;
		clanStore.fetch(clanId, currentPage, {...currentFilters});
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		changePageAndFilters(maps, event.detail.page + 1, currentFilters, false);
	}

	function onSearchChanged(e) {
		currentFilters.search = e.target.value ?? '';

		changePageAndFilters(maps, currentPage, currentFilters, false);
	}
	function onPrimaryToggle() {
		currentFilters.primary = !currentFilters.primary;

		changePageAndFilters(maps, currentPage, currentFilters, false);
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

	const clanOptions = [
		{key: 'players', label: 'Players', iconFa: 'fa fa-user', color: 'var(--beatleader-primary)'},
		{key: 'maps', label: 'Maps', iconFa: 'fa fa-location-dot', color: 'var(--beatleader-primary)'},
	];

	function onTypeChanged(event) {
		if (!event?.detail) return;

		currentPage = 1;

		changePageAndFilters(event.detail.key == 'maps', currentPage, currentFilters, false);
	}

	const statOptions = [
		{key: 'globalMap', label: 'Global Map History', iconFa: 'fa fa-chart-line', color: 'var(--beatleader-primary)'},
		{key: 'triangle', label: 'Skill Triangle', iconFa: 'fa fa-location-dot', color: 'var(--beatleader-primary)'},
	];

	let currentStat = statOptions[0];
	function onStatChanged(event) {
		if (!event?.detail) return;

		currentStat = event.detail;
	}

	let sortValues1 = [
		{id: 'pp', label: 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes'},
		{id: 'acc', label: 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs'},
		{id: 'rank', label: 'Rank', title: 'Sort by rank', iconFa: 'fa fa-list-ol'},
		{id: 'date', label: 'Recent', title: 'Sort by the last score posted', iconFa: 'fa fa-clock', hideFor: ['players']},
		{id: 'toconquer', label: 'To Conquer', title: 'Sort by PP needed to capture', iconFa: 'fa fa-arrows-to-circle', hideFor: ['players']},
		{id: 'tohold', label: 'To Hold', title: 'Sort by captured maps PP dominance', iconFa: 'fa fa-flag', hideFor: ['players']},
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
		currentPage = 1;

		changePageAndFilters(maps, currentPage, currentFilters, false);
	}

	let availableFilters = $account?.player?.playerId
		? [
				{
					component: SelectFilter,
					props: {
						id: 'playedStatus',
						iconFa: 'fa fa-chart-line',
						title: 'Filter by played status',
						open: !!currentFilters?.playedStatus,
						defaultValue: currentFilters?.playedStatus ?? null,
						values: [
							{id: null, name: 'All'},
							{id: 'played', name: 'Played'},
							{id: 'unplayed', name: 'Not Played'},
						],
					},
				},
			]
		: [];

	function onFiltersChanged(event) {
		const newFilters = event?.detail ?? {};

		currentFilters.playedStatus = newFilters.playedStatus ?? null;
		currentPage = 1;

		changePageAndFilters(maps, currentPage, currentFilters, false);
	}

	$: document.body.scrollIntoView({behavior: 'smooth'});

	$: isLoading = clanStore.isLoading;
	$: pending = clanStore.pending;
	$: numOfItems = $clanStore ? $clanStore?.metadata?.total : null;
	$: itemsPerPage = $clanStore ? $clanStore?.metadata?.itemsPerPage : 10;

	$: changePageAndFilters(maps, page, buildFiltersFromLocation(location), false, false);

	$: clan = $clanStore?.container ?? null;
	$: playersPage = $clanStore?.data ?? [];

	$: maxRank = playersPage && !maps ? Math.max(...playersPage.map(p => p.playerInfo?.rank)) : 0;
	$: maxCountryRank = playersPage && !maps ? Math.max(...playersPage.map(p => p.playerInfo?.country.rank)) : 0;

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
{#if clan?.tag == 'SOUP'}
	<RandomRain />
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

			<div class="switchers">
				<Switcher values={sortValues} value={sortValue} on:change={onSortChange} />
				{#if !maps}
					<Button
						iconFa="fas fa-house"
						title="Show only players with this clan as primary"
						type={currentFilters.primary ? 'primary' : 'default'}
						square={true}
						cls="primary-clan-button"
						squareSize="1.7rem"
						on:click={() => onPrimaryToggle()} />
				{:else}
					<ScoreServiceFilters filters={availableFilters} on:change={onFiltersChanged} />
				{/if}

				<Switcher values={clanOptions} value={clanOptions.find(o => o.key == (maps ? 'maps' : 'players'))} on:change={onTypeChanged} />
			</div>

			{#if maps}
				<ContentBox>
					{#if playersPage?.length}
						<div class="scores-grid grid-transition-helper">
							{#each playersPage as cr, idx (cr?.id ?? '')}
								<div
									class={`row-${idx}`}
									in:fly={{x: 200, delay: idx * 20, duration: 500}}
									out:fade={{x: 200, delay: idx * 20, duration: 500}}>
									<ClanRankingSong {idx} {cr} {page} sortBy={currentFilters.sortBy} />
								</div>
							{/each}
						</div>
					{:else}
						<span>No maps found.</span>
					{/if}
				</ContentBox>
			{:else if playersPage?.length}
				<div class="players grid-transition-helper" class:with-icons={isFounder}>
					{#each playersPage as player, idx (player.playerId)}
						<div
							class="ranking-grid-row"
							title={player.playerInfo?.clanOrder?.indexOf(clan?.tag) ? 'Not contributing to the global map for this clan' : null}
							in:fly|global={{delay: idx * 10, x: 100}}>
							<PlayerCard
								{player}
								playerId={mainPlayerId}
								withCrown={clanLeaderId === player.playerId}
								selectedClanTag={clan?.tag}
								value={player?.playerInfo?.pp}
								{maxRank}
								{maxCountryRank}
								opacity={player.playerInfo?.clanOrder?.indexOf(clan?.tag) ? '0.7' : '1.0'}
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
			{/if}
			<Pager
				totalItems={numOfItems}
				{itemsPerPage}
				itemsPerPageValues={null}
				currentPage={currentPage - 1}
				loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
				mode={numOfItems ? 'pages' : 'simple'}
				on:page-changed={onPageChanged} />
		</ContentBox>
		{#if clan}
			<ContentBox cls="chart-container-box">
				<Switcher values={statOptions} value={currentStat} on:change={onStatChanged} />
				<div class="darkened-background chart-container">
					{#if currentStat.key == 'globalMap'}
						{#if clan?.captureLeaderboardsCount > 0}
							<ClanChart clanId={clan.id} />
						{:else}
							<span>Compete on <a href="/leaderboards">ranked maps</a> to see the global map history.</span>
						{/if}
					{:else if currentStat.key == 'triangle'}
						{#if clan?.playersCount >= 5}
							<ClanSkillTriangle clanId={clan.id} />
						{:else}
							<span>Grow your clan to at least 5 players to see the combined skill triangle.</span>
						{/if}
					{/if}
				</div>
			</ContentBox>
		{/if}
		{#if clan?.tag == 'FELA'}
			<ContentBox>
				<div style="display: flex; width: 100%; height: 100%; justify-content: center;">
					<iframe
						width="100%"
						style="aspect-ratio: 16/9;"
						src="https://allpoland.github.io/ArcViewer/?id=159c7"
						title="[THE FELLAS MAP COLLAB] NECROMANSER"
						frameborder="0"
						allowfullscreen />
				</div>
			</ContentBox>
		{/if}
	</article>
</section>

{#if clan}
	<ClanMeta {clan} />
{/if}

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

	.scores-grid {
		gap: 0.4em;
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

	.switchers {
		display: flex;
		gap: 1em;
		justify-content: center;
	}

	.chart-container {
		padding: 1em;
		border-radius: 8px;
		overflow: hidden;
	}

	.chart-title {
		text-align: center;
		margin-bottom: 0.2em;
	}

	:global(.chart-container-box) {
		padding: 0.4em !important;
		border-radius: 12px !important;
	}
	:global(.primary-clan-button) {
		width: auto !important;
		margin-top: 0.3em !important;
	}

	@media screen and (max-width: 767px) {
		.switchers {
			flex-wrap: wrap;
		}
	}
</style>
