<script>
	import TabSwitcher from '../Common/TabSwitcher.svelte';
	import PasswordResetRequests from './PasswordResetRequests.svelte';
	import PasswordResetRecords from './PasswordResetRecords.svelte';

	const tabs = [
		{
			id: 'requests',
			label: 'Staff requests',
			iconFa: 'fas fa-envelope',
			title: 'Requests sent from the "contact staff" form of the password reset',
		},
		{id: 'records', label: 'Reset log', iconFa: 'fas fa-clock-rotate-left', title: 'Every password reset that went through'},
	];
	let tab = tabs[0];
</script>

<div class="reset-admin-tabs">
	<TabSwitcher values={tabs} value={tab} on:change={e => (tab = e.detail)} />
</div>

{#if tab.id == 'requests'}
	<PasswordResetRequests />
{:else}
	<PasswordResetRecords />
{/if}

<style>
	.reset-admin-tabs {
		margin-bottom: 0.8em;
	}
</style>
