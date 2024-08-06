<script>
	import {createEventDispatcher} from 'svelte';
	import RankedMapper from './RankedMapper.svelte';
	import ClanFounder from './ClanFounder.svelte';
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';

	export let playerId = null;
	export let playerInfo = null;
	export let editModel = null;
	export let profileSettings = null;

	export let onEmptyClan = () => {};
	export let onEmptyMaps = () => {};

	const dispatch = createEventDispatcher();

	let clan = null;
	let cachedPlayerId = null;

	function fetchClan(playerId) {
		if (!playerId || playerId == cachedPlayerId) return;
		cachedPlayerId = playerId;
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
	let cachedMapperId = null;

	function fetchRankedMapper(mapperId, profileSettings, editModel) {
		if (!mapperId) {
			onEmptyMaps();
			return;
		}
		if (cachedMapperId == mapperId) return;
		cachedMapperId = mapperId;
		fetch(
			`${BL_API_URL}player/${mapperId}/rankedmaps?sortBy=${
				editModel ? editModel?.data?.rankedMapperSort : profileSettings?.rankedMapperSort
			}`
		)
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

	$: fetchRankedMapper(playerInfo?.mapperId, profileSettings, editModel);
	$: fetchClan(playerId);
</script>

{#if playerInfo}
	<div id={playerId + '-player-cards'} class="cards-container">
		{#if rankedmaps || clan}
			{#if rankedmaps}
				<RankedMapper mapperId={playerInfo.mapperId} {rankedmaps} {topmap} bind:editModel />
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
		flex-wrap: wrap;
		gap: 0.5em;
	}

	@media screen and (max-width: 767px) {
		.cards-container {
			flex-direction: column;
		}
	}
</style>
