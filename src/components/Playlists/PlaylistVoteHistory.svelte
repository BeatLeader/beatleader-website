<script>
	import {createEventDispatcher} from 'svelte';
	import {getNotificationsContext} from 'svelte-notifications';
	import Spinner from '../Common/Spinner.svelte';
	import FormattedDate from '../Common/FormattedDate.svelte';
	import PlaylistVoteResults from './PlaylistVoteResults.svelte';
	import {isReplayPlaylist} from '../../stores/playlists';
	import {RESULTS_LABELS, timeLeft, votePercent} from './votes';

	export let playlist;
	export let store;
	export let isOwner = false;

	const dispatch = createEventDispatcher();
	const {addNotification} = getNotificationsContext();

	let votes = null;
	let loadedFor = null;
	let open = {};
	let details = {};
	let confirmingDelete = null;

	async function load(signature) {
		loadedFor = signature;
		try {
			votes = await store.getVotes(playlist);
		} catch (e) {
			votes = [];
			addNotification({text: e?.message || 'Failed to load the votes', position: 'top-right', type: 'error', removeAfter: 4000});
		}
	}

	async function toggle(vote) {
		open = {...open, [vote.id]: !open[vote.id]};
		if (open[vote.id] && !details[vote.id]) {
			try {
				details = {...details, [vote.id]: await store.getVote(playlist, vote.id)};
			} catch (e) {
				open = {...open, [vote.id]: false};
			}
		}
	}

	async function remove(vote) {
		confirmingDelete = null;
		try {
			await store.deleteVote(playlist.key, vote.id);
			votes = votes.filter(v => v.id !== vote.id);
		} catch (e) {
			addNotification({text: e?.message || 'Failed to delete the vote', position: 'top-right', type: 'error', removeAfter: 4000});
		}
	}

	const label = (option, replays) => (replays ? `${option.playerName ?? 'Unknown player'} on ${option.songName ?? 'a deleted map'}` : (option.songName ?? 'Unknown map'));

	$: signature = `${playlist?.id}-${playlist?.vote?.id ?? ''}-${playlist?.voteCount ?? 0}`;
	$: if (playlist?.id && signature !== loadedFor) load(signature);
	$: replays = isReplayPlaylist(playlist);
</script>

{#if votes === null}
	<Spinner />
{:else if !votes.length}
	<p class="empty">No votes yet.</p>
{:else}
	<div class="vote-list">
		{#each votes as vote (vote.id)}
			<div class="vote-entry" class:running={vote.active}>
				<div class="entry-head">
					<span class="entry-icon"><i class="fas {vote.active ? 'fa-square-poll-vertical' : 'fa-flag-checkered'}" /></span>
					<div class="entry-title">
						<b>{vote.question || `Vote for the favorite ${replays ? 'replays' : 'maps'}`}</b>
						<span class="entry-meta">
							{#if vote.active}
								<span class="live">Running{vote.endsAt ? ` · ends in ${timeLeft(vote.endsAt)}` : ''}</span>
							{:else}
								<span><FormattedDate date={vote.createdAt} /> – <FormattedDate date={vote.endedAt ?? vote.endsAt} /></span>
							{/if}
							<span>{vote.voterCount} {vote.voterCount === 1 ? 'voter' : 'voters'}</span>
							<span>{vote.maxChoices === 1 ? 'one pick' : `up to ${vote.maxChoices} picks`}</span>
							{#if vote.myChoices?.length}<span class="mine"><i class="fas fa-check" /> you voted</span>{/if}
						</span>
					</div>
					{#if vote.active}
						<button class="link" on:click={() => dispatch('show-running')}>Vote</button>
					{:else}
						<button class="link" on:click={() => toggle(vote)}>{open[vote.id] ? 'Hide results' : 'Results'}</button>
						{#if isOwner}
							{#if confirmingDelete === vote.id}
								<span class="delete-confirm">
									<button class="link danger" on:click={() => remove(vote)}>Delete</button>
									<button class="link" on:click={() => (confirmingDelete = null)}>Keep</button>
								</span>
							{:else}
								<button class="icon-button" title="Delete this vote and its results" on:click={() => (confirmingDelete = vote.id)}>
									<i class="fas fa-trash-alt" />
								</button>
							{/if}
						{/if}
					{/if}
				</div>

				{#if open[vote.id] && details[vote.id]}
					<div class="entry-results">
						<PlaylistVoteResults vote={details[vote.id]} />
					</div>
				{:else if open[vote.id]}
					<Spinner />
				{:else if !vote.active && vote.options?.length}
					<div class="leaders">
						{#each vote.options as option (option.id)}
							{@const first = option.votes === vote.options[0].votes}
							<span class="leader" class:first>
								{#if first}<i class="fas fa-trophy" />{/if}
								{label(option, replays)}
								<span class="leader-votes">{option.votes} · {votePercent(option.votes, vote.voterCount)}%</span>
							</span>
						{/each}
					</div>
				{:else if vote.active && !vote.resultsVisible}
					<p class="hint">{RESULTS_LABELS[vote.results]}.</p>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.empty {
		margin: 1em;
		text-align: center;
		opacity: 0.7;
	}

	.vote-list {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
	}

	.vote-entry {
		padding: 0.6em 0.8em;
		border: 1px solid color-mix(in srgb, var(--textColor, white) 10%, transparent);
		border-radius: 10px;
		background-color: color-mix(in srgb, var(--textColor, white) 3%, transparent);
	}

	.vote-entry.running {
		border-color: #9b6dff66;
		background-color: #9b6dff14;
	}

	.entry-head {
		display: flex;
		align-items: center;
		gap: 0.7em;
	}

	.entry-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 2em;
		height: 2em;
		border-radius: 50%;
		background-color: var(--dimmed);
	}

	.running .entry-icon {
		background-color: #9b6dff80;
	}

	.entry-title {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.entry-title b {
		color: var(--textColor, white);
		overflow-wrap: anywhere;
	}

	.entry-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2em 0.8em;
		font-size: 0.82em;
		opacity: 0.75;
	}

	.live {
		color: #b896ff;
		font-weight: 600;
	}

	.mine {
		color: #b896ff;
	}

	.link {
		flex: none;
		padding: 0;
		border: none;
		background: none;
		color: color-mix(in srgb, var(--textColor, white) 80%, transparent);
		font-family: inherit;
		font-size: 0.9em;
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

	.delete-confirm {
		display: inline-flex;
		gap: 0.7em;
	}

	.icon-button {
		flex: none;
		width: 1.9em;
		height: 1.9em;
		border: none;
		border-radius: 0.45em;
		background-color: transparent;
		color: color-mix(in srgb, var(--textColor, white) 50%, transparent);
		cursor: pointer;
	}

	.icon-button:hover {
		background-color: rgba(233, 78, 54, 0.45);
		color: white;
	}

	.entry-results {
		margin-top: 0.6em;
	}

	.leaders {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3em 1.1em;
		margin: 0.5em 0 0 2.7em;
		font-size: 0.85em;
		opacity: 0.85;
	}

	.leader.first {
		color: #ffd24d;
		font-weight: 600;
	}

	.leader-votes {
		opacity: 0.65;
		font-weight: normal;
	}

	.hint {
		margin: 0.4em 0 0 2.7em;
		font-size: 0.82em;
		opacity: 0.65;
	}

	/* Centers icons in the 1.3em box of Button.svelte's global button i rule */
	button i {
		line-height: 1.3em;
		text-align: center;
	}
</style>
