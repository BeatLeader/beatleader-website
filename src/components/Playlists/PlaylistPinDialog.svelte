<script>
	import DialogContent from '../Common/DialogContent.svelte';
	import {pinPlaylist, unpinPlaylist} from './pins';

	export let playlist;
	export let close;
	export let onChange = null;

	let description = playlist.pinDescription ?? '';
	let saving = false;
	let error = null;

	async function setPinned(pinned) {
		const text = description.trim();
		saving = true;
		error = null;
		try {
			await (pinned ? pinPlaylist(playlist.id, text) : unpinPlaylist(playlist.id));
			onChange?.(pinned, (pinned && text) || null);
			close();
		} catch (e) {
			error = e?.message || (pinned ? 'Pinning failed' : 'Unpinning failed');
		}
		saving = false;
	}
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title={playlist.pinned ? 'Pinned to your profile' : 'Pin to your profile'}
		okButton={playlist.pinned ? 'Save' : 'Pin'}
		okButtonDisabled={saving}
		cancelButton="Cancel"
		on:confirm={() => setPinned(true)}
		on:cancel={close}>
		<div slot="content" class="pin-content">
			<p>
				<b>{playlist.playlistTitle}</b> shows in the pinned section of your profile, with your comment.
			</p>
			<textarea rows="3" maxlength="300" placeholder="What's it for, why you like it... (optional)" bind:value={description} />
			<div class="row">
				<small>{description.length}/300</small>
				{#if playlist.pinned}
					<button class="unpin" disabled={saving} on:click={() => setPinned(false)}><i class="fas fa-thumbtack" /> Unpin</button>
				{/if}
			</div>
			{#if error}
				<p class="error">{error}</p>
			{/if}
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
		max-width: 32em;
	}

	.pin-content {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.pin-content p {
		margin: 0;
	}

	textarea {
		padding: 0.4em 0.6em;
		border-radius: 0.4em;
		border: 1px solid var(--faded);
		background-color: var(--dimmed);
		color: inherit;
		font-family: inherit;
		resize: vertical;
	}

	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	small {
		opacity: 0.6;
	}

	.unpin {
		padding: 0;
		border: none;
		background: none;
		color: #ff6b6b;
		font-family: inherit;
		cursor: pointer;
	}

	.error {
		color: #ff6b6b;
	}

	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
	}
</style>
