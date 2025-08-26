<script>
	import RankingVoting from './RankingVoting.svelte';
	import RankUpdate from './RankUpdate.svelte';

	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {bestiesCategoriesNames, DifficultyStatus} from '../../utils/beatleader/format';
	import {configStore} from '../../stores/config';
	import {produce} from 'immer';
	import beastsabericonthick from '../../resources/beastsabericonthick.svg';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import BeastiesNomination from './BeastiesNomination.svelte';
	import {getContext} from 'svelte';

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
	export let diffs;

	const {open, close} = getContext('simple-modal');

	let mapVoting = false;
	let rtvoting = false;
	let qualificationUpdate = false;
	let rankUpdate = false;

	let ellegibleForNomination = false;
	let currentNominations = null;

	function fetchNomination(leaderboard) {
		if (leaderboard.difficultyBl.status == DifficultyStatus.ost && leaderboard.song.id != 'Danger') {
			ellegibleForNomination = false;
			return;
		}

		if (parseInt(Number('0x' + leaderboard.song.id.replaceAll('x', '')), 10) < 270435) {
			ellegibleForNomination = false;
			return;
		}

		// if (parseInt(Number('0x' + leaderboard.song.id.replaceAll('x', '')), 10) >= 270435) {
		// 	ellegibleForNomination = false;
		// 	return;
		// }

		if (Math.floor(Date.now() / 1000) >= 1765756799) {
			ellegibleForNomination = false;
			return;
		}

		ellegibleForNomination = true;

		fetch(`${BL_API_URL}beasties/nominations?leaderboardId=${leaderboard.leaderboardId}`, {credentials: 'include'})
			.then(r => r.json())
			.then(r => {
				currentNominations = r;
			});
	}

	function toggleFirstUsage() {
		$configStore = produce($configStore, draft => {
			draft.preferences.beastiesNominationsBanner2025 = false;
		});
	}

	function openBestiesNomination() {
		toggleFirstUsage();
		open(BeastiesNomination, {
			leaderboard,
			diffs,
			currentNominations,
			confirm: () => {
				close();
			},
			cancel: () => {
				close();
			},
			wasNominated: () => {
				fetchNomination(leaderboard);
			},
		});
	}

	$: isRanked = leaderboard?.stats?.status === DifficultyStatus.ranked;
	$: isQualified = leaderboard?.stats?.status === DifficultyStatus.qualified;
	$: isNominated = leaderboard?.stats?.status === DifficultyStatus.nominated;

	$: reweight = leaderboard?.reweight;
	$: leaderboard && $account.player && fetchNomination(leaderboard);

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

<div class="action-buttons-container">
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
		{#if isRanked && isRT && (!reweight || reweight.rtMember == $account?.id || reweight.finished || !isjuniorRT)}
			<Button
				cls="voteButton"
				iconFa="fa fa-scale-balanced"
				title={reweight && !reweight.finished ? (reweight.rtMember == $account?.id ? 'Update' : 'Approve reweight') : 'Start map reweight!'}
				noMargin={true}
				on:click={() => {
					rankUpdate = !rankUpdate;
				}} />
		{/if}
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

		{#if ellegibleForNomination}
			{#if $configStore.preferences.beastiesNominationsBanner2025}
				<div class="beastsaber-banner">
					<Button
						cls="beastsButton highlighted"
						icon={beastsabericonthick}
						on:click={() => {
							openBestiesNomination();
						}} />
					<span>
						Nominate favorite maps for the <a href="https://mappingawards.saeraphinx.dev/">BeastSaber Mapping Awards!</a>
					</span>
					<button class="close-banner" title="Hide banner" on:click|preventDefault|stopPropagation={() => toggleFirstUsage()}
						><i class="fas fa-xmark" /></button>
				</div>
			{:else}
				<Button
					cls="beastsButton {currentNominations?.length ? 'purple' : ''}"
					title={currentNominations?.length
						? 'You nominated this map for categories: ' + currentNominations.map(n => bestiesCategoriesNames[n.category]).join(', ')
						: 'Nominate this map for Beasties Awards!'}
					icon={beastsabericonthick}
					on:click={() => {
						openBestiesNomination();
					}} />
			{/if}
		{/if}
	{:else}
		<Spinner />
	{/if}
</div>

<style>
	.action-buttons-container {
		display: flex;
		gap: 0.3em;
	}
	.beastsaber-banner {
		padding: 0.7em;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: -0.7em;
		margin-left: -0.4em;
		gap: 2em;
		background: linear-gradient(90deg, #454088, #454088 72.92%, #1268a1);
		border-radius: 16px;
	}
	.close-banner {
		border: none;
		color: white;
		background-color: transparent;
		cursor: pointer;
		width: 3em;
		z-index: 104;
		pointer-events: auto;
	}

	:global(.beastsButton) {
		margin-bottom: 0 !important;
		height: 1.8em !important;
		width: 1.8em !important;
	}

	:global(.beastsButton .icon) {
		margin-left: -0.1em !important;
		margin-right: -0.1em !important;
	}

	:global(.beastsButton.purple .icon) {
		color: #f931ff;
	}

	@property --bg-angle {
		inherits: false;
		initial-value: 0deg;
		syntax: '<angle>';
	}

	/**
		* To animate the gradient, we set the custom property to 1 full
		* rotation. The animation starts at the default value of `0deg`.
		*/
	@keyframes spin {
		to {
			--bg-angle: 360deg;
		}
	}

	:global(.beastsButton.highlighted) {
		/* add the animation, but pause it by default */
		animation: spin 2.5s infinite linear paused;

		/**
		* Using `background-origin` we can create a “border” using two gradients. And to
		* make the gradients better-looking, we use OKLCH.
		*
		* @see https://developer.mozilla.org/en-US/docs/Web/CSS/background-origin
		* @see https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
		*/
		background:
			linear-gradient(to bottom, var(--btn-bg-color, #3273dc), var(--btn-bg-color, #3273dc)) padding-box,
			conic-gradient(from var(--bg-angle) in oklch longer hue, oklch(0.85 0.37 0) 0 0) border-box;
		border: 2px solid transparent !important;
		animation-play-state: running;
	}
	@media screen and (max-width: 767px) {
		.beastsaber-banner {
			margin-top: -2.8em;
			z-index: 1;
			gap: 1em;
			width: 16em;
		}

		:global(.voteButton) {
			z-index: 2;
		}
	}
</style>
