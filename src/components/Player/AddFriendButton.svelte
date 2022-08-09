<script>
	import createAccountStore from '../../stores/beatleader/account';
	import friends from '../../stores/beatleader/friends';
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

	$: isMain = playerId && $account?.id === playerId;
	$: isFriend = playerId && !!$friends?.find(f => f?.playerId === playerId);
</script>

{#if isMain}
	<div class="fas fa-home icon main-profile" title="This is your profile" />
{:else if operationInProgress}
	<Spinner />
{:else}
	<div
		class={isFriend ? 'fas fa-user-minus icon remove-friend' : 'fas fa-user-plus icon add-friend'}
		on:click={() => onClick(isFriend ? 'remove' : 'add')}
		title={isFriend ? 'Remove from Friends' : 'Add to Friends'} />
{/if}

<style>
	.icon {
		display: grid;
		width: 2em;
		height: 2em;
		color: white;
		border-radius: 0.4em;
	}

	.icon.main-profile {
		background: var(--faded);
	}

	.icon.remove-friend {
		background: var(--decrease);
		cursor: pointer;
	}

	.icon.remove-friend:hover {
		background: var(--decrease) linear-gradient(0deg, transparent, #ffffff66);
	}

	.icon.add-friend {
		background: var(--alternate);
		cursor: pointer;
	}

	.icon.add-friend:hover {
		background: var(--alternate) linear-gradient(0deg, transparent, #ffffff66);
	}
</style>
