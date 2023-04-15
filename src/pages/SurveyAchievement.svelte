<script>
	import Button from '../components/Common/Button.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import {opt} from '../utils/js';
	import {CURRENT_URL, BL_API_URL} from '../network/queues/beatleader/api-queue';
	import Spinner from '../components/Common/Spinner.svelte';
	import beatSaverSvg from '../resources/beatsaver.svg';
	import steamSvg from '../resources/steam.svg';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {fetchJson} from '../network/fetch';
	import AchievementDetails from '../components/Common/Achievements/AchievementDetails.svelte';
	import {Confetti} from 'svelte-confetti';
	import ssrConfig from '../ssr-config';

	const account = createAccountStore();

	let achievement;
	var achievementError = null;
	var showLink = false;

	function fetchAchievement() {
		fetchJson(BL_API_URL + 'survey/achievement', {credentials: 'include'})
			.then(clientInfo => {
				achievement = clientInfo.body;
			})
			.catch(err => {
				if (err.response.status == 404) {
					achievementError = 'Please complete the survey first!';
					showLink = true;
				} else {
					achievementError = err;
				}
			});
	}

	let login;
	let password;

	$: loggedInPlayer = opt($account, 'player');
	$: error = opt($account, 'error') ?? achievementError;
	$: message = opt($account, 'message');
	$: loading = opt($account, 'loading');

	$: loggedInPlayer && fetchAchievement();
</script>

<svelte:head>
	<title>{ssrConfig.name} - 2023 Census Achievement</title>
</svelte:head>

<ContentBox cls="login-container login-page">
	<div class="survey-achievement">
		<span class="subtext">2023 Census of Beat Saber Users</span>
		<div class="survey-header">
			<img class="bl-icon" src="/assets/favicon.svg" />
			<i class="fa-solid fa-xmark" />
			<img class="berkeley-icon" src="/assets/berkeley.svg" />
		</div>

		<div class="title">Thank you for your contribution!</div>

		<span
			>Your responses will have a meaningful impact on the Beat Saber modding community, in addition to advancing public knowledge on
			safety, usability, and data security/privacy in VR.
		</span>

		{#if loading}
			<Spinner />
		{:else if !loggedInPlayer}
			<div class="tips">Log in to receive achievement.</div>
			<div class="input-container">
				<div class="cat">Login</div>
				<input bind:value={login} placeholder="Login (may differ from username)" />
			</div>
			<div class="input-container">
				<div class="cat">Password</div>
				<input type="password" bind:value={password} placeholder="Password" />
			</div>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<Button iconFa="fas fa-plus-square" label="Login" on:click={() => account.logIn(login, password, window.location.search)} />
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
		{:else if achievement}
			<div class="details-and-confetti">
				<AchievementDetails {achievement} showDetails={false} />
				<div class="confetti-container">
					<Confetti duration={3000} x={[-0.25, -1]} y={[-1, 1]} />
					<Confetti duration={3000} x={[0.25, 1]} y={[-1, 1]} />
				</div>
			</div>

			<span
				>You received temporary "Research Participant" achievement. After validating your responses, we may upgrade your badge to "Research
				Contributor" or "Research Hero" depending on the accuracy, completeness, and truthfulness of your responses</span>
		{/if}

		{#if error}
			<p class="error">{error}</p>
		{/if}
		{#if message}
			<p class="messagep">{message}</p>
		{/if}
		{#if showLink}
			<a href="https://berkeley.qualtrics.com/jfe/form/SV_6Yx1ja9WNGCxYVM">Go to survey</a>
		{/if}
	</div>
</ContentBox>

<style>
	span {
		margin-left: 1em;
		margin-right: 1em;
	}

	.survey-header {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: row;
		grid-gap: 1em;
	}

	.bl-icon {
		width: 10em;
		height: 10em;
	}

	.berkeley-icon {
		width: 7em;
		height: 7em;
		box-shadow: rgb(3 0 89 / 71%) 0 0 1.2em;
		border-radius: 50%;
		margin: 1.5em;
	}

	.fa-xmark {
		font-size: 2.5em;
	}

	.survey-achievement {
		max-width: 40em;
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
	.title {
		margin-top: -1em;
	}
	.subtext {
		font-size: 0.8em;
		margin-bottom: -3.3em;
		color: gray;
	}
	.details-and-confetti {
		position: relative;
		display: flex;
	}
	.confetti-container {
		position: absolute;
		display: flex;
		justify-content: space-between;
		align-items: center;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}
</style>
