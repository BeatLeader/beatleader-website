<script>
	import {fly, fade} from 'svelte/transition';
	import {navigate} from 'svelte-routing';
	import createAccountStore from '../../stores/beatleader/account';
	import {configStore} from '../../stores/config';
	import Switch from '../Common/Switch.svelte';
	import {deepClone} from '../../utils/js';

	export let animationSign = 1;

	const account = createAccountStore();

	async function settempsetting(key, value) {
		var preferences = deepClone(configStore.get('preferences'));
		preferences[key] = value;
		await configStore.setForKey('preferences', preferences, false);
	}
</script>

<div class="main-container" in:fly|global={{y: animationSign * 200, duration: 400}} out:fade|global={{duration: 100}}>
	{#if $account?.player}
		{#if ($account?.player?.playerId < 30000000 || $account?.player?.playerId > 1000000000000000) && !$account?.migrated}
			<a href="/signin" on:click|preventDefault|stopPropagation={() => navigate('/signin')}>Migrate</a>
		{/if}

		{#if $account?.player?.playerId < 70000000000000000 || $account?.migrated}
			<a href="/signin/changePassword" on:click|preventDefault|stopPropagation={() => navigate('/signin/changePassword')}
				>Change password</a>
			<a href="/signin/mylogin" on:click|preventDefault|stopPropagation={() => navigate('/signin/mylogin')}>My login</a>
		{/if}

		<a href="/signin/socials" on:click|preventDefault|stopPropagation={() => navigate('/signin/socials')}>Link socials</a>

		<a href="/supporting-project/link" on:click|preventDefault|stopPropagation={() => navigate('/supporting-project/link')}>Link Patreon</a>

		{#if $account?.ban}
			{#if $account?.ban?.reason === 'Self ban'}
				<a href="/signin/autoban" on:click|preventDefault|stopPropagation={() => navigate('/signin/autoban')}>Activate account</a>
			{/if}
		{:else}
			<a href="/signin/autoban" on:click|preventDefault|stopPropagation={() => navigate('/signin/autoban')}>Suspend account</a>
		{/if}

		<div class="options">
			<section class="option full" id="account-logout-confirmation">
				<div class="label" title="Ask for confirmation before logging out">Log out confirmation</div>
				<div class="switches">
					<Switch
						value={$configStore.preferences.askOnLogOut}
						label="Ask on Log Out"
						fontSize={12}
						design="slider"
						on:click={() => settempsetting('askOnLogOut', !$configStore.preferences.askOnLogOut)} />
				</div>
			</section>
		</div>
	{:else}
		<a href="/signin" on:click|preventDefault|stopPropagation={() => navigate('/signin')}>Log in</a>
	{/if}
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.options {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-gap: 1em;
		align-items: start;
		justify-items: start;
		margin-top: 0.25rem;
	}

	.option {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.option.full {
		grid-column: span 2;
	}

	.label {
		display: block;
		font-size: 0.75em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #afafaf !important;
		margin-bottom: 0.25em;
	}

	.switches {
		display: flex;
		grid-gap: 1em;
		flex-wrap: wrap;
		justify-content: flex-start;
		padding: 0.5em;
	}
</style>
