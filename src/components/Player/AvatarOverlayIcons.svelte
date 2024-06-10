<script>
	import {configStore} from '../../stores/config';
	import createAccountStore from '../../stores/beatleader/account';
	import followed from '../../stores/beatleader/followed';
	import {SsrHttpResponseError} from '../../network/errors';
	import {createEventDispatcher} from 'svelte';
	import createClanService from '../../services/beatleader/clan';
	import Button from '../Common/Button.svelte';
	import Dialog from '../Common/Dialog.svelte';
	import Error from '../Common/Error.svelte';

	export let playerData;
	export let editModel = null;

	let playerInfo = playerData?.playerInfo;
	let playerId = playerData?.playerId;

	const dispatch = createEventDispatcher();

	const account = createAccountStore();
	const clanService = createClanService();

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
	</nav>

	{#if editModel && !editModel.avatarOverlayEdit}
		<div class="imageInput" on:click={() => (editModel.avatarOverlayEdit = true)}>
			<span class="imageChange">
				<h3 class="changeLabel">Change</h3>
			</span>
		</div>
	{/if}
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

	nav :global(.button-n-0) {
		left: 7.3em;
		top: -2.5em;
	}

	nav :global(.button-n-0):hover {
		transform: scale(1.2);
	}

	nav :global(.button-n-1) {
		left: 8.9em;
		top: -0.2em;
	}

	nav :global(.button-n-1):hover {
		transform: scale(1.2);
	}

	nav :global(.button-n-2) {
		left: 9.5em;
		top: 2.6em;
	}

	nav :global(.button-n-2):hover {
		transform: scale(1.2);
	}

	nav :global(.button-n-3) {
		left: 8.9em;
		top: 5.4em;
	}

	nav :global(.button-n-3):hover {
		transform: scale(1.2);
	}

	nav :global(.button-n-4) {
		left: 7.2em;
		top: 7.6em;
	}

	nav :global(.button-n-4):hover {
		transform: scale(1.2);
	}

	.imageInput {
		cursor: pointer;
		display: flex;
		position: absolute;
		width: 100px;
		height: 100px;
		top: calc(50% - 48px);
		left: calc(50% - 48px);
		align-items: center;
		z-index: 6;
	}

	.imageChange {
		transition: opacity 0.2s ease-in-out;
		background-color: rgba(32, 33, 36, 0.6);
		height: 33%;
		left: 0;
		opacity: 1;
		position: absolute;
		right: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.changeLabel {
		position: absolute;
	}
</style>
