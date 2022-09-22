<script>
	import {BL_CDN} from '../../network/queues/beatleader/page-queue';
	import createBeatSaverService from '../../services/beatmaps';
	import {createEventDispatcher} from 'svelte';

	export let role;
	export let mapperId = null;
	export let profileAppearance;
	export let editModel = null;

	let roleIcon;
	let roleIconClass;
	let roleDescription;
	let roleLink;
	let show = false;

	async function verifyMapper(mapperId) {
		if (!mapperId) return;

		let beatSaverService = createBeatSaverService();
		const mapperInfoValue = await beatSaverService.getMapper(mapperId);
		if (mapperInfoValue.verifiedMapper) {
			roleIcon = null;
			roleIconClass = 'fas fa-hat-wizard';
			roleDescription = 'Verified maps creator';
			roleLink = 'https://beatsaver.com/profile/' + mapperId;
		}
	}

	function updateRoleIcon(role, mapperId, profileAppearance) {
		switch (role) {
			case 'mapper':
				show = !profileAppearance || profileAppearance.includes('mapper');
				verifyMapper(mapperId);
				break;
			case 'rankedteam':
				show = !profileAppearance || profileAppearance.includes('rankedteam');
				roleIcon = null;
				roleIconClass = 'fas fa-balance-scale-right';
				roleDescription = 'Ranking team member';
				break;
			case 'juniorrankedteam':
				show = !profileAppearance || profileAppearance.includes('juniorrankedteam');
				roleIcon = null;
				roleIconClass = 'fas fa-balance-scale';
				roleDescription = 'Junior Ranking team member';
				break;
			case 'creator':
				show = !profileAppearance || profileAppearance.includes('creator');
				roleIcon = null;
				roleIconClass = 'fab fa-creative-commons-by';
				roleDescription = 'BL creator';
				break;
			case 'admin':
				show = !profileAppearance || profileAppearance.includes('admin');
				roleIcon = null;
				roleIconClass = 'fas fa-user-shield';
				roleDescription = 'Administrator';
				break;
			case 'tipper':
				show = true;
				roleIcon = BL_CDN + '/assets/patreon1.png';
				roleDescription = 'Tier 1 Patreon supporter.';
				break;
			case 'supporter':
				show = true;
				roleIcon = BL_CDN + '/assets/patreon2.png';
				roleDescription = 'Tier 2 Patreon supporter.';
				break;
			case 'sponsor':
				show = true;
				roleIcon = BL_CDN + '/assets/patreon3.png';
				roleDescription = 'Highest tier Patreon supporter. Crypto godge';
				break;
			case 'warplane':
				show = !profileAppearance || profileAppearance.includes('warplane');
				roleIcon = null;
				roleIconClass = 'fas fa-plane';
				roleDescription = 'Warplane';
				break;
			default:
				roleIcon = null;
				roleIconClass = null;
				break;
		}
	}

	function onToggleRole(role) {
		if (!role?.length || !editModel) return;

		if (!editModel.profileAppearance) editModel.profileAppearance = [];

		if (editModel.profileAppearance.includes(role)) {
			editModel.profileAppearance = editModel.profileAppearance.filter(s => s !== role);
			if (!editModel.profileAppearance.length) editModel.profileAppearance = null;
		} else editModel.profileAppearance = [...editModel.profileAppearance, role];
	}

	$: updateRoleIcon(role, mapperId, editModel?.profileAppearance ?? profileAppearance);
</script>

{#if (show || !!editModel) && (roleIcon || roleIconClass)}
	{#if roleLink}
		{#if !!editModel}
			{#if roleIcon}
				<div class="player-role" class:disabled={!show} on:click={() => onToggleRole(role)}>
					<img class="role-icon" src={roleIcon} title={editModel ? 'Click to toggle' : roleDescription} alt="Role icon" />
				</div>
			{:else if roleIconClass}
				<i class={roleIconClass} class:disabled={!!editModel && !show} on:click={() => onToggleRole(role)} />
			{/if}
		{:else if roleIcon}
			<a class="player-role" href={roleLink}>
				<img class="role-icon" src={roleIcon} title={roleDescription} alt="Role icon" />
			</a>
		{:else if roleIconClass}
			<i class={roleIconClass} class:disabled={!!editModel && !show} on:click={() => onToggleRole(role)} />
		{/if}
	{:else if roleIcon}
		<div class="player-role" class:disabled={!!editModel && !show} on:click={() => onToggleRole(role)}>
			<img class="role-icon" src={roleIcon} title={editModel ? 'Click to toggle' : roleDescription} alt="Role icon" />
		</div>
	{:else if roleIconClass}
		<i class={roleIconClass} class:disabled={!!editModel && !show} on:click={() => onToggleRole(role)} />
	{/if}
{/if}

<style>
	.player-role {
		position: absolute;
		top: -2.5em;
		left: 2em;
		width: 6em;
		display: block;
	}

	.role-icon {
		z-index: 5;
		width: 100%;
	}

	i {
		color: var(--beatleader-primary);
		font-size: 1.5em;
	}

	img,
	i {
		transition: all 200ms;
	}

	:global(.edit-enabled) img,
	:global(.edit-enabled) i {
		cursor: cell;
	}

	.disabled img,
	i.disabled {
		filter: grayscale(1);
		opacity: 0.25;
	}

	i.disabled {
		opacity: 0.75;
	}

	.disabled img:hover,
	i.disabled:hover {
		filter: none;
		opacity: 0.5;
	}
</style>
