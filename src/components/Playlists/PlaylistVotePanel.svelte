<script>
	import {createEventDispatcher, onDestroy, onMount} from 'svelte';
	import {getNotificationsContext} from 'svelte-notifications';
	import Button from '../Common/Button.svelte';
	import FormattedDate from '../Common/FormattedDate.svelte';
	import {isReplayPlaylist} from '../../stores/playlists';
	import {RESULTS_LABELS, timeLeft} from './votes';

	export let playlist;
	export let store;
	export let voteState;
	export let isOwner = false;
	export let loggedIn = false;
	export let editor = false;

	const dispatch = createEventDispatcher();
	const {addNotification} = getNotificationsContext();
	const POLL_INTERVAL = 30000;

	let vote = null;
	let selected = new Set();
	let loadedId = null;
	let submitting = false;
	let confirmingEnd = false;
	let now = Date.now();
	let endedReported = null;

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 4000 : 2000});
	}

	function setVoteAndPicks(fresh) {
		vote = fresh;
		selected = new Set(fresh.myChoices ?? []);
	}

	async function load(id) {
		loadedId = id;
		try {
			setVoteAndPicks(await store.getVote(playlist, id));
		} catch (e) {
			notify(e?.message || 'Failed to load the vote', 'error');
		}
	}

	async function poll() {
		if (!vote?.active || document.visibilityState !== 'visible') return;
		try {
			vote = await store.getVote(playlist, vote.id);
		} catch (e) {}
	}

	function toggle(optionId) {
		if (!canPick) return;
		const next = new Set(selected);
		if (next.has(optionId)) {
			next.delete(optionId);
		} else if (vote.maxChoices === 1) {
			next.clear();
			next.add(optionId);
		} else if (next.size < vote.maxChoices) {
			next.add(optionId);
		}
		selected = next;
	}

	async function submit(optionIds) {
		submitting = true;
		try {
			setVoteAndPicks(await store.castVote(playlist, vote.id, optionIds));
			notify(optionIds.length ? (voted ? 'Vote changed' : 'Vote counted') : 'Vote taken back');
		} catch (e) {
			notify(e?.message || 'Voting failed', 'error');
		}
		submitting = false;
	}

	async function endVote() {
		confirmingEnd = false;
		try {
			await store.endVote(playlist.key, vote.id);
			notify('Vote ended, its results are on the Votes tab');
			dispatch('ended', vote.id);
		} catch (e) {
			notify(e?.message || 'Failed to end the vote', 'error');
		}
	}

	onMount(() => {
		const ticker = setInterval(() => (now = Date.now()), 1000);
		const poller = setInterval(poll, POLL_INTERVAL);
		return () => {
			clearInterval(ticker);
			clearInterval(poller);
		};
	});
	onDestroy(() => voteState.set(null));

	$: if (playlist?.vote?.id && playlist.vote.id !== loadedId) load(playlist.vote.id);
	$: running = !!vote && !vote.endedAt && (!vote.endsAt || vote.endsAt * 1000 > now);
	$: if (vote && !running && endedReported !== vote.id) {
		endedReported = vote.id;
		dispatch('ended', vote.id);
	}
	$: voted = !!vote?.myChoices?.length;
	$: canPick = loggedIn && running && (!voted || vote.allowChange);
	$: changed = !!vote && (selected.size !== (vote.myChoices?.length ?? 0) || [...selected].some(id => !vote.myChoices?.includes(id)));
	$: itemsWord = isReplayPlaylist(playlist) ? 'replays' : 'maps';
	$: voteState.set(
		vote
			? {
					vote,
					byItem: new Map((vote.options ?? []).map(o => [o.itemId, o])),
					selected,
					canPick,
					showPicks: loggedIn && running,
					resultsVisible: vote.resultsVisible,
					toggle,
				}
			: null
	);
</script>

