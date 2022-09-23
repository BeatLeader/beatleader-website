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

	export let playerData;
	export let isLoading = false;
	export let error = null;
	export let skeleton = false;
	export let twitchVideos = null;
	export let avatarHash = null;
	export let fixedBrowserTitle = null;

	let editModel = null;

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
		editModel = editModel = {
			name: playerData?.name ?? '',
			country: playerData?.playerInfo?.countries?.[0]?.country?.toLowerCase() ?? '',
			avatarInput: null,
			avatar: playerData?.playerInfo?.avatar
				? playerData.playerInfo.avatar + (playerData.playerInfo.avatar.includes('beatleader') ? `?${avatarHash}` : '')
				: null,
			patreonMessage: playerData?.playerInfo?.patreonFeatures?.message ?? '',
			profileAppearance: playerData?.playerInfo?.profileAppearance ?? null,
			avatarOverlay: playerData?.playerInfo?.avatarOverlay ?? null,
			avatarOverlayEdit: false,
			avatarHue: playerData?.playerInfo?.avatarHue ?? 0,
			avatarSaturation: playerData?.playerInfo?.avatarSaturation ?? 1,
		};
	}

	function onCancelEditModel() {
		editModel = null;
	}

	const readFile = async fileInput =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = () => reject(reader.error);

			reader.readAsArrayBuffer(fileInput);
		});

	async function onSaveEditModel() {
		// TODO: country.toUpperCase() before save

		console.error('TODO: save model', editModel);

		if (editModel.avatarInput) {
			const avatarBuffer = await readFile(editModel.avatarInput);
			console.log(avatarBuffer);
		}
	}

	// TODO: old save method
	async function onEditButtonClick() {
		if (!!editModel && nameInput !== name) {
			try {
				dispatch('player-data-edit-error', null);

				if (loggedInPlayer === playerId) {
					await account.changeName(nameInput);
				} else {
					await account.changeName(nameInput, playerId);
				}

				dispatch('player-data-updated', {name: nameInput});
			} catch (err) {
				dispatch('player-data-edit-error', err);
			}
		}

		if (!!editModel && selectedCountry && selectedCountry != countries[0]) {
			if (loggedInPlayer === playerId) {
				await account.changeCountry(selectedCountry);
			} else {
				await account.changeCountry(selectedCountry, playerId);
			}

			dispatch('player-data-updated', {country: selectedCountry});
		}

		if (!!editModel && messageInput !== playerInfo.patreonFeatures?.message) {
			try {
				dispatch('player-data-edit-error', null);

				if (loggedInPlayer === playerId) {
					await account.changePatreonMessage(messageInput);
				} else {
					await account.changePatreonMessage(messageInput, playerId);
				}

				dispatch('player-data-updated', {message: messageInput});
			} catch (err) {
				dispatch('player-data-edit-error', err);
			}
		}

		dispatch('edit-mode', false);

		if (!!editModel) {
			dispatch('modal-shown', null);
		} else {
			dispatch('modal-hidden', null);
		}
	}
	const changeAvatar = e => {
		let image = e.target.files[0];
		let reader = new FileReader();
		reader.readAsArrayBuffer(image);
		reader.onload = async e => {
			try {
				dispatch('player-data-edit-error', null);

				if (loggedInPlayer === playerId) {
					await account.changeAvatar(e.target.result);
				} else {
					await account.changeAvatar(e.target.result, playerId);
				}

				dispatch('player-data-updated', {avatar: e.target.result});
			} catch (err) {
				dispatch('player-data-edit-error', err);
			}
		};
	};

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

<ContentBox cls={modalShown ? 'inner-modal' : ''}>
	<AvatarOverlay data={editModel ?? playerInfo} {roles} />

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
						on:modal-hidden={() => (modalShown = false)}
						on:player-data-updated
						on:player-data-edit-error={onPlayerDataEditError} />
				{/if}
			</div>

			{#if roles}
				<div class="role-icons">
					{#each roles as role, idx}
						<RoleIcon
							{role}
							mapperId={playerInfo?.mapperId}
							profileAppearance={playerData?.playerInfo?.profileAppearance ?? null}
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
				profileAppearance={playerData?.playerInfo?.profileAppearance}
				bind:editModel
				on:player-data-updated
				on:player-data-edit-error={onPlayerDataEditError}
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
				profileAppearance={playerData?.playerInfo?.profileAppearance}
				bind:editModel />

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
