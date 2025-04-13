<script>
	import DialogContent from '../Common/DialogContent.svelte';

	export let playlistName;
	export let confirm;
	export let cancel;
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title="Delete Playlist"
		okButton="DELETE"
		okButtonType="danger"
		cancelButton="Cancel"
		on:confirm={confirm}
		on:cancel={cancel}>
		<div slot="content">Are you sure you want to delete <b>{playlistName}</b>? This is irreversible.</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
	}
	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
	}
</style>
