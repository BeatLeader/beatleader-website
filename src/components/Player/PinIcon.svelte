<script>
	import {getNotificationsContext} from 'svelte-notifications';
	import createPinnedScoresStore from '../../stores/beatleader/pinned-scores';
	import createAccountStore from '../../stores/beatleader/account';
	import pinApiClient from '../../network/clients/beatleader/scores/api-pin';
	import {SsrHttpClientError} from '../../network/errors';
	import Button from '../Common/Button.svelte';
	import {createEventDispatcher} from 'svelte';

	export let scoreId;

	const {addNotification} = getNotificationsContext();
	const dispatch = createEventDispatcher();

	const account = createAccountStore();
	const pinnedScoresStore = createPinnedScoresStore();

	let isLoading = false;

	async function onClick() {
		try {
			isLoading = true;

			if (isPinned) {
				await pinApiClient.unpin(scoreId);

				addNotification({
					text: 'Score unpinned.',
					position: 'top-right',
					type: 'success',
					removeAfter: 2000,
				});

				$pinnedScoresStore[$account.id] =
					$pinnedScoresStore[$account.id]
						?.filter(s => s?.score?.id !== scoreId)
						?.map((s, idx) => {
							if (Number.isFinite(s?.score?.metadata?.priority)) s.score.metadata.priority = idx + 1;

							return s;
						}) ?? [];
			} else {
				const response = await pinApiClient.pin(scoreId);
				const metadata = await response.json();

				addNotification({
					text: 'Score pinned. You can edit it in the Pinned scores section.',
					position: 'top-right',
					type: 'success',
					removeAfter: 4000,
				});

				dispatch('score-pinned', {scoreId, metadata});
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

	$: pinnedScoreIds = $account?.id ? $pinnedScoresStore[$account.id]?.map(s => s?.score?.id)?.filter(scoreId => scoreId) ?? [] : [];
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
