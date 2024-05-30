<script>
	import {createEventDispatcher, onMount} from 'svelte';
	import {fly} from 'svelte/transition';
	import createAccountStore from '../../stores/beatleader/account';
	import createRankingStore from '../../stores/http/http-ranking-store';
	import createEventRankingStore from '../../stores/http/http-event-ranking-store';
	import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts';
	import Pager from '../Common/Pager.svelte';
	import PlayerCard from './PlayerCard.svelte';
	import AddFriendButton from '../Player/AddFriendButton.svelte';
	import Switcher from '../Common/Switcher.svelte';
	import {deepClone, opt} from '../../utils/js';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import RankingMeta from './RankingMeta.svelte';
	import Select from '../Settings/Select.svelte';
	import {configStore} from '../../stores/config';

	export let type = 'global';
	export let page = 1;
	export let filters = {};
	export let noIcons = false;
	export let eventId = null;
	export let useInternalFilters = false;
	export let playerClickFilter = null;
	export let showTypeSwitcher = true;
	export let meta = false;
	export let editing = false;
	export let animationSign = 1;
	export let playersPerPage = PLAYERS_PER_PAGE;

	let currentFilters = filters;

	const dispatch = createEventDispatcher();

	const account = createAccountStore();

	const getStat = (data, key) => opt(data, key);
	const getAcc = (data, key) => (getStat(data, key) ?? 0) * 100;

	let allTypeValues = [
		{
			name: 'Ranked',
			value: 'ranked',
			icon: 'fa fa-star',
		},
		{
			name: 'Unranked',
			value: 'unranked',
			icon: 'fa fa-shapes',
		},
		{
			name: 'All',
			value: 'all',
			icon: 'fa fa-cubes-stacked',
		},
	];
	let currentTypeValue = filters.mapsType ?? 'ranked';

	const statKeys = {
		acc: {
			ranked: 'scoreStats.averageRankedAccuracy',
			unranked: 'scoreStats.averageUnrankedAccuracy',
			all: 'scoreStats.averageAccuracy',
		},
		weightedAcc: {
			ranked: 'scoreStats.averageWeightedRankedAccuracy',
		},
		topAcc: {
			ranked: 'scoreStats.topRankedAccuracy',
			unranked: 'scoreStats.topUnrankedAccuracy',
			all: 'scoreStats.topAccuracy',
		},
		playCount: {
			ranked: 'scoreStats.rankedPlayCount',
			unranked: 'scoreStats.unrankedPlayCount',
			all: 'scoreStats.totalPlayCount',
		},
		rank: {
			ranked: 'scoreStats.averageWeightedRankedRank',
			unranked: 'scoreStats.averageUnrankedRank',
			all: 'scoreStats.averageRank',
		},
		lastplay: {
			ranked: 'scoreStats.lastRankedScoreTime',
			unranked: 'scoreStats.lastUnrankedScoreTime',
			all: 'scoreStats.lastScoreTime',
		},
		maxStreak: {
			ranked: 'scoreStats.rankedMaxStreak',
			unranked: 'scoreStats.unrankedMaxStreak',
			all: 'scoreStats.maxStreak',
		},
		pp: {
			general: 'playerInfo.pp',
			acc: 'playerInfo.accPp',
			pass: 'playerInfo.passPp',
			tech: 'playerInfo.techPp',
		},
		topPp: {
			general: 'scoreStats.topPp',
			acc: 'scoreStats.topAccPP',
			pass: 'scoreStats.topPassPP',
			tech: 'scoreStats.topTechPP',
		},
		top1Count: {
			ranked: 'scoreStats.rankedTop1Count',
			unranked: 'scoreStats.unrankedTop1Count',
			all: 'scoreStats.top1Count',
		},
		top1Score: {
			ranked: 'scoreStats.rankedTop1Score',
			unranked: 'scoreStats.unrankedTop1Score',
			all: 'scoreStats.top1Score',
		},
	};

	let allPpTypeValues = [
		{
			name: 'Total',
			value: 'general',
			icon: 'fa fa-up-down-left-right',
		},
		{
			name: 'Accuracy',
			value: 'acc',
			icon: 'fa fa-arrows-to-dot',
		},
		{
			name: 'Pass',
			value: 'pass',
			icon: 'fa fa-person-walking-dashed-line-arrow-right',
		},
		{
			name: 'Tech',
			value: 'tech',
			icon: 'fa fa-arrows-split-up-and-left',
		},
	];
	let currentPpTypeValue = filters.ppType ?? 'general';

	let allSortValues = [
		{
			id: 'pp',
			label: 'PP',
			title: 'Sort by PP',
			iconFa: 'fa fa-cubes',
			value: data => getStat(data, statKeys['pp'][currentPpTypeValue]),
			props: {prefix: '', suffix: 'pp', zero: '-', digits: 2},
			hideForTypes: ['unranked'],
		},
		{
			id: 'weightedAcc',
			label: 'Weighted Acc',
			title: 'Sort by weighted accuracy from top 100 plays',
			iconFa: 'fa fa-crosshairs',
			value: data => getAcc(data, statKeys['weightedAcc'][currentTypeValue]),
			props: {prefix: '', suffix: '%', zero: '-', digits: 2},
			hideForTypes: ['unranked', 'all'],
		},

		{
			id: 'acc',
			label: 'Acc',
			title: 'Sort by average accuracy',
			iconFa: 'fa fa-crosshairs',
			value: data => getAcc(data, statKeys['acc'][currentTypeValue]),
			props: {prefix: '', suffix: '%', zero: '-', digits: 2},
			hideForTypes: ['ranked'],
		},
		{
			id: 'topPp',
			label: 'Top PP',
			title: 'Sort by top PP',
			iconFa: 'fa fa-cubes',
			value: data => getStat(data, statKeys['topPp'][currentPpTypeValue]),
			props: {prefix: '', suffix: 'pp', zero: '-', digits: 2},
			hideForTypes: ['unranked'],
		},
		{
			id: 'maxStreak',
			label: '115 Streak',
			title: 'Sort by longest 115 streak',
			iconFa: 'icon115s',
			value: data => getStat(data, statKeys['maxStreak'][currentTypeValue]),
			props: {prefix: '', suffix: '', zero: '-', digits: 0},
		},
		{
			id: 'playCount',
			label: 'Play count',
			title: 'Sort by play count',
			iconFa: 'fas fa-calculator',
			value: data => getStat(data, statKeys['playCount'][currentTypeValue]),
			props: {digits: 0, prefix: '', suffix: ''},
		},
		{
			id: 'lastplay',
			label: 'Recent',
			title: 'Sort by the most recent score',
			iconFa: 'fas fa-clock',
			value: data => {
				let timeset = getStat(data, statKeys['lastplay'][currentTypeValue]);
				return timeset == 0 ? timeset : formatDateRelative(dateFromUnix(timeset));
			},
			props: {isText: true},
		},
		{
			id: 'weightedRank',
			label: 'Weighted Rank',
			title: 'Sort by weighted average leaderboard rank from top 100 plays',
			iconFa: 'fa fa-chart-line',
			value: data => getStat(data, statKeys['rank'][currentTypeValue]),
			props: {digits: 0, prefix: '#', suffix: '', digits: 2},
			hideForTypes: ['unranked'],
		},
		{
			id: 'rank',
			label: 'Rank',
			title: 'Sort by average leaderboard rank',
			iconFa: 'fa fa-chart-line',
			value: data => getStat(data, statKeys['rank'][currentTypeValue]),
			props: {digits: 0, prefix: '#', suffix: ''},
			hideForTypes: ['ranked'],
		},
		{
			id: 'top1Count',
			label: '#1 Count',
			title: 'Sort by number of top scores',
			iconFa: 'fa fa-medal',
			value: data => getStat(data, statKeys['top1Count'][currentTypeValue]),
			props: {digits: 0, prefix: '', suffix: ''},
		},
		{
			id: 'top1Score',
			label: 'Podium Score',
			title: 'Sort by score sum from podium scores(#1 - 5, #2 - 3, #3 - 1)',
			iconFa: 'fa fa-ranking-star',
			value: data => getStat(data, statKeys['top1Score'][currentTypeValue]),
			props: {digits: 0, prefix: '', suffix: ''},
		},
		{
			id: 'replaysWatched',
			label: 'Watched',
			title: 'Sort by replay watch count',
			iconFa: 'fa fa-eye',
			value: data => {
				return (data?.scoreStats?.anonimusReplayWatched ?? 0) + (data?.scoreStats?.authorizedReplayWatched ?? 0);
			},
			props: {digits: 0, prefix: '', suffix: ''},
		},
	];

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	const rankingStore = eventId ? createEventRankingStore(type, page, eventId, filters, []) : createRankingStore(type, page, filters, []);

	function changeParams(newType, newPage, newFilters) {
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		if (eventId) {
			rankingStore.fetch(newType, newPage, eventId, {...newFilters}, true);
		} else {
			rankingStore.fetch(newType, playersPerPage, newPage, {...newFilters}, true);
		}
	}

	async function settempsetting(key, value) {
		var preferences = configStore.get('rankingPreferences');
		preferences[key] = value;
		await configStore.setForKey('rankingPreferences', preferences, false);
	}

	function onSwitcherChanged(e) {
		if (!e?.detail?.id) return;

		if (editing) {
			settempsetting(e.detail.id, !$configStore.rankingPreferences[e.detail.id]);
			return;
		}

		if (!useInternalFilters) {
			dispatch('sort-changed', e?.detail);
			return;
		}

		if (sortValue?.id === e.detail.id) {
			filters.order = filters.order === 'asc' ? 'desc' : 'asc';
		} else {
			filters.sortBy = e.detail.id;
			filters.order = 'desc';
		}
	}

	function onTypeChanged(e) {
		if (!useInternalFilters) {
			dispatch('maps-type-changed', currentTypeValue);
			return;
		}

		filters.mapsType = currentTypeValue;
		refreshSortValues(allSortValues, filters);
	}

	function onPPTypeChanged(e) {
		if (!useInternalFilters) {
			dispatch('pp-type-changed', currentPpTypeValue);
			return;
		}

		filters.ppType = currentPpTypeValue;
		refreshSortValues(allSortValues, filters);
	}

	onMount(() => {
		dispatch('loading', true);
	});

	let switcherSortValues;
	let sortValue;

	function refreshSortValues(allSortValues, filterValues, rankingPreferences) {
		switcherSortValues = allSortValues
			.filter(v => {
				return editing || ((!v.hideForTypes || !v.hideForTypes.includes(filterValues.mapsType)) && rankingPreferences[v.id]);
			})
			.map(v => ({
				...v,
				iconFa:
					filterValues?.sortBy === v.id
						? filterValues?.order === 'asc'
							? 'fas fa-long-arrow-alt-up'
							: 'fas fa-long-arrow-alt-down'
						: v.iconFa,
				cls: editing && !rankingPreferences[v.id] ? 'hidden' : '',
			}));

		if (filters?.sortBy?.length) {
			sortValue = switcherSortValues.find(v => v.id === filters.sortBy);
			if (!sortValue) {
				setTimeout(() => {
					sortValue = switcherSortValues[0];
					filters.sortBy = sortValue.id;
					changeParams(type, page, filters);
					$rankingStore = $rankingStore;
				}, 500);
			}
		} else {
			sortValue = switcherSortValues[0];
		}
	}

	$: isLoading = rankingStore.isLoading;
	$: pending = rankingStore.pending;
	$: numOfPlayers = $rankingStore ? $rankingStore.total : null;
	$: mainPlayerId = $account?.id;

	$: changeParams(type, page, filters);
	$: dispatch('loading', $isLoading);
	$: dispatch('pending', $pending?.page);
	$: dispatch('players-fetched', $rankingStore?.data);

	$: maxRank = $rankingStore?.data ? Math.max(...$rankingStore.data.map(p => p.playerInfo?.rank)) : 0;
	$: maxCountryRank = $rankingStore?.data ? Math.max(...$rankingStore.data.map(p => p.playerInfo?.countries[0].rank)) : 0;

	$: if (!$isLoading && $rankingStore?.data) currentFilters = deepClone(filters);
	$: refreshSortValues(allSortValues, currentFilters, $configStore.rankingPreferences);
