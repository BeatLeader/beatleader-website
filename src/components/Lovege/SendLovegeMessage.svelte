<script>
	import DialogContent from '../Common/DialogContent.svelte';

	export let player;

	export let confirm;
	export let cancel;

	let message = '';
</script>

<div class="dialog-container-lovege">
	<DialogContent
		type="confirm"
		title="Send message to {player.name}"
		okButton="Send"
		okButtonType="green"
		okButtonDisabled={message.length > 100}
		okButtonTitle={message.length > 100 ? "Please keep your message short" : null}
		cancelButton="Cancel"
		on:confirm={() => confirm(message)}
		on:cancel={cancel}>
		<div slot="content">
			<div class="message-container">
				<div class="player-container">
					<img src={player?.playerInfo?.avatar} class="avatar" alt="" />
				</div>
				<span class="main-message">Hi, I watched {player.views} of your plays, you are great!</span>
				<input class="message-input" type="text" bind:value={message} placeholder="Your message here..." />
			</div>
			<img class="background-heart" src="/assets/heart-regular.svg" />
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container-lovege {
		margin: 1em;
	}
	:global(.dialog-container-lovege header) {
		color: white !important;
	}
	.message-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	.player-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 10em;
		margin-bottom: 2em;
	}
	.avatar {
		border-radius: 50%;
		width: 150px;
		transition: transform 300ms;
		z-index: 2;
		aspect-ratio: 1/1;
	}
	.player-name {
		text-align: center;
	}
	.message-input {
		width: 100%;
		background-color: #f0f8ff00;
		color: white;
		border: none;
		border-bottom: 1px solid white !important;
	}
	::placeholder {
		color: black;
		opacity: 1; /* Firefox */
	}
	.main-message {
		font-size: 1.4em;
		margin-bottom: 1em;
	}
	.background-heart {
		position: absolute;
		width: 12em;
		height: 12em;
		top: 0;
		right: 0;
	}
	:global(.bg .wrap .window:has(.dialog-container-lovege)) {
		width: auto !important;
		height: auto !important;
		background-color: #b53232 !important;
		border-radius: 16px;
	}

	@media screen and (max-width: 767px) {
		:global(.dialog-container-lovege header) {
			max-width: 50%;
		}
	}
</style>
