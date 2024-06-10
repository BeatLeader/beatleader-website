<script>
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import createAccountStore from '../../../stores/beatleader/account';
	import followed from '../../../stores/beatleader/followed';
	import Button from '../../Common/Button.svelte';
	import Spinner from '../../Common/Spinner.svelte';

	export let playerId;
	export let thisPlayer;

	const account = createAccountStore();

	let operationInProgress = false;
	async function onFollowedChange(op) {
		if (!playerId || !op) return;

		try {
			operationInProgress = true;

			switch (op) {
				case 'add':
					await account.addFollowed(playerId);
					followers.followersCount = followers.followersCount + 1;
					break;
				case 'remove':
					await account.removeFollowed(playerId);
					followers.followersCount = followers.followersCount - 1;
					break;
			}
			followers = followers;
		} catch (err) {
		} finally {
			operationInProgress = false;
		}
	}

	let followers = null;

	function fetchFollowers(playerId) {
		if (!playerId) return;
		followers = null;
		fetch(`${BL_API_URL}player/${playerId}/followersInfo`, {credentials: 'include'})
			.then(r => r.json())
			.then(r => {
				followers = r;
			});
	}

	$: isMain = playerId && $account?.id === playerId;
	$: loggedInPlayer = $account?.id;
	$: isFollowed = playerId && !!$followed?.find(f => f?.playerId === playerId);

	$: fetchFollowers(playerId);
</script>

<div class="followers-container">
	{#if followers}
		{#if followers.followingCount}
			<div class="title-and-followers left-follower">
				<span class="followers-title">{followers.followingCount} Following</span>
				<div class="followers-list">
					{#each followers.following as follower, idx}
						<img class="follower-icon" style={idx == 0 ? 'margin-left: 0;' : ''} src={follower.avatar} />
					{/each}
				</div>
			</div>
		{/if}
		{#if followers.followersCount}
			<div class="title-and-followers">
				<span class="followers-title">{followers.followersCount} Followers</span>
				<div class="followers-list">
					{#each followers.followers as follower, idx}
						<img class="follower-icon" style={idx == 0 ? 'margin-left: 0;' : ''} src={follower.avatar} />
					{/each}
				</div>
			</div>
		{/if}
		{#if loggedInPlayer && !isMain}
			<Button
				square={true}
				animated={true}
				cls="add-follower-btn"
				title={isFollowed ? 'Stop following' : 'Follow'}
				iconFa={isFollowed ? 'fas fa-user-minus' : 'fas fa-user-plus'}
				type={isFollowed ? 'danger' : 'primary'}
				loading={operationInProgress}
				disabled={operationInProgress}
				on:click={() => onFollowedChange(isFollowed ? 'remove' : 'add')} />
		{/if}
	{:else}
		<Spinner />
	{/if}
</div>

<style>
	.followers-container {
		display: flex;
		align-content: center;
		align-items: center;
		justify-content: center;
		justify-items: center;
		background-color: black;
		padding: 0.6em;
		border-radius: 2em;
		width: fit-content;
		margin-bottom: 0.4em;
	}
	.title-and-followers {
		display: flex;
		align-items: center;
	}

	.followers-title {
		color: white;
	}

	.followers-list {
		display: flex;
		margin-left: 1em;
		mask-image: linear-gradient(90deg, white, transparent);
	}

	.left-followers {
		border-right: 3px solid white;
		padding-right: 0.4em;
		margin-right: 0.7em;
	}

	.follower-icon {
		width: 2em;
		height: 2em;
		border-radius: 1em;
		margin-left: -0.5em;
	}

	:global(.add-follower-btn) {
		width: 2.3rem !important;
		height: 2.3rem !important;
		border-radius: 2em !important;
		margin-top: -0.2em !important;
		margin-bottom: -0.2em !important;
	}
</style>
