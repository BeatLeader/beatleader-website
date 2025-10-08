<script>
	import DialogContent from '../Common/DialogContent.svelte';
	import ssrConfig from '../../ssr-config';

	export let confirm;
	export let cancel;
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title="Log Out from {ssrConfig.name}?"
		okButton="Yeap, log me out"
		okButtonType="danger"
		cancelButton="Cancel"
		on:confirm={confirm}
		on:cancel={cancel}>
		<div slot="content">Are you sure you want to log out?</div>
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
