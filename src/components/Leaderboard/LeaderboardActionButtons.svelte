<script>
	import RankingVoting from './RankingVoting.svelte';
	import RankUpdate from './RankUpdate.svelte';

	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {DifficultyStatus} from '../../utils/beatleader/format';
	// async function updateVerifiedMapperId(mapperId, hash) {
	// 	if (mapperId) {
	// 		let beatSaverService = createBeatSaverService();
	// 		const mapperInfoValue = await beatSaverService.getMapper(mapperId, true);

	// 		var timeToNomination;
	// 		if (mapperInfoValue.verifiedMapper) {
	// 			timeToNomination = 7;
	// 			verifiedMapperId = mapperId;
	// 		} else {
	// 			timeToNomination = 30;
	// 			verifiedMapperId = 0;
	// 		}
	// 		generalMapperId = mapperId;

	// 		account.refreshLastQualificationTime(hash, time => {
	// 			const currentSeconds = new Date().getTime() / 1000;
	// 			if (currentSeconds - time < 60 * 60 * 24 * timeToNomination) {
	// 				qualificationLimitError = 'You can nominate new map ' + formatDateRelative(dateFromUnix(time + 60 * 60 * 24 * timeToNomination));
	// 			} else {
	// 				qualificationLimitError = null;
	// 			}
	// 		});
	// 	}
	// }

	export let separatePage = false;
	export let leaderboard;
	export let account;
	export let votingStore;

	let mapVoting = false;
	let rtvoting = false;
	let qualificationUpdate = false;
	let rankUpdate = false;

	$: isRanked = leaderboard?.stats?.status === DifficultyStatus.ranked;
	$: isQualified = leaderboard?.stats?.status === DifficultyStatus.qualified;
	$: isNominated = leaderboard?.stats?.status === DifficultyStatus.nominated;

	$: reweight = leaderboard?.reweight;

	$: isAdmin = $account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('admin');
	$: isRT = isAdmin || ($account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('rankedteam'));
	$: isNQT = isAdmin || ($account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('qualityteam'));
	$: isjuniorRT = $account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('juniorrankedteam');

	$: hash = leaderboard?.song?.hash;
	$: diffInfo = leaderboard?.diffInfo;

	$: votingStatus = $votingStore[hash + diffInfo?.diff + diffInfo?.type];
	$: votingLoading = $votingStore.loading;

	// updateVerifiedMapperId($account?.player?.playerInfo.mapperId, hash)
</script>

{#if mapVoting}
	<RankingVoting
		{votingStore}
		{leaderboard}
		insideLeaderboard={!separatePage}
		playerId={$account.id}
		{rtvoting}
		{isjuniorRT}
		{qualificationUpdate}
		on:finished={() => {
			mapVoting = false;
			rtvoting = false;
			qualificationUpdate = false;
		}} />
{/if}

{#if rankUpdate}
	<RankUpdate
		{votingStore}
		{leaderboard}
		playerId={$account.id}
		reweight={reweight && !reweight.finished ? reweight : null}
		on:finished={() => {
			rankUpdate = false;
		}} />
{/if}

{#if !votingLoading}
	{#if votingStatus == 2}
		<Button
			cls="voteButton"
			iconFa={'fas fa-comment-dots'}
			title={'Vote this map for ranking!'}
			noMargin={true}
			on:click={() => (mapVoting = !mapVoting)} />
	{:else if votingStatus == 1}
		<Button cls="voteButton" disabled={true} iconFa="fas fa-lock" title="Pass this diff to vote on the map" noMargin={true} />
	{:else if votingStatus == 3}
		<Button cls="voteButton" type="green" iconFa="fas fa-clipboard-check" title="Thank your for the vote!" noMargin={true} />
	{/if}
	{#if ((isRT && !isjuniorRT) || isNQT) && !isNominated}
		<Button
			cls="voteButton"
			iconFa={isRanked ? 'fas fa-star' : 'fas fa-rocket'}
			title={isRanked ? 'Update map stars' : 'Nominate this map!'}
			noMargin={true}
			on:click={() => {
				mapVoting = !mapVoting;
				rtvoting = true;
			}} />
	{/if}
	<!-- {#if generalMapperId != 101330 && (isRT || (generalMapperId == leaderboard?.song.mapperId && !isRanked)) && !isNominated}
		{#if !isRT && qualificationLimitError}
			<Button cls="voteButton" disabled={true} iconFa="fas fa-lock" title={qualificationLimitError} noMargin={true} />
		{:else}
			<Button
				cls="voteButton"
				iconFa={isRanked ? 'fas fa-star' : 'fas fa-rocket'}
				title={isRanked ? 'Update map stars' : 'Nominate this map!'}
				noMargin={true}
				on:click={() => {
					mapVoting = !mapVoting;
					rtvoting = true;
				}} />
		{/if}

		<Button cls="voteButton" disabled={true} iconFa="fas fa-lock" title="New map nominations were temporarely disabled" noMargin={true} />
	{/if} -->
	<!-- {#if isRanked && isRT && (!reweight || reweight.rtMember == $account?.id || reweight.finished || !isjuniorRT)}
		<Button
			cls="voteButton"
			iconFa="fa fa-scale-balanced"
			title={reweight && !reweight.finished ? (reweight.rtMember == $account?.id ? 'Update' : 'Approve reweight') : 'Start map reweight!'}
			noMargin={true}
			on:click={() => {
				rankUpdate = !rankUpdate;
			}} />
	{/if} -->
	{#if isRT && (leaderboard?.stats?.status === DifficultyStatus.nominated || (!isjuniorRT && isQualified))}
		<Button
			cls="voteButton"
			iconFa="fas fa-list-check"
			title="Update qualification details"
			noMargin={true}
			on:click={() => {
				mapVoting = !mapVoting;
				rtvoting = true;
				qualificationUpdate = true;
			}} />
	{/if}
{:else}
	<Spinner />
{/if}
