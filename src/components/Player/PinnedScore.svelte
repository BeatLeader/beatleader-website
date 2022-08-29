<script>
	import {getNotificationsContext} from 'svelte-notifications';
	import pinnedScoresStore from '../../stores/pinned-scores';
	import createAccountStore from '../../stores/beatleader/account';
	import pinApiClient from '../../network/clients/beatleader/scores/api-pin';
	import {SsrHttpClientError} from '../../network/errors';
	import SongScore from './SongScore.svelte';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';

	export let playerId;
	export let songScore;
	export let modifiers;
	export let idx = 0;
	export let length = 0;

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
			const pinPriority = songScore?.score?.metadata?.priority ?? 1;

			const response = await pinApiClient.update({scoreId, pin, description, link, pinPriority});
			const data = await response.json();

			songScore.score.metadata = data;

			editMode = false;

			return data;
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

			return null;
		} finally {
			isLoading = false;
		}
	}

	function reindex(arr) {
		const sortFunc = (a, b) => (a?.score?.metadata?.priority ?? 0) - (b?.score?.metadata?.priority ?? 0);

		return arr
			.sort(sortFunc)
			.map((s, idx) => {
				if (Number.isFinite(s?.score?.metadata?.priority)) s.score.metadata.priority = idx + 1;
				return s;
			})
			.sort(sortFunc);
	}

	async function onUp() {
		if (idx <= 0 || !Number.isFinite(songScore?.score?.metadata?.priority)) return;

		const newPriority = songScore.score.metadata.priority - 1;

		description = songScore?.score?.metadata?.description ?? '';
		link = songScore?.score?.metadata?.link ?? '';
		songScore.score.metadata.priority = newPriority;

		const metadata = await onSave();
		if (!metadata) return;

		songScore.score.metadata = metadata;

		$pinnedScoresStore = reindex(
			$pinnedScoresStore.map(s => {
				if (s !== songScore && Number.isFinite(s?.score?.metadata?.priority) && s.score.metadata.priority >= newPriority)
					s.score.metadata.priority++;

				return s;
			})
		);
	}

	async function onDown() {
		if (idx >= length - 1 || !Number.isFinite(songScore?.score?.metadata?.priority)) return;

		const newPriority = songScore.score.metadata.priority + 1;

		description = songScore?.score?.metadata?.description ?? '';
		link = songScore?.score?.metadata?.link ?? '';
		songScore.score.metadata.priority = newPriority;

		const metadata = await onSave();
		if (!metadata) return;

		songScore.score.metadata = metadata;

		$pinnedScoresStore = reindex(
			$pinnedScoresStore.map(s => {
				if (s !== songScore && Number.isFinite(s?.score?.metadata?.priority) && s.score.metadata.priority <= newPriority)
					s.score.metadata.priority--;

				return s;
			})
		);
	}

	$: isFirst = idx === 0;
	$: isLast = idx >= length - 1;
</script>

{#if songScore?.score?.id}
	<div class="score">
		<header>
			{#if editMode}
				<form on:submit|preventDefault|stopPropagation={() => {}}>
					<textarea bind:value={description} placeholder="Enter description..." rows="5" />
					<input type="text" bind:value={link} placeholder="Enter YT/Twitch/Twitter link..." />
					<div>
						<Button type="primary" iconFa="fas fa-save" label="Save" on:click={onSave} loading={isLoading} disabled={isLoading} />
						<Button type="default" label="Cancel" on:click={() => (editMode = false)} />
					</div>
				</form>
			{:else}
				<h3 class:editable={$account?.id && $account?.id === songScore.score?.playerId} on:click={enableEdit}>
					{#if $account?.id && $account?.id === songScore.score?.playerId}
						<span class="move">
							{#if !isFirst}
								{#if isLoading}
									<i><Spinner /></i>
								{:else}
									<i class="fas fa-chevron-up" title="Move score up" on:click|stopPropagation={onUp} />
								{/if}
							{/if}

							{#if !isLast}
								{#if isLoading}
									<i><Spinner /></i>
								{:else}
									<i class="fas fa-chevron-down" title="Move score down" on:click|stopPropagation={onDown} />
								{/if}
							{/if}
						</span>
					{/if}

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

	h3 .move {
		display: inline-block;
		margin-right: 0.5em;
	}

	h3 .move i {
		padding: 0.25em 0.125em;
		cursor: pointer !important;
	}

	h3 i.fa-edit {
		display: inline-block;
		margin-left: 0.5em;
		cursor: pointer !important;
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