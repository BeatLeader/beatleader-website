<script>
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {fade, fly} from 'svelte/transition';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import {LottiePlayer} from '@lottiefiles/svelte-lottie-player';
	import createPlayerService from '../services/beatleader/player';
	import Avatar from '../components/Common/Avatar.svelte';
	import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte';
	import {navigate} from 'svelte-routing';
	import {getContext} from 'svelte';
	import SendLovegeMessage from '../components/Lovege/SendLovegeMessage.svelte';
	import Button from '../components/Common/Button.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import {configStore} from '../stores/config';
	import ReadLovegeMessage from '../components/Lovege/ReadLovegeMessage.svelte';
	import produce from 'immer';
	import Spinner from '../components/Common/Spinner.svelte';
	import steamSvg from '../resources/steam.svg';

	const playerService = createPlayerService();
	const account = createAccountStore();

	let login;
	let password;

	const {open, close} = getContext('simple-modal');

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	let topPlayers = [];
	let incomingMessages = [];

	let sendingMessage = false;
	let receivingMessage = false;

	function fetchTopPlayers() {
		fetch(BL_API_URL + 'mytopviewed', {credentials: 'include'})
			.then(r => r.json())
			.then(async result => {
				var players = [];
				for (let index = 0; index < result.length; index++) {
					const element = result[index];
					var player = await playerService.fetchPlayerOrGetFromCache(element.id);
					player.views = element.count;
					player.sent = element.sent;
					player.viewed = element.viewed;

					players.push(player);
				}

				sendingMessage = false;
				topPlayers = players;
			});
	}

	function titleForSendButton(player) {
		if (!player.sent) {
			return 'Send a message to your favourite player!';
		} else if (player.viewed) {
			return 'Your message was opened!';
		} else {
			return 'Your message was delivered!';
		}
	}

	function faIconForSendButton(player) {
		if (!player.sent) {
			return 'fa-heart';
		} else if (player.viewed) {
			return 'fa-envelope-open';
		} else {
			return 'fa-envelope';
		}
	}

	function titleForOpenButton(player) {
		if (player.viewed) {
			return 'Read the message once more';
		} else {
			return 'New message!';
		}
	}

	function faIconForOpenButton(player) {
		if (player.viewed) {
			return 'fa-envelope-open';
		} else {
			return 'fa-envelope';
		}
	}

	const openSendMessage = async (receiverPlayer, idx) => {
		open(SendLovegeMessage, {
			player: receiverPlayer,
			confirm: message => {
				close();
				sendingMessage = true;
				topPlayers = [];

				fetch(`${BL_API_URL}sendvalentine?index=${idx}&message=${encodeURIComponent(message)}`, {
					credentials: 'include',
					method: 'POST',
				}).then(_ => fetchTopPlayers());
			},
			cancel: () => {
				close();
			},
		});
	};

	const openViewMessage = async messagePlayer => {
		fetch(BL_API_URL + `valentine/viewed?id=${messagePlayer.messageId}`, {credentials: 'include'});

		open(ReadLovegeMessage, {
			player: messagePlayer,
			confirm: () => {
				messagePlayer.viewed = true;
				incomingMessages = incomingMessages;
				account.noteMessageViewed(messagePlayer.messageId);

				close();
			},
			cancel: () => {
				close();
			},
		});
	};

	async function fetchIncomingMessages(valentines) {
		var players = [];
		for (let index = 0; index < valentines.length; index++) {
			const element = valentines[index];
			var player = await playerService.fetchPlayerOrGetFromCache(element.senderId);
			player.views = element.viewCount;
			player.viewed = element.viewed;
			player.message = element.message;
			player.messageId = element.id;
			player.followed = element.followed;

			players.push(player);
		}

		receivingMessage = false;
		incomingMessages = players;
	}

	function checkUnreadValentines(account) {
		if (!account) return;

		receivingMessage = account?.valentines?.find(v => !v.viewed);

		if (receivingMessage) {
			setTimeout(() => {
				fetchIncomingMessages(account?.valentines ?? []);
			}, 1500);
		} else {
			fetchIncomingMessages(account?.valentines ?? []);
		}
	}

	function noteOpened() {
		$configStore = produce($configStore, draft => {
			draft.preferences.openedLovege = true;
		});
	}

	$: noteOpened();
	$: $account?.valentines ? checkUnreadValentines($account) : null;
	$: $account?.player && fetchTopPlayers();
</script>

