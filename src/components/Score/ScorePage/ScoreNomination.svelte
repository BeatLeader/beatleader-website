<script>
	import DialogContent from '../../Common/DialogContent.svelte';

	export let confirm;
	export let cancel;

	let reason = null;
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title="Nominate this score for the 'Score Of The Week'?"
		okButton="Nominate"
		okButtonType="green"
		cancelButton="Cancel"
		on:confirm={() => {
			confirm(reason);
		}}
		on:cancel={cancel}>
		<div slot="content">
			<div>
				<label>Why do you think this score is the best this week?<br /></label>
				<input type="text" bind:value={reason} placeholder="Optional" class="sponsor-input" />
			</div>
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
	}
</style>
