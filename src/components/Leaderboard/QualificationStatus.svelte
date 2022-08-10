<script>
	import createPlayerService from '../../services/beatleader/player';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import {navigate} from 'svelte-routing';

	export let qualification;

	const playerService = createPlayerService();

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}/beatleader/date/1`);
	}

	let qualifier;
	let mapper;
	let criteriaChecker;
	let approvers;

	async function retrievePlayers(qualification) {
		if (!qualification) return;

		qualifier = await playerService.fetchPlayerOrGetFromCache(qualification.rtMember);

		if (qualification.mapperId) {
			mapper = await playerService.fetchPlayerOrGetFromCache(qualification.mapperId);
		} else {
			mapper = null;
		}
		if (qualification.criteriaChecker) {
			criteriaChecker = await playerService.fetchPlayerOrGetFromCache(qualification.criteriaChecker);
		} else {
			criteriaChecker = null;
		}
		if (qualification.approvers) {
			approvers = qualification.approvers.split(',').map(async element => await playerService.fetchPlayerOrGetFromCache(element));
		} else {
			approvers = null;
		}
	}

	$: retrievePlayers(qualification);
</script>

{#if qualification}
	<div class="qualification-description">
		<b><i class="fa fa-check" /> Nominated by:</b>
		<Avatar player={qualifier} />
		<PlayerNameWithFlag
			player={qualifier}
			type={'beatleader/date'}
			on:click={qualifier ? () => navigateToPlayer(qualifier.playerId) : null} />
		<div class="timeset">
			<span style="color: {getTimeStringColor(qualification?.timeset)}; ">
				{formatDateRelative(dateFromUnix(qualification.timeset))}
			</span>
		</div>
	</div>
	<div class="qualification-description">
		{#if qualification.mapperAllowed}
			<b><i class="fa fa-check" /> Allowed by mapper:</b>
			<Avatar player={mapper} />
			<PlayerNameWithFlag player={mapper} type={'beatleader/date'} on:click={mapper ? () => navigateToPlayer(mapper.playerId) : null} />
		{:else}
			<span style="color: red;"><i class="fa fa-xmark" /> Mapper not allowed yet</span>
		{/if}
	</div>
	<div class="qualification-description">
		{#if qualification.criteriaMet != 0}
			{#if qualification.criteriaMet == 1}
				<b><i class="fa fa-check" /> Criteria checked:</b>
			{:else if qualification.criteriaMet == 2}
				<span style="color: red;"><i class="fa fa-xmark" /> Criteria check failed</span>
			{/if}
			<Avatar player={criteriaChecker} />
			<PlayerNameWithFlag
				player={criteriaChecker}
				type={'beatleader/date'}
				on:click={criteriaChecker ? () => navigateToPlayer(criteriaChecker.playerId) : null} />

			{#if qualification.criteriaCommentary}
				<span style="color: red;">: {qualification.criteriaCommentary}</span>
			{/if}
		{:else}
			<span style="color: gray;"><i class="fa fa-xmark" /> Criteria not checked yet</span>
		{/if}
	</div>

	<div class="qualification-description">
		{#if approvers}
			{#if qualification.approved}
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
			<span style="color: gray;"><i class="fa fa-xmark" /> Not voted by RT yet</span>
		{/if}
	</div>

	{#if qualification.approved}
		<div class="timeset">
			<span style="color: white;">
				Ready to rank {formatDateRelative(dateFromUnix(qualification.approvalTimeset + 60 * 60 * 24 * 7))}
			</span>
		</div>
	{/if}
{/if}

<style>
	.qualification-description {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
	}
</style>
