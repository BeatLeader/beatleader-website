<script>
	import {BL_CDN} from '../../network/queues/beatleader/page-queue';
	import createBeatSaverService from '../../services/beatmaps';

	export let role;
	export let onAvatar;
	export let mapperId = null;

	let roleIcon;
	let roleDescription;
	let roleLink;
	let iconClass;
	let show = false;

	async function verifyMapper(mapperId) {
		if (!mapperId) return;

		let beatSaverService = createBeatSaverService();
		const mapperInfoValue = await beatSaverService.getMapper(mapperId);
		if (mapperInfoValue.verifiedMapper) {
			roleIcon = BL_CDN + '/assets/mapper.png';
			roleDescription = 'Verified maps creator';
			iconClass = null;
		} else {
			roleIcon = 'https://beatsaver.com/static/favicon/apple-touch-icon.png';
			roleDescription = 'Has BeatSaver account';
			iconClass = 'small';
		}

		roleLink = 'https://beatsaver.com/profile/' + mapperId;
	}

	function updateRoleIcon(role, mapperId) {
		if (role) {
			switch (role) {
				case 'mapper':
					if (!onAvatar) {
						show = true;
						verifyMapper(mapperId);
					}

					break;
				case 'rankedteam':
					show = !onAvatar;
					roleIcon = BL_CDN + '/assets/rankedteam.png';
					roleDescription = 'Ranking team member';
					break;
				case 'creator':
					show = !onAvatar;
					roleIcon = BL_CDN + '/assets/creator.gif';
					roleDescription = 'BL creator';
					break;
				case 'admin':
					show = !onAvatar;
					roleIcon = BL_CDN + '/assets/admin.png';
					roleDescription = 'Administrator';
					break;
				case 'tipper':
					show = onAvatar;
					roleIcon = BL_CDN + '/assets/patreon1.png';
					roleDescription = 'Tier 1 Patreon supporter.';
					break;
				case 'supporter':
					show = onAvatar;
					roleIcon = BL_CDN + '/assets/patreon2.png';
					roleDescription = 'Tier 2 Patreon supporter.';
					break;
				case 'sponsor':
					show = onAvatar;
					roleIcon = BL_CDN + '/assets/patreon3.png';
					roleDescription = 'Highest tier Patreon supporter. Crypto godge';
					break;
				default:
					break;
			}
		} else {
			roleIcon = null;
		}
	}

	$: updateRoleIcon(role, mapperId);
</script>

{#if show && roleIcon}
	{#if roleLink}
		<a class="player-role {iconClass} {onAvatar ? 'on-avatar' : ''}" href={roleLink}>
			<img class="role-icon" src={roleIcon} title={roleDescription} alt="Role icon" />
		</a>
	{:else}
		<div class="player-role {iconClass} {onAvatar ? 'on-avatar' : ''}">
			<img class="role-icon" src={roleIcon} title={roleDescription} alt="Role icon" />
		</div>
	{/if}
{/if}

<style>
	.player-role {
		width: 6em;
		display: block;
		margin-left: -0.5em;
		margin-right: -0.5em;
	}

	.role-icon {
		z-index: 5;
		width: 100%;
	}

	.small {
		width: 2.5em;
	}

	.on-avatar {
		margin-right: -5.5em;
		margin-top: -2.5em;
	}
</style>
