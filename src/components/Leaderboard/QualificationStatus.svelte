<script>
	import createPlayerService from '../../services/beatleader/player';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import {dateFromUnix, formatDateRelative, getTimeStringColor, WEEKSECONDS} from '../../utils/date';
	import {navigate} from 'svelte-routing';
	import QualificationChange from './QualificationChange.svelte';

	export let qualification;

	const playerService = createPlayerService();

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}/beatleader/date/1`);
	}

	let nominator;
	let mapper;
	let criteriaChecker;
	let approvers;

	async function retrievePlayers(qualification) {
		if (!qualification) return;

		nominator = await playerService.fetchPlayerOrGetFromCache(qualification.rtMember);

		if (qualification?.mapperId) {
			mapper = await playerService.fetchPlayerOrGetFromCache(qualification?.mapperId);
		} else {
			mapper = null;
		}
		if (qualification?.criteriaChecker) {
			criteriaChecker = await playerService.fetchPlayerOrGetFromCache(qualification?.criteriaChecker);
		} else {
			criteriaChecker = null;
		}
		if (qualification?.approvers) {
			approvers = qualification?.approvers.split(',').map(async element => await playerService.fetchPlayerOrGetFromCache(element));
		} else {
			approvers = null;
		}
	}

	let showChanges;

	$: retrievePlayers(qualification);
</script>

{#if qualification}
	<div class="qualification-description">
		<b><i class="fa fa-check" /> Nominated by:</b>
		<Avatar player={nominator} />
		<PlayerNameWithFlag
			player={nominator}
			type={'beatleader/date'}
			on:click={nominator ? () => navigateToPlayer(nominator.playerId) : null} />
		<div class="timeset">
			<span style="color: {getTimeStringColor(qualification?.timeset)}; ">
				{formatDateRelative(dateFromUnix(qualification?.timeset))}
			</span>
		</div>
	</div>
	<div class="qualification-description">
		{#if qualification?.mapperAllowed}
			<b><i class="fa fa-check" /> Allowed by mapper:</b>
			<Avatar player={mapper} />
			<PlayerNameWithFlag player={mapper} type={'beatleader/date'} on:click={mapper ? () => navigateToPlayer(mapper.playerId) : null} />
		{:else}
			<span style="color: red;"><i class="fa fa-xmark" /> Mapper not allowed yet</span>
		{/if}
	</div>
	<div class="qualification-description">
		{#if qualification?.criteriaMet != 0}
			{#if qualification?.criteriaMet == 1}
				<b><i class="fa fa-check" /> Criteria checked by:</b>
			{:else if qualification?.criteriaMet == 2}
				<span style="color: red;"><i class="fa fa-xmark" /> Criteria check failed</span>
			{/if}
			<Avatar player={criteriaChecker} />
			<PlayerNameWithFlag
				player={criteriaChecker}
				type={'beatleader/date'}
				on:click={criteriaChecker ? () => navigateToPlayer(criteriaChecker.playerId) : null} />

			<div class="timeset">
				<span style="color: {getTimeStringColor(qualification?.timeset)}; ">
					{formatDateRelative(dateFromUnix(qualification?.criteriaTimeset))}
				</span>
			</div>

			{#if qualification?.criteriaCommentary}
				<span style="color: red;">({qualification?.criteriaCommentary})</span>
			{/if}
		{:else}
			<span style="color: gray;"><i class="fa fa-xmark" /> Criteria not checked yet</span>
		{/if}
	</div>

	<div class="qualification-description">
		{#if approvers}
			{#if qualification?.approved}
				<b><i class="fa fa-check" /> Approved by RT:</b>
			{:else}
				<span style="color: red;"><i class="fa fa-xmark" /> Declined by RT</span>
			{/if}

			{#each approvers as approverPromise, idx}
				{#await approverPromise}
					Loading...
				{:then approver}
					<Avatar player={approver} />
					<PlayerNameWithFlag
						player={approver}
						type={'beatleader/date'}
						on:click={approver ? () => navigateToPlayer(approver.playerId) : null} />
				{/await}
			{/each}
		{:else}
			<span style="color: gray;"><i class="fa fa-xmark" /> Not approved by other RT yet</span>
		{/if}
	</div>

	{#if qualification?.approved}
		<div class="timeset">
			{#if Date.now() / 1000 - qualification?.approvalTimeset < WEEKSECONDS}
				<span style="color: white;">
					Ready to rank {formatDateRelative(dateFromUnix(qualification?.approvalTimeset + WEEKSECONDS))}
				</span>
			{:else}
				<span style="color: green;"><i class="fa fa-check" /> Ready to rank</span>
			{/if}
		</div>
	{/if}

	{#if qualification?.changes && qualification?.changes.length}
		<div class="score-options-section">
			<span
				class="beat-savior-reveal clickable"
				class:opened={showChanges}
				on:click={() => (showChanges = !showChanges)}
				title="Show average difficulty stats">
				{#if showChanges}
					Hide changelog
				{:else}
					Show changelog
				{/if}

				<i class="fas fa-chevron-down" />
			</span>
		</div>
		{#if showChanges}
			{#each qualification?.changes as change, idx}
				<QualificationChange {change} />
			{/each}
		{/if}
	{/if}
{/if}

<style>
	.qualification-description {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
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
</style>
