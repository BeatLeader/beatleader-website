<script>
	import {dateFromUnix, formatDateRelative, getTimeStringColor, WEEKSECONDS} from '../../utils/date';
	import createPlayerService from '../../services/beatleader/player';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import {describeModifiersChanges, mapTypeFromMask} from '../../utils/beatleader/format';
	import {shallowEqual} from '../../utils/js';

	export let map;

	let reweight = map.reweight;
	let diff = map.difficulty ?? map.difficultyBl;

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	let nominator;

	async function retrieveNominator(reweight) {
		if (!reweight) return;

		const playerService = createPlayerService();
		nominator = await playerService.fetchPlayerOrGetFromCache(reweight.rtMember);
	}

	$: retrieveNominator(reweight);
</script>

{#if reweight}
	<div class="qualification-description">
		<div class="timeset">
			<span style="color: {getTimeStringColor(reweight?.timeset)}; ">
				Started {formatDateRelative(dateFromUnix(reweight.timeset))} by
			</span>

			<Avatar player={nominator} />
			<PlayerNameWithFlag player={nominator} hideFlag={true} on:click={nominator ? () => navigateToPlayer(nominator.playerId) : null} />
		</div>

		{#if reweight.stars != diff.stars}
			{diff.stars} → {reweight.stars} ★
		{/if}

		{#if reweight.type != diff.type}
			{mapTypeFromMask(diff.type)} → {mapTypeFromMask(reweight.type)}
		{/if}

		{#if !reweight.keep}
			Ranked → Unranked
		{/if}

		{#if !shallowEqual(reweight.modifiers, diff.modifierValues)}
			<span title={describeModifiersChanges(diff.modifierValues, reweight.modifiers)}>Modifiers updated</span>
		{/if}
	</div>
{/if}

<style>
	.qualification-description {
		display: flex;
		grid-gap: 0.8em;
		align-items: center;
		flex-wrap: wrap;
	}

	.timeset {
		display: flex;
		grid-gap: 0.4em;
	}
</style>
