<script>
	import Button from '../Common/Button.svelte';
	import createPlayerService from '../../services/beatleader/player';
	import {createEventDispatcher} from 'svelte';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import Avatar from '../Common/Avatar.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';

	export let request;

	const dispatch = createEventDispatcher();

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	let player;

	async function retrievePlayer(request) {
		if (!request) return;

		const playerService = createPlayerService();
		player = await playerService.fetchPlayerOrGetFromCache(request.playerId);
	}

	function approveRequest(id) {
		fetch(`${BL_API_URL}alias/request/${id}/resolve?status=2`, {credentials: 'include', method: 'POST'})
			.then(r => r.json())
			.then(array => {
				dispatch('modified');
			});
	}

	function declineRequest(id) {
		fetch(`${BL_API_URL}alias/request/${id}/resolve?status=3`, {credentials: 'include', method: 'POST'})
			.then(r => r.json())
			.then(array => {
				dispatch('modified');
			});
	}

	$: retrievePlayer(request);
</script>

<div class="request-container">
	<div class="id-and-alias">
		<span><b>/u/{request.value}</b></span>
		<div class="timeset">
			<span style="color: {getTimeStringColor(request?.timeset)}; ">
				{formatDateRelative(dateFromUnix(request.timeset))} by
			</span>

			<Avatar {player} />
			<PlayerNameWithFlag {player} hideFlag={true} on:click={player ? () => navigateToPlayer(player.playerId) : null} />
		</div>
	</div>
	<div>
		<Button
			type="green"
			label="Approve"
			on:click={() => {
				approveRequest(request.id);
			}} />
		<Button
			type="yellow"
			label="Decline"
			on:click={() => {
				declineRequest(request.id);
			}} />
	</div>
</div>

<style>
	.request-container {
		background-color: #121212;
		padding: 0.5em;
		border-radius: 8px;
		margin-bottom: 0.5em;
	}
	.id-and-alias {
		display: flex;
		gap: 0.5em;
		margin-bottom: 0.5em;
	}
	.timeset {
		display: flex;
		grid-gap: 0.4em;
	}
</style>
