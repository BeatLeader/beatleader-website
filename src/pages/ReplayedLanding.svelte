<script>
	import {fade, fly} from 'svelte/transition';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import FeaturedCarousel from '../components/Maps/FeaturedCarousel.svelte';
	import ReplayedCard from '../components/Replayed/ReplayedCard.svelte';
	import ReplayedSummaryCard from '../components/Replayed/ReplayedSummaryCard.svelte';
	import {fetchJson} from '../network/fetch';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import SoundMotionController from '../components/Replayed/SoundMotionController.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import beatSaverSvg from '../resources/beatsaver.svg';
	import steamSvg from '../resources/steam.svg';
	import Button from '../components/Common/Button.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import {navigate} from 'svelte-routing/src/history';
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../ssr-config';

	const account = createAccountStore();

	let playerReplayedAvailable = null;
	let mapperReplayedAvailable = null;
	let loggedInPlayer;

	let login;
	let password;

	let showBeatSaverLogin = false;

	function fetchReplayed() {
		fetchJson(BL_API_URL + 'replayed', {
			credentials: 'include',
		})
			.then(async response => {
				if (response.body.player != null) {
					playerReplayedAvailable = true;
				} else {
					playerReplayedAvailable = false;
				}

				if (response.body.mapper != null) {
					mapperReplayedAvailable = true;
				} else {
					mapperReplayedAvailable = false;
				}
			})
			.catch(err => {
				playerReplayedAvailable = false;
				mapperReplayedAvailable = false;
			});
	}

	$: loggedInPlayer = $account?.id;
	$: fetchReplayed($account?.id);
</script>

<svelte:head>
	<title>BeatLeader rePlayed 2023</title>
</svelte:head>

<section class="align-content">
	<article class="page-content align-content" transition:fade|global>
		<ContentBox cls="main-content-replayed">
			<div class="items">
				{#if loggedInPlayer && playerReplayedAvailable != null && mapperReplayedAvailable != null}
					<div class="centering-container" transition:fade|global>
						<h2>BeatLeader rePlayed 2023</h2>
						{#if playerReplayedAvailable || mapperReplayedAvailable}
							<div style="display: flex; gap: 1em; font-size: 1.5vh;">
								<Button label="Player rePlayed" url="/replayed/player" type="primary" on:click={() => navigate('/replayed/player')} />
								<Button label="Mapper rePlayed" url="/replayed/mapper" type="primary" on:click={() => navigate('/replayed/mapper')} />
							</div>
						{:else}
							<div class="centering-container">
								<h3>
									You don't have a rePlayed 2023 yet<br /><br />Play a song and come back next year<br />Or link your BeatSaver account if
									you're a mapper
								</h3>
							</div>
						{/if}
					</div>
				{:else if playerReplayedAvailable != null && mapperReplayedAvailable != null}
					<div class="login-form" transition:fade|global>
						<div class="title">Please log in to view your<b>rePlayed 2023</b></div>
						<form action={BL_API_URL + 'signin'} method="post">
							<input type="hidden" name="Provider" value="Steam" />
							<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/replayed'} />

							<Button icon={steamSvg} label="Log In with Steam" type="green" />
						</form>
						<br />
						<span>Quest Log In</span>
						<div class="input-container">
							<div class="cat">Login</div>
							<input bind:value={login} placeholder="Login" />
						</div>
						<div class="input-container">
							<div class="cat">Password</div>
							<input type="password" bind:value={password} placeholder="Password" />
						</div>

						<Button iconFa="fas fa-right-to-bracket" label="Log In" on:click={() => account.logIn(login, password)} />

						<div class="sorting-options">
							<span
								class="beat-savior-reveal clickable"
								class:opened={showBeatSaverLogin}
								on:click={() => (showBeatSaverLogin = !showBeatSaverLogin)}
								on:keydown={() => (showBeatSaverLogin = !showBeatSaverLogin)}
								title="Show login with BeatSaver">
								{#if showBeatSaverLogin}
									I play the game too
								{:else}
									Don't play the game but still map?
								{/if}

								<i class="fas fa-chevron-down" />
							</span>
						</div>

						{#if showBeatSaverLogin}
							<form action={BL_API_URL + 'signin'} method="post">
								<input type="hidden" name="Provider" value="BeatSaver" />
								<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/replayed/mapper'} />

								<Button icon={beatSaverSvg} label="Log In with BeatSaver" type="submit" />
							</form>
						{/if}
					</div>
				{:else}
					<div class="centering-container">
						<Spinner />
					</div>
				{/if}
			</div>
		</ContentBox>
	</article>
</section>

<MetaTags
	title="BeatLeader rePlayed 2023"
	description="View your BeatLeader rePlayed 2023"
	openGraph={{
		title: 'BeatLeader rePlayed 2023',
		description: 'View your BeatLeader rePlayed 2023',
		images: CURRENT_URL + '/assets/logo-small.png',
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: 'BeatLeader rePlayed 2023',
		description: 'View your BeatLeader rePlayed 2023',
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: 'BeatLeader rePlayed 2023',
	}} />

<style>
	.align-content {
		display: flex;
		justify-content: center !important;
	}

	:global(.main-content-replayed) {
		aspect-ratio: 9 / 14.5; /*results in ~9 / 16 for ReplayedCard*/
		padding: 0rem !important;
		max-width: 100% !important;
	}

	.page-content {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	article {
		width: 100%;
		height: 100%;
		overflow-x: visible;
	}

	.items {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow: hidden;
		text-align: center;
	}

	.items h2 {
		font-size: 2vh;
		font-weight: 700;
	}

	.items h3 {
		font-size: 1.5vh;
		font-weight: 600;
	}

	.centering-container {
		display: flex;
		width: 100%;
		height: 100%;
		justify-content: center;
		align-self: center;
		align-items: center;
		flex-direction: column;
		gap: 1em;
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
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5em;
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
