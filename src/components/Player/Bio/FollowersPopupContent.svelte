<script>
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import Button from '../../Common/Button.svelte';
	import Pager from '../../Common/Pager.svelte';
	import Spinner from '../../Common/Spinner.svelte';
	import followed from '../../../stores/beatleader/followed';

	export let playerId;
	export let account;
	export let followersCount;
	export let followingCount;
	export let tab = 0;

	let page = 1;
	let loading = false;
	let operationInProgress = false;
	let list = [];
	let count = 0;

	function fetchFollowers(playerId, tab, page) {
		loading = true;
		list = [];
		fetch(BL_API_URL + `player/${playerId}/followers?type=${tab}&count=10&page=${page}`, {credentials: 'include'})
			.then(r => r.json())
			.then(result => {
				loading = false;
				list = result;
			});
	}

	function updateCount(followingCount, followersCount, tab) {
		page = 1;
		count = tab == 0 ? followingCount : followersCount;
	}

	async function onFollowedChange(op, follower) {
		if (!playerId || !op) return;

		try {
			operationInProgress = true;

			switch (op) {
				case 'add':
					await account.addFollowed(follower.id);
					follower.count = followers.followersCount + 1;
					if (account.id == playerId && tab == 1) {
						fetchFollowers(playerId, tab, page);
					}
					break;
				case 'remove':
					await account.removeFollowed(follower.id);
					follower.count = followers.followersCount - 1;
					break;
			}
		} catch (err) {
		} finally {
			operationInProgress = false;
		}
	}

	$: updateCount(followingCount, followersCount, tab);
	$: fetchFollowers(playerId, tab, page);
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
			{#each list as follower}
				<div class="player-container">
					<a style="display: contents;" href={`/u/${follower.alias ?? follower.id}`}>
						<img class="avatar" src={follower.avatar} />
					</a>
					<div class="name-and-buttons">
						<div class="name-and-status">
							<span class="name">{follower.name}</span>
							{#if follower.count}
								<span class="status">{follower.count} {tab == 0 ? 'Total Followers' : 'Mutuals'}</span>
							{/if}
						</div>
						{#if account && $account.player.playerId != follower.id}
							{@const isFollowed = !!$followed?.find(f => f?.playerId === follower.id)}
							<Button
								square={true}
								animated={true}
								cls="add-follower-btn"
								title={isFollowed ? 'Stop following' : 'Follow'}
								iconFa={isFollowed ? 'fas fa-user-minus' : 'fas fa-user-plus'}
								type={isFollowed ? 'danger' : 'primary'}
								loading={operationInProgress}
								disabled={operationInProgress}
								on:click={() => onFollowedChange(isFollowed ? 'remove' : 'add', follower)} />
						{:else}
							<div />
						{/if}
					</div>
				</div>
			{/each}
			<Pager
				totalItems={count}
				itemsPerPage={10}
				itemsPerPageValues={null}
				currentPage={page - 1}
				on:page-changed={e => {
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

	.name-and-buttons {
		display: flex;
		justify-content: space-between;
		flex: 1;
		align-items: center;
	}

	.name-and-status {
		display: flex;
		flex-direction: column;
	}

	.name {
		font-weight: bold;
	}

	.player-container {
		display: flex;
		gap: 1em;
		align-items: center;
		color: white;
		padding: 0.5em;
		background-color: #242424;
		border-radius: 2em;
	}

	.avatar {
		width: 3em;
		height: 3em;
		border-radius: 1.5em;
	}

	:global(.wrap .window:has(.followers-popup-container)) {
		border-radius: 18px !important;
	}
</style>
