<script>
	import {createEventDispatcher, onMount} from 'svelte';
	import {fly} from 'svelte/transition';
	import createAccountStore from '../../stores/beatleader/account';
	import createRankingStore from '../../stores/http/http-ranking-store';
	import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts';
	import Pager from '../Common/Pager.svelte';
	import PlayerCard from './PlayerCard.svelte';
	import AddFriendButton from '../Player/AddFriendButton.svelte';
	import Filter from '../Common/Filter.svelte';
	import {identity} from 'svelte/internal';
	import About from '../../pages/About.svelte';

	export let type = 'global';
	export let page = 1;
	export let filters = {};
	export let noIcons = false;

	const dispatch = createEventDispatcher();

	const account = createAccountStore();

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let boxEl = null;

	const rankingStore = createRankingStore(type, page, filters);

	function changeParams(newType, newPage, newFilters) {
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		rankingStore.fetch(newType, newPage, {...newFilters}, true);
	}

	onMount(() => {
		dispatch('loading', true);
	});

	let currentSortBy = 'pp';
	const displaySortBy = {
		pp: 'pp',
		acc: 'averageAccuracy',
	};

	$: isLoading = rankingStore.isLoading;
	$: pending = rankingStore.pending;
	$: numOfPlayers = $rankingStore ? $rankingStore.total : null;
	$: mainPlayerId = $account?.id;

	$: changeParams(type, page, filters);
	$: dispatch('loading', $isLoading);
	$: dispatch('pending', $pending?.page);
</script>

<Filter
	sortingMethods={[
		{identifier: 'topAcc', label: 'Top Acc', title: 'Sort by top acc', iconFa: 'fas fa-arrow-to-top'},
		{identifier: 'topPp', label: 'Top PP', title: 'Sort by top PP', iconFa: 'fa fa-arrow-up-to-line'},
		{identifier: 'pp', label: 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes'},
		{identifier: 'acc', label: 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs'},
		{identifier: 'rank', label: 'Rank', title: 'Sort by rank', iconFa: 'fa fa-list-ol'},
		{identifier: 'playCount', label: 'Play Count', title: 'Sort by play count', iconFa: 'fa fa-list-ol'},
		{identifier: 'score', label: 'Total score', title: 'Sort by total score', iconFa: 'fa fa-list-ol'},
	]}
	filters={[
		{
			name: 'Is Friend',
			type: 'bool',
			identifier: 'friends',
			once: true,
		},
		{
			name: 'Platform',
			identifier: 'platform',
			type: 'radio',
			choices: {
				steam: 'Steam',
				oculus: 'Oculus Android',
				oculuspc: 'Oculus PC',
			},
			once: true,
		},
		{
			name: 'Role',
			identifier: 'role',
			type: 'radio',
			choices: {
				admin: 'Administrator',
				rankedteam: 'Ranked Team',
				tipper: 'Tipper',
				supporter: 'Supporter',
				sponsor: 'Sponsor',
			},
			once: true,
		},
		{
			name: 'Country/Region',
			identifier: 'countries',
			type: 'country',
		},
		{
			name: 'HMD',
			identifier: 'hmd',
			type: 'radio',
			choices: {
				0: '<div>aa</div>Unknown headset',
				1: 'Oculus Rift CV1',
				2: 'Vive',
				4: 'Vive Pro',
				8: 'Windows Mixed Reality',
				16: 'Rift S',
				32: 'Oculus Quest',
				64: 'Valve Index',
				128: 'Vive Cosmos',
				256: 'Oculus Quest 2',
			},
		},
	]}
	onFilterChange={result => {
		changeParams(type, page, {filter: result.toUrl(), ...filters});
	}} />
{#if $rankingStore?.data?.length}
	<section class="ranking-grid">
		{#each $rankingStore.data as player, idx (player?.playerId)}
			<div class="ranking-grid-row" in:fly={{delay: idx * 10, x: 100}}>
				{console.log(player)}
				<PlayerCard {player} playerId={mainPlayerId} currentFilters={filters} currentSortBy={currentSortBy} />
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

	.icon {
		display: flex;
		width: 9.5em;
		height: 2.5em;
		color: white;
		border-radius: 0.4em;
		margin-bottom: 1em;
	}

	.icon.off {
		color: #ffffffe1;
	}

	.icon.pp {
		background: var(--faded);
	}

	.icon.pp:hover {
		background: var(--faded) linear-gradient(0deg, transparent, #ffffff66);
	}

	.icon.dailyImprovements {
		background: green;
		cursor: pointer;
	}

	.icon.dailyImprovements:hover {
		background: green linear-gradient(0deg, transparent, #ffffff66);
	}

	.sortBy {
		margin-left: 0.5em;
		font-weight: normal;
		font-family: BlinkMacSystemFont, -apple-system, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
			'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
	}

	@media screen and (max-width: 500px) {
		.ranking-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
