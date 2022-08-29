<script>
	import {createEventDispatcher, getContext} from 'svelte';
	import processPlayerData from './utils/profile';
	import createBeatSaviorService from '../../services/beatsavior';
	import createAccSaberService from '../../services/accsaber';
	import createAccountStore from '../../stores/beatleader/account';
	import pinnedScoresStore from '../../stores/pinned-scores';
	import Avatar from './Avatar.svelte';
	import AvatarOverlayIcons from './AvatarOverlayIcons.svelte';
	import ProfileHeaderInfo from './ProfileHeaderInfo.svelte';
	import BeatLeaderSwipeCard from './ProfileCards/BeatLeaderSwipeCard.svelte';
	import MiniRankingSwipeCard from './ProfileCards/MiniRankingSwipeCard.svelte';
	import TwitchVideosSwipeCard from './ProfileCards/TwitchVideosSwipeCard.svelte';
	import AccSaberSwipeCard from './ProfileCards/AccSaberSwipeCard.svelte';
	import BeatSaviorSwipeCard from './ProfileCards/BeatSaviorSwipeCard.svelte';
	import Carousel from '../Common/Carousel.svelte';
	import BeatLeaderSummary from './BeatLeaderSummary.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import Error from '../Common/Error.svelte';
	import RoleIcon from './RoleIcon.svelte';
	import Rain from '../Common/Rain.svelte';
	import PinnedScores from './PinnedScores.svelte';

	export let playerData;
	export let isLoading = false;
	export let error = null;
	export let skeleton = false;
	export let twitchVideos = null;
	export let avatarHash = null;
	export let fixedBrowserTitle = null;

	const pageContainer = getContext('pageContainer');
	const dispatch = createEventDispatcher();

	const beatSaviorService = createBeatSaviorService();
	const accSaberService = createAccSaberService();
	const account = createAccountStore();

	let accSaberPlayerInfo = null;
	let accSaberCategories = null;

	let isBeatSaviorAvailable = false;

	async function refreshBeatSaviorState(playerId) {
		if (!playerId) return;

		isBeatSaviorAvailable = await beatSaviorService.isDataForPlayerAvailable(playerId);
	}

	function generateScoresStats(stats) {
		return stats && stats.length ? stats : [];
	}

	async function updateAccSaberPlayerInfo(playerId) {
		if (!playerId) return;

		accSaberPlayerInfo = await accSaberService.getPlayer(playerId);
		accSaberCategories = await accSaberService.getCategories();
	}

	let editError = null;
	function onPlayerDataEditError(err) {
		editError = err?.detail ?? null;
	}

	let roles = null;
	function updateRoles(role) {
		roles = role?.split(',').reverse();
	}

	function refreshPinnedScores(pinnedScores) {
		$pinnedScoresStore = pinnedScores ?? [];
	}

	let modalShown;

	$: isCached = !!(playerData && playerData.scoresLastUpdated);
	$: playerId = playerData && playerData.playerId ? playerData.playerId : null;
	$: statsHistory = playerData?.statsHistory ?? null;
	$: name = playerData && playerData.name ? playerData.name : null;
	$: ({playerInfo, scoresStats, accStats, accBadges, ssBadges} = processPlayerData(playerData));
	$: updateRoles(playerInfo?.role ?? null);
	$: refreshBeatSaviorState(playerId);
	$: scoresStatsFinal = generateScoresStats(scoresStats);
	$: rankChartData = (playerData?.playerInfo.rankHistory ?? []).concat(playerData?.playerInfo.rank);
	$: updateAccSaberPlayerInfo(playerId);

	$: swipeCards = [].concat(
		playerId
			? [
					{
						name: `stats-${playerId}`,
						component: BeatLeaderSwipeCard,
						props: {
							playerId,
							scoresStats: scoresStatsFinal,
							ssBadges,
							statsHistory,
						},
						delay: 500,
					},
			  ]
					.concat(
						$pageContainer.name !== 'xxl'
							? [
									{
										name: `ranking-${playerId}`,
										component: MiniRankingSwipeCard,
										props: {player: playerData},
									},
							  ]
							: []
					)
					.concat(
						accSaberCategories && accSaberPlayerInfo && accSaberCategories.length && accSaberPlayerInfo.length
							? [
									{
										name: `accsaber-${playerId}`,
										component: AccSaberSwipeCard,
										props: {categories: accSaberCategories, playerInfo: accSaberPlayerInfo},
									},
							  ]
							: []
					)
					.concat(
						isBeatSaviorAvailable
							? [
									{
										name: `beat-savior-${playerId}`,
										component: BeatSaviorSwipeCard,
										props: {playerId},
									},
							  ]
							: []
					)
					.concat(
						$pageContainer.name !== 'xxl' && twitchVideos && twitchVideos.length
							? [
									{
										name: `twitch-${playerId}`,
										component: TwitchVideosSwipeCard,
										props: {videos: twitchVideos},
									},
							  ]
							: []
					)
			: []
	);

	$: refreshPinnedScores(playerData?.pinnedScores ?? [], playerData?.playerId);
</script>

{#if playerInfo?.clans?.filter(cl => cl.tag == 'BB').length}
	<Rain />
{/if}

<ContentBox cls={modalShown ? 'inner-modal' : ''}>
	<div class="player-general-info">
		<div class="avatar-and-roles">
			<div class="avatar-cell">
				<Avatar {isLoading} {playerInfo} hash={avatarHash} />

				{#if playerInfo && !isLoading}
					<AvatarOverlayIcons
						{playerData}
						on:modal-shown={() => (modalShown = true)}
						on:modal-hidden={() => (modalShown = false)}
						on:player-data-updated
						on:player-data-edit-error={onPlayerDataEditError} />
				{/if}
			</div>

			{#if roles}
				<div class="role-icons">
					{#each roles as role, idx}
						<RoleIcon onAvatar={true} {role} mapperId={playerInfo?.mapperId} />
					{/each}
				</div>
			{/if}
		</div>

		<div class="rank-and-stats-cell">
			{#if editError}
				<Error error={editError} />
			{/if}

			<ProfileHeaderInfo
				{error}
				{name}
				{playerInfo}
				{playerId}
				{statsHistory}
				{roles}
				on:player-data-updated
				on:player-data-edit-error={onPlayerDataEditError}
				on:modal-shown={() => (modalShown = true)}
				on:modal-hidden={() => (modalShown = false)} />
			<BeatLeaderSummary {playerId} {scoresStats} {accBadges} {skeleton} />

			{#if $account.error}
				{$account.error}
			{/if}
		</div>
	</div>
</ContentBox>

<ContentBox>
	<div class="columns">
		<div class="column">
			<Carousel cards={swipeCards} />
		</div>
	</div>
</ContentBox>

<PinnedScores playerId={playerData?.id} {fixedBrowserTitle} />

<style>
	.player-general-info {
		display: flex;
		flex-wrap: nowrap;
		grid-gap: 1.5em;
	}

	.avatar-cell {
		position: relative;
		width: 150px;
		min-width: 150px;
		height: 150px;
	}

	.rank-and-stats-cell {
		display: flex;
		flex-direction: column;
		justify-content: center;
		grid-gap: 0.4em;
	}

	.role-icons {
		display: flex;
		z-index: 5;
	}

	.avatar-and-roles {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	:global(.inner-modal) {
		z-index: 100 !important;
		position: relative !important;
	}

	@media screen and (max-width: 767px) {
		.player-general-info {
			flex-direction: column;
			align-items: center;
			grid-gap: 0.4em;
		}

		.rank-and-stats-cell {
			align-items: center;
		}
	}
</style>
