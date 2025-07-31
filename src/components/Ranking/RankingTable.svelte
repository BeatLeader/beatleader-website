<script>
	import {createEventDispatcher, onMount} from 'svelte';
	import {fly} from 'svelte/transition';
	import createAccountStore from '../../stores/beatleader/account';
	import createRankingStore from '../../stores/http/http-ranking-store';
	import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts';
	import Pager from '../Common/Pager.svelte';
	import PlayerCard from './PlayerCard.svelte';
	import AddFriendButton from '../Player/AddFriendButton.svelte';
	import RankingMeta from './RankingMeta.svelte';
	import {configStore} from '../../stores/config';
	import Spinner from '../Common/Spinner.svelte';

	export let type = 'global';
	export let page = 1;
	export let filters = {};
	export let noIcons = false;
	export let playerClickFilter = null;
	export let meta = false;
	export let animationSign = 1;
	export let playersPerPage = PLAYERS_PER_PAGE;

	let currentFilters = {};

	const dispatch = createEventDispatcher();

	const account = createAccountStore();

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	const rankingStore = createRankingStore(type, page, filters, []);

	function changeParams(newType, newPage, newFilters) {
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		rankingStore.fetch(newType, playersPerPage, newPage, {...newFilters});
	}

	function updateCurrentFilters(newFilters) {
		currentFilters = newFilters;
	}

	onMount(() => {
		dispatch('loading', true);
	});

	$: isLoading = rankingStore.isLoading;
	$: pending = rankingStore.pending;
	$: numOfPlayers = $rankingStore ? $rankingStore.total : null;
	$: mainPlayerId = $account?.id;

	$: changeParams(type, page, filters);
	$: dispatch('loading', $isLoading);
	$: dispatch('pending', $pending?.page);
	$: dispatch('players-fetched', $rankingStore?.data);

	$: maxNumRank = page * (playersPerPage ?? 0) + 1;
	$: maxRank = $rankingStore?.data ? Math.max(...$rankingStore.data.map(p => p.playerInfo?.rank)) : 0;
	$: maxCountryRank = $rankingStore?.data ? Math.max(...$rankingStore.data.map(p => p.playerInfo?.country.rank)) : 0;

	$: updateCurrentFilters(filters);
</script>

{#if $rankingStore?.data?.length}
	<section class="ranking-grid">
		{#each $rankingStore.data as player, idx (player?.playerId)}
			<div
				class="ranking-grid-row {!noIcons && $configStore.rankingList.showFriendsButton ? 'with-friends-button' : ''} {type}-rating"
				in:fly|global={{delay: idx * 10, x: animationSign * 100}}>
				<PlayerCard
					{player}
					numRank={(page - 1) * (playersPerPage ?? 0) + idx + 1}
					playerId={mainPlayerId}
					{playerClickFilter}
					{currentFilters}
					{maxNumRank}
					{maxRank}
					{maxCountryRank} />
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
{:else if $isLoading}
	<div class="ranking-grid-empty" style="display: flex; justify-content: center; align-items: center; height: {playersPerPage * 2}em;">
		<Spinner />
	</div>
{:else}
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

	@media screen and (max-width: 500px) {
		.ranking-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
