<script>
	import processPlayerData from '../../Player/utils/profile';

	import createAccountStore from '../../../stores/beatleader/account';

	import Avatar from '../../Player/Avatar.svelte';
	import AvatarOverlayIcons from '../../Player/AvatarOverlayIcons.svelte';
	import ProfileHeaderInfo from '../../Player/ProfileHeaderInfo.svelte';

	import ContentBox from '../../Common/ContentBox.svelte';
	import Error from '../../Common/Error.svelte';
	import RoleIcon from '../../Player/RoleIcon.svelte';

	import AvatarOverlay from '../../Player/Overlay/AvatarOverlay.svelte';

	import SummaryBox from '../../Player/Summary/SummaryBox.svelte';
	import Followers from '../../Player/Bio/Followers.svelte';
	import Socials from '../../Player/Bio/Socials.svelte';

	import createPlayerInfoWithScoresStore from '../../../stores/http/http-player-with-scores-store';

	export let player;
	export let isLoading = false;
	export let error = null;
	export let skeleton = false;
	export let avatarHash = null;

	const account = createAccountStore();

	let playerStore = player && player.playerId ? createPlayerInfoWithScoresStore(player && player.playerId) : null;

	$: playerData = $playerStore?.name ? $playerStore : player;

	let editError = null;

	let roles = null;
	function updateRoles(role) {
		roles =
			role
				?.split(',')
				?.reverse()
				?.filter(r => r?.length) ?? [];
	}

	let modalShown;

	let rolesShown = false;
	function anyRolesShown(profileAppearance) {
		if (!profileAppearance) return false;
		const roleIconStrings = ['booster', 'tipper', 'supporter', 'sponsor'];
		return roleIconStrings.some(str => profileAppearance.includes(str) && roles?.includes(str));
	}

	let cinematicsCanvas;

	function drawCinematics(cinematicsCanvas, coverUrl) {
		if (coverUrl && cinematicsCanvas) {
			cinematicsCanvas.style.opacity = 1;
			const context = cinematicsCanvas.getContext('2d');

			const cover = new Image();
			cover.onload = function () {
				context.drawImage(cover, 0, 0, cinematicsCanvas.width, cinematicsCanvas.height);
			};
			cover.src = coverUrl;
		}
	}

	$: playerId = playerData && playerData.playerId ? playerData.playerId : null;
	$: name = playerData && playerData.name ? playerData.name : null;
	$: ({playerInfo, scoresStats, accBadges, ssBadges} = processPlayerData(playerData));
	$: updateRoles(playerInfo?.role ?? null);

	$: isAdmin = $account?.player?.role?.includes('admin');
	$: profileAppearance = playerData?.profileSettings?.profileAppearance;
	$: cover = playerData?.profileSettings?.profileCover;
	$: rolesShown = anyRolesShown(profileAppearance);

	let zIndex = 0;

	$: cover && drawCinematics(cinematicsCanvas, cover);
</script>

