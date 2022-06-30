<script>
	import {createEventDispatcher, onMount} from 'svelte'
	import {fly} from 'svelte/transition'
	import createAccountStore from '../../stores/beatleader/account'
	import createRankingStore from '../../stores/http/http-ranking-store'
	import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts'
	import Pager from '../Common/Pager.svelte'
	import PlayerCard from "./PlayerCard.svelte";
	import AddFriendButton from "../Player/AddFriendButton.svelte";
	import Switcher from '../Common/Switcher.svelte'
	import {opt} from '../../utils/js'
	import {getHeadsetForHMD} from '../../utils/beatleader/format'

	export let type = 'global';
	export let page = 1;
	export let filters = {};
	export let noIcons = false;
	export let useInternalFilters = false;

	const dispatch = createEventDispatcher();

	const account = createAccountStore();

	const getStat = (data, key) => opt(data, key);
	const getAcc = (data, key) => (getStat(data, key) ?? 0) * 100;
	const getHmd = (data, key) => getHeadsetForHMD(getStat(data, key))?.name ?? 'Unknown headset'
	
	let allSortValues = [
		{id: 'pp', 'label': 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes', value: data => getStat(data, 'playerInfo.pp'), props: {suffix: 'pp', zero: '-'}},
		{id: 'acc', 'label': 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs', value: data => getAcc(data, 'scoreStats.averageRankedAccuracy'), props: {suffix: '%', zero: '-'}},
		{id: 'topPp', 'label': 'Top PP', title: 'Sort by top PP', iconFa: 'fa fa-cubes', value: data => getStat(data, 'scoreStats.topPp'), props: {suffix: 'pp', zero: '-'}},
		{id: 'topAcc', 'label': 'Top Acc', title: 'Sort by top accuracy', iconFa: 'fa fa-crosshairs', value: data => getAcc(data, 'scoreStats.topAccuracy'), props: {suffix: '%', zero: '-'}},
		{id: 'hmd', 'label': 'HMD', title: 'Sort by HMD', iconFa: 'fas fa-vr-cardboard', value: data => getHmd(data, 'scoreStats.topHMD')},
		{id: 'playCount', 'label': 'Play count', title: 'Sort by play count', iconFa: 'fas fa-calculator', value: data => getStat(data, 'scoreStats.rankedPlayCount'), props: {digits: 0}},
		{id: 'dailyImprovements', 'label': 'Improvements', title: 'Sort by daily improvements', iconFa: 'far fa-lightbulb', value: data => getStat(data, 'scoreStats.dailyImprovements'), props: {digits: 0}},
	];

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	const rankingStore = createRankingStore(type, page, filters, []);

	function changeParams(newType, newPage, newFilters) {
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		rankingStore.fetch(newType, newPage, {...newFilters}, true);
	}

	function onSwitcherChanged(e) {
		if (!e?.detail?.id) return;

		if (!useInternalFilters) {
			dispatch('sort-changed', e?.detail)
			return;
		}

		if (sortValue?.id === e.detail.id) {
			filters.order = filters.order === 'asc' ? 'desc' : 'asc';
		} else {
			filters.sortBy = e.detail.id;
			filters.order = 'desc';
		}
	}

	onMount(() => {
		dispatch('loading', true)
	})

	$: isLoading = rankingStore.isLoading;
	$: pending = rankingStore.pending;
	$: numOfPlayers = $rankingStore ? $rankingStore.total : null;
	$: mainPlayerId = $account?.id;

	$: changeParams(type, page, filters)
	$: dispatch('loading', $isLoading);
	$: dispatch('pending', $pending?.page);

	$: switcherSortValues = allSortValues.map(v => ({...v, iconFa: filters?.sortBy === v.id ? (filters?.order === 'asc' ? 'fas fa-long-arrow-alt-up' : 'fas fa-long-arrow-alt-down') : v.iconFa}))
	$: sortValue = filters?.sortBy?.length ? (switcherSortValues.find(v => v.id === filters.sortBy) ?? switcherSortValues[0]) : switcherSortValues[0]
</script>

{#if $rankingStore?.data?.length}
	<nav>
		<Switcher values={switcherSortValues} value={sortValue} on:change={onSwitcherChanged} />
	</nav>

	<section class="ranking-grid">
		{#each $rankingStore.data as player, idx (player?.playerId)}
			<div class="ranking-grid-row" in:fly={{delay: idx * 10, x: 100}}>
				<PlayerCard player={player} playerId={mainPlayerId} currentFilters={filters}
										value={sortValue?.value(player)} valueProps={sortValue?.props ?? {}}
										on:filters-updated
				/>
				{#if !noIcons}
					<AddFriendButton playerId={player.playerId}/>
				{/if}
			</div>
		{/each}
	</section>

	<Pager totalItems={numOfPlayers} itemsPerPage={PLAYERS_PER_PAGE} itemsPerPageValues={null}
				 currentPage={page-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
				 mode={numOfPlayers ? 'pages' : 'simple'}
				 on:page-changed
	/>
{:else if (!$isLoading)}
	<p>No players found.</p>
{/if}

<style>
    .ranking-grid {
        display: grid;
        grid-gap: .75em;
    }

    .ranking-grid-row {
        display: grid;
        grid-template-columns: auto 2.4em;
        grid-gap: .4em;
        align-items: center;
        justify-items: center;
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