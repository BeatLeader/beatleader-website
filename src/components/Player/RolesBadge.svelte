<script>
	import {CREATOR} from './Overlay/overlay';
	import RolesBadgePart from './RolesBadgePart.svelte';

	export let roles = null;
	export let profileAppearance;
	export let editModel;

	let filteredRoles = [];

	function filterRoles(roles, profileAppearance, editModel) {
		filteredRoles = CREATOR.filter(role => roles.includes(role) && (editModel || profileAppearance.includes(role)));
	}

	$: filterRoles(roles, editModel?.data?.profileAppearance ?? profileAppearance, editModel);
</script>

{#if filteredRoles?.length}
	<div class="roles-badge {editModel ? 'editing' : ''}">
		{#each filteredRoles as role, idx}
			{#if idx > 0}
				<div class="separator" />
			{/if}
			<RolesBadgePart {role} index={idx} allRoles={roles} {profileAppearance} bind:editModel />
		{/each}
	</div>
{/if}

<style>
	.roles-badge {
		display: flex;
		align-items: center;
		gap: 0.5em;
		background-color: purple;
		padding: 0.2em 0.4em;
		border-radius: 6px;
		box-shadow: 1px 1px 5px #00000069;
		width: fit-content;
		margin-top: 0.2em;
		margin-bottom: 0.2em;
		font-weight: 600;
		font-size: 0.8em;
		margin-left: 0.3em;
	}

	.separator {
		background-color: #eeeeeed1;
		width: 0.12em;
		height: 1.2em;
	}
</style>
