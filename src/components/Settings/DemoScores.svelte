<script>
	import createScoresStore from '../../stores/http/http-scores-store.js';
	import createAccountStore from '../../stores/beatleader/account';
	import stringify from 'json-stable-stringify';
	import SongScore from '../Player/SongScore.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {getContext} from 'svelte';
	import {writable} from 'svelte/store';

	export let playerId = null;
	export let initialService = 'beatleader';
	export let initialServiceParams = {sort: 'pp', page: 1, count: 1};
	export let numOfScores = 1;
	export let fixedBrowserTitle = null;
	export let withPlayers = false;
	export let noIcons = false;
	export let selectedMetric = null;

	const isDemo = getContext('isDemo') ?? writable(false);

	const account = createAccountStore();

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
	$: if (
		(!$account.loading && !$account?.id) ||
		(playerId?.length && !$scoreIsLoading && scoresStore?.getPlayerId() === playerId && !$scoresStore?.length)
	)
		playerId = '76561199104169308';

	$: songScore =
		$scoresStore?.reduce((acc, s) => {
			if (s?.score) {
				s.score.myScore = {score: {}};
				[
					'acc',
					'accLeft',
					'accRight',
					'pp',
					'ppWeighted',
					'badCuts',
					'bombCuts',
					'missedNotes',
					'pauses',
					'rank',
					'totalRank',
					'wallsHit',
					'score',
					'mods',
					'accPP',
					'passPP',
					'techPP',
					'badCuts',
					'fcAccuracy',
					'fcPp',
					'fullCombo',
					'maxCombo',
					'maxStreak',
					'missedNotes',
					'percentage',
					'replaysWatched',
					'timeSet',
					'timeset',
					'wallsHit',
				].forEach(k => (s.score.myScore.score[k] = s.score[k]));
			}

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
		<div class="song-scores" class:demo={$isDemo}>
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

	.song-scores.demo :global(.player-performance-badges:not(.not-demo) *) {
		cursor: pointer !important;
	}

	.song-scores.demo :global(.player-performance-badges:not(.not-demo) .badge) {
		transition: opacity 200ms;
	}

	.song-scores.demo :global(.player-performance-badges:not(.not-demo) .badge:hover) {
		opacity: 0.85;
		outline: 2px dashed var(--textColor);
	}
</style>
