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

	document.body.scrollIntoView({behavior: 'smooth'});

	let login;
	let password;

	let showBeatSaverLogin = false;
	let showOtherVersions = false;

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
			<div class="header-box">
				{#if !patreoned}
					<div class="sorting-options">
						<span> Link your account to receive Patreon features for your tier. </span>
					</div>
				{/if}
				{#if !loggedInPlayer}
					<div class="login-form">
						<div class="title">Please log in first to link Patreon</div>
						<form action={BL_API_URL + 'signin'} method="post">
							<input type="hidden" name="Provider" value="Steam" />
							<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/supporting-project/link'} />

							<Button icon={steamSvg} label="Log In with Steam" type="green" />
						</form>
						<br />
						<span>or Log In with BL account from the Quest mod</span>
						<span>if you never used BeatLeader you need to sign up in mod</span>
						<div class="input-container">
							<div class="cat">Login</div>
							<input bind:value={login} placeholder="Login" />
						</div>
						<div class="input-container">
							<div class="cat">Password</div>
							<input type="password" bind:value={password} placeholder="Password" />
						</div>

						<Button iconFa="fas fa-right-to-bracket" label="Log In" on:click={() => account.logIn(login, password)} />
						<a href="https://discord.com/channels/921820046345523311/951919251227295844">forgot password?</a>
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
			</div>
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

			{#if action == 'linkPatreon' || isSupporter}
				{#if isSupporter && loggedInPlayer < 30000000}
					<div class="benefit-button-container">
						<Button
							iconFa="fas fa-download"
							title={!loggedInPlayer || !isSupporter ? 'Log in on the top of the Page and Link Patreon' : 'Download Reesabers for 1.28'}
							label="Download for Quest 1.28"
							url={BL_API_URL + `questreesabers.qmod?random=${Math.random()}`}
							onlyurl={true}
							disabled={!loggedInPlayer || !isSupporter}
							type="green" />
						<Button
							iconFa="fas fa-download"
							title={!loggedInPlayer || !isSupporter ? 'Log in on the top of the Page and Link Patreon' : 'Download Reesabers for 1.35'}
							label="Download for Quest 1.35"
							url={BL_API_URL + `questreesabersversion?version=1.35.0`}
							onlyurl={true}
							disabled={!loggedInPlayer || !isSupporter}
							type="green" />
					</div>
				{:else}
					<div class="benefit-button-top-container">
						<div class="benefit-button-container">
							<span>PC (v0.3.9):</span>
							<Button
								iconFa="fas fa-download"
								title={!loggedInPlayer || !isSupporter ? 'Log in on the top of the Page and Link Patreon' : 'Download Reesabers for 1.35'}
								label="Download for PC 1.35-1.36.2"
								url={BL_API_URL + 'reesabersversion?version=1.35.0'}
								onlyurl={true}
								disabled={!loggedInPlayer || !isSupporter}
								type="green" />
							<Button
								iconFa="fas fa-download"
								title={!loggedInPlayer || !isSupporter
									? 'Log in on the top of the Page and Link Patreon'
									: 'Download PC Reesabers for 1.27-1.29'}
								label="Download for PC 1.27-1.29.1"
								url={BL_API_URL + 'reesabersversion?version=1.29.1'}
								onlyurl={true}
								disabled={!loggedInPlayer || !isSupporter}
								type="green" />
						</div>
						<div class="benefit-button-container">
							<span>QUEST (v0.3.9):</span>
							<Button
								iconFa="fas fa-download"
								title={!loggedInPlayer || !isSupporter ? 'Log in on the top of the Page and Link Patreon' : 'Download Reesabers for 1.35'}
								label="Download for Quest 1.35"
								url={BL_API_URL + `questreesabersversion?version=1.35.0`}
								onlyurl={true}
								disabled={!loggedInPlayer || !isSupporter}
								type="green" />
							<Button
								iconFa="fas fa-download"
								title={!loggedInPlayer || !isSupporter ? 'Log in on the top of the Page and Link Patreon' : 'Download Reesabers for 1.28'}
								label="Download for Quest 1.28"
								url={BL_API_URL + `questreesabersversion?version=1.28.0`}
								onlyurl={true}
								disabled={!loggedInPlayer || !isSupporter}
								type="green" />
						</div>
					</div>

					{#if loggedInPlayer && isSupporter}
						<div class="versions-list">
							<span
								class="beat-savior-reveal clickable"
								class:opened={showOtherVersions}
								on:click={() => (showOtherVersions = !showOtherVersions)}
								on:keydown={() => (showOtherVersions = !showOtherVersions)}
								title="Show ReeSabers downloads for other versions">
								{#if showOtherVersions}
									Hide versions
								{:else}
									Other versions
								{/if}

								<i class="fas fa-chevron-down" />
							</span>

							{#if showOtherVersions}
								<a href={BL_API_URL + 'reesabersversion?version=1.34.0'}> Version for 1.34.2 (v0.3.8)</a>
							{/if}
						</div>
					{/if}
				{/if}
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

	{#if action != 'linkPatreon' && !isSupporter}
		<ContentBox>
			<div class="header-box">
				<span>
					Already a patron? Link your account here to receive patreon features for your tier.<br /><br />
				</span>
				<Button url={CURRENT_URL + '/supporting-project/link'} onlyurl={true} iconFa="fas fa-link" label="Link to patreon" type="submit" />
				<span>
					If you are not yet a patron, you can become one
					<strong> <a class="inlineLink" href="https://www.patreon.com/beatleader">here</a></strong>
				</span>
			</div>
		</ContentBox>
	{/if}
</div>

<style>
	.header-box {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
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
	.benefit-button-top-container {
		display: flex;
		gap: 2em;
	}
	.benefit-button-container {
		flex: none;
		display: flex;
		flex-direction: column;
		width: 15em;
		padding-top: 1em;
	}
	.benefits-gif {
		max-width: 36em;
		padding: 1em;
	}
	.versions-list {
		display: flex;
		flex-direction: column;
		align-self: flex-start;
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

	.sorting-options {
		display: grid;
		justify-items: center;
		margin: 0.4em;
	}

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}

	.beat-saver-description {
		margin-bottom: 1em;
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
