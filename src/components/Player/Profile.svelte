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
	import AvatarOverlayEditor from './Overlay/AvatarOverlayEditor.svelte';
	import AvatarOverlay from './Overlay/AvatarOverlay.svelte';
	import {getNotificationsContext} from 'svelte-notifications';

	export let playerData;
	export let isLoading = false;
	export let error = null;
	export let skeleton = false;
	export let twitchVideos = null;
	export let avatarHash = null;
	export let fixedBrowserTitle = null;

	let editModel = null;

	const {addNotification} = getNotificationsContext();

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

	let roles = null;
	function updateRoles(role) {
		roles =
			role
				?.split(',')
				?.reverse()
				?.filter(r => r?.length) ?? [];
	}

	function refreshPinnedScores(pinnedScores) {
		$pinnedScoresStore = pinnedScores ?? [];
	}

	function onEnableEditModel() {
		editModel = {
			data: {
				name: playerData?.name ?? '',
				country: playerData?.playerInfo?.countries?.[0]?.country?.toLowerCase() ?? '',
				avatar: null,
				patreonMessage: playerData?.playerInfo?.patreonFeatures?.message ?? '',
				profileAppearance: playerData?.profileSettings?.profileAppearance ?? null,
				effectName: playerData?.profileSettings?.effectName ?? null,
				hue: playerData?.profileSettings?.hue ?? 0,
				saturation: playerData?.profileSettings?.saturation ?? 1,
			},
			avatar: playerData?.playerInfo?.avatar
				? playerData.playerInfo.avatar + (playerData.playerInfo.avatar.includes('beatleader') ? `?${avatarHash}` : '')
				: null,
			avatarOverlayEdit: false,
			isSaving: false,
		};

		addNotification({
			text: 'You can click on each badge to turn it on or off. Click on an avatar to change it or set an overlay.',
			position: 'top-right',
			type: 'success',
			removeAfter: 4000,
		});
	}

	function onCancelEditModel() {
		editModel = null;
	}

	async function onSaveEditModel() {
		if (!editModel) return;

		let {profileAppearance, country, avatar, patreonMessage, ...data} = editModel?.data ?? {};

		profileAppearance = profileAppearance?.length ? profileAppearance?.join(',') : null;
		country =
			country?.length && (country !== playerData?.playerInfo?.countries?.[0]?.country?.toLowerCase() ?? '') ? country.toUpperCase() : null;

		data = {...data, profileAppearance};
		if (country) data.country = country;
		if (patreonMessage?.length) data.patreonMessage = patreonMessage;

		try {
			editModel.isSaving = true;

			await account.update(data, avatar);

			setTimeout(() => {
				dispatch('player-data-updated');
			}, 1000);

			editModel = null;
		} catch (err) {
			editError = err;
		} finally {
			if (editModel) editModel.isSaving = false;
		}
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

	$: loggedInPlayer = $account?.id;
	$: isMain = playerId && $account?.id === playerId;
	$: isAdmin = $account?.player?.role?.includes('admin');
	$: canEdit = (isMain && loggedInPlayer === playerId) || isAdmin;

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

<AvatarOverlayEditor bind:editModel {roles} />

<ContentBox cls={modalShown ? 'inner-modal' : ''} zIndex="4">
	<AvatarOverlay data={editModel?.data ?? playerData?.profileSettings} />

	<div class="player-general-info" class:edit-enabled={!!editModel}>
		<div class="avatar-and-roles">
			<div class="avatar-cell">
				<Avatar
					{isLoading}
					{playerInfo}
					hash={avatarHash}
					{editModel}
					on:click={() => {
						if (editModel) editModel.avatarOverlayEdit = true;
					}} />

				{#if playerInfo && !isLoading}
					<AvatarOverlayIcons
						{playerData}
						bind:editModel
						on:modal-shown={() => (modalShown = true)}
						on:modal-hidden={() => (modalShown = false)} />
				{/if}
			</div>

			{#if roles}
				<div class="role-icons">
					{#each roles as role, idx}
						<RoleIcon
							{role}
							mapperId={playerInfo?.mapperId}
							profileAppearance={playerData?.profileSettings?.profileAppearance ?? null}
							bind:editModel />
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
				bind:editModel
				on:edit-model-enable={onEnableEditModel}
				on:edit-model-cancel={onCancelEditModel}
				on:edit-model-save={onSaveEditModel}
				on:modal-shown={() => (modalShown = true)}
				on:modal-hidden={() => (modalShown = false)} />
			<BeatLeaderSummary
				{playerId}
				{scoresStats}
				{accBadges}
				{skeleton}
				profileAppearance={playerData?.profileSettings?.profileAppearance}
				bind:editModel />

			{#if $account.error}
				<Error error={$account.error} />
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
		align-items: flex-start;
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
		flex-grow: 1;
	}

	.role-icons {
		display: flex;
		position: relative;
		z-index: 5;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
		width: 100%;
		min-height: 1.5rem;
	}

	.avatar-and-roles {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	:global(.inner-modal) {
		z-index: 10 !important;
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
