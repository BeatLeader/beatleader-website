<script>
	import {createEventDispatcher} from 'svelte';
	import RankedMapper from './RankedMapper.svelte';
	import ClanFounder from './ClanFounder.svelte';
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';

	export let playerId = null;
	export let playerInfo = null;

	export let onEmptyClan = () => {};
	export let onEmptyMaps = () => {};

	const dispatch = createEventDispatcher();

	let clan = null;

	function fetchClan(playerId) {
		fetch(`${BL_API_URL}player/${playerId}/foundedClan`, {credentials: 'include'})
			.then(r => r.json())
			.then(result => {
				clan = result;

				dispatch('height-changed');
			})
			.catch(e => {
				onEmptyClan();
				clan = null;
			});
	}

	let rankedmaps = null;
	let topmap = null;

	function fetchRankedMapper(mapperId) {
		fetch(`${BL_API_URL}player/${mapperId}/rankedmaps`)
			.then(r => r.json())
			.then(response => {
				rankedmaps = response;
				topmap = rankedmaps.maps[0];

				dispatch('height-changed');
			})
			.catch(e => {
				onEmptyMaps();
				rankedmaps = null;
			});
	}

	$: playerInfo?.mapperId && fetchRankedMapper(playerInfo?.mapperId);
	$: playerId && fetchClan(playerId);
</script>

{#if playerInfo}
	<div class="cards-container">
		{#if rankedmaps || clan}
			{#if rankedmaps}
				<RankedMapper mapperId={playerInfo.mapperId} {rankedmaps} {topmap} />
			{/if}
			{#if clan}
				<ClanFounder {clan} />
			{/if}
		{/if}
	</div>
{/if}

<style>
	.cards-container {
		display: flex;
		justify-content: center;
	}
</style>
