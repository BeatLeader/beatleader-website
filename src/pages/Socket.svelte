<script>
	import SongScore from '../components/Player/SongScore.svelte';
	import {processScore} from '../network/clients/beatleader/scores/utils/processScore';

	let scores = [];

	const socket = new WebSocket('wss://api.beatleader.xyz/scores');

	socket.addEventListener('message', message => {
		scores.unshift(processScore(JSON.parse(message.data)));
		scores = scores;
	});
</script>

<div>
	<div class="song-scores grid-transition-helper">
		{#each scores as songScore, idx ((songScore?.id ?? '') + (songScore?.score?.id ?? ''))}
			<SongScore playerId={songScore.player.id} {songScore} {idx} service="BeatLeader" withPlayers="true" />
		{/each}
	</div>
</div>

<style>
	.song-scores :global(> *:last-child) {
		border-bottom: none !important;
	}
</style>
