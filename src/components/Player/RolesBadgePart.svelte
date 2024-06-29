<script>
	export let role;
	export let allRoles;
	export let index = 0;
	export let profileAppearance;
	export let editModel = null;

	let roleTitle;
	let roleDescription;
	let show = false;
	let cls = null;

	function updateRoleIcon(role, profileAppearance, edit) {
		cls = null;
		show = false;

		switch (role) {
			case 'rankedteam':
				show = !profileAppearance || profileAppearance.includes('rankedteam');
				roleTitle = 'RT';
				roleDescription = 'Ranking Team member';
				break;
			case 'qualityteam':
				show = !profileAppearance || profileAppearance.includes('qualityteam');
				roleTitle = 'NQT';
				roleDescription = 'Nomination Quality Team member';
				break;
			case 'juniorrankedteam':
				show = !profileAppearance || profileAppearance.includes('juniorrankedteam');
				roleTitle = 'Junior RT';
				roleDescription = 'Junior Ranking team member';
				break;
			case 'creator':
				show = !profileAppearance || profileAppearance.includes('creator');
				roleTitle = 'CREATOR';
				roleDescription = 'BeatLeader Creator';
				break;
			case 'admin':
				show = !profileAppearance || profileAppearance.includes('admin');
				roleTitle = 'ADMIN';
				roleDescription = 'Administrator';
				break;
		}

		if (edit && cls && index > 0) {
			cls += ' edit';
		}
	}

	function onToggleRole(role, e) {
		if (!role?.length || !editModel) return;

		e.preventDefault();
		e.stopPropagation();

		if (!editModel.data.profileAppearance) editModel.data.profileAppearance = [];

		if (editModel.data.profileAppearance.includes(role)) {
			editModel.data.profileAppearance = editModel.data.profileAppearance.filter(s => s !== role);
			if (!editModel.data.profileAppearance.length) editModel.data.profileAppearance = null;
		} else editModel.data.profileAppearance = [...editModel.data.profileAppearance, role];
	}

	$: updateRoleIcon(role, editModel?.data?.profileAppearance ?? profileAppearance, !!editModel);
</script>

{#if (show || !!editModel) && roleTitle}
	{#if roleTitle}
		<span
			class={cls}
			class:disabled={!!editModel && !show}
			title={editModel ? 'Click to toggle' : roleDescription}
			on:click={e => onToggleRole(role, e)}>{roleTitle}</span>
	{/if}
	{#if cls === 'player-role'}
		<div class="player-role-margin" />
	{/if}
{/if}

<style>
	.player-role {
		position: absolute;
		top: -2.5em;
		left: 20%;
		width: 6em;
	}

	.player-role-margin {
		position: relative;
		margin-bottom: 1.7em;
	}

	.player-role.edit {
		top: 1.2em;
		height: 6em;
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

	.disabled {
		filter: grayscale(1);
		opacity: 0.25;
	}

	.disabled:hover {
		filter: none;
		opacity: 0.5;
	}
</style>
