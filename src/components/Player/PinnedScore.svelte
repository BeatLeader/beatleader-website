<script>
	import {getNotificationsContext} from 'svelte-notifications';
	import createAccountStore from '../../stores/beatleader/account';
	import pinApiClient from '../../network/clients/beatleader/scores/api-pin';
	import {SsrHttpClientError} from '../../network/errors';
	import SongScore from './SongScore.svelte';
	import Button from '../Common/Button.svelte';

	export let playerId;
	export let songScore;
	export let modifiers;

	const {addNotification} = getNotificationsContext();
	const account = createAccountStore();

	let editMode = false;

	let isLoading = false;

	let description = '';
	let link = '';

	function enableEdit() {
		editMode = true;
		description = songScore?.score?.metadata?.description ?? '';
		link = songScore?.score?.metadata?.link ?? '';
	}

	async function onSave() {
		if (!songScore?.score?.id) return;

		try {
			isLoading = true;

			const pin = true;
			const scoreId = songScore.score.id;
			const pinPriority = songScore?.score?.metadata?.priority ?? 100;

			const data = await pinApiClient.update({scoreId, pin, description, link, pinPriority});

			console.log('DATA RETURNED', data);

			// TODO: update score metadata

			editMode = false;
		} catch (err) {
			let errMessage = err.toString();

			if (err instanceof SsrHttpClientError) {
				errMessage = await err.getResponse().text();
			}

			addNotification({
				text: errMessage,
				position: 'top-right',
				type: 'error',
				removeAfter: 4000,
			});
		} finally {
			isLoading = false;
		}
	}
</script>

{#if songScore?.score?.id}
	<div class="score">
		<header>
			{#if editMode}
				<form on:submit|preventDefault|stopPropagation={() => {}}>
					<textarea bind:value={description} placeholder="Enter description..." rows="5" />
					<input type="text" bind:value={link} placeholder="Enter YT/Twitch/Twitter link..." />
					<div>
						<Button type="primary" iconFa="fas fa-save" label="Save" on:click={onSave} />
						<Button type="default" label="Cancel" on:click={() => (editMode = false)} />
					</div>
				</form>
			{:else}
				<h3 class:editable={$account?.id && $account?.id === songScore.score?.playerId} on:click={enableEdit}>
					{songScore.score?.metadata?.description ??
						($account?.id && $account?.id === songScore.score?.playerId ? 'Click to edit description...' : '')}

					{#if $account?.id && $account?.id === songScore.score?.playerId}
						<i class="fas fa-edit" on:click={enableEdit} title="Click to edit" />
					{/if}
				</h3>
			{/if}
		</header>

		<SongScore {playerId} {songScore} modifiersStore={modifiers} service="beatleader" icons={['bs', 'replay', 'pin', 'pin-service']} />
	</div>
{/if}

<style>
	.score {
		padding: 1em 0;
	}

	header {
		font-size: 0.875em;
		margin-top: 1em;
		margin-bottom: 0.5em;
	}

	h3.editable {
		cursor: pointer;
	}

	h3 i.fas {
		display: inline-block;
		margin-left: 0.5em;
	}

	textarea,
	input {
		font-size: 100%;
		color: white;
		background-color: transparent;
		padding: 0.5em;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	textarea::placeholder,
	input::placeholder {
		color: var(--dimmed);
		opacity: 0.5;
	}
</style>
