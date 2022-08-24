<script>
	import {configStore} from '../../stores/config';
	import createAccountStore from '../../stores/beatleader/account';
	import friends from '../../stores/beatleader/friends';
	import {SsrHttpResponseError} from '../../network/errors';
	import {createEventDispatcher} from 'svelte';
	import createClanService from '../../services/beatleader/clan';
	import Button from '../Common/Button.svelte';
	import Dialog from '../Common/Dialog.svelte';
	import Error from '../Common/Error.svelte';

	export let playerData;

	let playerInfo = playerData.playerInfo;
	let playerId = playerData.playerId;

	const dispatch = createEventDispatcher();

	const account = createAccountStore();
	const clanService = createClanService();

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

	$: isMain = playerId && $account?.id === playerId;
	$: loggedInPlayer = $account?.id;
	$: isFriend = playerId && !!$friends?.find(f => f?.playerId === playerId);
	$: isAdmin = $account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('admin');
	$: showAvatarIcons = $configStore?.preferences?.iconsOnAvatars ?? 'only-when-needed';

	$: twitchSocial = playerInfo.socials?.find(s => s?.service === 'Twitch');
	$: twitterSocial = playerInfo.socials?.find(s => s?.service === 'Twitter');
	$: beatsaverSocial = playerInfo.socials?.find(s => s?.service === 'BeatSaver');

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

		{#if twitchSocial}
			<Button
				cls="twitch"
				url={twitchSocial.link}
				onlyurl={true}
				type="twitch"
				iconFa="fab fa-twitch"
				title="{twitchSocial.user} streamer" />
		{/if}

		{#if twitterSocial}
			<Button
				cls="twitter"
				url={twitterSocial.link}
				onlyurl={true}
				type="twitter"
				iconFa="fab fa-twitter"
				title="{twitterSocial.user} drama starter" />
		{/if}

		{#if beatsaverSocial}
			<Button
				cls="beat-saver"
				url={beatsaverSocial.link}
				onlyurl={true}
				type="purple"
				icon="<img src='https://beatsaver.com/static/favicon/apple-touch-icon.png' />"
				title="{beatsaverSocial.user} mapper" />
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

<style>
	nav {
		position: absolute;
		top: 30px;
		left: calc(50% - 50px);
		text-align: left;
		font-size: 0.75rem;
		z-index: 6;
	}

	nav :global(button) {
		border-radius: 50% !important;
		transition: all 200ms !important;
	}

	nav :global(button):nth-child(1) {
		transform: translate3d(-25px, 69px, 0);
	}

	nav :global(button):nth-child(1):hover {
		transform: translate3d(-25px, 69px, 0) scale(1.2);
	}

	nav :global(button):nth-child(2) {
		transform: translate3d(-63px, 29px, 0);
	}

	nav :global(button):nth-child(2):hover {
		transform: translate3d(-63px, 29px, 0) scale(1.2);
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

	nav :global(a) {
		position: absolute !important;
		border-radius: 50% !important;
		transition: all 200ms !important;
	}

	nav :global(.beat-saver) {
		left: 8.5em;
		top: 5.8em;
	}

	nav :global(.beat-saver):hover {
		transform: scale(1.2);
	}

	nav :global(.twitter) {
		left: 9.5em;
		top: 2.6em;
	}

	nav :global(.twitter):hover {
		transform: scale(1.2);
	}

	nav :global(.twitch) {
		left: 8.5em;
		top: -0.6em;
	}

	nav :global(.twitch):hover {
		transform: scale(1.2);
	}

	.imageInput {
		cursor: pointer;
		display: flex;
		position: absolute;
		width: 95px;
		height: 96px;
		margin-left: 1em;
		align-items: center;
	}

	.imageChange {
		transition: opacity 0.2s ease-in-out;
		background-color: rgba(32, 33, 36, 0.6);
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
