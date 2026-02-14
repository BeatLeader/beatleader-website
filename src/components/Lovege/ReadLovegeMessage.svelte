<script>
	import DialogContent from '../Common/DialogContent.svelte';

	export let player;

	export let confirm;
	export let cancel;

	let blurred = true;
</script>

<div class="dialog-container">
	<DialogContent
		type="alert"
		title="A message from {player.name}"
		okButton="Done"
		okButtonType="primary"
		on:confirm={() => confirm()}
		on:cancel={cancel}>
		<div slot="content">
			<div class="message-container">
				<div class="player-container">
					<img src={player?.playerInfo?.avatar} class="avatar" alt="" />
				</div>
				<span class="main-message">Hi, I watched {player.views} of your plays, you are great!</span>
				{#if player.followed}
					<span class="custom-message">{player.message}</span>
				{:else}
					<span class="message-warning">Message is from the player not from your friends list.<br /> Click eye to show it.</span>
					<div class="blurred-container">
						<span class="custom-message" class:blurred>{player.message}</span>
						<div style="margin: 0; padding: 0;">
							<span
								class="reveal clickable"
								class:opened={!blurred}
								on:click={() => (blurred = !blurred)}
								title={!blurred ? 'Hide message' : 'Message from a player not from your friends list'}>
								<i class={!blurred ? 'fas fa-eye-slash' : 'far fa-eye'} />
							</span>
						</div>
					</div>
				{/if}
			</div>
			<img class="background-heart" src="/assets/heart-regular.svg" />
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
	}
	:global(.dialog-container header) {
		color: white !important;
	}
	.message-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin-top: 2em;
	}
	.message-warning {
		color: #ffffff82;
		text-align: center;
		max-width: 90%;
	}
	.player-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin-bottom: 1em;
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
		text-align: center;
	}
	.background-heart {
		position: absolute;
		width: 12em;
		height: 12em;
		top: 0;
		right: 0;
	}
	.reveal {
		align-self: flex-start;
		cursor: pointer;
	}
	.blurred-container {
		display: flex;
		gap: 1em;
	}
	.blurred {
		color: transparent;
		text-shadow: 0 0 8px #ffffff;
	}

	:global(.bg .wrap .window) {
		width: auto !important;
		height: auto !important;
		background-color: #b53232 !important;
		border-radius: 16px;
	}

	@media screen and (max-width: 767px) {
		:global(.dialog-container header) {
			max-width: 50%;
		}
	}
</style>
