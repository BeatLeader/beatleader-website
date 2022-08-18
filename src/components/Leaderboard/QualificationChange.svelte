<script>
	import createPlayerService from '../../services/beatleader/player';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import {navigate} from 'svelte-routing';
	import {mapTypeFromMask} from '../../utils/beatleader/format';

	export let change;

	const playerService = createPlayerService();

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}/beatleader/date/1`);
	}

	let player;

	async function retrievePlayer(change) {
		if (!change) return;

		player = await playerService.fetchPlayerOrGetFromCache(change.playerId);
	}

	$: retrievePlayer(change);
</script>

{#if change}
	<div class="qualification-description">
		<Avatar {player} />
		<PlayerNameWithFlag {player} type={'beatleader/date'} on:click={player ? () => navigateToPlayer(player.playerId) : null} />
		<div class="timeset">
			<span style="color: {getTimeStringColor(change?.timeset)}; ">
				{formatDateRelative(dateFromUnix(change.timeset))}
			</span>
		</div>

		{#if change.oldStars != change.newStars}
			{change.oldStars} → {change.newStars} ★
		{/if}

		{#if change.oldType != change.newType}
			{mapTypeFromMask(change.oldType)} → {mapTypeFromMask(change.newType)}
		{/if}

		{#if change.oldCriteriaMet != change.newCriteriaMet}
			{change.oldCriteriaMet == 1 ? 'Met criteria' : 'Unmet criteria'} → {change.newCriteriaMet == 1 ? 'Met criteria' : 'Unmet criteria'}
		{/if}

		{#if change.oldRankability != change.newRankability}
			{change.oldRankability > 0 ? 'Nominated' : 'Unranked'} → {change.newRankability > 0 ? 'Nominated' : 'Unranked'}
		{/if}
	</div>
{/if}

<style>
	.qualification-description {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
	}
</style>
