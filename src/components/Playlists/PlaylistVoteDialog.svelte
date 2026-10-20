<script>
	import DialogContent from '../Common/DialogContent.svelte';
	import Select from '../Settings/Select.svelte';
	import {playlistItemCount, playlistItemsLabel} from '../../stores/playlists';

	export let playlist;
	export let store;
	export let close;
	export let onStarted = null;

	const HOUR = 3600;
	const DURATIONS = [
		{name: 'No time limit, I end it', value: 0},
		{name: '1 hour', value: HOUR},
		{name: '1 day', value: 24 * HOUR},
		{name: '3 days', value: 3 * 24 * HOUR},
		{name: '1 week', value: 7 * 24 * HOUR},
		{name: '2 weeks', value: 14 * 24 * HOUR},
		{name: 'Until a date...', value: -1},
	];
	const RESULTS = [
		{id: 'always', icon: 'fas fa-eye', title: 'Always', text: 'Everyone sees the counts while voting.'},
		{id: 'voted', icon: 'fas fa-check-to-slot', title: 'After voting', text: 'Voters see the counts once they voted.'},
		{id: 'ended', icon: 'fas fa-flag-checkered', title: 'After the vote ends', text: 'Nobody but you sees them until it ends.'},
	];

	const optionCount = playlistItemCount(playlist);
	const maxPicks = Math.min(50, optionCount);
	const tooMany = optionCount > 200;

	let question = '';
	let duration = 3 * 24 * HOUR;
	let until = datetimeLocalValue(Date.now() + 7 * 24 * HOUR * 1000);
	let maxChoices = 1;
	let results = 'always';
	let allowChange = true;
	let saving = false;
	let error = tooMany ? `Votes can have up to 200 options, this playlist has ${optionCount}. Split it to vote on it.` : null;

	function datetimeLocalValue(ms) {
		return new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
	}

	function endsAt() {
		if (duration === 0) return null;
		if (duration > 0) return Math.floor(Date.now() / 1000) + duration;
		return Math.floor(new Date(until).getTime() / 1000);
	}

	async function start() {
		error = null;
		const end = endsAt();
		if (Number.isNaN(end) || (end != null && end * 1000 < Date.now() + 60000)) {
			error = 'Pick a date at least a minute from now';
			return;
		}
		const picks = Math.round(Number(maxChoices));
		if (!(picks >= 1 && picks <= maxPicks)) {
			error = `Voters can pick 1 to ${maxPicks}`;
			return;
		}

		saving = true;
		try {
			const vote = await store.startVote(playlist.key, {question: question.trim() || null, maxChoices: picks, results, allowChange, endsAt: end});
			onStarted?.(vote);
			close();
		} catch (e) {
			error = e?.message || 'Failed to start the vote';
		}
		saving = false;
	}
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title="Start a vote"
		okButton="Start vote"
		okButtonDisabled={saving || tooMany}
		cancelButton="Cancel"
		on:confirm={start}
		on:cancel={close}>
		<div slot="content" class="vote-form">
			<p class="intro">
				Players who can open this playlist vote on its {playlistItemsLabel(playlist, optionCount)}. While the vote runs, nobody can
				add, remove, reorder or edit them. You can end it any time, and its results stay on the Votes tab.
			</p>

			<label class="field">
				<span class="label-text">Question</span>
				<input type="text" maxlength="300" placeholder="e.g. Which map should we play next week? (optional)" bind:value={question} />
			</label>

			<div class="row">
				<div class="field grow">
					<span class="label-text">Time limit</span>
					<Select bind:value={duration} options={DURATIONS} fontSize={0.9} />
					{#if duration === -1}
						<input type="datetime-local" bind:value={until} min={datetimeLocalValue(Date.now() + 60000)} />
					{/if}
				</div>
				<label class="field">
					<span class="label-text">Picks per voter</span>
					<input class="picks" type="number" min="1" max={maxPicks} bind:value={maxChoices} />
				</label>
			</div>

			<div class="field">
				<span class="label-text">Results</span>
				<div class="results" role="radiogroup">
					{#each RESULTS as option (option.id)}
						<button class="result-option" class:on={results === option.id} role="radio" aria-checked={results === option.id} on:click={() => (results = option.id)}>
							<i class={option.icon} />
							<span>
								<b>{option.title}</b>
								<small>{option.text}</small>
							</span>
						</button>
					{/each}
				</div>
				<small class="hint">You always see them.</small>
			</div>

			<label class="checkbox">
				<input type="checkbox" bind:checked={allowChange} />
				<span>Voters can change their picks until the vote ends</span>
			</label>

			{#if error}
				<p class="error">{error}</p>
			{/if}
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
		width: min(36em, 88vw);
	}

	.vote-form {
		display: flex;
		flex-direction: column;
		gap: 0.9em;
	}

	.intro {
		margin: 0;
		font-size: 0.9em;
		opacity: 0.8;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
	}

	.label-text {
		font-size: 0.75em;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.6;
	}

	.row {
		display: flex;
		gap: 1em;
		align-items: flex-start;
	}

	.grow {
		flex: 1;
	}

	input[type='text'],
	input[type='number'],
	input[type='datetime-local'] {
		height: 2.1em;
		padding: 0 0.6em;
		border-radius: 0.45em;
		border: 1px solid var(--dimmed);
		background-color: rgba(0, 0, 0, 0.25);
		color: inherit;
		font-family: inherit;
		font-size: 0.9em;
		color-scheme: dark;
	}

	.picks {
		width: 6em;
	}

	.results {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.4em;
	}

	.result-option {
		display: flex;
		align-items: flex-start;
		gap: 0.5em;
		padding: 0.5em 0.6em;
		border: 1px solid var(--dimmed);
		border-radius: 0.5em;
		background-color: color-mix(in srgb, var(--textColor, white) 3%, transparent);
		color: inherit;
		font-family: inherit;
		font-size: 0.85em;
		text-align: left;
		cursor: pointer;
	}

	.result-option i {
		margin-top: 0.2em;
		opacity: 0.7;
	}

	.result-option span {
		display: flex;
		flex-direction: column;
	}

	.result-option small {
		opacity: 0.65;
	}

	.result-option:hover:not(.on) {
		background-color: color-mix(in srgb, var(--textColor, white) 7%, transparent);
	}

	.result-option.on {
		border-color: #9b6dff99;
		background-color: #9b6dff1f;
	}

	.result-option.on i {
		color: #b896ff;
		opacity: 1;
	}

	.hint {
		font-size: 0.78em;
		opacity: 0.6;
	}

	.checkbox {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-size: 0.9em;
		cursor: pointer;
	}

	.error {
		margin: 0;
		color: #ff6b6b;
	}

	@media screen and (max-width: 600px) {
		.row {
			flex-direction: column;
		}

		.results {
			grid-template-columns: 1fr;
		}
	}

	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
	}

	/* Centers icons in the 1.3em box of Button.svelte's global button i rule */
	button i {
		line-height: 1.3em;
		text-align: center;
	}
</style>
