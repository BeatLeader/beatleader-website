<script>
	import {getNotificationsContext} from 'svelte-notifications';
	import createPinnedScoresStore from '../../stores/beatleader/pinned-scores';
	import createAccountStore from '../../stores/beatleader/account';
	import pinApiClient from '../../network/clients/beatleader/scores/api-pin';
	import {SsrHttpClientError} from '../../network/errors';
	import SongScore from './SongScore.svelte';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';

	export let playerId;
	export let songScore;
	export let idx = 0;
	export let length = 0;
	export let fixedBrowserTitle = null;

	const {addNotification} = getNotificationsContext();
	const account = createAccountStore();
	const pinnedScoresStore = createPinnedScoresStore();

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

		$pinnedScoresStore[playerId] = reindex(
			$pinnedScoresStore[playerId].map(s => {
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

		$pinnedScoresStore[playerId] = reindex(
			$pinnedScoresStore[playerId].map(s => {
				if (s !== songScore && Number.isFinite(s?.score?.metadata?.priority) && s.score.metadata.priority <= newPriority)
					s.score.metadata.priority--;

				return s;
			})
		);
	}

	$: isFirst = idx === 0;
	$: isLast = idx >= length - 1;
	$: editable = $account?.id && $account?.id === songScore.score?.playerId;
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
				{#if editable}
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

				{#if editable || songScore.score?.metadata?.description}
					<h3
						class="pin-description"
						class:editable
						on:click={() => {
							if (editable) enableEdit();
						}}>
						{songScore.score?.metadata?.description ?? (editable ? 'Click to edit description...' : '')}
					</h3>
				{/if}
				{#if songScore.score?.replaysWatched}
					<h3 class="pin-description" title="Replay watch count">
						<i class="fas fa-eye" />
						{songScore.score?.replaysWatched}
					</h3>
				{/if}

				{#if editable}
					<i class="fas fa-edit" on:click={enableEdit} title="Click to edit" />
				{/if}
			{/if}
		</header>

		<SongScore
			{playerId}
			{songScore}
			service="beatleader"
			icons={['bs', 'replay', 'pin', 'pin-service']}
			{fixedBrowserTitle}
			replayCounter={false} />
	</div>
{/if}

<style>
	.score:not(:first-child) {
		border-top: 1px solid var(--row-separator);
	}

	header {
		display: flex;
		align-items: flex-start;
		grid-gap: 0.5em;
		font-size: 0.875em;
	}

	header > h3 {
		width: fit-content;
		border-bottom-left-radius: 0.5em;
		border-bottom-right-radius: 0.5em;
		background: var(--row-separator);
		padding: 0 1em 0.2em;
	}

	.move {
		display: flex;
		justify-content: center;
		grid-gap: 0.5em;
		width: 3em;
	}

	h3.editable {
		cursor: pointer;
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
		width: 100%;
	}

	textarea::placeholder,
	input::placeholder {
		color: var(--dimmed);
		opacity: 0.5;
	}

	.pin-description {
		overflow-wrap: anywhere;
	}
</style>
