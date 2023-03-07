<script>
	import createScoresStore from '../../stores/http/http-scores-store.js';
	import stringify from 'json-stable-stringify';
	import SongScore from '../Player/SongScore.svelte';

	export let playerId = null;
	export let initialState = null;
	export let initialStateType = null;
	export let initialService = 'beatleader';
	export let initialServiceParams = {};
	export let numOfScores = 1;
	export let fixedBrowserTitle = null;
	export let withPlayers = false;
	export let noIcons = false;

	let scoresStore = createScoresStore(playerId, initialService, initialServiceParams, initialState, initialStateType);

	let scoresBoxEl = null;

	function changeParams(newPlayerId, newService, newServiceParams) {
		if (!newPlayerId) return null;

		scoresStore.fetch(newServiceParams, newService, newPlayerId);

		return {playerId: newPlayerId, service: newService, serviceParams: newServiceParams};
	}

	let currentService = null;
	let lastService = '';
	function updateService(scoresStore) {
		if (!scoresStore) return;

		const newService = scoresStore.getService();
		if (lastService !== newService) currentService = newService;

		lastService = newService;
	}

	let currentServiceParams = null;
	let lastServiceParams = '';
	function updateServiceParams(scoresStore) {
		if (!scoresStore) return;

		const newServiceParams = stringify(scoresStore.getServiceParams());
		if (lastServiceParams !== newServiceParams) currentServiceParams = scoresStore.getServiceParams();

		lastServiceParams = newServiceParams;
	}
	$: changeParams(playerId, initialService, initialServiceParams, initialState, initialStateType);
	$: $scoresStore, updateService(scoresStore);
	$: $scoresStore, updateServiceParams(scoresStore);

	$: scoresStore && scoresStore.fetch(currentServiceParams, currentService);
</script>

<div bind:this={scoresBoxEl}>
	{#if $scoresStore && $scoresStore.length}
		<div class="song-scores">
			{#each $scoresStore as songScore, idx ((songScore?.id ?? '') + (songScore?.score?.id ?? ''))}
				{#if idx < numOfScores}
					<SongScore
						{playerId}
						{songScore}
						{fixedBrowserTitle}
						{idx}
						service={currentService}
						{withPlayers}
						{noIcons}
						additionalStat={currentServiceParams?.sort} />
				{/if}
			{/each}
		</div>
	{:else}
		<p>No scores.</p>
	{/if}
</div>

<style>
	.song-scores :global(> *:last-child) {
		border-bottom: none !important;
	}
</style>
