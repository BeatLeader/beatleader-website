<script>
	import Button from '../components/Common/Button.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {fade, fly, slide} from 'svelte/transition';
	import {MetaTags} from 'svelte-meta-tags';
	import steamSvg from '../resources/steam.svg';
	import ssrConfig from '../ssr-config';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import {isPatron} from '../components/Player/Overlay/overlay';
	import Spinner from '../components/Common/Spinner.svelte';

	let loading = true;
	let error = null;
	let scrollY;

	let login;
	let password;

	const account = createAccountStore();
	$: fetch(BL_API_URL + 'reesaberstibytesviewed', {credentials: 'include'});
	$: loggedInPlayer = $account?.id;
	$: error = $account?.error;
	$: message = $account?.message;
	$: isSupporter = isPatron($account?.player?.playerInfo?.role);
	$: patreoned = $account?.patreoned;
	$: loading = $account?.loading;

	const metaDescription =
		'Download Tibytes Presets - A special version of ReeSabers with legendary presets included. Exclusive to BeatLeader Patreon supporters.';
</script>

<svelte:window bind:scrollY />

<section class="align-content">
	<div class="saber-container left" style="transform: translateY({scrollY * 2.4}px)">
		<img class="reesaber-red" src="/assets/reesaber-red.webp" alt="Red ReeSaber" />
	</div>
	<article class="page-content" transition:fade|global>
		<div class="main-container">
			<div class="box-container">
				<div class="header-container">
					<img class="top-image" src="/assets/tibytes-preset.webp" style="margin-bottom: {-scrollY * 0.5}px" />
					<ContentBox cls="slim-box">
						<div class="header-container darkened-background">
							<h1 class="header-title">Tibytes Presets!</h1>
							<p class="header-subtitle">Special version of ReeSabers with legendary presets included</p>
						</div>
					</ContentBox>
				</div>
				<div class="group-container" style={!isSupporter ? 'max-width: 60em;' : ''}>
					{#if isSupporter}
						<div class="features-list">
							<ul>
								<li>Youtuber presets included</li>
								<li>Infinite customization</li>
								<li>Motion blur, particles and stunning effect</li>
								<li>Supports both Quest and PC</li>
								<li>Share and discover presets with players</li>
								<li>Regular updates</li>
								<li><a href="/supporting-project">Check all Patreon benefits here</a></li>
							</ul>
						</div>
					{/if}
					<ContentBox cls="slim-box central-box">
						<div class="text-header darkened-background">
							{#if isSupporter}
								<p class="thank-you-message">Thank you for supporting us! ❤️<br />Click below to download special ReeSabers:</p>
								<div class="benefit-button-container">
									<Button
										iconFa="fa-solid fa-download"
										label="Quest 1.37"
										type="primary"
										url={BL_API_URL + 'reesaberstibytes?version=1.37.0&platform=quest'}
										onlyurl={true} />
									<Button
										iconFa="fa-solid fa-download"
										label="Quest 1.40.8"
										type="primary"
										url={BL_API_URL + 'reesaberstibytes?version=1.40.8&platform=quest'}
										onlyurl={true} />
								</div>

								<div class="benefit-button-container">
									<Button
										iconFa="fa-solid fa-download"
										label="PC 1.29.1"
										type="primary"
										url={BL_API_URL + 'reesaberstibytes?version=1.29.1&platform=pc'}
										onlyurl={true} />
									<Button
										iconFa="fa-solid fa-download"
										label="PC 1.38-1.40.8"
										type="primary"
										url={BL_API_URL + 'reesaberstibytes?version=1.40.0&platform=pc'}
										onlyurl={true} />
								</div>
								<a href="https://beatleader.wiki/en/reesabers/support">and check the wiki on what to do next</a>
							{:else}
								<p class="support-message">Support us on Patreon to receive ReeSabers and many more features!</p>
								<div class="benefit-button-container">
									<Button
										iconFa="fa-brands fa-patreon"
										onlyurl={true}
										label="Become a Patron"
										type="patreon"
										url="https://www.patreon.com/beatleader" />
								</div>
							{/if}
						</div>
					</ContentBox>

					{#if !isSupporter}
						<div class="preview-image">
							<img src="/assets/tibytes-preview.webp" />
						</div>
						<div class="features-list">
							<ul>
								<li>Youtuber presets included</li>
								<li>Infinite customization</li>
								<li>Motion blur, particles and stunning effect</li>
								<li>Supports both Quest and PC</li>
								<li>Share and discover presets with players</li>
								<li>Regular updates</li>
								<li><a href="/supporting-project">Check all Patreon benefits here</a></li>
							</ul>
						</div>
						<ContentBox cls="slim-box login-box">
							<div class="darkened-background">
								{#if !loggedInPlayer}
									<div class="login-form">
										<div class="title">Subscribed? Log in to link:</div>
										<form action={BL_API_URL + 'signin'} method="post">
											<input type="hidden" name="Provider" value="Steam" />
											<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/tibytes-presets'} />

											<Button icon={steamSvg} label="Log In with Steam" type="green" />
										</form>
										<br />
										<span>or Log In with BL account from the Quest mod.<br /></span>
										<span>If you never used BeatLeader you need to sign up in the mod</span>
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
									<span>
										Link your Patreon to receive the benefits<br /><br />
									</span>
									<form action={BL_API_URL + 'signin'} method="post">
										<input type="hidden" name="Provider" value="Patreon" />
										<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/tibytes-presets'} />

										<Button iconFa="fas fa-plus-square" label="Link to patreon" type="submit" />
									</form>
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
						<div class="preview-image">
							<img src="/assets/tibytes-preview.webp" />
						</div>
					{/if}
				</div>
			</div>
		</div>
	</article>
	<div class="saber-container right" style="transform: translateY(-{scrollY * 2.4}px)">
		<img class="reesaber-blue" src="/assets/reesaber-blue.webp" alt="Blue ReeSaber" />
	</div>
</section>

<MetaTags
	title="ReeSabers with Tibytes Presets"
	description={metaDescription}
	openGraph={{
		title: 'ReeSabers with Tibytes Presets',
		description: metaDescription,
		images: [{url: '/assets/tibytes-preview.webp'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		cardType: 'summary_large_image',
		title: 'ReeSabers with Tibytes Presets',
		description: metaDescription,
		image: '/assets/tibytes-preview.webp',
		imageAlt: 'Tibytes Presets Preview',
	}} />

<style>
	.align-content {
		display: flex;
		justify-content: center;
		position: relative;
	}

	.top-image {
		width: 100%;
		min-width: 20em;
	}

	.page-content {
		width: 100%;
	}

	.main-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-container {
		max-width: 30em;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.preview-image {
		border-radius: 12px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
		overflow: hidden;
		width: 26em;
		display: flex;
		height: 16em;
		justify-content: center;
	}

	.group-container {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 1em;
	}

	.box-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: rgba(0, 0, 0, 0.6);
		border-radius: 15px;
		padding: 2em;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		margin-bottom: 1em;
	}

	.saber-container {
		display: none;
	}

	.header-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
	}

	.darkened-background {
		padding: 1em;
		border-radius: 10px;
		background: rgba(0, 0, 0, 0.3);
	}

	.header-title {
		font-size: 2.5em;
		font-weight: bold;
		margin-bottom: 0.2em;
		color: #ff6b6b;
	}

	.header-subtitle {
		font-size: 1.2em;
		color: #f8f9fa;
	}

	.text-header {
		text-align: center;
		max-width: 24em;
		display: flex;
		flex-direction: column;
		height: 100%;
		justify-content: center;
	}

	.thank-you-message,
	.support-message {
		font-size: 1.1em;
		margin-bottom: 1em;
	}

	.benefit-button-container {
		margin-top: 1em;
	}

	.features-list {
		padding: 1em;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		width: 26em;
		height: 16em;
	}

	.features-list h2 {
		color: #4ecdc4;
		margin-bottom: 0.5em;
	}

	.features-list ul {
		list-style-type: none;
		padding-left: 0;
	}

	.features-list li {
		margin-bottom: 0.5em;
		padding-left: 1.5em;
		position: relative;
	}

	.features-list li::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: #4ecdc4;
	}

	.saber-container {
		position: fixed;

		z-index: -1;
	}

	.saber-container.left {
		left: -2.5em;
		top: -30em;
	}

	.saber-container.right {
		right: -2.5em;
		bottom: -30em;
	}

	.reesaber-red,
	.reesaber-blue {
		height: 30em;
		transition: transform 0.3s ease;
	}

	.reesaber-red:hover,
	.reesaber-blue:hover {
		transform: scale(1.1) rotateZ(0deg);
	}

	.error-message {
		color: #ff6b6b;
		font-weight: bold;
	}

	:global(.slim-box) {
		padding: 0.4em !important;
		border-radius: 12px !important;
	}

	:global(.central-box) {
		height: 16em;
		margin-bottom: 0 !important;
		margin-top: 0 !important;
	}

	.error {
		color: red;
	}
	.messagep {
		color: green;
	}

	.input-container {
		display: grid;
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

	:global(.login-box) {
		max-width: 26em;
		text-align: center;
	}

	@media (max-width: 768px) {
		.box-container {
			border-radius: 0;
		}

		.saber-container {
			display: block;
		}

		.header-title {
			font-size: 2em;
		}

		.header-subtitle {
			font-size: 1em;
		}

		.reesaber-red,
		.reesaber-blue {
			width: 10em;
		}
		.features-list {
			width: auto;
			height: auto;
		}

		.group-container {
			gap: 1em;
		}

		:global(.central-box) {
			height: auto;
		}

		.preview-image {
			display: none;
		}

		:global(.group-container:not(:has(.login-box))) {
			flex-direction: column-reverse;
		}
	}
</style>
