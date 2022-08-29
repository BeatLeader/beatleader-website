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

	export let type = 'global';
	export let page = 1;
	export let filters = {};
	export let noIcons = false;
	export let eventId = null;
	export let useInternalFilters = false;

	let currentFilters = filters;

	const dispatch = createEventDispatcher();

	const account = createAccountStore();

	const getStat = (data, key) => opt(data, key);
	const getAcc = (data, key) => (getStat(data, key) ?? 0) * 100;

	let allTypeValues = [
		{
			label: 'Ranked',
			value: 'ranked',
			icon: 'fa fa-cubes',
		},
		{
			label: 'Unranked',
			value: 'unranked',
			icon: 'fa fa-cubes',
		},
		{
			label: 'All',
			value: 'all',
			icon: 'fa fa-cubes',
		},
	];
	let currentTypeValue = filters.mapsType;

	const statKeys = {
		acc: {
			ranked: 'scoreStats.averageRankedAccuracy',
			unranked: 'scoreStats.averageUnrankedAccuracy',
			all: 'scoreStats.averageAccuracy',
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
			ranked: 'scoreStats.averageRankedRank',
			unranked: 'scoreStats.averageUnrankedRank',
			all: 'scoreStats.averageRank',
		},
		lastplay: {
			ranked: 'scoreStats.lastRankedScoreTime',
			unranked: 'scoreStats.lastUnrankedScoreTime',
			all: 'scoreStats.lastScoreTime',
		},
	};

	let allSortValues = [
		{
			id: 'pp',
			label: 'PP',
			title: 'Sort by PP',
			iconFa: 'fa fa-cubes',
			value: data => getStat(data, 'playerInfo.pp'),
			props: {suffix: 'pp', zero: '-', digits: 2},
			hideForTypes: ['unranked'],
		},
		{
			id: 'acc',
			label: 'Acc',
			title: 'Sort by average accuracy',
			iconFa: 'fa fa-crosshairs',
			value: data => getAcc(data, statKeys['acc'][currentTypeValue]),
			props: {suffix: '%', zero: '-', digits: 2},
		},
		{
			id: 'topPp',
			label: 'Top PP',
			title: 'Sort by top PP',
			iconFa: 'fa fa-cubes',
			value: data => getStat(data, 'scoreStats.topPp'),
			props: {suffix: 'pp', zero: '-', digits: 2},
			hideForTypes: ['unranked'],
		},
		{
			id: 'topAcc',
			label: 'Top Acc',
			title: 'Sort by top accuracy',
			iconFa: 'fa fa-crosshairs',
			value: data => getAcc(data, statKeys['topAcc'][currentTypeValue]),
			props: {suffix: '%', zero: '-', digits: 2},
		},
		{
			id: 'playCount',
			label: 'Play count',
			title: 'Sort by play count',
			iconFa: 'fas fa-calculator',
			value: data => getStat(data, statKeys['playCount'][currentTypeValue]),
			props: {digits: 0, suffix: ''},
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
			id: 'rank',
			label: 'Rank',
			title: 'Sort by average leaderboard rank',
			iconFa: 'fa fa-chart-line',
			value: data => getStat(data, statKeys['rank'][currentTypeValue]),
			props: {digits: 0, prefix: '#', suffix: ''},
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
			rankingStore.fetch(newType, newPage, {...newFilters}, true);
		}
	}

	function onSwitcherChanged(e) {
		if (!e?.detail?.id) return;

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

	onMount(() => {
		dispatch('loading', true);
	});

	let switcherSortValues;
	let sortValue;

	function refreshSortValues(allSortValues, filterValues) {
		switcherSortValues = allSortValues
			.filter(v => {
				return !v.hideForTypes || !v.hideForTypes.includes(filterValues.mapsType);
			})
			.map(v => ({
				...v,
				iconFa:
					filterValues?.sortBy === v.id
						? filterValues?.order === 'asc'
							? 'fas fa-long-arrow-alt-up'
							: 'fas fa-long-arrow-alt-down'
						: v.iconFa,
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

	$: if (!$isLoading && $rankingStore?.data) currentFilters = deepClone(filters);
	$: refreshSortValues(allSortValues, currentFilters);
</script>

{#if $rankingStore?.data?.length}
	{#if !eventId}
		<nav class="switcher-nav">
			<Switcher values={switcherSortValues} value={sortValue} on:change={onSwitcherChanged} />
			<select class="type-select" bind:value={currentTypeValue} on:change={onTypeChanged}>
				{#each allTypeValues as option (option.value)}
					<option class="type-option" value={option.value}><i class={option.icon} />{option.label}</option>
				{/each}
			</select>
		</nav>
	{/if}

	<section class="ranking-grid">
		{#each $rankingStore.data as player, idx (player?.playerId)}
			<div class="ranking-grid-row" in:fly={{delay: idx * 10, x: 100}}>
				<PlayerCard
					{player}
					playerId={mainPlayerId}
					{currentFilters}
					value={sortValue?.value(player)}
					valueProps={sortValue?.props ?? {}}
					on:filters-updated />
				{#if !noIcons}
					<AddFriendButton playerId={player.playerId} />
				{/if}
			</div>
		{/each}
	</section>

	<Pager
		totalItems={numOfPlayers}
		itemsPerPage={PLAYERS_PER_PAGE}
		itemsPerPageValues={null}
		currentPage={page - 1}
		loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
		mode={numOfPlayers ? 'pages' : 'simple'}
		on:page-changed />
{:else if !$isLoading}
	<p>No players found.</p>
{/if}

<style>
	.switcher-nav {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.ranking-grid {
		display: grid;
		grid-gap: 0.75em;
	}

	.ranking-grid-row {
		display: grid;
		grid-template-columns: auto 2.4em;
		grid-gap: 0.4em;
		align-items: center;
		justify-items: center;
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
	}

	.type-option {
		color: black;
		font-family: inherit;
	}

	nav > :global(*) {
		margin-top: 1rem;
		margin-bottom: 2rem;
	}

	@media screen and (max-width: 500px) {
		.ranking-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