{#if vote}
	<div class="vote-panel">
		<div class="vote-head">
			<span class="vote-icon"><i class="fas fa-square-poll-vertical" /></span>
			<div class="vote-title">
				<b>{vote.question || `Vote for your favorite ${itemsWord}`}</b>
				<span class="vote-meta">
					{#if vote.endsAt}
						<span title="Ends {new Date(vote.endsAt * 1000).toLocaleString()}"><i class="far fa-clock" /> Ends in {timeLeft(vote.endsAt, now)}</span>
					{:else}
						<span><i class="far fa-clock" /> No time limit</span>
					{/if}
					<span>{vote.maxChoices === 1 ? 'One pick' : `Up to ${vote.maxChoices} picks`}</span>
					<span>{vote.voterCount} {vote.voterCount === 1 ? 'voter' : 'voters'}</span>
					{#if !vote.allowChange}<span>Votes are final</span>{/if}
				</span>
			</div>
			{#if isOwner}
				{#if confirmingEnd}
					<span class="end-confirm">
						End it now?
						<button class="link danger" on:click={endVote}>End vote</button>
						<button class="link" on:click={() => (confirmingEnd = false)}>Keep it</button>
					</span>
				{:else}
					<button class="end-button" title="End the vote now, its results stay" on:click={() => (confirmingEnd = true)}>
						<i class="fas fa-flag-checkered" /> End vote
					</button>
				{/if}
			{/if}
		</div>

		<div class="vote-status">
			{#if !loggedIn}
				<span>Log in to vote.</span>
			{:else if canPick}
				<span>
					{#if voted}
						Your vote is in. Change your picks below and submit again.
					{:else}
						Pick {vote.maxChoices === 1 ? 'one' : `up to ${vote.maxChoices}`} of the {itemsWord} below, then submit.
					{/if}
				</span>
				<span class="actions">
					<Button
						label={voted ? 'Change vote' : `Submit vote${vote.maxChoices > 1 ? ` (${selected.size}/${vote.maxChoices})` : ''}`}
						type="primary"
						noMargin={true}
						disabled={submitting || !changed || !selected.size}
						loading={submitting}
						on:click={() => submit([...selected])} />
					{#if voted}
						<button class="link" disabled={submitting} on:click={() => submit([])}>Take back my vote</button>
					{:else if selected.size}
						<button class="link" on:click={() => (selected = new Set())}>Clear</button>
					{/if}
				</span>
			{:else if voted}
				<span><i class="fas fa-check" /> You voted. Votes in this one can't be changed.</span>
			{/if}
		</div>

		<div class="vote-foot">
			<span>
				{#if isOwner && vote.results !== 'always'}
					You see the results; {vote.results === 'voted' ? 'voters see them once they vote' : 'others see them when the vote ends'}.
				{:else}
					{RESULTS_LABELS[vote.results]}.
				{/if}
			</span>
			{#if editor}
				<span>The {itemsWord} can't change while the vote runs.</span>
			{/if}
			<span class="started">Started <FormattedDate date={vote.createdAt} /></span>
		</div>
	</div>
{/if}

<style>
	.vote-panel {
		--vote-accent: #9b6dff;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		margin: 0.1em 0.2em 0.6em;
		padding: 0.7em 0.9em;
		border: 1px solid #9b6dff66;
		border-radius: 10px;
		background-color: #9b6dff14;
	}

	.vote-head {
		display: flex;
		align-items: center;
		gap: 0.7em;
	}

	.vote-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 2.2em;
		height: 2.2em;
		border-radius: 50%;
		background-color: #9b6dff80;
		color: white;
	}

	.vote-title {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.vote-title b {
		color: var(--textColor, white);
		overflow-wrap: anywhere;
	}

	.vote-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3em 0.9em;
		font-size: 0.85em;
		opacity: 0.8;
	}

	.vote-status {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em 1em;
		font-size: 0.9em;
	}

	.actions {
		display: inline-flex;
		align-items: center;
		gap: 0.8em;
		margin-left: auto;
	}

	.vote-foot {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2em 1em;
		font-size: 0.78em;
		opacity: 0.6;
	}

	.started {
		margin-left: auto;
	}

	.end-button {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		flex: none;
		padding: 0.35em 0.8em;
		border: 1px solid color-mix(in srgb, var(--textColor, white) 15%, transparent);
		border-radius: 0.5em;
		background-color: color-mix(in srgb, var(--textColor, white) 7%, transparent);
		color: color-mix(in srgb, var(--textColor, white) 87%, transparent);
		font-family: inherit;
		font-size: 0.85em;
		font-weight: 600;
		cursor: pointer;
	}

	.end-button:hover {
		background-color: color-mix(in srgb, var(--textColor, white) 13%, transparent);
	}

	.end-confirm {
		display: inline-flex;
		align-items: center;
		gap: 0.7em;
		flex: none;
		font-size: 0.85em;
	}

	.link {
		padding: 0;
		border: none;
		background: none;
		color: color-mix(in srgb, var(--textColor, white) 80%, transparent);
		font-family: inherit;
		font-size: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.link:hover {
		color: var(--textColor, white);
		text-decoration: underline;
	}

	.link.danger {
		color: #ff6b6b;
	}

	.link:disabled {
		opacity: 0.5;
		cursor: default;
	}

	@media screen and (max-width: 767px) {
		.vote-head {
			flex-wrap: wrap;
		}

		.actions {
			margin-left: 0;
		}
	}

	/* Centers icons in the 1.3em box of Button.svelte's global button i rule */
	button i {
		line-height: 1.3em;
		text-align: center;
	}
</style>