</script>

{#if $rankingStore?.data?.length}
	{#if !eventId}
		<nav class="switcher-nav {editing ? 'edit-enabled' : ''}">
			<Switcher values={switcherSortValues} value={sortValue} on:change={onSwitcherChanged} />
			{#if showTypeSwitcher}
				<div class="type-switcher">
					<Select bind:value={currentTypeValue} options={allTypeValues} fontSize={0.8} fontPadding={0.2} on:change={onTypeChanged} />

					{#if sortValue?.id == 'pp' || sortValue?.id == 'topPp'}
						<Select
							bind:value={currentPpTypeValue}
							options={allPpTypeValues}
							fontSize={0.8}
							fontPadding={0.2}
							on:change={onPPTypeChanged} />
					{/if}
				</div>
			{/if}
		</nav>
	{/if}

	<section class="ranking-grid">
		{#each $rankingStore.data as player, idx (player?.playerId)}
			<div
				class="ranking-grid-row {!noIcons && $configStore.rankingList.showFriendsButton ? 'with-friends-button' : ''} {type}-rating"
				in:fly|global={{delay: idx * 10, x: animationSign * 100}}>
				<PlayerCard
					{player}
					playerId={mainPlayerId}
					{playerClickFilter}
					{currentFilters}
					value={sortValue?.value(player)}
					{maxRank}
					{maxCountryRank}
					valueProps={eventId == 32 || eventId == 48
						? {prefix: '', suffix: ' scores', zero: 'Carbon positive', digits: 0}
						: sortValue?.props ?? {}}
					on:filters-updated />
				{#if !noIcons && $configStore.rankingList.showFriendsButton}
					<AddFriendButton playerId={player.playerId} />
				{/if}
			</div>
		{/each}
	</section>

	<Pager
		totalItems={numOfPlayers}
		itemsPerPage={playersPerPage}
		itemsPerPageValues={null}
		currentPage={page - 1}
		loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
		mode={numOfPlayers ? 'pages' : 'simple'}
		on:page-changed />
{:else if !$isLoading}
	<p>No players found.</p>
{/if}

{#if meta}
	<RankingMeta {rankingStore} countries={filters.countries} />
{/if}

<style>
	.switcher-nav {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.ranking-grid {
		display: grid;
		grid-gap: 0.5em;
	}

	.ranking-grid-row {
		display: grid;
		grid-gap: 0.4em;
		align-items: center;
		justify-items: center;
	}

	.ranking-grid-row.with-friends-button {
		grid-template-columns: auto 2.4em;
	}

	.type-select {
		padding: 0.175rem;
		margin-top: 0.875rem;
		text-align: center;
		white-space: nowrap;
		border: 0;
		border-radius: 0.2em;
		cursor: pointer;
		color: var(--color, #363636);
		background-color: #dbdbdb;
		box-shadow: none;
		opacity: 0.35;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		margin-left: 0.4em;
	}

	.type-option {
		color: black;
		font-family: inherit;
	}

	.type-switcher {
		margin-left: 0.4em;
	}

	:global(.followed-rating .clan-badges) {
		display: none;
	}

	nav > :global(*) {
		margin-top: 1rem;
		margin-bottom: 2rem;
	}

	.edit-enabled :global(.switch-types .button),
	.edit-enabled :global(.score-filters .filter-btn),
	.edit-enabled :global(.score-filters .filter),
	.edit-enabled :global(.score-filters .filter select),
	.edit-enabled :global(.score-filters .filter input) {
		cursor: cell !important;
		opacity: 1 !important;
		color: var(--textColor, white) !important;
		background: transparent !important;
	}

	.edit-enabled :global(.switch-types .button:not(.hidden)),
	.edit-enabled :global(.score-filters .filter:not(.hidden)) {
		border: 1px dotted var(--textColor, white);
	}

	.edit-enabled :global(.switch-types .button.hidden),
	.edit-enabled :global(.score-filters .filter.hidden) {
		filter: grayscale(1);
		opacity: 0.25 !important;
		transition: all 200ms;
	}

	.edit-enabled :global(.switch-types .button.hidden:hover),
	.edit-enabled :global(.score-filters .filter.hidden:hover) {
		filter: none;
		opacity: 0.5 !important;
	}

	@media screen and (max-width: 500px) {
		.ranking-grid {
			grid-template-columns: 1fr;
		}

		:global(.player-name-and-rank .clan-badges) {
			display: none;
		}

		.switcher-nav {
			flex-direction: column-reverse;
		}

		.type-switcher {
			margin-top: 0;
			margin-bottom: 1rem;
		}
	}
</style>
