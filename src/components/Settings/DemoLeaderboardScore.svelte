<script>
	import createScoresStore from '../../stores/http/http-scores-store.js';
	import createLeaderboardStore from '../../stores/http/http-leaderboard-store';
	import createAccountStore from '../../stores/beatleader/account';
	import stringify from 'json-stable-stringify';
	import SongScore from '../Player/SongScore.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import {getContext} from 'svelte';
	import {writable} from 'svelte/store';
	import Score from '../Leaderboard/Score.svelte';

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

	let leaderboardStore = null;

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

	$: leaderboardId = $scoresStore?.[0]?.leaderboard?.leaderboardId;
	$: if (leaderboardId) {
		let rank = $scoresStore?.[0]?.score?.rank ?? 1;
		let page = Math.ceil((rank - 1) / 5);
		if (page < 1) page = 1;
		leaderboardStore = createLeaderboardStore(leaderboardId, 'global', page, {count: 5});
	}
	$: modifiers = leaderboardStore && $leaderboardStore ? $leaderboardStore?.leaderboard?.difficultyBl?.modifierValues ?? null : null;
	$: scores =
		leaderboardStore && $leaderboardStore?.scores?.length
			? $leaderboardStore.scores.map(s => ({
					...s,
					score: {
						...s?.score,
						mods: ['TE', 'ST'],
					},
					leaderboard: $leaderboardStore.leaderboard,
			  }))
			: null;
</script>

<div class="leaderboard">
	<div class="scores-grid">
		{#if scores}
			<div class="song-scores" class:demo={$isDemo}>
				{#each scores as score}
					<Score
						{leaderboardId}
						{score}
						type="global"
						{modifiers}
						highlight={score?.player?.playerId === $account?.id}
						opened={false}
						{selectedMetric}
						on:badge-click />
				{/each}
			</div>
		{:else}
			<Spinner />
		{/if}
	</div>
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
