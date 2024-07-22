<script>
	import DialogContent from '../Common/DialogContent.svelte';

	export let confirm;
	export let cancel;
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title="Reset Client Secret"
		okButton="RESET"
		okButtonType="danger"
		cancelButton="Cancel"
		on:confirm={confirm}
		on:cancel={cancel}>
		<div slot="content">Are you sure you want to reset the secret? This will break your current set up.</div>
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
