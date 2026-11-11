<script>
	import {createEventDispatcher} from 'svelte';
	import OauthButton from './OauthButton.svelte';
	import {session} from './api';

	const dispatch = createEventDispatcher();

	$: providers = $session.linkedProviders;
	$: steam = providers.includes('Steam');
	$: one = providers.length == 1;
</script>

{#if steam}
	<h2 class="title is-5">This profile is merged with a Steam account</h2>
	<p>
		Sign in with that Steam account to set a new password for the Quest login. Go to the Settings, "Account" tab. You'll see the login there
		too.
	</p>
{:else}
	<h2 class="title is-5">Sign in with a linked account</h2>
	<p>
		{providers.join(', ')}
		{one ? 'is' : 'are'} linked to this profile. Sign in with {one ? 'it' : 'one of them'} to set a new password.
	</p>
{/if}

<div class="row">
	{#each providers as provider}
		<OauthButton {provider} />
	{/each}
</div>

{#if steam}
	<p class="hint">Only need the website? <a href="/signin">Log in with Steam</a>, it needs no password.</p>
{/if}
<p class="hint">
	Can't use {one ? 'it' : 'any of them'} anymore?
	<button class="link" on:click={() => dispatch('staff')}>Contact the staff</button>, they'll check it by hand.
</p>
