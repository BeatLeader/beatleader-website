<script>
	import {fly, fade} from 'svelte/transition';
	import {navigate} from 'svelte-routing';
	import createAccountStore from '../../stores/beatleader/account';

	export let animationSign = 1;

	const account = createAccountStore();
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
</style>
