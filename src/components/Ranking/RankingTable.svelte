<script>
	import {createEventDispatcher, onMount} from 'svelte'
	import {fly} from 'svelte/transition'
	import createAccountStore from '../../stores/beatleader/account'
	import createRankingStore from '../../stores/http/http-ranking-store'
	import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts'
	import Pager from '../Common/Pager.svelte'
	import PlayerCard from "./PlayerCard.svelte";
	import AddFriendButton from "../Player/AddFriendButton.svelte";

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
		dispatch('loading', true)
	})

	$: isLoading = rankingStore.isLoading;
	$: pending = rankingStore.pending;
	$: numOfPlayers = $rankingStore ? $rankingStore.total : null;
	$: mainPlayerId = $account?.id;

	$: changeParams(type, page, filters)
	$: dispatch('loading', $isLoading);
	$: dispatch('pending', $pending?.page);
</script>

{#if $rankingStore?.data?.length}
	<div
		class={filters?.sortBy === "dailyImprovements" ? "fas fa-lightbulb icon dailyImprovements" :
		"far fa-lightbulb icon off pp"}
		on:click={() => dispatch('sort-toggled')}
		title={filters?.sortBy === "dailyImprovements" ? "Sort by amount of recycled scores" : "Sort by PP" }>
		<span class="sortBy">Sort by {filters?.sortBy === "dailyImprovements" ? "savings" : "pp"}</span>

	</div>
	<section class="ranking-grid">
		{#each $rankingStore.data as player, idx (player?.playerId)}
			<div class="ranking-grid-row" in:fly={{delay: idx * 10, x: 100}}>
				<PlayerCard player={player} playerId={mainPlayerId} currentFilters={filters}/>
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

    .icon {
        display: flex;
        width: 9.5em;
        height: 2.5em;
        color: white;
        border-radius: .4em;
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
        font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
    }

    @media screen and (max-width: 500px) {
        .ranking-grid {
            grid-template-columns: 1fr;
        }
    }
</style>