<script>
	import createTwitchService from '../../services/twitch';
	import {configStore} from '../../stores/config';
	import createAccountStore from '../../stores/beatleader/account';
	import friends from '../../stores/beatleader/friends';
	import {opt} from '../../utils/js';
	import {SsrHttpResponseError} from '../../network/errors';
	import {createEventDispatcher, onMount} from 'svelte';
	import createClanService from '../../services/beatleader/clan';
	import Button from '../Common/Button.svelte';
	import TwitchLinkModal from './TwitchLinkModal.svelte';
	import Dialog from '../Common/Dialog.svelte';
	import Error from '../Common/Error.svelte';

	export let playerId;

	const dispatch = createEventDispatcher();

	const account = createAccountStore();
	const twitchService = createTwitchService();
	const clanService = createClanService();

	let twitchToken = null;
	let playerTwitchProfile = null;

	let showLinkingModal = false;

	let operationInProgress = false;
	async function onFriendsChange(op) {
		if (!playerId || !op) return;

		try {
			operationInProgress = true;

			switch (op) {
				case 'add':
					await account.addFriend(playerId);
					break;
				case 'remove':
					await account.removeFriend(playerId);
					break;
			}
		} catch (err) {
		} finally {
			operationInProgress = false;
		}
	}

	async function onTwitchLink(event) {
		if (!opt(event, 'detail.id')) return;

		playerTwitchProfile = event.detail;

		await twitchService.updatePlayerProfile({...event.detail, playerId, profileLastUpdated: new Date()});

		showLinkingModal = false;

		dispatch('modal-hidden', null);
	}

	async function onPlayerChanged(playerId) {
		if (!playerId) return;

		playerTwitchProfile = await twitchService.getPlayerProfile(playerId);
	}

	onMount(async () => {
		twitchToken = await twitchService.getCurrentToken();
	});

	let fileinput;
	const changeAvatar = e => {
		let image = e.target.files[0];
		let reader = new FileReader();
		reader.readAsArrayBuffer(image);
		reader.onload = async e => {
			try {
				dispatch('player-data-edit-error', null);

				if (loggedInPlayer === playerId) {
					await account.changeAvatar(e.target.result);
				} else {
					await account.changeAvatar(e.target.result, playerId);
				}

				dispatch('player-data-updated', {avatar: e.target.result});
			} catch (err) {
				dispatch('player-data-edit-error', err);
			}
		};
	};

	let invitationConfirmationType = null;
	let invitingError = null;
	async function onInvite(playerId) {
		if (!playerId?.length) return;

		try {
			invitingError = null;

			await clanService.invite(playerId);

			invitationConfirmationType = null;
		} catch (err) {
			if (err instanceof SsrHttpResponseError) {
				const htmlError = await err.getResponse().text();
				invitingError = htmlError?.length ? htmlError : err;
			} else {
				invitingError = err;
			}
		}
	}

	async function onCancelInvite(playerId) {
		if (!playerId?.length) return;

		try {
			invitingError = null;

			await clanService.cancelInvite(playerId);

			invitationConfirmationType = null;
		} catch (err) {
			if (err instanceof SsrHttpResponseError) {
				const htmlError = await err.getResponse().text();
				invitingError = htmlError?.length ? htmlError : err;
			} else {
				invitingError = err;
			}
		}
	}

	$: onPlayerChanged(playerId);
	$: isProfileLinkedToTwitch = !!playerTwitchProfile?.login ?? false;
	$: isMain = playerId && $account?.id === playerId;
	$: loggedInPlayer = $account?.id;
	$: isFriend = playerId && !!$friends?.find(f => f?.playerId === playerId);
	$: isAdmin = $account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('admin');
	$: showAvatarIcons = $configStore?.preferences?.iconsOnAvatars ?? 'only-when-needed';

	$: isUserFounderOfTheClan = !!$account?.clan;
	$: isPlayerClanMember = isUserFounderOfTheClan && !!$account?.clan?.players?.find(pId => pId === playerId);
	$: hasPlayerPendingInvitation =
		isUserFounderOfTheClan && !isPlayerClanMember && !!$account?.clan?.pendingInvites?.find(pId => pId === playerId);
</script>

