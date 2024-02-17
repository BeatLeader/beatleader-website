<script>
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import {LottiePlayer} from '@lottiefiles/svelte-lottie-player';
	import createPlayerService from '../services/beatleader/player';
	import Avatar from '../components/Common/Avatar.svelte';
	import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte';
	import {navigate} from 'svelte-routing';
	import {getContext} from 'svelte';
	import SendLovegeMessage from '../components/Lovege/SendLovegeMessage.svelte';
	import Button from '../components/Common/Button.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import ReadLovegeMessage from '../components/Lovege/ReadLovegeMessage.svelte';

	const playerService = createPlayerService();
	const account = createAccountStore();

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

	function faIconForSendButton(player) {
		if (!player.sent) {
			return 'fa-heart';
		} else if (player.viewed) {
			return 'fa-envelope-open';
		} else {
			return 'fa-envelope';
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

    const openViewMessage = async (messagePlayer) => {
        fetch(BL_API_URL + `valentine/viewed?id=${messagePlayer.messageId}`, {credentials: 'include'})

		open(ReadLovegeMessage, {
			player: messagePlayer,
			confirm: () => {
                messagePlayer.viewed = true;
                incomingMessages = incomingMessages;
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

			players.push(player);
		}

		receivingMessage = false;
		incomingMessages = players;
	}

	function checkUnreadValentines(account) {
		if (!account) return;

		receivingMessage = account?.valentines?.find(v => !v.viewed);

		if (receivingMessage) {
			setInterval(() => {
				fetchIncomingMessages(account?.valentines ?? []);
			}, 1000);
		} else {
			fetchIncomingMessages(account?.valentines ?? []);
		}
	}

	$: $account?.valentines ? checkUnreadValentines($account) : null;
	$: $account?.player && fetchTopPlayers();
</script>

<div class="centering-container">
	{#if !$account?.player}{:else}
		{#if incomingMessages.length}
			<ContentBox cls="lovege-box">
				<div class="lovege-container">
					<span class="header-title">Messages to you:</span>
					{#each incomingMessages as player}
						<div class="list-item">
							<div class="player-info">
								<Avatar {player} />
								<PlayerNameWithFlag {player} on:click={player ? () => navigateToPlayer(player.playerId) : null} />
							</div>
							<span>{player.views} replays</span>
							<Button
								iconFa="fas {faIconForOpenButton(player)}"
								type="danger"
								on:click={() => openViewMessage(player)} />
						</div>
					{/each}
				</div>
			</ContentBox>
		{/if}
		<ContentBox cls="lovege-box">
			<div class="lovege-container">
				{#if topPlayers.length}
					<span class="header-title">Your most loved</span>
					{#each topPlayers as player, idx}
						<div class="list-item">
							<div class="player-info">
								<Avatar {player} />
								<PlayerNameWithFlag {player} on:click={player ? () => navigateToPlayer(player.playerId) : null} />
							</div>
							<span>{player.views} replays</span>
							<Button
								iconFa="fas {faIconForSendButton(player)}"
								type="danger"
								disabled={player.sent}
								on:click={() => openSendMessage(player, idx)} />
						</div>
					{/each}
				{:else if receivingMessage}
					<span>Incoming!</span>
					<LottiePlayer
						speed="1"
						width="10em"
						height="10em"
						loop
						autoplay
						controls={false}
						src={`/assets/animations/lovege-incoming.json`} />
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
	}

	.lovege-container {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.header-title {
		font-size: 1.4em;
		font-weight: bold;
	}

	.list-item {
		display: flex;
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
</style>
