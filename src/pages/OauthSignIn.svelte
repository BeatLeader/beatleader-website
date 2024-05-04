<script>
	import Button from '../components/Common/Button.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import createOculusStore from '../stores/beatleader/oculususer';
	import {CURRENT_URL, BL_API_URL} from '../network/queues/beatleader/api-queue';
	import Spinner from '../components/Common/Spinner.svelte';
	import beatSaverSvg from '../resources/beatsaver.svg';
	import steamSvg from '../resources/steam.svg';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {fetchJson} from '../network/fetch';

	export let location;

	const searchParams = new URLSearchParams(location?.search ?? '');

	const account = createAccountStore();
	const oculus = createOculusStore();

	let clientDetais;
	let antiforgeryToken;
	let scope = [];

	let scopeDesriptions = {
		profile: {
			title: 'Access your id, username and avatar',
			icon: 'fas fa-user-check',
		},
		clan: {
			title: 'Manage your clan',
			icon: 'fas fa-people-group',
		},
		offline_access: {
			title: 'Prolong access to your account without this prompt',
			icon: 'fa-solid fa-server',
		},
	};

	var clientFetchError = null;

	function fetchClient(searchParams) {
		scope = searchParams.get('scope').split(' ');
		fetchJson(BL_API_URL + 'oauthclient/info?clientId=' + searchParams.get('client_id'))
			.then(clientInfo => {
				clientDetais = clientInfo.body;
			})
			.catch(err => {
				clientFetchError = err;
			});

		fetch(BL_API_URL + 'oauthclient/antiforgery')
			.then(response => response.text())
			.then(token => {
				document.cookie = 'X-CSRF-TOKEN=' + antiforgeryToken + ';path=/';
				antiforgeryToken = token;
			})
			.catch(err => {
				clientFetchError = err;
			});
	}

	let login;
	let password;

	$: document.body.scrollIntoView({behavior: 'smooth'});
	$: loggedInPlayer = $account?.player;
	$: error = $account?.error ?? $oculus?.error ?? clientFetchError;
	$: message = $account?.message;
	$: loading = $account?.loading;

	$: fetchClient(searchParams);
</script>

<ContentBox cls="login-container login-page">
	<div class="title">Login with BeatLeader</div>
	{#if loggedInPlayer}
		<div class="pfp-and-greeting">
			<img class="avatar" src={loggedInPlayer.playerInfo.avatar} />
			<span class="greeting">{loggedInPlayer.name}, Welcome!</span>
		</div>
	{/if}

	<div class="client-description">
		{#if clientDetais}
			<div class="client-icon-and-title">
				<img class="client-icon" src={clientDetais.icon} />
				<span class="client-title">{clientDetais.name} wants to access your BeatLeader account</span>
			</div>
			<span>This will allow {clientDetais.name} to:</span>
		{/if}
		{#each scope as scopeValue}
			<div class="scope-description">
				<i class={scopeDesriptions?.[scopeValue]?.icon ?? ''} />
				<span>{scopeDesriptions?.[scopeValue]?.title ?? scopeValue}</span>
			</div>
		{/each}
	</div>

	{#if loading}
		<Spinner />
	{:else if !loggedInPlayer}
		<div class="tips">Login with Steam or the account you created in game.</div>

		<form action={BL_API_URL + 'signinoculus'} method="post">
			<div class="input-container">
				<div class="cat">Login</div>
				<input bind:value={login} name="login" placeholder="Login (may differ from username)" />
			</div>
			<div class="input-container">
				<div class="cat">Password</div>
				<input type="password" name="password" bind:value={password} placeholder="Password" />
			</div>
			<input type="hidden" name="oauthState" value={window.location.search} />
			<input type="hidden" name="ReturnUrl" value={CURRENT_URL} />
			<input type="hidden" name="action" value="login" />

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<Button iconFa="fas fa-plus-square" label="Login" type="submit" />
		</form>
		<form action={BL_API_URL + 'signin'} method="post">
			<input type="hidden" name="Provider" value="Steam" />
			<input type="hidden" name="oauthState" value={window.location.search} />
			<input type="hidden" name="ReturnUrl" value={CURRENT_URL} />

			<Button icon={steamSvg} label="Login with Steam" type="submit" />
		</form>
		<form action={BL_API_URL + 'signin'} method="post">
			<input type="hidden" name="Provider" value="BeatSaver" />
			<input type="hidden" name="oauthState" value={window.location.search} />
			<input type="hidden" name="ReturnUrl" value={CURRENT_URL} />

			<Button icon={beatSaverSvg} label="Login with BeatSaver" type="submit" />
		</form>
	{:else}
		<form action={BL_API_URL + 'oauth2/authorize'} method="post">
			<input type="hidden" name="client_id" value={searchParams.get('client_id')} />
			<input type="hidden" name="scope" value={searchParams.get('scope')} />
			<input type="hidden" name="response_type" value={searchParams.get('response_type')} />
			<input type="hidden" name="redirect_uri" value={searchParams.get('redirect_uri')} />
			<input type="hidden" name="state" value={searchParams.get('state')} />
			<input type="hidden" name="__RequestVerificationToken" value={antiforgeryToken} />
			<Button iconFa="fas fa-sign-in-alt" label="Authorize" type="submit" />
		</form>
	{/if}

	{#if error}
		<p class="error">{error}</p>
	{/if}
	{#if message}
		<p class="messagep">{message}</p>
	{/if}
</ContentBox>

<style>
	b {
		margin-left: 1em;
		margin-right: 1em;
	}
	span {
		margin-left: 1em;
		margin-right: 1em;
	}

	.client-description {
		display: flex;
		flex-direction: column;
		grid-gap: 1em;
		background-color: #740707;
		border-radius: 0.6em;
		padding: 0.5em;
	}

	.client-icon-and-title {
		display: flex;
		align-items: center;
		padding: 1em;
	}

	.client-icon {
		width: 4em;
		border-radius: 50%;
	}

	.client-title {
		font-size: 1.2em;
		font-weight: bold;
	}

	.scope-description {
		margin-left: 1em;
	}

	.pfp-and-greeting {
		display: flex;
		align-items: center;
		grid-gap: 1em;
	}

	.greeting {
		font-size: 1.2em;
		font-weight: bold;
	}

	.avatar {
		border-radius: 50%;
	}

	:global(.login-container) {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		grid-gap: 2em;
	}
	.error {
		color: red;
	}
	.messagep {
		color: green;
	}

	.input-container {
		display: grid;
	}

	.button-container {
		display: flex;
		justify-content: center;
		margin: 1em;
	}

	.inlineLink {
		display: contents;
	}
	.title {
		margin-top: 1em;
	}
	.twitch :global(.button) {
		font-size: 0.875em;
		width: max-content;
	}
</style>