{#if playerId}
	{#if invitationConfirmationType}
		<Dialog
			type="confirm"
			title="Are you sure?"
			okButton="Yeah!"
			cancelButton="Hell no!"
			on:confirm={() => (invitationConfirmationType === 'invite' ? onInvite(playerId) : onCancelInvite(playerId))}
			on:cancel={() => (invitationConfirmationType = false)}>
			<div slot="content">
				{#if invitationConfirmationType === 'invite'}
					<div>An invitation will be sent to the player to join the clan.</div>
				{:else}
					<div>The player's invitation to the clan will be cancelled.</div>
				{/if}

				{#if invitingError}
					<Error error={invitingError} />
				{/if}
			</div>
		</Dialog>
	{/if}

	<nav class:main={isMain}>
		{#if loggedInPlayer && !isMain && (showAvatarIcons === 'show' || (showAvatarIcons === 'only-when-needed' && !isFriend))}
			<Button
				title={isFriend ? 'Remove from Friends' : 'Add to Friends'}
				iconFa={isFriend ? 'fas fa-user-minus' : 'fas fa-user-plus'}
				type={isFriend ? 'danger' : 'primary'}
				loading={operationInProgress}
				disabled={operationInProgress}
				on:click={() => onFriendsChange(isFriend ? 'remove' : 'add')} />
		{/if}

		{#if twitchToken && (showAvatarIcons === 'show' || (showAvatarIcons === 'only-when-needed' && !isProfileLinkedToTwitch))}
			<Button
				type="twitch"
				iconFa="fab fa-twitch"
				title={`${isProfileLinkedToTwitch ? 'Re-link' : 'Link'} Twitch profile`}
				on:click={() => {
					dispatch('modal-shown', null);
					showLinkingModal = true;
				}} />
		{/if}

		{#if isUserFounderOfTheClan}
			{#if !isPlayerClanMember && !hasPlayerPendingInvitation}
				<Button
					type="primary"
					iconFa="fas fa-users"
					title="Invite player to the clan"
					on:click={() => (invitationConfirmationType = 'invite')} />
			{:else if hasPlayerPendingInvitation}
				<Button
					type="danger"
					iconFa="fas fa-users-slash"
					title="Cancel invitation to the clan"
					on:click={() => (invitationConfirmationType = 'cancel')} />
			{/if}
		{/if}

		{#if isMain || isAdmin}
			<div class="imageInput" on:click={() => fileinput.click()}>
				<input style="display:none" type="file" accept=".jpg, .jpeg, .png, .gif" on:change={e => changeAvatar(e)} bind:this={fileinput} />
				<span class="imageChange">
					<h3 class="changeLabel">Change</h3>
				</span>
			</div>
		{/if}
	</nav>
{/if}

{#if twitchToken}
	<TwitchLinkModal {playerId} show={showLinkingModal} on:link={onTwitchLink} on:cancel={() => (showLinkingModal = false)} />
{/if}

<style>
	nav {
		position: absolute;
		top: 0;
		left: calc(50% - 50px);
		text-align: left;
		font-size: 0.75rem;
		z-index: 15;
		width: 100px;
	}

	nav :global(button) {
		border-radius: 50% !important;
		transition: all 200ms !important;
	}

	nav :global(button):nth-child(1) {
		transform: translate3d(-35px, 60px, 0);
	}

	nav :global(button):nth-child(1):hover {
		transform: translate3d(-35px, 60px, 0) scale(1.2);
	}

	nav :global(button):nth-child(2) {
		transform: translate3d(-50px, 21px, 0);
	}

	nav :global(button):nth-child(2):hover {
		transform: translate3d(-50px, 21px, 0) scale(1.2);
	}

	nav :global(button):nth-child(3) {
		transform: translate3d(-47px, -7px, 0);
	}

	nav :global(button):nth-child(3):hover {
		transform: translate3d(-47px, -7px, 0) scale(1.2);
	}

	nav :global(button):nth-child(4) {
		transform: translate3d(50px, -45px, 0);
	}

	nav :global(button):nth-child(4):hover {
		transform: translate3d(50px, -45px, 0) scale(1.2);
	}

	.imageInput {
		cursor: pointer;
		display: flex;
		position: absolute;
		width: 130px;
		height: 130px;
		margin-left: -5px;
		margin-top: -40px;
	}

	.imageChange {
		transition: opacity 0.2s ease-in-out;
		background-color: rgba(32, 33, 36, 0.6);
		bottom: 0;
		height: 33%;
		left: 0;
		opacity: 0;
		position: absolute;
		right: 0;
		display: flex;
		justify-content: center;
	}

	.imageInput:hover .imageChange {
		opacity: 1;
	}

	.changeLabel {
		top: 30%;
		position: absolute;
	}
</style>
