<script>
	import {createEventDispatcher} from 'svelte';
	import Button from '../Common/Button.svelte';
	import {session, checkLogin} from './api';

	const dispatch = createEventDispatcher();

	let login = $session.loginTried ?? '';
	let checking = false;
	let error = null;

	async function check() {
		checking = true;
		error = null;
		try {
			await checkLogin(login.trim());
		} catch (e) {
			error = e.message;
		}
		checking = false;
	}

	$: ({loginTried: tried, loginMatched: matched, loginTriesLeft: triesLeft} = $session);
</script>

<h2 class="title is-5">Which login are you typing?</h2>
<p>
	The login is what you entered in the mod when you made the account. It can be different from the profile name
	<b>{$session.player.name}</b>.
</p>

<form class="row" on:submit|preventDefault={check}>
	<input
		type="text"
		placeholder="Login"
		autocomplete="username"
		autocapitalize="off"
		maxlength="100"
		disabled={matched || !triesLeft}
		bind:value={login} />
	{#if !matched && triesLeft}
		<Button type="primary" label="Check" loading={checking} disabled={checking || !login.trim()} noMargin={true} />
	{/if}
</form>

{#if error}
	<p class="bad">{error}</p>
{:else if matched}
	<p class="good">That's the login, so it's the password that's lost.</p>
{:else if tried}
	<p class="bad">
		<b>{tried}</b> isn't the login of this profile.{triesLeft ? ` ${triesLeft} more ${triesLeft == 1 ? 'try' : 'tries'}.` : ''}
	</p>
	<p class="hint">Don't remember it? Once we know the profile is yours, we'll show you the login.</p>
{/if}

<Button
	type={matched || tried ? 'primary' : 'default'}
	iconFa="fas fa-arrow-right"
	label={matched ? 'Reset the password' : tried ? 'Continue without the login' : "I don't remember my login"}
	noMargin={true}
	on:click={() => dispatch('continue')} />
