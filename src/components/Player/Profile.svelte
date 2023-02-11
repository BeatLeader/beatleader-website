<script>
	import processPlayerData from './utils/profile';
	import createBeatSaviorService from '../../services/beatsavior';
	import createAccSaberService from '../../services/accsaber';
	import createAccountStore from '../../stores/beatleader/account';
	import Avatar from './Avatar.svelte';
	import AvatarOverlayIcons from './AvatarOverlayIcons.svelte';
	import ProfileHeaderInfo from './ProfileHeaderInfo.svelte';
	import BeatLeaderSummary from './BeatLeaderSummary.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import RoleIcon from './RoleIcon.svelte';
	import AvatarOverlay from './Overlay/AvatarOverlay.svelte';
	import Button from '../Common/Button.svelte';
	export let playerData;
	export let isLoading = false;
	export let error = null;
	export let skeleton = false;
	export let twitchVideos = null;
	export let avatarHash = null;
	export let fixedBrowserTitle = null;
	export let pinnedScores = true;

	let editModel = null;

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

	function onEnableEditModel() {
		editModel = {
			data: {
				name: playerData?.name ?? '',
				country: playerData?.playerInfo?.countries?.[0]?.country?.toLowerCase() ?? '',
				avatar: null,
				message: playerData?.profileSettings?.message ?? '',
				profileAppearance: playerData?.profileSettings?.profileAppearance ?? null,
				effectName: playerData?.profileSettings?.effectName ?? null,
				hue: playerData?.profileSettings?.hue ?? 0,
				saturation: playerData?.profileSettings?.saturation ?? 1,
				profileCover: playerData?.profileSettings?.profileCover ?? '/assets/defaultcover.jpg',
				profileCoverData: playerData?.profileSettings?.profileCover,
			},
			avatar: playerData?.playerInfo?.avatar
				? playerData.playerInfo.avatar + (playerData.playerInfo.avatar.includes('beatleader') ? `?${avatarHash}` : '')
				: null,
			avatarOverlayEdit: false,
			isSaving: false,
		};
	}
	let modalShown;

	$: playerId = playerData && playerData.playerId ? playerData.playerId : null;
	$: name = playerData && playerData.name ? playerData.name : null;
	$: ({playerInfo, scoresStats, accBadges, ssBadges} = processPlayerData(playerData));
	$: updateRoles(playerInfo?.role ?? null);
	$: refreshBeatSaviorState(playerId);
	$: updateAccSaberPlayerInfo(playerId);
	$: isAdmin = $account?.player?.role?.includes('admin');
	$: profileAppearance = playerData?.profileSettings?.profileAppearance;
	$: cover = !editModel?.avatarOverlayEdit && (playerData?.profileSettings?.profileCover ?? editModel?.data.profileCover);

	let fileinput;
	const readFile = async fileInput =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = () => reject(reader.error);

			reader.readAsArrayBuffer(fileInput);
		});
	const changeCover = async e => {
		editModel.data.profileCover = URL.createObjectURL(e.target.files[0]);
		playerData.profileSettings.profileCover = editModel.data.profileCover;
		editModel.data.profileCoverData = await readFile(e.target.files[0])?.catch(_ => _);
	};
	const resetCover = async e => {
		editModel.data.profileCover = '/assets/defaultcover.jpg';
		editModel.data.profileCoverData = null;
		playerData.profileSettings.profileCover = null;
	};
</script>

<ContentBox cls="{cover ? 'profile-container' : ''} {modalShown ? 'inner-modal' : ''}" zIndex="4">
	{#if cover}
		<div class="cover-image" style="background-image: url({cover})">
			{#if editModel}
				{#if editModel.data.profileCoverData}
					<Button type="danger" cls="remove-cover-button" iconFa="far fa-xmark" label="Remove cover" on:click={() => resetCover()} />
				{/if}
				<Button
					type="primary"
					cls="edit-cover-button"
					iconFa="far fa-image"
					label={editModel.data.profileCoverData ? 'Change cover' : 'Set cover'}
					on:click={() => fileinput.click()}>
					<input style="display:none" type="file" accept=".jpg, .jpeg, .png, .gif" on:change={changeCover} bind:this={fileinput} />
				</Button>
			{/if}
		</div>
	{/if}
	<AvatarOverlay withCover={cover} data={editModel?.data ?? playerData?.profileSettings} />

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
					<div data-html2canvas-ignore style="margin: 0; padding: 0;">
						<AvatarOverlayIcons
							{playerData}
							bind:editModel
							on:modal-shown={() => (modalShown = true)}
							on:modal-hidden={() => (modalShown = false)} />
					</div>
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
			<ProfileHeaderInfo
				{error}
				{name}
				{playerInfo}
				{playerId}
				bind:editModel
				on:edit-model-enable={onEnableEditModel}
				on:modal-shown={() => (modalShown = true)}
				on:modal-hidden={() => (modalShown = false)} />
			<BeatLeaderSummary {playerId} {scoresStats} {accBadges} {skeleton} {profileAppearance} bind:editModel />
		</div>
	</div>
</ContentBox>

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

	.cover-image {
		position: absolute;
		display: flex;
		background-size: cover;
		background-position: 50%;
		top: 0;
		left: 0;
		height: 12.5em;
		z-index: -1;
		width: 100%;
		flex-direction: column-reverse;
		border-radius: 6px 6px 0 0;
		mask-type: alpha;
		-webkit-mask-image: linear-gradient(180deg, white, white 40%, transparent);
		mask-image: linear-gradient(180deg, white, white 40%, transparent);
	}

	:global(.shareButton) {
		font-size: 1.5em !important;
		position: absolute !important;
		right: 2em;
		top: 0em;
		z-index: 5;
	}
	:global(.screenshotButton) {
		font-size: 1.5em !important;
		position: absolute !important;
		right: 0.4em;
		top: 0em;
		z-index: 5;
	}
	:global(.inner-modal) {
		z-index: 10 !important;
		position: relative !important;
	}
	:global(.profile-container) {
		padding-top: 8em !important;
	}
	:global(.edit-cover-button) {
		width: 10em;
		margin-left: 1em !important;
		margin-bottom: 9em !important;
	}

	:global(.remove-cover-button) {
		width: 10em;
		position: absolute !important;
		left: 1em;
		top: 4em;
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
