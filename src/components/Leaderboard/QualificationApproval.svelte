<script>
	import {fade, slide} from 'svelte/transition';

	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import beatSaverSvg from '../../resources/beatsaver.svg';
	import Button from '../Common/Button.svelte';

	export let leaderboard;
	export let account;

	let approved = leaderboard?.qualification?.mapperAllowed;
	let error;
	let showDetails;

	function approve(leaderboardId) {
		fetch(BL_API_URL + 'user/approveQualification?leaderboardId=' + leaderboardId, {
			credentials: 'include',
		}).then(async response => {
			if (response.status == 200) {
				approved = true;
			} else {
				error = await response.text();
			}
		});
	}

	$: currentMapperId = $account.player ? $account.player.playerInfo.mapperId : null;
</script>

<div transition:fade>
	{#if !approved}
		<div class="title-box">
			Hai hai {leaderboard?.song.levelAuthorName}, your map made such an impression on our community that we wanted to rank it!🎉<br />
			This means either players or RT pushed it so hard that it made it to your eyes ^u^<br />
			Great job!<br />
		</div>

		<div class="title-box">
			Are you OK with it becoming ranked?<br />
			<div class="score-options-section">
				<span
					class="beat-savior-reveal clickable"
					class:opened={showDetails}
					on:click={() => (showDetails = !showDetails)}
					title="Details for ranked status for map">
					{#if showDetails}
						(understandable)
					{:else}
						(what does it imply)
					{/if}

					<i class="fas fa-chevron-down" />
				</span>
			</div>
		</div>

		{#if showDetails}
			<div transition:slide class="tab title-box">
				Ranking means players will be receiving PP from your map. And probably putting a lot of effort in improving on it.<br />
				After your map is ranked - please don't remove or update it on the BeatSaver.<br />
				Doing so will make the ranked leaderboard impossible to score on for new players which will bar you from ranking future maps<br />
				More details <a href="https://github.com/BeatLeader/Ranking-Criteria/wiki#restrictions">here</a>
			</div>
		{/if}

		{#if currentMapperId && currentMapperId == leaderboard?.song.mapperId}
			<div class="title-box">
				<Button iconFa="fas fa-check" label="Approve" type="submit" on:click={() => approve(leaderboard.leaderboardId)} />
			</div>
		{:else if !currentMapperId}
			<form class="title-box" action={BL_API_URL + 'signin/approve?leaderboardId=' + leaderboard.leaderboardId} method="post">
				<input type="hidden" name="ReturnUrl" value={location.href} />

				<Button icon={beatSaverSvg} label="Login with BeatSaver to approve" type="submit" />
			</form>
		{:else}
			<div class="title-box">
				You are not <b>{leaderboard?.song.levelAuthorName}</b>!<br />
				Please share this link with <b>{leaderboard?.song.levelAuthorName}</b>.
			</div>
		{/if}
	{:else if currentMapperId && currentMapperId == leaderboard?.song.mapperId}
		<div class="title-box">
			Thank you!<br />
			The map will soon enter qualifications assuming all other requirements are met 🎉<br />
		</div>
	{/if}

	{#if error}
		<span style="color: red;"> {error} </span>
	{/if}
</div>

<style>
	.title-box {
		margin: 1em;
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

	.score-options-section {
		display: grid;
		color: cyan;
		margin: 0.3em;
	}
</style>
