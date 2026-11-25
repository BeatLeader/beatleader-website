<script>
	import {getNotificationsContext} from 'svelte-notifications';
	import DialogContent from '../Common/DialogContent.svelte';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {formatNumber} from '../../utils/format';
	import {reasonLabel, fetchScoreStatus, markScores, simulateScore, describeSimulation} from '../../stores/beatleader/score-deletions';
	import ScoreDeletionScore from './ScoreDeletionScore.svelte';

	export let scoreId;
	export let close;

	const {addNotification} = getNotificationsContext();

	let status = null;
	let result = null;
	let error = null;
	let simulating = false;
	let marking = false;

	function notify(text, type = 'success') {
		addNotification({text, position: 'top-right', type, removeAfter: type === 'error' ? 4000 : 2000});
	}

	async function loadStatus() {
		try {
			status = await fetchScoreStatus(scoreId);
		} catch (e) {
			error = e.message;
		}
	}

	async function simulate() {
		simulating = true;
		error = null;
		result = null;
		try {
			result = await simulateScore(scoreId);
		} catch (e) {
			error = e.message;
		} finally {
			simulating = false;
		}
	}

	async function mark() {
		marking = true;
		try {
			await markScores([scoreId], 'SimulationMismatch', describeSimulation(result));
			notify('Marked for deletion');
			close();
		} catch (e) {
			notify(e.message, 'error');
		} finally {
			marking = false;
		}
	}

	function accuracy(score) {
		return formatNumber((score * 100) / Math.max(result.maxScore, 1));
	}

	$: simulated = result && !result.skipped;
	$: exact = simulated && result.recordedScore === result.simulatedScore;
	$: verdict = !simulated ? null : exact ? 'exact' : result.mismatch ? 'mismatch' : 'close';

	loadStatus();
	simulate();
</script>

<div class="dialog-container">
	<DialogContent type="confirm" title="Simulator check" okButton={null} cancelButton={null}>
		<div slot="content" class="simulation-content">
			{#if status?.score}
				<ScoreDeletionScore score={status.score} />
			{:else if status && !status.score}
				<div class="problem">This score doesn't exist</div>
			{/if}

			{#if simulating}
				<div class="notice">
					<Spinner />
					Simulating the replay...
				</div>
			{:else if error}
				<div class="problem">{error}</div>
			{:else if result?.skipped}
				<div class="notice">
					<i class="fas fa-circle-info" />
					Not simulated: {result.skipped}
				</div>
			{:else if simulated}
				<div class="verdict {verdict}">
					{#if verdict === 'exact'}
						<i class="fas fa-circle-check" /> The replay's movements give exactly the recorded score
					{:else if verdict === 'close'}
						<i class="fas fa-circle-check" /> Within the threshold
					{:else}
						<i class="fas fa-triangle-exclamation" /> Too different, over the threshold
					{/if}
				</div>

				<dl class="numbers">
					<dt>Build</dt>
					<dd>{result.build}</dd>
					<dt>Notes claim</dt>
					<dd>{formatNumber(result.recordedScore, 0)} <span class="muted">({accuracy(result.recordedScore)}%)</span></dd>
					<dt>Movements give</dt>
					<dd>{formatNumber(result.simulatedScore, 0)} <span class="muted">({accuracy(result.simulatedScore)}%)</span></dd>
					<dt>Difference</dt>
					<dd class:off={verdict === 'mismatch'}>
						{result.accuracyDifference >= 0 ? '+' : ''}{formatNumber(result.accuracyDifference, 3)}%
						<span class="muted">({formatNumber(result.recordedScore - result.simulatedScore, 0, true)})</span>
					</dd>
					<dt>Notes scored differently</dt>
					<dd>{formatNumber(result.mismatchedNotes, 0)} of {formatNumber(result.notes, 0)}</dd>
					<dt>Simulation</dt>
					<dd>{formatNumber(result.milliseconds, 0)} ms</dd>
				</dl>
			{/if}

			{#if status?.mark}
				<div class="notice marked">
					<i class="fas fa-hourglass-half" />
					Already in the deletion queue: {reasonLabel(status.mark.reason)}{#if status.mark.markedBy}, by {status.mark.markedBy
							.name}{/if}
				</div>
			{/if}
		</div>

		<span slot="footer-left">
			<Button type="default" iconFa="fas fa-arrows-rotate" label="Check again" disabled={simulating} on:click={simulate} />
		</span>
		<span slot="footer-right">
			{#if simulated && status?.score && !status?.mark}
				<Button
					type="danger"
					iconFa="fas fa-hourglass-half"
					label="Mark for deletion"
					title="Queue it with the simulation numbers as the comment"
					loading={marking}
					disabled={marking}
					on:click={mark} />
			{/if}
			<Button type="default" label="Close" on:click={close} />
		</span>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
		width: min(32em, 85vw);
	}

	.simulation-content {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.notice {
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.6em 0.8em;
		border-radius: 0.5em;
		background-color: #ffffff0d;
	}

	.notice :global(.spinner) {
		width: 1.2em;
		height: 1.2em;
	}

	.notice.marked {
		color: #ffd24d;
		background-color: #ffd24d14;
	}

	.verdict {
		padding: 0.6em 0.8em;
		border-radius: 0.5em;
		font-weight: 600;
	}

	.verdict.exact,
	.verdict.close {
		color: #6fd36f;
		background-color: #6fd36f14;
	}

	.verdict.mismatch {
		color: #ff8f8f;
		background-color: #ff6b6b1f;
	}

	.numbers {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.35em 1.2em;
		margin: 0;
	}

	.numbers dt {
		color: var(--faded, #999);
	}

	.numbers dd {
		margin: 0;
		font-variant-numeric: tabular-nums;
	}

	.numbers dd.off {
		color: #ff8f8f;
		font-weight: 600;
	}

	.muted {
		color: var(--faded, #999);
	}

	.problem {
		color: #ff6b6b;
	}
</style>