<div class="centering-container">
	{#if !$account?.player}
		<div class="login-form" transition:fade|global>
			<div class="title">Please log in to view your<br /><b>favourite players</b></div>
			<form action={BL_API_URL + 'signin'} method="post">
				<input type="hidden" name="Provider" value="Steam" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/lovege'} />

				<Button icon={steamSvg} label="Log In with Steam" type="green" />
			</form>
			<br />
			<span>Quest Log In</span>
			<div class="input-container">
				<div class="cat">Login</div>
				<input bind:value={login} placeholder="Login" />
			</div>
			<div class="input-container">
				<div class="cat">Password</div>
				<input type="password" bind:value={password} placeholder="Password" />
			</div>

			<Button iconFa="fas fa-right-to-bracket" label="Log In" on:click={() => account.logIn(login, password)} />
		</div>
	{:else}
		{#if !receivingMessage && (incomingMessages.length || topPlayers.length)}
			<ContentBox cls="lovege-box">
				<div class="cover-container">
					<a href="https://x.com/MEGANESIUM310/status/1757389916588171489">
						<img class="cover-image" src="/assets/lovege-cover.jpg" />
					</a>
					<span class="cover-title">Send some love to your favourite players!</span>
				</div>
			</ContentBox>
		{/if}
		{#if incomingMessages.length}
			<ContentBox cls="lovege-box">
				<div class="lovege-container">
					<span class="header-title">Messages to you:</span>
					{#each incomingMessages as player}
						<div class="list-item">
							<div class="player-and-views">
								<div class="player-info">
									<Avatar {player} />
									<PlayerNameWithFlag {player} on:click={player ? () => navigateToPlayer(player.playerId) : null} />
								</div>
								<span>{player.views} replays watched</span>
							</div>
							<Button
								iconFa="fas {faIconForOpenButton(player)}"
								title={titleForOpenButton(player)}
								type="danger"
								on:click={() => openViewMessage(player)} />
						</div>
					{/each}
				</div>
			</ContentBox>
		{/if}
		<ContentBox cls="lovege-box">
			<div class="lovege-container">
				{#if receivingMessage}
					<span>Incoming!</span>
					<LottiePlayer
						speed="1"
						width="10em"
						height="10em"
						loop
						autoplay
						controls={false}
						src={`/assets/animations/lovege-incoming.json`} />
				{:else if topPlayers.length}
					<span class="header-title">Your most loved:</span>
					{#each topPlayers as player, idx}
						<div class="list-item">
							<div class="player-and-views">
								<div class="player-info">
									<Avatar {player} />
									<PlayerNameWithFlag {player} on:click={player ? () => navigateToPlayer(player.playerId) : null} />
								</div>
								<span>{player.views} replays watched</span>
							</div>
							<Button
								iconFa="fas {faIconForSendButton(player)}"
								title={titleForSendButton(player)}
								type="danger"
								disabled={player.sent}
								on:click={() => openSendMessage(player, idx)} />
						</div>
					{/each}
				{:else if sendingMessage}
					<span>Your message is on the way...</span>
					<LottiePlayer
						speed="1"
						width="10em"
						height="10em"
						loop
						autoplay
						controls={false}
						src={`/assets/animations/lovege-sending.json`} />
				{:else if !incomingMessages.length}
					<span>Collecting your views...</span>
					<LottiePlayer
						speed="1"
						width="10em"
						height="10em"
						loop
						autoplay
						controls={false}
						src={`/assets/animations/lovege-loading.json`} />
				{:else}
					<Spinner />
				{/if}
			</div>
		</ContentBox>
	{/if}
</div>

<style>
	.centering-container {
		display: flex;
		justify-content: center;
		align-items: center;
		align-self: center;
		flex-direction: column;
	}

	.lovege-container {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.player-and-views {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
	}

	.cover-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.cover-title {
		text-align: center;
	}

	.cover-image {
		width: 14em;
	}

	.header-title {
		font-size: 1.4em;
		font-weight: bold;
	}

	.list-item {
		display: flex;
		align-items: center;
		width: 18em;
		justify-content: space-between;
	}

	.player-info {
		display: flex;
		gap: 0.4em;
	}

	:global(.lovege-box) {
		max-width: 20em;
		max-height: 20em;
		background-color: pink;
	}

	.title {
		text-align: center;
	}

	.error {
		color: red;
	}
	.messagep {
		color: green;
	}

	.input-container {
		display: grid;
		width: 20em;
		margin-bottom: 0.5em;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		flex: none;
		align-items: center;
	}

	.button-container {
		display: flex;
		justify-content: center;
		margin: 1em;
	}

	.inlineLink {
		display: contents;
	}
</style>
