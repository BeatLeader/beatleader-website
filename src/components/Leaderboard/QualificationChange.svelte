<script>
	import createPlayerService from '../../services/beatleader/player';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import {navigate} from 'svelte-routing';
	import {describeModifiersChanges, mapTypeFromMask} from '../../utils/beatleader/format';
	import {shallowEqual} from '../../utils/js';

	export let change;

	const playerService = createPlayerService();

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	function criteriaStatusDescription(criteriaMet) {
		switch (criteriaMet) {
			case 0:
				return 'Not checked';
			case 1:
				return 'Met criteria';
			case 2:
				return 'Unmet criteria';
			case 3:
				return 'Criteria on hold';
		}
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
		<div class="player-info">
			<Avatar {player} />
			<PlayerNameWithFlag {player} on:click={player ? () => navigateToPlayer(player.playerId) : null} />
			<div class="timeset">
				<span style="color: {getTimeStringColor(change?.timeset)}; ">
					{formatDateRelative(dateFromUnix(change.timeset))}
				</span>
			</div>
		</div>

		{#if change.oldAccRating.toFixed(2) != change.newAccRating.toFixed(2)}
			{change.oldAccRating.toFixed(2)} → {change.newAccRating.toFixed(2)} Acc ★
		{/if}

		{#if change.oldPassRating.toFixed(2) != change.newPassRating.toFixed(2)}
			{change.oldPassRating.toFixed(2)} → {change.newPassRating.toFixed(2)} Pass ★
		{/if}

		{#if change.oldTechRating.toFixed(2) != change.newTechRating.toFixed(2)}
			{change.oldTechRating.toFixed(2)} → {change.newTechRating.toFixed(2)} Tech ★
		{/if}

		{#if change.oldCriteriaMet != change.newCriteriaMet}
			{criteriaStatusDescription(change.oldCriteriaMet)} → {criteriaStatusDescription(change.newCriteriaMet)}
		{/if}

		{#if change.oldRankability != change.newRankability}
			{change.oldRankability > 0 ? 'Nominated' : 'Unranked'} → {change.newRankability > 0 ? 'Nominated' : 'Unranked'}
		{/if}

		{#if change.oldCriteriaCommentary != change.newCriteriaCommentary}
			{#if change.oldCriteriaCommentary}
				"{change.oldCriteriaCommentary}"
			{:else}
				No commentary
			{/if}
			→
			{#if change.newCriteriaCommentary}
				"{change.newCriteriaCommentary}"
			{:else}
				No commentary
			{/if}
		{/if}

		{#if !shallowEqual(change.oldModifiers, change.newModifiers, ['modifierId'])}
			<span title={describeModifiersChanges(change.oldModifiers, change.newModifiers)}>Modifiers updated</span>
		{/if}
	</div>
{/if}

<style>
	.qualification-description {
		margin-top: 0.25em;
	}

	.player-info {
		display: flex;
		grid-gap: 0.8em;
	}
</style>
