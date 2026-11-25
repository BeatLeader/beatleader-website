<script>
	import {getNotificationsContext} from 'svelte-notifications';
	import {navigate} from 'svelte-routing';
	import DialogContent from '../Common/DialogContent.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import {DELETION_REASONS, reasonLabel, fetchScoreStatus, markScores, unmarkScores} from '../../stores/beatleader/score-deletions';
	import ScoreDeletionScore from './ScoreDeletionScore.svelte';

	export let scoreId;
	export let close;

	const {addNotification} = getNotificationsContext();

	let status = null;
	let error = null;
	let reason = 'Cheating';
	let comment = '';
	let saving = false;

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 4000 : 2000});
	}

	async function load() {
		try {
			status = await fetchScoreStatus(scoreId);
			if (status?.mark) {
				reason = status.mark.reason;
				comment = status.mark.comment ?? '';
			}
		} catch (e) {
			error = e.message;
		}
	}

	async function mark() {
		saving = true;
		try {
			await markScores([scoreId], reason, comment);
			notify(status?.mark ? 'Deletion reason updated' : 'Marked for deletion');
			close();
		} catch (e) {
			notify(e.message, 'error');
		} finally {
			saving = false;
		}
	}

	async function unmark() {
		saving = true;
		try {
			await unmarkScores([scoreId]);
			notify('Removed from the deletion queue');
			close();
		} catch (e) {
			notify(e.message, 'error');
		} finally {
			saving = false;
		}
	}

	function openQueue() {
		close();
		navigate('/admin/scoreDeletions');
	}

	$: canMark = !!status?.score && !saving;

	load();
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title={status?.mark ? 'Marked for deletion' : 'Mark for deletion'}
		okButton={status?.score ? (status?.mark ? 'Update' : 'Mark') : null}
		okButtonType="danger"
		okButtonDisabled={!canMark}
		cancelButton="Cancel"
		on:confirm={mark}
		on:cancel={close}>
		<div slot="content" class="deletion-content">
			{#if error}
				<div class="problem">{error}</div>
			{:else if !status}
				<Spinner />
			{:else}
				{#if status.score}
					<ScoreDeletionScore score={status.score} />
				{:else if status.removal}
					<div class="notice">
						<i class="fas fa-circle-info" />
						Already deleted {formatDateRelative(dateFromUnix(status.removal.timestamp))}
						{#if status.removal.admin}by {status.removal.admin.name}{/if}
						{#if status.removal.reason}({reasonLabel(status.removal.reason)}){/if}.
					</div>
				{:else}
					<div class="problem">This score doesn't exist</div>
				{/if}

				{#if status.mark}
					<div class="notice marked">
						<i class="fas fa-hourglass-half" />
						In the queue since {formatDateRelative(dateFromUnix(status.mark.timestamp))}
						{#if status.mark.markedBy}by {status.mark.markedBy.name}{/if}: {reasonLabel(status.mark.reason)}.
					</div>
				{/if}

				{#if status.score}
					<section>
						<div class="section-label">Reason</div>
						<div class="reasons" role="radiogroup">
							{#each DELETION_REASONS as option (option.id)}
								<button class="reason-chip" class:on={reason === option.id} role="radio" aria-checked={reason === option.id} on:click={() => (reason = option.id)}>
									<i class={option.iconFa} />
									{option.label}
								</button>
							{/each}
						</div>
					</section>

					<section>
						<div class="section-label">Comment</div>
						<textarea class="sd-field" rows="3" maxlength="500" placeholder="What's wrong with it, links to proof" bind:value={comment}></textarea>
					</section>

					<small class="hint">
						The score stays up until an admin deletes the queue on the <button class="link" on:click={openQueue}>admin page</button>.
					</small>
				{/if}
			{/if}
		</div>
		<span slot="footer-left">
			{#if status?.mark}
				<button class="unmark" disabled={saving} on:click={unmark}><i class="fas fa-rotate-left" /> Remove from the queue</button>
			{/if}
		</span>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
		width: min(32em, 85vw);
	}

	.deletion-content {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 0.45em;
	}

	.section-label {
		font-weight: 600;
		color: var(--faded);
		font-size: 0.9em;
	}

	.reasons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em;
	}

	.reason-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.35em 0.7em;
		border: 1px solid var(--faded, #555);
		border-radius: 1em;
		background: none;
		color: var(--textColor, white);
		font-family: inherit;
		font-size: 0.9em;
		cursor: pointer;
	}

	.reason-chip.on {
		border-color: #ff6b6b;
		background-color: #ff6b6b22;
		color: #ff8f8f;
	}

	.sd-field {
		width: 100%;
		box-sizing: border-box;
		padding: 0.5em;
		border: 1px solid var(--faded, #555);
		border-radius: 0.4em;
		background-color: var(--background, #222);
		color: var(--textColor, white);
		font-family: inherit;
		resize: vertical;
	}

	.notice {
		padding: 0.6em 0.8em;
		border-radius: 0.5em;
		background-color: #ffffff0d;
	}

	.notice.marked {
		color: #ffd24d;
		background-color: #ffd24d14;
	}

	.problem {
		color: #ff6b6b;
	}

	.hint {
		color: var(--faded);
	}

	.link,
	.unmark {
		padding: 0;
		border: none;
		background: none;
		color: var(--beatleader-primary, #3273dc);
		font-family: inherit;
		font-size: inherit;
		cursor: pointer;
	}

	.unmark {
		color: #ffd24d;
		font-weight: 600;
	}

	.unmark:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
