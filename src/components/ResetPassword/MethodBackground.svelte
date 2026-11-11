<script>
	import {onMount} from 'svelte';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import OauthButton from './OauthButton.svelte';
	import {session, runCheck, getSession, checkHint} from './api';

	let hint = '';
	let checking = false;
	let wrong = false;
	let error = null;

	async function guess() {
		checking = true;
		error = null;
		const before = $session.hintTriesLeft;
		try {
			await checkHint(hint);
			wrong = $session.hintTriesLeft < before;
			hint = '';
		} catch (e) {
			error = e.message;
		}
		checking = false;
	}

	onMount(() => {
		if ($session.check == 'pending') runCheck().catch(e => (error = e.message));
		const poll = setInterval(() => {
			if ($session.check == 'running') getSession().catch(() => {});
		}, 4000);
		return () => clearInterval(poll);
	});

	$: ({check, identityProviders: providers, hintTriesLeft: triesLeft} = $session);
	$: account = `${$session.identityProvider} account ${$session.identityName ?? ''}`;
</script>

{#if check == 'pending' || check == 'running'}
	<p class="status"><Spinner /> Looking at the {account}, this takes up to a minute.</p>
{:else if check == 'granted' && triesLeft}
	<p class="good">The {account} checks out.</p>
	<p>Now type the <b>last 2 characters</b> of your password, as well as you remember them. Capital letters matter.</p>
	<form class="row" on:submit|preventDefault={guess}>
		<span class="dots">••••••</span>
		<input class="ending" type="text" maxlength="2" autocomplete="off" autocapitalize="off" spellcheck="false" bind:value={hint} />
		<Button type="primary" label="Check" loading={checking} disabled={checking || hint.length != 2} noMargin={true} />
		<span class="hint">{triesLeft} {triesLeft == 1 ? 'try' : 'tries'} left</span>
	</form>
	{#if wrong}
		<p class="bad">That's not how the password ends.</p>
	{/if}
{:else}
	{#if check == 'none'}
		<p>
			Sign in with your {providers.join(' or ')} account, it doesn't have to be linked to BeatLeader. If server verifies it, you get a few tries
			to type the <b>last 2 characters</b> of your password.
		</p>
	{:else}
		<p class="bad">
			{check == 'granted' ? 'No more tries at the password ending.' : `We couldn't confirm the profile is yours from the ${account}.`}
			{$session.replaysAvailable ? 'Connecting your Quest below is open now.' : ''}
		</p>
	{/if}

	{#if check == 'none' || $session.identitiesLeft}
		<div class="row">
			{#each providers as provider}
				<OauthButton {provider} />
			{/each}
		</div>
		<p class="hint">We only look at the account, nothing gets linked to your profile or posted.</p>
	{/if}
{/if}

{#if error}
	<p class="bad">{error}</p>
{/if}

<style>
	.dots {
		color: var(--faded);
		letter-spacing: 0.15em;
	}

	.ending {
		width: 3.5em;
		font-family: monospace;
		text-align: center;
	}
</style>
