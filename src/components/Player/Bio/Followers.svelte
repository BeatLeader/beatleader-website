<script>
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import createAccountStore from '../../../stores/beatleader/account';
	import followed from '../../../stores/beatleader/followed';
	import Button from '../../Common/Button.svelte';
	import Spinner from '../../Common/Spinner.svelte';
	import {slide} from 'svelte/transition';

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

	let opened = false;
	let openedFollowing = false;

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

<div class="followers-container" class:opened transition:slide>
	{#if followers}
		{#if followers.followingCount}
			<div
				class="title-and-followers left-follower"
				class:opened
				transition:slide
				on:click={() => {
					opened = !opened;
				}}>
				<span class="followers-title">{followers.followingCount} Following</span>
				<div class="followers-list" class:opened transition:slide>
					{#each followers.following as follower, idx}
						<div class="follower" class:opened>
							<img class="follower-icon" style={idx == 0 ? 'margin-left: 0;' : ''} src={follower.avatar} />
							{#if opened}
								<span>{follower.name}</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
		{#if !opened || openedFollowing}
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
	.followers-top-container {
		display: contents;
	}
	.followers-top-container.opened {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 40em;
	}
	.followers-container {
		display: flex;
		align-content: center;
		align-items: center;
		justify-content: center;
		justify-items: center;
		padding: 0.6em;
		padding-left: 1em;
		border-radius: 2em;
		width: fit-content;
		gap: 1em;
		transition: all 0.5s cubic-bezier(0.215, 0.61, 0.355, 1);
	}

	.followers-list.opened {
		flex-direction: column;
		mask-image: none;
	}

	.title-and-followers.opened {
		flex-direction: column;
	}

	.follower {
		display: contents;
	}

	.follower.opened {
		display: flex;
		justify-content: start;
		align-items: center;
		gap: 1em;
	}

	.title-and-followers {
		display: flex;
		align-items: center;
		cursor: pointer;
		transition: all 0.5s cubic-bezier(0.215, 0.61, 0.355, 1);
	}

	.title-and-followers:hover {
		background-color: rgba(0, 0, 0, 0.459);
		border-radius: 2em;
		padding: 0.4em;
		margin: -0.4em;
	}

	.followers-title {
		color: white;
		margin-top: 0.1em;
	}

	.followers-list {
		display: flex;
		margin-left: 1em;
		mask-image: linear-gradient(90deg, white, transparent);
		transition: all 0.5s cubic-bezier(0.215, 0.61, 0.355, 1);
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
