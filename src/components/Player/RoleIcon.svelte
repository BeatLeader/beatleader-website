<script>
	import {BL_CDN} from '../../network/queues/beatleader/page-queue';
	import createBeatSaverService from '../../services/beatmaps';

	export let role;
	export let onAvatar;
	export let mapperId = null;
	export let profileAppearance;
	export let editEnabled = false;

	let roleIcon;
	let roleDescription;
	let roleLink;
	let show = false;

	async function verifyMapper(mapperId) {
		if (!mapperId) return;

		let beatSaverService = createBeatSaverService();
		const mapperInfoValue = await beatSaverService.getMapper(mapperId);
		if (mapperInfoValue.verifiedMapper) {
			roleIcon = BL_CDN + '/assets/mapper.png';
			roleDescription = 'Verified maps creator';
			roleLink = 'https://beatsaver.com/profile/' + mapperId;
		}
	}

	function updateRoleIcon(role, mapperId) {
		if (role) {
			switch (role) {
				case 'mapper':
					if (!onAvatar) {
						show = !profileAppearance || profileAppearance.includes('mapper');
						verifyMapper(mapperId);
					}
					break;
				case 'rankedteam':
					show = !onAvatar && (!profileAppearance || profileAppearance.includes('rankedteam'));
					roleIcon = BL_CDN + '/assets/rankedteam.png';
					roleDescription = 'Ranking team member';
					break;
				case 'juniorrankedteam':
					show = !onAvatar && (!profileAppearance || profileAppearance.includes('juniorrankedteam'));
					roleIcon = BL_CDN + '/assets/juniorrankedteam.png';
					roleDescription = 'Junior Ranking team member';
					break;
				case 'creator':
					show = !onAvatar && (!profileAppearance || profileAppearance.includes('creator'));
					roleIcon = BL_CDN + '/assets/creator.gif';
					roleDescription = 'BL creator';
					break;
				case 'admin':
					show = !onAvatar && (!profileAppearance || profileAppearance.includes('admin'));
					roleIcon = BL_CDN + '/assets/admin.png';
					roleDescription = 'Administrator';
					break;
				case 'tipper':
					show = onAvatar && (!profileAppearance || profileAppearance.includes('tipper'));
					roleIcon = BL_CDN + '/assets/patreon1.png';
					roleDescription = 'Tier 1 Patreon supporter.';
					break;
				case 'supporter':
					show = onAvatar && (!profileAppearance || profileAppearance.includes('supporter'));
					roleIcon = BL_CDN + '/assets/patreon2.png';
					roleDescription = 'Tier 2 Patreon supporter.';
					break;
				case 'sponsor':
					show = onAvatar && (!profileAppearance || profileAppearance.includes('sponsor'));
					roleIcon = BL_CDN + '/assets/patreon3.png';
					roleDescription = 'Highest tier Patreon supporter. Crypto godge';
					break;
				case 'warplane':
					show = onAvatar && (!profileAppearance || profileAppearance.includes('warplane'));
					roleIcon = BL_CDN + '/assets/warplane.png';
					roleDescription = 'Warplane';
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

{#if (show || editEnabled) && roleIcon}
	{#if roleLink}
		<a class="player-role {onAvatar ? 'on-avatar' : ''}" href={roleLink} class:disabled={!show}>
			<img class="role-icon" src={roleIcon} title={roleDescription} alt="Role icon" />
		</a>
	{:else}
		<div class="player-role {onAvatar ? 'on-avatar' : ''}" class:disabled={editEnabled && !show}>
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

	.on-avatar {
		margin-right: -5.5em;
		margin-top: -2.5em;
	}

	.disabled img {
		filter: grayscale(1);
		opacity: 0.25;
	}
</style>
