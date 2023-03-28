<script>
	import createPlayerService from '../../services/beatleader/player';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import {navigate} from 'svelte-routing';
	import {describeModifiersAndMultipliers, describeModifiersChanges, mapTypeFromMask} from '../../utils/beatleader/format';
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
		<Avatar {player} />
		<PlayerNameWithFlag {player} on:click={player ? () => navigateToPlayer(player.playerId) : null} />
		<div class="timeset">
			<span style="color: {getTimeStringColor(change?.timeset)}; ">
				{formatDateRelative(dateFromUnix(change.timeset))}
			</span>
		</div>

		{#if change.oldRankability !== change.newRankability}
			{change.oldRankability ? 'Ranked' : 'Unranked'} → {change.newRankability ? 'Ranked' : 'Unranked'}
		{/if}

		{#if change.oldStars != change.newStars}
			★: {change.oldStars.toFixed(2)} → {change.newStars.toFixed(2)}
		{/if}

		{#if change.oldAccRating != change.newAccRating}
			Acc: {change.oldAccRating.toFixed(2)} → {change.newAccRating.toFixed(2)}
		{/if}

		{#if change.oldPassRating != change.newPassRating}
			Pass: {change.oldPassRating.toFixed(2)} → {change.newPassRating.toFixed(2)}
		{/if}

		{#if change.oldTechRating != change.newTechRating}
			Tech: {change.oldTechRating.toFixed(2)} → {change.newTechRating.toFixed(2)}
		{/if}

		{#if change.oldType !== change.newType}
			{mapTypeFromMask(change.oldType)} → {mapTypeFromMask(change.newType)}
		{/if}

		{#if change.oldCriteriaMet !== change.newCriteriaMet}
			{criteriaStatusDescription(change.oldCriteriaMet)} → {criteriaStatusDescription(change.newCriteriaMet)}
		{/if}

		{#if change.oldKeep !== change.newKeep}
			{change.oldKeep ? 'Ranked' : 'Unranked'} → {change.newKeep ? 'Ranked' : 'Unranked'}
		{/if}

		{#if change.oldCriteriaCommentary !== change.newCriteriaCommentary}
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
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
		margin-top: 0.25em;
	}
</style>
