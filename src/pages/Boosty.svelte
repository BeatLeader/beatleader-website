<script>
	import Button from '../components/Common/Button.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import {opt} from '../utils/js';
	import {CURRENT_URL, BL_API_URL} from '../network/queues/beatleader/api-queue';
	import steamSvg from '../resources/steam.svg';
	import ssrConfig from '../ssr-config';

	const account = createAccountStore();

	let login;
	let password;

	let link = null;
	let loadingLink = true;
	let sending = false;
	let error = null;
	let name = '';
	let code = '';
	let codeSent = false;

	async function request(path, method = 'GET') {
		const response = await fetch(BL_API_URL + path, {credentials: 'include', method});
		const text = await response.text();
		if (!response.ok) {
			// Proxy error pages are HTML, show a generic message instead.
			throw text.length && text.length < 300 && !text.startsWith('<') ? text : 'Something went wrong, try again later';
		}
		return text.length ? JSON.parse(text) : null;
	}

	async function fetchLink() {
		loadingLink = true;
		try {
			link = await request('user/boosty');
		} catch {
			link = null;
		}
		loadingLink = false;
	}

	async function run(action) {
		if (sending) return;
		sending = true;
		error = null;
		try {
			await action();
		} catch (e) {
			error = e?.toString();
		}
		sending = false;
	}

	function sendCode() {
		if (!name.trim().length) return;
		run(async () => {
			await request('user/boosty/code?name=' + encodeURIComponent(name.trim()), 'POST');
			code = '';
			codeSent = true;
		});
	}

	function linkCode() {
		if (code.trim().length != 6) return;
		run(async () => {
			link = await request('user/boosty/link?code=' + encodeURIComponent(code.trim()), 'POST');
			codeSent = false;
			account.refresh();
		});
	}

	function unlink() {
		if (!confirm('Unlink your Boosty subscription from this profile?')) return;
		run(async () => {
			await request('user/boosty/link', 'DELETE');
			link = null;
			name = '';
			account.refresh();
		});
	}

	function toggleCodeStep() {
		codeSent = !codeSent;
		code = '';
		error = null;
	}

	$: loggedInPlayer = opt($account, 'id');
	$: accountError = opt($account, 'error');
	$: if (loggedInPlayer) fetchLink();
</script>

<svelte:head>
	<title>Link Boosty - {ssrConfig.name}</title>
</svelte:head>

<ContentBox>
	<div class="boosty-page">
		<h1 class="boosty-heading">Link your Boosty subscription</h1>
		<span>
			Thank you for supporting {ssrConfig.name} on
			<a class="boosty-inline-link" href="https://boosty.to/beatleader" target="_blank" rel="noreferrer">Boosty</a>! Link your subscription
			to get supporter features for your tier.
		</span>

		{#if $account?.loading}
			<Spinner />
		{:else if !loggedInPlayer}
			<div class="boosty-login">
				<div class="boosty-step">Log in first</div>
				<form action={BL_API_URL + 'signin'} method="post">
					<input type="hidden" name="Provider" value="Steam" />
					<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/supporting-project/boosty'} />

					<Button icon={steamSvg} label="Log In with Steam" type="green" />
				</form>
				<span>or Log In with BL account from the Quest mod</span>
				<div class="boosty-input-container">
					<div class="boosty-label">Login</div>
					<input bind:value={login} placeholder="Login" />
				</div>
				<div class="boosty-input-container">
					<div class="boosty-label">Password</div>
					<input type="password" bind:value={password} placeholder="Password" />
				</div>
				<Button iconFa="fas fa-right-to-bracket" label="Log In" on:click={() => account.logIn(login, password)} />
				{#if accountError}
					<p class="boosty-error">{accountError}</p>
				{/if}
			</div>
		{:else if loadingLink}
			<Spinner />
		{:else if link}
			<span>
				Linked as <b>{link.name}</b>{#if link.level}&nbsp;({link.level}){/if}
			</span>
			{#if link.tier}
				<Button iconFa="fas fa-gift" label="Claim your benefits" type="boosty" url={CURRENT_URL + '/supporting-project'} onlyurl={true} />
				<span class="boosty-hint">The subscription stays linked to this profile while it's active. You can unlink it after it ends.</span>
			{:else}
				<span class="boosty-hint">No paid subscription found. Changes on Boosty show up here within a few hours.</span>
				<Button iconFa="fas fa-link-slash" label="Unlink Boosty" loading={sending} on:click={unlink} />
			{/if}
		{:else if !codeSent}
			<div class="boosty-step">1. Enter your Boosty name</div>
			<span class="boosty-hint">Exactly as it appears on your Boosty profile. We'll send you a code in Boosty messages.</span>
			<div class="boosty-row">
				<input
					class="boosty-input"
					bind:value={name}
					placeholder="Boosty name"
					maxlength="100"
					on:keydown={e => e.key === 'Enter' && sendCode()} />
				<Button
					iconFa="fas fa-paper-plane"
					label="Send code"
					type="boosty"
					noMargin={true}
					loading={sending}
					disabled={!name.trim().length}
					on:click={sendCode} />
			</div>
			<span class="boosty-hint boosty-clickable" on:click={toggleCodeStep} on:keydown={toggleCodeStep} role="button" tabindex="0">
				I already have a code
			</span>
		{:else}
			<div class="boosty-step">2. Enter the code</div>
			<span class="boosty-hint">
				Check your
				<a class="boosty-inline-link" href="https://boosty.to/app/messages" target="_blank" rel="noreferrer">Boosty messages</a>, the code
				is valid for 30 minutes.
			</span>
			<div class="boosty-row">
				<input
					class="boosty-input boosty-code"
					bind:value={code}
					placeholder="000000"
					inputmode="numeric"
					autocomplete="one-time-code"
					maxlength="6"
					on:keydown={e => e.key === 'Enter' && linkCode()} />
				<Button
					iconFa="fas fa-link"
					label="Link Boosty"
					type="boosty"
					noMargin={true}
					loading={sending}
					disabled={code.trim().length != 6}
					on:click={linkCode} />
			</div>
			<span class="boosty-hint boosty-clickable" on:click={toggleCodeStep} on:keydown={toggleCodeStep} role="button" tabindex="0">
				Change the name or send a new code
			</span>
		{/if}

		{#if error}
			<p class="boosty-error">{error}</p>
		{/if}
	</div>
</ContentBox>

<style>
	.boosty-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75em;
		max-width: 34em;
		margin: 0 auto;
		padding: 1em 0;
		text-align: center;
	}

	.boosty-heading {
		font-size: 1.6em;
		font-weight: 600;
		text-transform: none;
		margin: 0;
	}

	.boosty-step {
		margin-top: 0.75em;
		font-weight: 600;
	}

	.boosty-login {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5em;
	}

	.boosty-input-container {
		display: grid;
		width: 20em;
		max-width: 100%;
		text-align: left;
	}

	.boosty-label {
		font-size: 0.85em;
		opacity: 0.8;
	}

	.boosty-row {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	.boosty-input {
		width: 14em;
	}

	.boosty-code {
		width: 7em;
		text-align: center;
		letter-spacing: 0.2em;
	}

	.boosty-hint {
		font-size: 0.85em;
		opacity: 0.7;
	}

	.boosty-clickable {
		cursor: pointer;
		text-decoration: underline;
	}

	.boosty-inline-link {
		display: contents;
	}

	.boosty-error {
		color: red;
		margin: 0;
	}
</style>
