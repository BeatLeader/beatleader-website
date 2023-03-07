<script>
	import DialogContent from '../Common/DialogContent.svelte';

	export let confirm;
	export let cancel;
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title="Remove OP scores"
		okButton="DELETE"
		okButtonType="danger"
		cancelButton="Cancel"
		on:confirm={confirm}
		on:cancel={cancel}>
		<div slot="content">Are you sure you want to delete all cheezed scores?</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
	}
	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
		background-color: black !important;
	}
</style>
