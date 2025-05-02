<script>
	import {fly, fade} from 'svelte/transition';
	import {navigate} from 'svelte-routing';
	import {createEventDispatcher, getContext} from 'svelte';
	import Button from '../../Common/Button.svelte';
	import Popover from '../../Common/Popover.svelte';
	import Spinner from '../../Common/Spinner.svelte';
	import MiniProfile from '../Mini/MiniProfile.svelte';

	export let follower;
	export let followed;
	export let account;
	export let playerId;
	export let loading;
	export let tab;
	export let idx;
	export let animationSign;

	const dispatch = createEventDispatcher();

	let operationInProgress = false;
	let referenceElement;

	let mutual = false;
	let originalMutual = false;
	let fetchedMutual = false;
	function refreshMutual(follower) {
		if (fetchedMutual) return;
		mutual = follower.mutual;
		originalMutual = follower.mutual;
		fetchedMutual = true;
	}

	function onFollowedChange(op, follower) {
		if (!follower) return;

		operationInProgress = true;

		switch (op) {
			case 'add':
				account.addFollowed(follower.id).then(_ => {
					dispatch('followed');
					if ($account?.player?.playerId == playerId) {
						mutual = tab == 1 || originalMutual;
					}
					operationInProgress = false;
				});

				break;
			case 'remove':
				account.removeFollowed(follower.id).then(_ => {
					dispatch('unfollowed');
					if ($account?.player?.playerId == playerId) {
						mutual = false;
					}
					operationInProgress = false;
				});

				break;
		}
	}

	$: isFollowed = !!$followed?.find(f => f?.playerId === follower.id);
	$: follower && refreshMutual(follower);
	$: avatartUrl = follower.avatar?.includes('beatleader')
		? follower.avatar.replace(follower.avatar.split('.')[follower.avatar.split('.').length - 1], 'webp')
		: follower.avatar;
</script>

<a
	href={`/u/${follower.alias ?? follower.id}`}
	class="player-container"
	bind:this={referenceElement}
	on:click|preventDefault|stopPropagation={() => navigate(`/u/${follower.alias ?? follower.id}`)}
	in:fly|global={{delay: idx * 10, x: animationSign * 100}}>
	{#if !loading}
		<img class="avatar" src={avatartUrl} />
	{:else}
		<div class="avatar-placeholder">
			<Spinner />
		</div>
	{/if}
	{#if mutual}
		<i class="fas fa-handshake-angle" title="Mutually follows you!" />
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
				cls="list-add-follower-btn"
				title={isFollowed
					? 'Stop following'
					: $followed.length >= 250
						? 'More than 250 following is not supported at the moment. Please unfollow someone first.'
						: 'Follow'}
				iconFa={isFollowed ? 'fas fa-user-minus' : 'fas fa-user-plus'}
				type={isFollowed ? 'danger' : 'primary'}
				loading={operationInProgress}
				disabled={operationInProgress || (!isFollowed && $followed.length >= 250)}
				preventDefault={true}
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
		position: relative;
		display: flex;
		gap: 1em;
		align-items: center;
		color: white;
		padding: 0.5em;
		background-color: #242424;
		border-radius: 2em;
	}

	.fa-handshake-angle {
		position: absolute;
		transition: all 0.3s;
		bottom: 0.5em;
		left: 2.8em;
		background-color: #0000008a;
		font-size: 0.8em;
		padding: 0.3em 0.2em;
		border-radius: 1em;
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

	:global(.list-add-follower-btn) {
		width: 2.3rem !important;
		height: 2.3rem !important;
		border-radius: 2em !important;
		margin-top: -0.2em !important;
		margin-bottom: -0.2em !important;
		margin-right: 0.4em !important;
	}

	:global(.list-add-follower-btn i) {
		margin-bottom: -0.2em;
		margin-left: 0.15em;
	}
</style>
