<script>
	import Button from '../components/Common/Button.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import createOculusStore from '../stores/beatleader/oculususer';
	import {formatDateRelative, dateFromUnix} from '../utils/date';
	import {opt} from '../utils/js';
	import {CURRENT_URL, BL_API_URL} from '../network/queues/beatleader/api-queue';
	import {navigate} from 'svelte-routing';
	import Dialog from '../components/Common/Dialog.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import beatSaverSvg from '../resources/beatsaver.svg';
	import steamSvg from '../resources/steam.svg';
	import ContentBox from '../components/Common/ContentBox.svelte';

	export let action;

	const account = createAccountStore();
	const oculus = createOculusStore();

	let login;
	let password;
	let newPassword;
	let newLogin = opt($account, 'login');
	let suspendingDialogShown = false;
	let token = null;

	function performAction() {
		if (action == 'addHome') {
			account.refresh(true);
		}
		if (action == 'oculuspc') {
			const urlParams = new URLSearchParams(window.location.search);
			token = urlParams.get('token');
			oculus.fetchOculusUser(token);
		}
	}

	$: loggedInPlayer = opt($account, 'id');
	$: socials = opt($account, 'player.playerInfo.socials');
	$: error = opt($account, 'error') ?? $oculus?.error;
	$: message = opt($account, 'message');
	$: patreoned = opt($account, 'patreoned');
	$: loading = opt($account, 'loading');
	$: performAction();
</script>

