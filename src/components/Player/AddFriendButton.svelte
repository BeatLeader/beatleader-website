<script>
	import createAccountStore from '../../stores/beatleader/account';
	import followed from '../../stores/beatleader/followed';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';

	export let playerId = null;

	const account = createAccountStore();

	let operationInProgress = false;
	async function onClick(op) {
		if (!playerId || !op) return;

		try {
			operationInProgress = true;

			switch (op) {
				case 'add':
					await account.addFollowed(playerId);
					break;
				case 'remove':
					await account.removeFollowed(playerId);
					break;
			}
		} catch (err) {
		} finally {
			operationInProgress = false;
		}
	}

	$: isMain = playerId && $account?.id === playerId;
	$: isFollowed = playerId && !!$followed?.find(f => f?.playerId === playerId);
</script>

{#if isMain}
	<div class="fas fa-home icon main-profile" title="This is your profile" />
{:else if operationInProgress}
	<Spinner />
{:else if isFollowed}
	<Button
		cls="ranking-friends-button"
		type="danger"
		square={true}
		animated={true}
		disabled={operationInProgress}
		title="Unfollow"
		iconFa="fas fa-user-minus"
		on:click={() => onClick('remove')} />
{:else}
	<Button
		cls="ranking-friends-button"
		type="primary"
		square={true}
		animated={true}
		disabled={operationInProgress || $followed.length >= 250}
		title={$followed.length >= 250 ? 'More than 250 following is not supported at the moment. Please unfollow someone first.' : 'Follow'}
		iconFa="fas fa-user-plus"
		on:click={() => onClick('add')} />
{/if}

<style>
	.icon {
		display: grid;
		width: 2em;
		height: 2em;
		color: white;
		border-radius: 100%;
	}

	.icon.main-profile {
		background: var(--faded);
	}

	:global(.ranking-friends-button) {
		width: 2em !important;
		height: 2em !important;
		border-radius: 100% !important;
		margin-bottom: -0.1em !important;
	}
</style>
