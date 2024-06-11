<script>
	import processPlayerData from './utils/mini-profile';
	import Avatar from './Avatar.svelte';
	import AvatarOverlayIcons from './AvatarOverlayIcons.svelte';
	import ProfileHeaderInfo from './ProfileHeaderInfo.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import RoleIcon from './RoleIcon.svelte';
	import AvatarOverlay from './Overlay/AvatarOverlay.svelte';
	import createPlayerInfoWithScoresStore from '../../stores/http/http-player-with-scores-store';

	export let player;
	export let isLoading = false;
	export let error = null;

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

	$: profileAppearance = playerData?.profileSettings?.profileAppearance;
	$: cover = playerData?.profileSettings?.profileCover;
</script>

<ContentBox zIndex="3">
	{#if cover}
		<div class="cover-image" style="background-image: url({cover})" />
	{/if}
	<AvatarOverlay data={playerData?.profileSettings} />

	<div class="player-general-info">
		<div class="avatar-and-roles">
			<div class="avatar-cell">
				<Avatar {isLoading} {playerInfo} />

				{#if playerInfo && !isLoading}
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
			<ProfileHeaderInfo {error} {name} {playerInfo} {playerId} showRedact={false} />
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
		height: 100%;
		z-index: -1;
		width: 100%;
		flex-direction: column-reverse;
		border-radius: 6px;
		mask-type: alpha;
		-webkit-mask-image: linear-gradient(180deg, transparent, rgba(0 0 0 / 10%) 30%, rgb(0, 0, 0));
		mask-image: linear-gradient(180deg, transparent, rgba(0 0 0 / 10%) 30%, rgb(0, 0, 0));
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
