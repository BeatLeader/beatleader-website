<script>
	import {CREATOR} from './Overlay/overlay';
	import RolesBadgePart from './RolesBadgePart.svelte';

	export let roles = null;
	export let profileAppearance;
	export let editModel;

	let filteredRoles = [];

	function filterRoles(roles, profileAppearance, editModel) {
		filteredRoles = roles.filter(role => CREATOR.includes(role) && (editModel || profileAppearance.includes(role)));
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
		padding: 0.4em 0.8em;
		border-radius: 3em;
		box-shadow: 1px 1px 5px #252525cc;
		width: fit-content;
		margin-top: 0.8em;
		font-weight: 600;
	}

	.separator {
		background-color: #eeeeeed1;
		width: 0.1em;
		height: 1.2em;
	}
</style>
