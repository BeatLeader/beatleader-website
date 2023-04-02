<script>
	import {setContext} from 'svelte';
	import createScoresStore from '../../stores/http/http-scores-store.js';
	import stringify from 'json-stable-stringify';
	import SongScore from '../Player/SongScore.svelte';
	import Spinner from '../Common/Spinner.svelte';

	export let playerId = null;
	export let initialService = 'beatleader';
	export let initialServiceParams = {sort: 'pp', page: 1, count: 1};
	export let numOfScores = 1;
	export let fixedBrowserTitle = null;
	export let withPlayers = false;
	export let noIcons = false;
	export let selectedMetric = null;

	setContext('isDemo', true);

	let scoresStore = createScoresStore(playerId, initialService, initialServiceParams);
	let scoreIsLoading = scoresStore.isLoading;

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

	$: changeParams(playerId, initialService, initialServiceParams);
	$: $scoresStore, updateService(scoresStore);
	$: $scoresStore, updateServiceParams(scoresStore);

	$: scoresStore && scoresStore.fetch(currentServiceParams, currentService);
	$: if (playerId?.length && !$scoreIsLoading && scoresStore?.getPlayerId() === playerId && !$scoresStore?.length)
		playerId = '76561199104169308';

	$: songScore =
		$scoresStore?.reduce((acc, s) => {
			if (!s?.score?.scoreImprovement) return s;

			// demo score improvements
			['accuracy', 'accLeft', 'accRight', 'pp', 'totalPp'].forEach(k => (s.score.scoreImprovement[k] = 1.23));
			['badCuts', 'bombCuts', 'missedNotes', 'pauses', 'rank', 'totalRank', 'wallsHit'].forEach(k => (s.score.scoreImprovement[k] = -1));
			s.score.scoreImprovement.score = 123;
			s.score.mods = ['TE', 'ST'];

			return s;
		}, null) ?? null;
</script>

<div>
	{#if songScore}
		<div class="song-scores">
			<SongScore
				{playerId}
				{songScore}
				{fixedBrowserTitle}
				service={currentService}
				{withPlayers}
				{noIcons}
				animationSign={0}
				{selectedMetric}
				on:badge-click />
		</div>
	{:else}
		<Spinner />
	{/if}
</div>

<style>
	.song-scores {
		border: 3px dashed var(--textColor);
		padding: 0.5rem;
	}

	.song-scores :global(> *:last-child) {
		border-bottom: none !important;
	}

	.song-scores :global(.player-performance-badges *) {
		cursor: pointer !important;
	}

	.song-scores :global(.player-performance-badges .badge) {
		transition: opacity 200ms;
	}

	.song-scores :global(.player-performance-badges .badge:hover) {
		opacity: 0.85;
		outline: 2px dashed var(--textColor);
	}
</style>
