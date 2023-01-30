<script>
	import {dateFromUnix, formatDateRelative, getTimeStringColor, WEEKSECONDS} from '../../utils/date';
	import createPlayerService from '../../services/beatleader/player';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import {describeModifiersChanges, mapTypeFromMask} from '../../utils/beatleader/format';
	import {shallowEqual} from '../../utils/js';
	import ReweightChange from './ReweightChange.svelte';

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

	function updateReweightAndDiff(map) {
		reweight = map.reweight;
		diff = map.difficulty ?? map.difficultyBl;
	}

	let showChanges;

	$: updateReweightAndDiff(map);
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

		{#if reweight.accRating != diff.accRating}
			{diff.accRating} → {reweight.accRating} Acc ★
		{/if}

		{#if reweight.passRating != diff.passRating}
			{diff.passRating} → {reweight.passRating} Pass ★
		{/if}

		{#if reweight.techRating != diff.techRating}
			{diff.techRating} → {reweight.techRating} Tech ★
		{/if}

		{#if reweight.type != diff.type}
			{mapTypeFromMask(diff.type)} → {mapTypeFromMask(reweight.type)}
		{/if}

		{#if !reweight.keep}
			Ranked → Unranked
		{/if}

		{#if reweight.criteriaCommentary}
			<span style="color: red">({reweight.criteriaCommentary})</span>
		{/if}

		{#if !shallowEqual(reweight.modifiers, diff.modifierValues, ['modifierId'])}
			<span title={describeModifiersChanges(diff.modifierValues, reweight.modifiers)}>Modifiers updated</span>
		{/if}
	</div>

	{#if reweight?.changes && reweight?.changes.length}
		<div class="score-options-section">
			<span
				class="beat-savior-reveal clickable"
				class:opened={showChanges}
				on:click={() => (showChanges = !showChanges)}
				title="Show average difficulty stats">
				{#if showChanges}
					Hide reweighing changelog
				{:else}
					Show reweighing changelog
				{/if}

				<i class="fas fa-chevron-down" />
			</span>
		</div>
		{#if showChanges}
			{#each reweight?.changes as change, idx}
				<ReweightChange {change} />
			{/each}
		{/if}
	{/if}
{/if}

<style>
	.qualification-description {
		display: flex;
		grid-gap: 0.8em;
		align-items: center;
		flex-wrap: wrap;
		margin-top: 0.25em;
	}

	.timeset {
		display: flex;
		grid-gap: 0.4em;
	}

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}

	:global(.content figure:not(:first-child)) {
		margin-top: 0;
	}

	.score-options-section {
		margin-top: 0.5rem;
	}

	:global(.qualification-description) + .score-options-section {
		margin-top: 1rem;
	}

	.score-options-section :global(+ *) {
		margin-top: 0.5rem;
	}
</style>
