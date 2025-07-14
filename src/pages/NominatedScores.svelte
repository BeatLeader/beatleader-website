<script>
	import Spinner from '../components/Common/Spinner.svelte';
	import SongScore from '../components/Player/SongScore.svelte';
	import PlayerName from '../components/Scores/PlayerName.svelte';
	import {processScore} from '../network/clients/beatleader/scores/utils/processScore';
	import processPlayer from '../network/clients/beatleader/player/process';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import {navigate} from 'svelte-routing';
	import {dateFromUnix, formatDateRelative} from '../utils/date';

	let scores = [];

	function fetchScores() {
		fetch(`${BL_API_URL}scores/sotws`, {credentials: 'include'})
			.then(s => s.json())
			.then(s => {
				scores = s.data.map(s => {
					const result = processScore(s);
					result.score.nominations = result.score.nominations.map(n => {
						const nresult = n;
						if (nresult.player) {
							nresult.player = processPlayer(nresult.player);
						}
						return nresult;
					});
					return result;
				});
			});
	}

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	$: fetchScores();
</script>

<section class="align-content">
	<article class="page-content">
		{#if scores.length}
			{#each scores as songScore, idx ((songScore?.id ?? songScore?.score?.leaderboardId ?? '') + (songScore?.score?.timeset ?? songScore?.score?.score ?? '') + (songScore?.score?.attemptsCount ?? '') + (songScore?.timeSet ?? songScore?.player?.playerId ?? ''))}
				<div class="score-container">
					<SongScore {songScore} {idx} service="scores" withPlayers={true} additionalStats={['sotwNominations']} />
					<div class="nominations-container">
						{#each songScore.score.nominations as nomination}
							<div class="nomination">
								{#if nomination.player}
									<div class="player">
										<PlayerName
											player={nomination.player}
											on:click={() => navigateToPlayer(nomination.player.alias ?? nomination.player.playerId)} />
										<span class="timestamp">{formatDateRelative(dateFromUnix(nomination.timestamp))}</span>
									</div>
								{/if}
								<span class="nomination-description">{nomination.description ?? 'Without description'}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{:else}
			<Spinner />
		{/if}
	</article>
</section>

<style>
	.align-content {
		display: flex;
		justify-content: center;
	}

	.page-content {
		max-width: 58em;
		width: 100%;
	}

	.nomination {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 0.5em;
		background-color: #0000006b;
	}

	.player {
		background: #d100d170;
		padding: 0.5em;
		border-radius: 12px;
		display: flex;
		justify-content: space-between;
	}

	.timestamp {
		color: grey;
	}
</style>
