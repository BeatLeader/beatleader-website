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
				<label><b>Best Of The Week</b> is a new format on Cube Community Youtube channel.<br /><br /></label>

				<label
					>Every week we choose the best play that goes live on Wednesday on 8pm UTC. Play is choosen not solely based on skill but also
					based on how interesting or unique the play is. Everything interesting might have a potential. <br /></label>
				<label>You can nominate this score for the Best Of The Week, and it will have a chance to appear on YouTube.<br /><br /></label>

				<label>Why do you think this score is the best this week?<br /></label>
				<textarea type="text" bind:value={reason} placeholder="Optional" class="textarea" rows="4" cols="50"></textarea>
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
	textarea::placeholder {
		color: rgb(36, 36, 36) !important;
	}
</style>
