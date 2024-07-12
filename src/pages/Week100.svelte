<script>
	import Confetti from 'svelte-confetti';
	import AchievementDetails from '../components/Common/Achievements/AchievementDetails.svelte';
	import Button from '../components/Common/Button.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {CURRENT_URL, BL_API_URL} from '../network/queues/beatleader/api-queue';
	import Spinner from '../components/Common/Spinner.svelte';
	import beatSaverSvg from '../resources/beatsaver.svg';
	import steamSvg from '../resources/steam.svg';
	import {fetchJson} from '../network/fetch';
	import createAccountStore from '../stores/beatleader/account';
	const account = createAccountStore();

	let achievement;
	var pollId = null;
	var achievementError = null;

	function fetchAchievement() {
		fetchJson(BL_API_URL + 'survey/week100', {credentials: 'include'})
			.then(clientInfo => {
				achievement = clientInfo.body.achievement;
				pollId = clientInfo.body.pollId;
			})
			.catch(err => {
				achievementError = err;
			});
	}

	let login;
	let password;

	$: loggedInPlayer = $account?.player;
	$: error = $account?.error ?? achievementError;
	$: message = $account?.message;
	$: loading = $account?.loading;

	$: loggedInPlayer && fetchAchievement();
</script>

<div class="week100-container">
	<img src="/assets/week100cover.webp" />
	<span class="week100-title">Ranked Week 100 Poll</span>
	<ContentBox cls="week100-box">
		<div class="big-text">
			100 batches of maps were ranked! Some of them had more maps than others, for some we made events and for some awesome arts. But we
			hope all of them were fun and interesting to play! Thanks to the team and to the mappers for your hard work, let's rank at least 100
			weeks more! ❤️

			<br /><br />
			Do you think we did well? Check out our anniversary poll where you can give feedback to almost any part of BeatLeader and help us improve
			the project for the greater good. (also we always open to feedback on Discord, so no need to wait another 100 weeks)

			<br />
		</div>
		{#if loading}
			<Spinner />
		{:else if !loggedInPlayer}
			<div class="login-form">
				<div class="tips"><br />Log in to receive achievement for the poll.</div>
				<form action={BL_API_URL + 'signin'} method="post">
					<input type="hidden" name="Provider" value="Steam" />
					<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/week100'} />

					<Button icon={steamSvg} label="Log In with Steam" type="green" />
				</form>
				<br />
				<span>or Log In with BL account from the Quest mod</span>
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

				<div class="tips">Or fill it anonimously (no achievement)</div>
				<Button
					label="Open poll"
					onlyurl={true}
					url={`https://docs.google.com/forms/d/e/1FAIpQLSeLuDxXx_bcmRAQXQI1L_jy2qsyb-U8RWfUVqazXNqNGkQmww/viewform?usp=pp_url`}
					iconFa="fas fa-square-poll-horizontal" />
			</div>
		{:else if achievement}
			<div class="details-and-confetti">
				<AchievementDetails {achievement} showDetails={false} />
				<div class="confetti-container">
					<Confetti duration={3000} x={[-0.25, -1]} y={[-1, 1]} />
					<Confetti duration={3000} x={[0.25, 1]} y={[-1, 1]} />
				</div>
			</div>

			<span
				>You received temporary "Anniversary poll participant" achievement. After validating your responses, we may upgrade your badge to
				"Anniversary helper" depending on the accuracy, completeness, and truthfulness of your responses</span>
		{:else}
			<Button
				type="green"
				label="Open poll"
				onlyurl={true}
				url={`https://docs.google.com/forms/d/e/1FAIpQLSeLuDxXx_bcmRAQXQI1L_jy2qsyb-U8RWfUVqazXNqNGkQmww/viewform?usp=pp_url&entry.919133417=${pollId}`}
				iconFa="fas fa-square-poll-horizontal" />
			<span>Filling out the poll will grant you an achievement depending on the quality of your feedback.</span>
		{/if}

		{#if error}
			<p class="error">{error}</p>
		{/if}
		{#if message}
			<p class="messagep">{message}</p>
		{/if}
	</ContentBox>
</div>

<style>
	.week100-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.week100-title {
		font-size: 3em;
		text-align: center;
	}
	img {
		max-width: 30em;
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

	:global(.week100-box) {
		max-width: 60%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3em;
	}

	@media screen and (max-width: 768px) {
		:global(.week100-box) {
			max-width: unset;
		}

		img {
			max-width: 100%;
		}
	}
</style>
