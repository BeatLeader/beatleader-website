<script>
	import {getNotificationsContext} from 'svelte-notifications';
	import {configStore} from '../../stores/config';
	import pinnedScoresStore from '../../stores/pinned-scores';
	import pinApiClient from '../../network/clients/beatleader/scores/api-pin';
	import {SsrHttpClientError} from '../../network/errors';
	import Button from '../Common/Button.svelte';
	import {createEventDispatcher} from 'svelte';

	export let scoreId;

	const {addNotification} = getNotificationsContext();
	const dispatch = createEventDispatcher();

	let isLoading = false;

	async function onClick() {
		try {
			isLoading = true;

			if (isPinned) {
				await pinApiClient.unpin(scoreId);
			} else {
				await pinApiClient.pin(scoreId);
			}

			if (isPinned) {
				addNotification({
					text: 'Score unpinned.',
					position: 'top-right',
					type: 'success',
					removeAfter: 2000,
				});

				$pinnedScoresStore = $pinnedScoresStore?.filter(s => s?.score?.id !== scoreId) ?? [];
			} else {
				addNotification({
					text: 'Score pinned. You can edit it in the Pinned scores section.',
					position: 'top-right',
					type: 'success',
					removeAfter: 4000,
				});

				dispatch('score-pinned', scoreId);
			}
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

	$: pinnedScoreIds = $pinnedScoresStore?.map(s => s?.score?.id)?.filter(scoreId => scoreId) ?? [];
	$: isPinned = pinnedScoreIds.includes(scoreId);
</script>

{#if scoreId}
	<Button
		iconFa={`fas fa-thumbtack${isPinned ? ' rotate' : ''}`}
		title={isPinned ? 'Unpin the map' : 'Pin the map'}
		noMargin={true}
		loading={isLoading}
		disabled={isLoading}
		on:click={onClick} />
{/if}
