<script>
	import DialogContent from '../../Common/DialogContent.svelte';

	export let confirm;
	export let cancel;
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title="Un-nominate the map?"
		okButton="VOTE"
		okButtonType="danger"
		cancelButton="Cancel"
		on:confirm={confirm}
		on:cancel={cancel}>
		<div slot="content">
			This vote will be the third negative?<br />
			Are you sure you want to stop the nomination?
		</div>
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
