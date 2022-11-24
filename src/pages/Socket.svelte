<script>
	import Pager from '../components/Common/Pager.svelte';
	import SongScore from '../components/Player/SongScore.svelte';
	import {processScore} from '../network/clients/beatleader/scores/utils/processScore';
	import {BL_SOCKET_URL} from '../network/queues/beatleader/api-queue';

	let scores = [];
	let page = 0;
	let itemsPerPage = 10;
	let itemsPerPageValues = [5, 10, 20];
	let totalItems = 0;

	const socket = new WebSocket(BL_SOCKET_URL + 'scores');

	socket.addEventListener('message', message => {
		scores.unshift(processScore(JSON.parse(message.data)));
		scores = scores;
		totalItems = scores.length;
	});

	function onPageChanged(event) {
		page = event.detail.page;
	}
</script>

<div>
	{#if totalItems}
		<div class="song-scores grid-transition-helper">
			{#each scores.slice(totalItems > itemsPerPage ? page * itemsPerPage : 0, (page + 1) * itemsPerPage < totalItems ? (page + 1) * itemsPerPage : totalItems) as songScore, idx ((songScore?.id ?? '') + (songScore?.score?.id ?? ''))}
				<SongScore playerId={songScore.player.id} {songScore} {idx} service="BeatLeader" withPlayers="true" />
			{/each}
		</div>
	{:else}
		Waiting for someone's score.
	{/if}

	{#if scores.length > itemsPerPage}
		<Pager bind:currentPage={page} bind:itemsPerPage {totalItems} {itemsPerPageValues} on:page-changed={onPageChanged} />
	{/if}
</div>

<style>
	.song-scores :global(> *:last-child) {
		border-bottom: none !important;
	}
</style>
