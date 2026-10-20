<script>
	import DialogContent from '../Common/DialogContent.svelte';

	export let playlistName;
	export let confirm;
	export let cancel;
	export let leave = false;
	export let pinCount = 0;
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title={leave ? 'Leave Playlist' : 'Delete Playlist'}
		okButton={leave ? 'LEAVE' : 'DELETE'}
		okButtonType="danger"
		cancelButton="Cancel"
		on:confirm={confirm}
		on:cancel={cancel}>
		<div slot="content">
			{#if leave}
				Remove <b>{playlistName}</b> from your playlists? You'll need to be invited again to get it back.
			{:else}
				Are you sure you want to delete <b>{playlistName}</b>? This is irreversible.
				{#if pinCount > 0}
					<p class="pin-warning">
						<i class="fas fa-thumbtack" />
						{pinCount === 1 ? '1 player has' : `${pinCount} players have`} it pinned to their profile. It will disappear from there.
					</p>
				{/if}
			{/if}
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
	}

	.pin-warning {
		margin: 0.8em 0 0;
		color: #ffd24d;
	}

	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
	}
</style>
