<script>
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';

	import Pager from '../../Common/Pager.svelte';
	import Spinner from '../../Common/Spinner.svelte';
	import followed from '../../../stores/beatleader/followed';

	import FollowerItem from './FollowerItem.svelte';

	export let playerId;
	export let account;
	export let followersCount;
	export let followingCount;
	export let tab = 0;

	let page = 1;
	let previousPage = 0;
	let loading = false;

	let list = [];
	let count = 0;

	function fetchFollowers(playerId, playerCount, tab, page) {
		loading = true;
		fetch(BL_API_URL + `player/${playerId}/followers?type=${tab}&count=${playerCount}&page=${page}`, {credentials: 'include'})
			.then(r => r.json())
			.then(result => {
				loading = false;
				list = result;
			});
	}

	function updateCount(followingCount, followersCount, tab) {
		page = 1;
		previousPage = 0;
		count = tab == 0 ? followingCount : followersCount;
	}

	$: updateCount(followingCount, followersCount, tab);
	$: playerCount = Math.min(Math.round(window.screen.height / 120), 10);
	$: fetchFollowers(playerId, playerCount, tab, page);
</script>

<div class="followers-popup-container darkened-background">
	<div class="tab-title-container">
		<span
			class="tab-title"
			class:active={tab == 0}
			on:click={() => {
				tab = 0;
			}}
			>Following{#if tab == 0}<i> {count}</i>{/if}</span>
		<span
			class="tab-title"
			class:active={tab == 1}
			on:click={() => {
				tab = 1;
			}}
			>{#if tab == 1}<i>{count} </i>{/if}Followers</span>
	</div>

	<div class="followers-container">
		{#if list.length}
			{#each list as follower, idx (follower?.id)}
				<FollowerItem
					{playerId}
					{follower}
					{account}
					{followed}
					{loading}
					{tab}
					{idx}
					animationSign={page >= previousPage ? 1 : -1}
					on:followed={() => {
						if (tab == 0) {
							follower.count++;
							if (playerId == $account?.player?.playerId) {
								followingCount++;
							}
						}
						if (tab == 1 && playerId == $account?.player?.playerId) {
							followingCount++;
						}
					}}
					on:unfollowed={() => {
						if (tab == 0) {
							follower.count--;
							if (playerId == $account?.player?.playerId) {
								followingCount--;
							}
						}
						if (tab == 1 && playerId == $account?.player?.playerId) {
							followingCount--;
						}
					}} />
			{/each}
			<Pager
				totalItems={count}
				itemsPerPage={playerCount}
				itemsPerPageValues={null}
				currentPage={page - 1}
				on:page-changed={e => {
					previousPage = page;
					page = (e?.detail?.page ?? 0) + 1;
				}} />
		{:else if loading}
			<Spinner />
		{:else}
			<span>No followers</span>
		{/if}
	</div>
</div>

<style>
	.followers-popup-container {
		display: flex;
		flex-direction: column;
		padding: 0.5em;
		margin: 0.5em;
		border-radius: 12px;
		margin-bottom: 1em;
		max-width: 30em;
		min-width: 20em;
		overflow: hidden;
	}

	.tab-title-container {
		display: flex;
		justify-content: space-between;
	}

	.tab-title {
		cursor: pointer;
		color: white;
		font-size: 1.4em;
		opacity: 0.6;
		transition: all 0.5s cubic-bezier(0.215, 0.61, 0.355, 1);
	}

	.tab-title.active {
		opacity: 1;
	}

	.followers-container {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
		color: white;
	}

	:global(.wrap .window:has(.followers-popup-container)) {
		border-radius: 18px !important;
	}

	@media screen and (max-width: 767px) {
		:global(.wrap .window:has(.followers-popup-container)) {
			margin-top: -1.4em;
		}
	}
</style>