<ContentBox cls="login-container login-page">
	{#if !action || action == 'addHome'}
		{#if !loggedInPlayer}
			<div class="title">Login</div>
			<div class="tips">Login with Steam or the account you created in game.</div>
			<b>Creating an account is only possible from in game!</b>
			<div class="input-container">
				<div class="cat">Login (not username)</div>
				<input bind:value={login} placeholder="Login (from the mod)" />
			</div>
			<div class="input-container">
				<div class="cat">Password</div>
				<input type="password" bind:value={password} placeholder="Password" />
			</div>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<Button iconFa="fas fa-plus-square" label="Login" on:click={() => account.logIn(login, password)} />
			<form action={BL_API_URL + 'signin'} method="post">
				<input type="hidden" name="Provider" value="Steam" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button icon={steamSvg} label="Login with Steam" type="submit" />
			</form>
			<form action={BL_API_URL + 'signin'} method="post">
				<input type="hidden" name="Provider" value="BeatSaver" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button icon={beatSaverSvg} label="Login with BeatSaver" type="submit" />
			</form>
			<b>You can't use BeatSaver only account to post scores. </b>
			<b>To use Quest mod - signup in the mod preferences with new login and password </b>
			<br />
		{:else if loggedInPlayer > 70000000000000000}
			{#if !$account.migrated}
				<span>
					If you are using the <b>Steam game</b> you are all set!<br />
					Check <a class="inlineLink" href={'/u/' + loggedInPlayer}>your fancy profile </a>
				</span>
				<br />
				<br />
				<br />
				<span>
					If you are using Quest - you can migrate<br />account created in mod to this
					<b class="inlineLink">Steam account.</b><br /><br />
					Your current scores will migrate and<br />the new ones will be posted to the Steam acc.<br />
					This is not required and there is no way to unmerge!
				</span>
				<div class="input-container">
					Login
					<input bind:value={login} placeholder="Login" />
				</div>
				<div class="input-container">
					Password
					<input type="password" bind:value={password} placeholder="Password" />
				</div>
				<Button iconFa="fas fa-plus-square" label="Migrate" on:click={() => account.migrate(login, password)} />
			{:else}
				{navigate('/u/' + loggedInPlayer)}
			{/if}
		{:else if loggedInPlayer < 30000000 || loggedInPlayer > 1000000000000000}
			<span>
				You can migrate this account to your Steam account.<br /><br />
				Your current scores will migrate and<br />the new ones will be posted to the Steam account.<br /><br />
				Or just use this account ¯\_(ツ)_/¯.<br />
				You can change your avatar and name in <a class="inlineLink" href={'/u/' + loggedInPlayer}>your profile.</a>
			</span>

			<form action={BL_API_URL + 'signinmigrate'} method="post">
				<input type="hidden" name="Provider" value="Steam" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button iconFa="fas fa-plus-square" label="Migrate to Steam" type="submit" />
			</form>
		{:else}
			{navigate('/u/' + loggedInPlayer)}
		{/if}
	{:else if action == 'changePassword'}
		{#if !$account.migrated}
			<div class="input-container">
				Login
				<input bind:value={login} placeholder="Login" />
			</div>
			<div class="input-container">
				Current password
				<input type="password" bind:value={password} placeholder="Password" />
			</div>
			<div class="input-container">
				New password
				<input type="password" bind:value={newPassword} placeholder="New password" />
			</div>

			<Button iconFa="fas fa-plus-square" label="Change password" on:click={() => account.changePassword(login, password, newPassword)} />
		{:else}
			<div class="input-container">
				Login
				<input bind:value={login} placeholder="Login" />
			</div>
			<div class="input-container">
				New password
				<input type="password" bind:value={newPassword} placeholder="Password" />
			</div>

			<Button iconFa="fas fa-plus-square" label="Change password" on:click={() => account.changePasswordMigrated(login, newPassword)} />
		{/if}
	{:else if action == 'linkPatreon'}
		<span>
			Link your account to receive patreon features for your tier.<br /><br />

			If you are not yet a patron, you can become one
			<strong> <a class="inlineLink" href="https://www.patreon.com/beatleader">here</a></strong>
		</span>

		<form action={BL_API_URL + 'signin'} method="post">
			<input type="hidden" name="Provider" value="Patreon" />
			<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/patreon'} />

			<Button iconFa="fas fa-plus-square" label="Link to patreon" type="submit" />
		</form>
	{:else if action == 'socials'}
		{#if socials && socials.find(s => s.service == 'BeatSaver')}
			{#if loggedInPlayer > 1000000000000000}
				<form action={BL_API_URL + 'user/unlink'} method="post">
					<input type="hidden" name="Provider" value="BeatSaver" />
					<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

					<Button icon={beatSaverSvg} label="Unlink BeatSaver" type="danger" />
				</form>
			{/if}
		{:else}
			<span>
				Link BeatSaver to receive mapper role.<br />
				And receive a profile badge if you are approved mapper.<br />
			</span>

			<form action={BL_API_URL + 'signin'} method="post">
				<input type="hidden" name="Provider" value="BeatSaver" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button iconFa="fas fa-plus-square" label="Link to BeatSaver" type="submit" />
			</form>
		{/if}

		<span>
			Link social platforms to add buttons on your profile and<br />
			in-game if you are Patreon supporter.
		</span>
		{#if socials && socials.find(s => s.service == 'Discord')}
			<form action={BL_API_URL + 'user/unlink'} method="post">
				<input type="hidden" name="Provider" value="Discord" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button iconFa="fab fa-discord" label="Unlink Discord" type="danger" />
			</form>
		{:else}
			<form class="blurple" action={BL_API_URL + 'signin'} method="post">
				<input type="hidden" name="Provider" value="Discord" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button type="blurple" iconFa="fab fa-discord" label="Link Discord" />
			</form>
		{/if}
		{#if socials && socials.find(s => s.service == 'Twitch')}
			<form action={BL_API_URL + 'user/unlink'} method="post">
				<input type="hidden" name="Provider" value="Twitch" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button iconFa="fab fa-twitch" label="Unlink Twitch" type="danger" />
			</form>
		{:else}
			<form class="twitch" action={BL_API_URL + 'signin'} method="post">
				<input type="hidden" name="Provider" value="Twitch" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button type="twitch" iconFa="fab fa-twitch" label="Link Twitch" />
			</form>
		{/if}
		{#if socials && socials.find(s => s.service == 'YouTube')}
			<form action={BL_API_URL + 'user/unlink'} method="post">
				<input type="hidden" name="Provider" value="Google" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button iconFa="fab fa-youtube" label="Unlink YouTube" type="danger" />
			</form>
		{:else}
			<form class="youtube" action={BL_API_URL + 'signin'} method="post">
				<input type="hidden" name="Provider" value="Google" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button type="youtube" iconFa="fab fa-youtube" label="Link YouTube" />
			</form>
		{/if}
		{#if socials && socials.find(s => s.service == 'Twitter')}
			<form action={BL_API_URL + 'user/unlink'} method="post">
				<input type="hidden" name="Provider" value="Twitter" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button iconFa="fab fa-twitter" label="Unlink Twitter" type="danger" />
			</form>
		{:else}
			<form class="twitter" action={BL_API_URL + 'signin'} method="post">
				<input type="hidden" name="Provider" value="Twitter" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

				<Button type="twitter" iconFa="fab fa-twitter" label="Link Twitter" />
			</form>
		{/if}
	{:else if action == 'patreon'}
		{#if patreoned}
			Yay!<br />
			Thank you for supporting BeatLeader!
		{:else}
			Something went wrong while linking your account.<br />
			If you used this account before, try unlink it first.
		{/if}
	{:else if action == 'mylogin'}
		<span>
			Your current login is: <b>{$account.login}</b><br />
			It's the username you use to sign in with.<br />
			Your profile name is a different thing!<br />
		</span>

		<div class="input-container">
			You may change it once a week.<br />Make sure you don't use special characters not available in-game keyboard.
			<input bind:value={newLogin} placeholder="New login" />
		</div>

		<Button iconFa="fas fa-plus-square" label="Change login" on:click={() => account.changeLogin(newLogin)} />
	{:else if action == 'autoban'}
		{#if $account.ban}
			Your account was suspended {formatDateRelative(dateFromUnix($account.ban.timeset))}<br />
			You can activate it after a week has passed.

			<Button iconFa="fas fa-plus-square" label="Try activate my account" on:click={() => account.unbanPlayer()} />
		{:else}
			You can suspend your BeatLeader account. It will disappear in the leaderboards and ranking.<br />
			And you won't be able to submit scores.<br /><br />

			<b
				>You can activate it back only after the week of suspension.<br />
				All account data will be deleted after 6 months of suspension!</b
			><br />

			Account suspension may take up to 3 minutes.

			<Button
				iconFa="fas fa-plus-square"
				label="Yes, suspend my account"
				on:click={() => (suspendingDialogShown = !suspendingDialogShown)} />
		{/if}
	{:else if action == 'oculuspc'}
		{#if $oculus.name}
			{#if !$oculus.migrated}
				<span>
					{$oculus.name}, hi! 👋<br /><br />
					Please select preffered way to login on the website.<br />
				</span>
				<b>Steam account.</b>
				<span>
					You don't need to own the game.<br />
					Your ID will be changed to the Steam ID<br />
				</span>

				<form action={BL_API_URL + 'signinmigrate/oculuspc'} method="post">
					<input type="hidden" name="Provider" value="Steam" />
					<input type="hidden" name="Token" value={token} />
					<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

					<Button iconFa="fas fa-plus-square" label="Use Steam" type="submit" />
				</form>

				<b>Login and password.</b>
				New login and password just for this website.<br />
				Your ID will remain the same.<br />
				<form action={BL_API_URL + 'signinoculus/oculuspc'} method="post">
					<input type="hidden" name="action" value="signup" />
					<input type="hidden" name="Token" value={token} />
					<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />
					<div class="input-container">
						Website Login
						<input name="login" bind:value={login} placeholder="Login" />
					</div>
					<div class="input-container">
						New password
						<input name="password" type="password" bind:value={password} placeholder="Password" />
					</div>
					<div class="button-container">
						<Button iconFa="fas fa-plus-square" label="Sign up" type="submit" />
					</div>
				</form>
			{:else}
				{navigate('/u/' + $oculus.migratedId)}
			{/if}
		{:else}
			Loading...
		{/if}
	{/if}

	{#if suspendingDialogShown}
		<Dialog
			type="confirm"
			title="Are you sure?"
			okButton="Yeah!"
			cancelButton="Hell no!"
			on:confirm={() => {
				account.banPlayer();
				suspendingDialogShown = false;
			}}
			on:cancel={() => (suspendingDialogShown = false)}>
			<div slot="content">
				<div>Your BeatLeader account will be suspended!</div>
			</div>
		</Dialog>
	{/if}

	{#if loading}
		<Spinner />
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
