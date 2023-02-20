<script>
	import createPlayerService from '../../../services/beatleader/player';
	import PlayerNameWithFlag from '../../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../../Common/Avatar.svelte';
	import {dateFromUnix, formatDate, formatDateRelative, getTimeStringColor, WEEKSECONDS} from '../../../utils/date';
	import {navigate} from 'svelte-routing';

	export let vote;

	const playerService = createPlayerService();

	let voter;

	async function retrievePlayer(playerId) {
		voter = await playerService.fetchPlayerOrGetFromCache(playerId);
	}

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	$: retrievePlayer(vote.playerId);
</script>

<div class="sender">
	<Avatar player={voter} />
	<PlayerNameWithFlag player={voter} on:click={voter ? () => navigateToPlayer(voter.playerId) : null} />
	<div class="timeset">
		<span style="color: {getTimeStringColor(vote.timeset)}; ">
			{formatDateRelative(dateFromUnix(vote.timeset))}
		</span>
	</div>
	{#if vote.edited}
		<span title={formatDateRelative(dateFromUnix(vote.editTimeset))}>(Edited)</span>
	{/if}
</div>

<style>
	.sender {
		display: flex;
		grid-gap: 0.8em;
		width: 20em;
	}
</style>
