<script>
	import createAccountStore from '../../stores/beatleader/account';
	import followed from '../../stores/beatleader/followed';
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
{:else}
	<div
		class={isFollowed ? 'fas fa-user-minus icon remove-followed' : 'fas fa-user-plus icon add-followed'}
		on:click={() => onClick(isFollowed ? 'remove' : 'add')}
		title={isFollowed ? 'Remove from Followed' : 'Add to Followed'} />
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

	.icon.remove-followed {
		background: var(--decrease);
		cursor: pointer;
	}

	.icon.remove-followed:hover {
		background: var(--decrease) linear-gradient(0deg, transparent, #ffffff66);
	}

	.icon.add-followed {
		background: var(--alternate);
		cursor: pointer;
	}

	.icon.add-followed:hover {
		background: var(--alternate) linear-gradient(0deg, transparent, #ffffff66);
	}
</style>
