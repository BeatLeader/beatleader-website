<script>
	import processPlayerData from '../utils/mini-profile';
	import Avatar from '../Avatar.svelte';
	import AvatarOverlayIcons from '../AvatarOverlayIcons.svelte';
	import ProfileHeaderInfo from './MiniProfileHeaderInfo.svelte';
	import ContentBox from '../../Common/ContentBox.svelte';
	import RoleIcon from '../RoleIcon.svelte';
	import AvatarOverlay from '../Overlay/AvatarOverlay.svelte';
	import createPlayerInfoWithScoresStore from '../../../stores/http/http-player-with-scores-store';

	export let player;

	let playerStore = player && player.playerId ? createPlayerInfoWithScoresStore(player && player.playerId) : null;

	$: playerData = $playerStore?.name ? $playerStore : player;

	let roles = null;
	function updateRoles(role) {
		roles =
			role
				?.split(',')
				?.reverse()
				?.filter(r => r?.length) ?? [];
	}

	$: playerId = playerData && playerData.playerId ? playerData.playerId : null;
	$: name = playerData && playerData.name ? playerData.name : null;
	$: ({playerInfo, scoresStats, accBadges, ssBadges} = processPlayerData(playerData));
	$: updateRoles(playerInfo?.role ?? null);

	$: cover = playerData?.profileSettings?.profileCover;
</script>

<ContentBox cls="mini-profile-box">
	{#if cover}
		<div class="cover-image" style="background-image: url({cover})" />
	{/if}
	<AvatarOverlay data={playerData?.profileSettings} />

	<div class="player-general-info">
		<div class="avatar-and-roles">
			<div class="avatar-cell">
				<Avatar {playerInfo} />

				{#if playerInfo}
					<AvatarOverlayIcons {playerData} />
				{/if}
			</div>
			{#if roles}
				<div class="role-icons">
					{#each roles as role, idx}
						<RoleIcon
							{role}
							allRoles={roles}
							mapperId={playerInfo?.mapperId}
							profileAppearance={playerData?.profileSettings?.profileAppearance ?? null} />
					{/each}
				</div>
			{/if}
		</div>

		<div class="rank-and-stats-cell">
			<ProfileHeaderInfo
				{name}
				{roles}
				{playerInfo}
				{playerId}
				{playerData}
				profileAppearance={playerData?.profileSettings?.profileAppearance ?? null} />
		</div>
	</div>
</ContentBox>

<style>
	.player-general-info {
		display: flex;
		flex-wrap: nowrap;
		grid-gap: 0.5em;
		align-items: flex-start;
	}

	:global(.mini-profile-box) {
		padding: 0.4em !important;
		border-radius: 12px !important;
	}

	:global(.mini-profile-box .avatar-overlay) {
		top: -31px !important;
		left: -31px !important;
	}

	:global(.svelte-easy-popover) {
		--z-index: 4;
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
		margin-top: -1.25em;
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
		flex-direction: column-reverse;
		border-radius: 12px;
	}

	.summary {
		margin: -1em;
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

		:global(.mini-profile-box .avatar-overlay) {
			left: calc(50% - 112px) !important;
		}
	}
</style>
