<script>
	import {navigate} from 'svelte-routing';
	import {createEventDispatcher} from 'svelte';
	import {fade, fly} from 'svelte/transition';
	import createAccountStore from '../stores/beatleader/account';
	import {debounce} from '../utils/debounce';
	import ssrConfig from '../ssr-config';
	import Pager from '../components/Common/Pager.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import Button from '../components/Common/Button.svelte';
	import OauthApp from '../components/Developer/OauthApp.svelte';
	import BotAccount, {waitForBotsRefresh} from '../components/Developer/BotAccount.svelte';
	import {fetchJson} from '../network/fetch';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import beatSaverSvg from '../resources/beatsaver.svg';

	export let page = 1;
	export let location;

	const FILTERS_DEBOUNCE_MS = 500;

	document.body.classList.remove('slim');
	const dispatch = createEventDispatcher();

	let createMode = false;
	let createError = null;
	let createIsSaving = false;
	let showBeatSaverLogin = false;

	let boxEl = null;

	const account = createAccountStore();

	let isLoading = false;
	let apps = null;

	function fetchApps() {
		fetchJson(BL_API_URL + 'developer/apps', {credentials: 'include'}).then(remoteApps => {
			apps = remoteApps.body;
			isLoading = false;
		});
	}

	function newAppAdded(event) {
		createMode = false;
		apps.unshift(event.detail);
		apps = apps;
	}

	function onAppDeleted(event) {
		createMode = false;
		apps = apps.filter(app => app.clientId !== event.detail.clientId);
	}

	let botCreateMode = false;
	let isBotsLoading = false;
	let bots = null;

	function fetchBots() {
		isBotsLoading = true;
		fetchJson(BL_API_URL + 'developer/bots', {credentials: 'include'}).then(remoteBots => {
			bots = remoteBots.body;
			isBotsLoading = false;
		});
	}

	async function onBotAdded() {
		botCreateMode = false;
		isBotsLoading = true;
		await waitForBotsRefresh();
		fetchBots();
	}

	function onBotChanged() {
		fetchBots();
	}

	let cinematicsCanvas;

	function drawCinematics(cinematicsCanvas, coverUrl) {
		if (coverUrl && cinematicsCanvas) {
			cinematicsCanvas.style.opacity = 1;
			const context = cinematicsCanvas.getContext('2d');

			const cover = new Image();
			cover.onload = function () {
				context.drawImage(cover, 0, 0, cinematicsCanvas.width, cinematicsCanvas.height);
			};
			cover.src = coverUrl;
		}
	}

	$: drawCinematics(cinematicsCanvas, '/assets/landing-big-developer.jpg');

	$: document.body.scrollIntoView({behavior: 'smooth'});

	$: $account.id && fetchApps();
	$: $account.id && fetchBots();
	$: discordSocial = $account?.player?.playerInfo?.socials?.find(s => s?.service === 'Discord');
</script>