<ContentBox cls="profile-box {cover ? 'score-profile-container' : ''} {modalShown ? 'inner-modal' : ''}" zIndex={`${zIndex}`}>
	{#if cover}
		<div class="cinematics">
			<div class="cinematics-canvas">
				<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
			</div>
		</div>
		<div class="cover-image" style="background-image: url({cover})"></div>
	{/if}
	<AvatarOverlay data={playerData?.profileSettings} />

	<div class="player-general-info">
		<div class="avatar-and-roles">
			<div class="avatar-cell">
				<Avatar {isLoading} {playerInfo} hash={avatarHash} />

				{#if playerInfo && !isLoading}
					<div style="margin: 0; padding: 0;">
						<AvatarOverlayIcons {playerData} on:modal-shown={() => (modalShown = true)} on:modal-hidden={() => (modalShown = false)} />
					</div>
				{/if}
			</div>

			{#if roles}
				<div class="role-icons">
					{#each roles as role, idx}
						<RoleIcon
							{role}
							index={idx}
							allRoles={roles}
							mapperId={playerInfo?.mapperId}
							profileAppearance={playerData?.profileSettings?.profileAppearance ?? null} />
					{/each}
				</div>
			{/if}
		</div>

		<div class="rank-and-stats-cell" class:with-roles={rolesShown}>
			{#if editError}
				<Error error={editError} />
			{/if}

			<ProfileHeaderInfo
				{error}
				{name}
				{playerInfo}
				{playerId}
				{roles}
				mayEdit={false}
				profileAppearance={playerData?.profileSettings?.profileAppearance ?? null}
				bind:zIndex
				on:modal-shown={() => (modalShown = true)}
				on:modal-hidden={() => (modalShown = false)} />
		</div>
	</div>
	<SummaryBox
		{playerId}
		{playerData}
		{scoresStats}
		{skeleton}
		{profileAppearance}
		overrideVisibleStats="topPp,averageRankedAccuracy"
		showHeadset={false} />
</ContentBox>

<style>
	.player-general-info {
		display: flex;
		flex-wrap: nowrap;
		grid-gap: 1.5em;
		align-items: flex-start;
		margin-bottom: 1em;
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
		grid-gap: 0em;
		flex-grow: 1;
		align-self: center;
	}

	.with-roles {
		margin-bottom: 3em;
	}

	.role-icons {
		display: flex;
		position: relative;
		z-index: 5;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
		width: 100%;
	}

	.role-icons:empty {
		display: none;
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
		height: 100%;
		z-index: -1;
		width: 100%;
		border-radius: 12px;
		mask-type: alpha;
		-webkit-mask-image: linear-gradient(180deg, white, white 40%, rgb(255 255 255 / 40%));
		mask-image: linear-gradient(180deg, white, white 40%, rgb(255 255 255 / 40%));
	}

	.cover-edit-buttons {
		display: flex;
		justify-content: flex-start;
		margin: 1em;
		gap: 1.5em;
	}

	.followers-and-socials {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		margin-left: -1em;
		margin-right: -1em;
		margin-bottom: -1em;
		background-color: #0000004f;
		margin-top: 0.5em;
		border-radius: 0 0 12px 12px;
		backdrop-filter: blur(10px);
		--webkit-transofrm: translateZ(0);
		--webkit-perspective: 1000;
		--webkit-backface-visibility: hidden;
		-webkit-backdrop-filter: blur(10px);
	}

	.socials-list {
		display: flex;
		justify-content: center;
		gap: 0.6em;
		margin-right: 0.6em;
		margin-left: 0.8em;
		margin-top: 0.5em;
	}

	.cinematics {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		pointer-events: none;
	}

	.cinematics-canvas {
		filter: blur(5em) opacity(0.4) saturate(250%);
		left: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.1) translateZ(0);
		width: 110%;
		z-index: -1;
		height: 110%;
	}

	:global(.shareButton) {
		font-size: 1.5em !important;
		position: absolute !important;
		right: 2em;
		top: 0em;
		z-index: 5;
		text-shadow: 1px 1px 5px #00000069;
	}
	:global(.shareButton:hover) {
		scale: 1.1;
	}

	:global(.screenshotButton) {
		font-size: 1.5em !important;
		position: absolute !important;
		right: 0.4em;
		top: 0em;
		z-index: 5;
		text-shadow: 1px 1px 5px #00000069;
	}
	:global(.screenshotButton:hover) {
		scale: 1.1;
	}

	:global(.screenshotSpinner) {
		position: absolute !important;
		right: 1.2em;
		top: 1em;
		z-index: 5;
	}
	:global(.inner-modal) {
		z-index: 10 !important;
		position: relative !important;
	}
	:global(.profile-box) {
		border-radius: 12px !important;
	}
	:global(.edit-cover-button) {
		width: 10em;
	}

	:global(.remove-cover-button) {
		width: 10em;
	}

	@media screen and (max-width: 1750px) {
		.cinematics-canvas {
			width: 100%;
		}
	}

	@media screen and (max-width: 767px) {
		.player-general-info {
			flex-direction: column;
			align-items: center;
			grid-gap: 0.4em;
		}

		.rank-and-stats-cell {
			align-items: center;
			align-self: center;
		}

		.followers-and-socials {
			justify-content: space-evenly;
			margin-left: 0;
			margin-left: -0.8em;
			margin-right: -0.8em;
			padding: 0 0.8em;
			border-radius: 0;
		}

		.cover-image {
			border-radius: 0;
		}

		.cinematics-canvas {
			transform: scaleY(1.2) translateZ(0);
		}

		:global(.profile-box) {
			border-radius: 0 !important;
		}
	}
</style>
