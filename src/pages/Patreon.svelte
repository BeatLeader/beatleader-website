<script>
	import Button from '../components/Common/Button.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import {opt} from '../utils/js';
	import {CURRENT_URL, BL_API_URL} from '../network/queues/beatleader/api-queue';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {Confetti} from 'svelte-confetti';
	import beatSaverSvg from '../resources/beatsaver.svg';
	import steamSvg from '../resources/steam.svg';
	import ssrConfig from '../ssr-config';
	import {isPatron} from '../components/Player/Overlay/overlay';

	const account = createAccountStore();

	export let action;

	let login;
	let password;

	$: loggedInPlayer = opt($account, 'id');
	$: error = opt($account, 'error');
	$: message = opt($account, 'message');
	$: isSupporter = isPatron($account?.player?.playerInfo?.role);
	$: patreoned = opt($account, 'patreoned');
	$: loading = opt($account, 'loading');
</script>

<svelte:head>
	{#if isSupporter}
		<title>Supporting {ssrConfig.name}</title>
	{:else}
		<title>Thank you for supporting {ssrConfig.name}</title>
	{/if}
</svelte:head>

<div class="top-container">
	{#if isSupporter}
		<div class="confetti">
			<Confetti
				colorArray={['url(/assets/favicon-32x32.png)', 'url(/assets/lovege.webp)']}
				x={[-5, 5]}
				y={[0, 0.1]}
				delay={[500, 2000]}
				size="30"
				infinite
				duration="5000"
				amount="200"
				fallDistance="150vh" />
		</div>
		<div class="text-header">
			<h1>Yay! Thank you for supporting BeatLeader!❤️</h1>
			Claim your benefits:
		</div>
	{:else if action == 'linkPatreon'}
		<ContentBox>
			{#if !patreoned}
				<span>
					Link your account to receive Patreon features for your tier.<br /><br />
				</span>
			{/if}
			{#if !loggedInPlayer}
				<div class="login-form">
					<div class="title">Please log in first to link Patreon</div>
					<div class="input-container">
						<div class="cat">Login (may differ from username)</div>
						<input bind:value={login} placeholder="Login" />
					</div>
					<div class="input-container">
						<div class="cat">Password</div>
						<input type="password" bind:value={password} placeholder="Password" />
					</div>

					<Button iconFa="fas fa-plus-square" label="Log In" on:click={() => account.logIn(login, password)} />
					<form action={BL_API_URL + 'signin'} method="post">
						<input type="hidden" name="Provider" value="Steam" />
						<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/supporting-project/link'} />

						<Button icon={steamSvg} label="Log In with Steam" type="submit" />
					</form>
					<form action={BL_API_URL + 'signin'} method="post">
						<input type="hidden" name="Provider" value="BeatSaver" />
						<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/supporting-project/link'} />

						<Button icon={beatSaverSvg} label="Log In with BeatSaver" type="submit" />
					</form>
				</div>
			{:else if patreoned}
				<span>
					Your account is linked to Patreon, but no active subsription was found.<br /><br />
				</span>
				<Button iconFa="fas fa-arrows-rotate" label="Refresh status" type="submit" on:click={() => account.refreshPatreon()} />
			{:else}
				<form action={BL_API_URL + 'signin'} method="post">
					<input type="hidden" name="Provider" value="Patreon" />
					<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/supporting-project'} />

					<Button iconFa="fas fa-plus-square" label="Link to patreon" type="submit" />
				</form>
				<span>
					If you are not yet a patron, you can become one
					<strong> <a class="inlineLink" href="https://www.patreon.com/beatleader">here</a></strong>
				</span>
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
	{:else}
		<ContentBox>
			<div class="text-header">
				<span>Help the open-source leaderboard to be sustainable and to keep making new features!<br /></span>
				<div class="benefit-button-container">
					<Button
						iconFa="fa-brands fa-patreon"
						onlyurl={true}
						label="Patreon page"
						type="patreon"
						url="https://www.patreon.com/beatleader" />
				</div>
				<span>Support us on Patreon today to not only invest in reliable service but also receive a set of cool benefits:</span>
			</div>
		</ContentBox>
	{/if}
	<div class="benefits-container">
		<ContentBox cls="benefits-box first-box">
			<h2><b>Reesabers</b></h2>

			<img class="benefits-gif" src="/assets/reesabers.webp" />

			<ul>
				<li>The most advanced and beautiful custom sabers mod for Beat Saber</li>
				<li>A ton of customizations to make your game stand out not only for you, but for your recordings as well</li>
				<li>Built-in motion blur for the smoothest sabers you have ever experienced</li>
			</ul>
			<span style="color: red">ONLY FOR PC BEAT SABER</span>

			{#if isSupporter && loggedInPlayer > 1000000000000000}
				<div class="benefit-button-container">
					<Button
						iconFa="fas fa-download"
						title="Download Reesabers"
						label="Download"
						url={BL_API_URL + 'reesabers'}
						onlyurl={true}
						type="green" />
				</div>
			{/if}
		</ContentBox>

		<ContentBox cls="benefits-box second-box">
			<h2><b>Profile recognition</b></h2>

			<img class="benefits-gif" src="/assets/profile-recognition.webp" />

			<ul>
				<li>Select one of the stunning avatar borders</li>
				<li>7 more scores to pin!</li>
				<li>Customize colors for web replays and embeds</li>
				<li>Social links in-game</li>
				<li>Add a message to show in the game (only for sponsors)</li>
			</ul>

			{#if isSupporter}
				<div class="benefit-button-container">
					<Button
						iconFa="fas fa-edit"
						title="Edit profile"
						label="Edit profile"
						noMargin={true}
						url="/u/{loggedInPlayer}?edit=true"
						onlyurl={true}
						type="default" />
				</div>
			{/if}
		</ContentBox>

		<ContentBox cls="benefits-box">
			<h2><b>Special powers</b></h2>

			<img class="benefits-gif" src="/assets/discord.webp" />

			<ul>
				<li>Access private chat for supporters</li>
				<li>Priority for feature requests</li>
				<li>Roles in Discord server</li>
			</ul>

			{#if isSupporter}
				<div class="benefit-button-container">
					<Button
						iconFa="fa-brands fa-discord"
						title="Join discord"
						label="Join discord"
						noMargin={true}
						url="https://discord.gg/2RG5YVqtG6"
						onlyurl={true}
						type="blurple" />
				</div>
			{/if}
		</ContentBox>
	</div>

	{#if loggedInPlayer && !isSupporter && action != 'linkPatreon'}
		<ContentBox>
			<span>
				Link your account to receive patreon features for your tier.<br /><br />
			</span>
			<form action={BL_API_URL + 'signin'} method="post">
				<input type="hidden" name="Provider" value="Patreon" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/supporting-project'} />

				<Button iconFa="fas fa-plus-square" label="Link to patreon" type="submit" />
			</form>
			<span>
				If you are not yet a patron, you can become one
				<strong> <a class="inlineLink" href="https://www.patreon.com/beatleader">here</a></strong>
			</span>

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
	{/if}
</div>

<style>
	.top-container {
		display: flex;
		flex-direction: column;
	}
	.benefits-container {
		display: flex;
		flex-direction: column;
	}
	.text-header {
		text-align: center;
		flex-direction: column;
		display: flex;
		padding: 1em;
	}
	.benefit-button-container {
		flex: none;
		padding-top: 1em;
	}
	.benefits-gif {
		max-width: 36em;
		padding: 1em;
	}
	:global(.benefits-box) {
		width: 60%;
		display: flex;
		flex-direction: column;
	}

	:global(.second-box) {
		left: 36%;
	}

	.error {
		color: red;
	}
	.messagep {
		color: green;
	}

	.input-container {
		display: grid;
		width: 20em;
		margin-bottom: 0.5em;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		flex: none;
		align-items: center;
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

	.confetti {
		position: fixed;
		top: -50px;
		left: 0;
		height: 100vh;
		width: 100vw;
		display: flex;
		justify-content: center;
		overflow: hidden;
		pointer-events: none;
	}
	h1 {
		font-size: 2em;
	}
	h2 {
		font-size: larger;
	}

	p {
		margin-top: 0.5em;
		margin-bottom: 0.5em;
	}

	ul {
		list-style-type: square;
		padding-left: 20px;
	}

	li {
		line-height: 1.6;
	}

	@media screen and (max-width: 760px) {
		:global(.benefits-box) {
			width: auto;
			align-items: center;
		}

		:global(.second-box) {
			left: auto;
		}

		.benefits-gif {
			max-width: 100%;
		}
	}
</style>
