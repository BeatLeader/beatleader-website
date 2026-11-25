<script>
	import {createEventDispatcher} from 'svelte';
	import Dialog from '../Common/Dialog.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';

	export let change;

	const MIN_LENGTH = 10;
	const MAX_LENGTH = 500;

	const dispatch = createEventDispatcher();

	function portal(node) {
		document.body.appendChild(node);
		return {destroy: () => node.remove()};
	}

	let reason = '';
	let sending = false;
	let error = null;

	async function submit() {
		if (!valid || sending) return;

		sending = true;
		error = null;
		try {
			const response = await fetch(`${BL_API_URL}user/namehistory/removal`, {
				method: 'POST',
				credentials: 'include',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({changeId: change.id, reason: reason.trim()}),
			});
			if (!response.ok) {
				const text = await response.text();
				throw new Error(text?.length ? text.replace(/^"|"$/g, '') : `Request failed (${response.status})`);
			}
			dispatch('requested', await response.json());
		} catch (e) {
			error = e.message;
		} finally {
			sending = false;
		}
	}

	$: length = reason.trim().length;
	$: valid = length >= MIN_LENGTH && length <= MAX_LENGTH;
</script>

<div use:portal>
	<Dialog
		type="confirm"
		title="Remove from name history"
		okButton={sending ? 'Sending...' : 'Send request'}
		okButtonDisabled={!valid || sending}
		on:confirm={submit}
		on:cancel={() => dispatch('cancel')}>
		<div slot="content" class="removal-dialog">
			<div class="change">
				<span class="old-name">{change.oldName}</span>
				<i class="fas fa-arrow-right arrow"></i>
				<span class="new-name">{change.newName}</span>
				<span class="when" title={dateFromUnix(change.timestamp)?.toLocaleString()}
					>{formatDateRelative(dateFromUnix(change.timestamp))}</span>
			</div>

			<p>
				Tell us why this change should be removed. (Privacy and safety reasons, like your real name or other personal details in a
				name, for example.)
			</p>

			<textarea
				bind:value={reason}
				rows="4"
				maxlength={MAX_LENGTH}
				placeholder="For example: the old name is my real full name"
				disabled={sending}></textarea>
			<div class="counter" class:short={length > 0 && length < MIN_LENGTH}>
				{#if length > 0 && length < MIN_LENGTH}At least {MIN_LENGTH} characters ·{/if}
				{length}/{MAX_LENGTH}
			</div>

			<p class="note">
				A name also shows in the change before or after this one, ask for each change you want gone. If an admin declines the
				request, this change can't be requested again. Please message staff directly.
			</p>

			{#if error}
				<p class="error"><i class="fas fa-circle-xmark"></i> {error}</p>
			{/if}
		</div>
	</Dialog>
</div>

<style>
	.removal-dialog {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
		width: min(32em, 80vw);
	}

	.removal-dialog p {
		margin: 0;
	}

	.change {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em;
		padding: 0.5em 0.7em;
		border-radius: 6px;
		background-color: color-mix(in srgb, var(--textColor, white) 6%, transparent);
		word-break: break-word;
	}

	.old-name {
		color: var(--faded, #999);
	}

	.new-name {
		font-weight: 600;
	}

	.arrow {
		color: var(--faded, #999);
		font-size: 0.85em;
	}

	.when {
		margin-left: auto;
		color: var(--faded, #999);
		font-size: 0.85em;
	}

	textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 0.5em 0.6em;
		border: 1px solid var(--faded, #555);
		border-radius: 0.4em;
		background-color: var(--background, #222);
		color: var(--textColor, white);
		font-family: inherit;

		font-size: inherit;
		resize: vertical;
	}

	::placeholder {
		opacity: 0.6;
	}

	.counter {
		margin-top: -0.3em;
		align-self: flex-end;
		color: var(--faded, #999);
		font-size: 0.8em;
	}

	.counter.short {
		color: #e8c34a;
	}

	.note {
		color: var(--faded, #999);
		font-size: 0.85em;
	}

	.error {
		color: #ff6b6b;
	}
</style>
