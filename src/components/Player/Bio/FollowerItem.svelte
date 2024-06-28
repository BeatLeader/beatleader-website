<script>
	import {fly, fade} from 'svelte/transition';
	import Button from '../../Common/Button.svelte';
	import Popover from '../../Common/Popover.svelte';
	import Spinner from '../../Common/Spinner.svelte';
	import MiniProfile from '../Mini/MiniProfile.svelte';

	export let follower;
	export let followed;
	export let account;
	export let loading;
	export let tab;
	export let idx;
	export let animationSign;

	let operationInProgress = false;
	let referenceElement;

	async function onFollowedChange(op, follower) {
		if (!playerId || !op) return;

		try {
			operationInProgress = true;

			switch (op) {
				case 'add':
					await account.addFollowed(follower.id);
					follower.count = followers.followersCount + 1;
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

	$: isFollowed = !!$followed?.find(f => f?.playerId === follower.id);
</script>

<a
	href={`/u/${follower.alias ?? follower.id}`}
	class="player-container"
	bind:this={referenceElement}
	in:fly|global={{delay: idx * 10, x: animationSign * 100}}>
	{#if !loading}
		<img class="avatar" src={follower.avatar} />
	{:else}
		<div class="avatar-placeholder">
			<Spinner />
		</div>
	{/if}
	<div class="name-and-buttons">
		<div class="name-and-status">
			<span class="name">{follower.name}</span>
			{#if follower.count}
				<span class="status">{follower.count} {tab == 0 ? 'Total Followers' : 'Mutuals'}</span>
			{/if}
		</div>
		{#if account && $account?.player?.playerId != follower.id}
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
</a>

<!-- {#if !loading}
	<Popover triggerEvents={['hover', 'focus']} placement="top" {referenceElement} spaceAway={10}>
		<div class="popover-contents" transition:fade|global={{duration: 250}}>
			<MiniProfile player={{playerId: follower.id, name: follower.name, playerInfo: {}}} />
		</div>
	</Popover>
{/if} -->

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

	.avatar-placeholder {
		width: 3em;
		height: 3em;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 1.5em;
		background-color: #6f6f6f;
	}

	:global(.wrap .window:has(.followers-popup-container)) {
		border-radius: 18px !important;
	}
</style>