<svelte:head>
	<title>Developer Portal / {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<div class="big-landing-box">
			<div class="cinematics">
				<div class="cinematics-canvas">
					<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
				</div>
			</div>
			<div class="title-and-buttons">
				<h3 class="big-description audiowide">Let's create something awesome together!</h3>

				<div class="downloadButtons">
					<a class="pc-download-button" href="https://api.beatleader.com/swagger/index.html" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-box-open" label="API" />
					</a>
					<a class="quest-download-button" href="https://github.com/BeatLeader" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-file-code" label="Source code" />
					</a>
					<a
						class="quest-download-button"
						href="https://api.beatleader.com/grafana/public-dashboards/24a088907eb24c599da93cf110686b43?orgId=1&refresh=10s"
						target="_blank"
						rel="noreferrer">
						<Button iconFa="fas fa-chart-line" label="Grafana" />
					</a>
				</div>
			</div>
		</div>
		<ContentBox bind:box={boxEl}>
			<h1 class="title is-5">
				Oauth Applications

				{#if isLoading}
					<Spinner />
				{/if}
			</h1>

			{#if apps}
				{#if createMode}
					<ContentBox>
						<OauthApp
							enableCreateMode={true}
							on:added={e => newAppAdded(e)}
							on:deleted={e => onAppDeleted(e)}
							on:cancel={() => {
								createMode = false;
							}} />
					</ContentBox>
				{:else if $account?.player && apps.length < 5}
					<Button
						iconFa="fas fa-rocket"
						label="New Oauth2 application"
						type="primary"
						on:click={() => {
							createMode = true;
						}} />
				{/if}

				{#if apps?.length}
					<div class="apps grid-transition-helper">
						{#each apps as app, idx (app.clientId)}
							<div class={`app-line row-${idx}`} in:fly|global={{delay: idx * 10, x: 100}}>
								<div class="main">
									<OauthApp {app} on:deleted={e => onAppDeleted(e)} />
								</div>
							</div>
						{/each}
					</div>
				{:else if !isLoading}
					<p>No apps yet.</p>
				{/if}
			{:else if $account.id}
				{#if discordSocial}
					<Button
						iconFa="fas fa-rocket"
						label="New Oauth2 application"
						type="primary"
						on:click={() => {
							apps = [];
							createMode = true;
						}} />
				{:else}
					<div class="benefit-button-container">
						<Button
							iconFa="fas fa-edit"
							title="Please link discord"
							label="Please link discord"
							noMargin={true}
							url="/signin/socials"
							onlyurl={true}
							type="default" />
					</div>
				{/if}
			{:else}
				<div class="benefit-button-container">
					<Button
						iconFa="fas fa-edit"
						title="Log in to start"
						label="Log in to start"
						noMargin={true}
						url="/signin"
						onlyurl={true}
						type="default" />
				</div>
			{/if}
		</ContentBox>
		<ContentBox>
			<h1 class="title is-5">
				Bot accounts

				{#if isBotsLoading}
					<Spinner />
				{/if}
			</h1>

			<p class="bots-description">
				A bot account is useful if you are working on algorithm for passing maps. They compete on the separate bots leaderboard and
				ranking. Only the best bot score is shown on the main leaderboards for players who enabled "Show bots". <br /> <br />
				<b>
					Please do not create bots for deterministic 100% or near 100% accuracy, these bots will be deleted, and your account
					won't be able to host bots. Bot movements in the replay MUST be realistic.</b>
			</p>

			{#if bots}
				{#if botCreateMode}
					<ContentBox>
						<BotAccount
							enableCreateMode={true}
							on:added={onBotAdded}
							on:cancel={() => {
								botCreateMode = false;
							}} />
					</ContentBox>
				{:else if $account?.player && bots.length < 3}
					{#if discordSocial}
						<Button
							iconFa="fas fa-robot"
							label="New bot account"
							type="primary"
							on:click={() => {
								botCreateMode = true;
							}} />
					{:else}
						<div class="benefit-button-container">
							<Button
								iconFa="fas fa-edit"
								title="Please link discord"
								label="Please link discord"
								noMargin={true}
								url="/signin/socials"
								onlyurl={true}
								type="default" />
						</div>
					{/if}
				{/if}

				{#if bots?.length}
					<div class="apps grid-transition-helper">
						{#each bots as bot, idx (bot.playerId)}
							<div class={`app-line row-${idx}`} in:fly|global={{delay: idx * 10, x: 100}}>
								<div class="main">
									<BotAccount {bot} on:changed={onBotChanged} />
								</div>
							</div>
						{/each}
					</div>
				{:else if !isBotsLoading}
					<p>No bot accounts yet.</p>
				{/if}
			{:else if !$account.id}
				<div class="benefit-button-container">
					<Button
						iconFa="fas fa-edit"
						title="Log in to start"
						label="Log in to start"
						noMargin={true}
						url="/signin"
						onlyurl={true}
						type="default" />
				</div>
			{/if}
		</ContentBox>
		<ContentBox>
			<span
				class="title is-5 chevron-clickable"
				class:opened={showBeatSaverLogin}
				on:click={() => (showBeatSaverLogin = !showBeatSaverLogin)}
				on:keydown={() => (showBeatSaverLogin = !showBeatSaverLogin)}
				title="Show login with BeatSaver">
				Mapper login

				<i class="fas fa-chevron-down" />
			</span>

			{#if showBeatSaverLogin}
				<div transition:fade|global>
					<p style="padding: 1em 0">
						This login option is only for mappers that <b>do not own the game</b>, but need to login to the website to manage
						their maps.
						<br /> If you are a player, please use the game login. <b style="color:#ff6666">THIS IS NOT FOR PLAYERS</b> and is
						<b style="color:#ff6666">unusable</b> in game. <br />
						<b style="color:#ff6666">Reesabers are not available for this login method.</b>
					</p>

					<form action={BL_API_URL + 'signin'} method="post">
						<input type="hidden" name="Provider" value="BeatSaver" />
						<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />

						<Button icon={beatSaverSvg} label="Login with BeatSaver" type="submit" />
					</form>
				</div>
			{/if}
		</ContentBox>
	</article>
</section>

<style>
	.align-content {
		display: flex;
		align-items: flex-start;
		justify-content: center;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
		overflow: visible;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	input::placeholder {
		color: var(--faded) !important;
	}

	.apps :global(> *:last-child) {
		border-bottom: none !important;
	}

	.bots-description {
		margin-bottom: 1em;
		color: var(--faded);
	}

	.app-line {
		border-bottom: 1px solid var(--row-separator);
		padding: 0.5em 0;
	}

	.app-line:last-child {
		border-bottom: none;
	}

	.app-line .icons.up-to-tablet + .main {
		padding-top: 0;
	}

	.app-line .main {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		grid-column-gap: 0.75em;
	}

	.app-line .main > *:last-child {
		margin-right: 0;
	}

	.big-landing-box {
		background: url('/assets/landing-big-developer.jpg') !important;
		background-position-y: 50em !important;
		background-position-x: 80% !important;
		display: flex;
		justify-content: flex-end;
		margin: 4px 10px 18px;
		border-radius: 6px;
		padding: 1rem;
		position: relative;
		z-index: var(--z-index);
	}

	.big-description {
		font-family: 'Audiowide';
		font-size: 2.5em;
	}

	.title-and-buttons {
		max-width: 48%;
	}

	.sources {
		display: flex;
		flex-wrap: wrap;
		gap: 2em;
	}

	.features {
		display: flex;
		justify-content: space-evenly;
	}

	.feature-image {
		width: 25em;
		height: 25em;
	}

	.feature {
		perspective: 50em;
	}

	.feature-description {
		text-align: center;
	}

	.cinematics {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		pointer-events: none;
	}

	.cinematics-canvas {
		filter: blur(5em) opacity(0.5) saturate(250%);
		left: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.1) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
	}

	.title.is-4 {
		margin-top: 1.2em;
	}

	.global-ranking-call {
		margin-top: 2em;
	}

	h3 {
		padding: 0.25em 0;
		margin-bottom: 0.75em !important;
		font-size: 1.25em;
	}

	h3 > a {
		display: inline-flex;
		align-items: center;
	}

	h3 .icon {
		display: inline-block;
		width: 4em;
		height: 4em;
		margin-right: 0.5em;
	}

	.imageLink {
		width: 4em;
		height: 4em;
	}

	.downloadButtons {
		margin-top: 1.5em;
		margin-left: 0.3em;
		margin-bottom: 2em;
		display: flex;
		gap: 0.6em;
		float: center;
	}
	ul {
		list-style-type: square;
		padding-left: 20px;
	}

	li {
		line-height: 1.6;
	}

	.chevron-clickable > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.chevron-clickable.opened > i {
		transform: rotateZ(180deg);
	}

	@media screen and (min-width: 1250px) {
		.big-landing-box {
			background-position-y: 52% !important;
			background-position-x: 80% !important;
			background-size: 100% !important;
		}

		.title-and-buttons {
			margin-top: 4.6em;
			margin-bottom: 3em;
			max-width: 44%;
		}
	}

	@media screen and (max-width: 1024px) {
		.title-and-buttons {
			max-width: 60%;
		}
	}

	@media screen and (max-width: 767px) {
		.features {
			flex-direction: column;
		}

		.feature-image {
			transform: none !important;
		}

		.big-landing-box {
			background-position-y: 51.5em !important;
			background-position-x: -15em !important;
		}

		.big-title {
			font-size: 3em;
		}

		.pc-download-button {
			display: none;
		}

		.title-and-buttons {
			margin-top: 7em;
			margin-bottom: -2em;
			max-width: none;
		}

		.cinematics-canvas {
			transform: scaleY(1.2) translateZ(0);
		}
	}
</style>
