<script>
	import Button from '../Common/Button.svelte';
	import {session, complete} from './api';

	const VERIFIED_BY = {
		steam: 'You signed in with the Steam account of this profile.',
		linkedAccount: 'You signed in with an account linked to this profile.',
		play: 'We saw you play the map with the right modifiers.',
		hint: 'You knew how the password ends.',
		localReplay: 'A replay from your headset matches a run recorded for this profile.',
		staff: 'The staff approved your request.',
	};

	let password = '';
	let repeat = '';
	let saving = false;
	let error = null;

	async function save() {
		saving = true;
		error = null;
		try {
			await complete(password);
		} catch (e) {
			error = e.message;
		}
		saving = false;
	}

	$: mismatch = repeat.length > 0 && repeat != password;
	$: valid = password.replace(/ /g, '').length >= 8 && repeat == password;
</script>

{#if $session.completed}
	<h2 class="title is-5"><i class="fas fa-circle-check good"></i> Password changed</h2>
	<p>
		Log in in the Quest mod and on the website with {#if $session.login}the login <b class="login">{$session.login}</b> and{/if} your new password.
	</p>
	<Button
		type="primary"
		iconFa="fas fa-arrow-right-to-bracket"
		label="Log in on the website"
		url="/signin"
		onlyurl={true}
		noMargin={true} />
	<p class="hint">
		Once you're in, link Steam. You don't need to own the game. If you forget the password again, signing in with it is all it takes.
	</p>
{:else}
	<p class="good"><b>The profile is yours.</b> {VERIFIED_BY[$session.verifiedBy] ?? ''}</p>
	{#if $session.verifiedBy == 'staff' && $session.request?.adminNote}
		<p class="hint">"{$session.request.adminNote}"</p>
	{/if}

	<div class="inset">
		<span class="hint">Your login, it goes into the "login" field in the mod and on the website</span>
		<b class="login">{$session.login}</b>
	</div>

	<h2 class="title is-5">Choose a new password</h2>
	<form class="flow" on:submit|preventDefault={save}>
		<input type="password" placeholder="New password" autocomplete="new-password" maxlength="200" bind:value={password} />
		<input type="password" placeholder="Repeat it" autocomplete="new-password" maxlength="200" bind:value={repeat} />
		{#if mismatch}
			<p class="bad">The passwords don't match.</p>
		{:else}
			<p class="hint">At least 8 characters, ones you can type on the keyboard in the headset.</p>
		{/if}
		{#if error}
			<p class="bad">{error}</p>
		{/if}
		<Button type="primary" iconFa="fas fa-key" label="Set the password" loading={saving} disabled={!valid || saving} noMargin={true} />
	</form>
{/if}

<style>
	.inset {
		display: flex;
		flex-direction: column;
		align-self: stretch;
	}

	.login {
		font-family: monospace;
		font-size: 1.2em;
		word-break: break-all;
	}
</style>
