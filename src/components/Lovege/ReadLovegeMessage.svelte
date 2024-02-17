<script>
	import DialogContent from '../Common/DialogContent.svelte';

	export let player;

	export let confirm;
	export let cancel;
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title="A message from {player.name}"
		okButton="Send"
		okButtonType="green"
		on:confirm={() => confirm()}
		on:cancel={cancel}>
		<div slot="content">
			<div class="message-container">
				<div class="player-container">
					<img src={player?.playerInfo?.avatar} class="avatar" alt="" />
					<span class="player-name">{player.name}</span>
				</div>
				<span class="main-message">Hi, I watched {player.views} of your plays, you are great!</span>
				<span class="custom-message">{player.message}</span>
			</div>
			<img class="background-heart" src="/assets/heart-regular.svg" />
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
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
	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
		background-color: rgb(137 0 0) !important;
	}
</style>
