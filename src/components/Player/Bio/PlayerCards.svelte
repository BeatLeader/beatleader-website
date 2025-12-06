<script>
	import {createEventDispatcher} from 'svelte';
	import RankedMapper from './RankedMapper.svelte';
	import ClanFounder from './ClanFounder.svelte';
	import OfficialMapper from './OfficialMapper.svelte';
	import {GLOBAL_LEADERBOARD_TYPE} from '../../../utils/format';
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import Spinner from '../../Common/Spinner.svelte';

	export let playerId = null;
	export let playerInfo = null;
	export let editModel = null;
	export let profileSettings = null;

	export let onEmptyClan = () => {};
	export let onEmptyMaps = () => {};

	const dispatch = createEventDispatcher();

	let clan = null;
	let cachedPlayerId = null;

	async function fetchClan(playerId) {
		if (!playerId || playerId == cachedPlayerId) return;

		cachedPlayerId = playerId;

		const response = await fetch(`${BL_API_URL}player/${playerId}/foundedClan`, {credentials: 'include'});
		clan = !response.ok ? null : await response.json();
		if (!clan) {
			onEmptyClan();
		}
	}

	let rankedmaps = null;
	let topmap = null;
	let officialmaps = null;
	let officialtopmap = null;

	let cachedMapperId = null;
	let cachedOfficialMapperId = null;

	let sortBy = null;

	async function fetchRankedMapper(mapperId, sortBy) {
		if (cachedMapperId == mapperId) return;

		cachedMapperId = mapperId;
		const response = mapperId
			? await fetch(`${BL_API_URL}player/${mapperId}/rankedmaps?sortBy=${sortBy}&leaderboardContext=${GLOBAL_LEADERBOARD_TYPE}`)
			: null;
		rankedmaps = !response?.ok ? null : await response.json();
		if (rankedmaps) {
			topmap = rankedmaps.maps[0];
		} else {
			onEmptyMaps();
		}
	}

	async function fetchOfficialMapper(mapperId) {
		if (cachedOfficialMapperId == mapperId) return;
		cachedOfficialMapperId = mapperId;
		const response = mapperId
			? await fetch(`${BL_API_URL}player/${mapperId}/officialmaps?sortBy=${sortBy}&leaderboardContext=${GLOBAL_LEADERBOARD_TYPE}`)
			: null;
		officialmaps = !response?.ok ? null : await response.json();
		if (officialmaps) {
			officialtopmap = officialmaps.maps[0];
		}
	}

	function updateSortBy(newSortBy) {
		cachedMapperId = null;
		cachedOfficialMapperId = null;
		sortBy = newSortBy;
	}

	$: updateSortBy(editModel ? editModel?.data?.rankedMapperSort : profileSettings?.rankedMapperSort);

	$: mapperPromise = fetchRankedMapper(playerInfo?.mapperId, sortBy);
	$: officialMapperPromise = fetchOfficialMapper(playerInfo?.mapperId);
	$: clanPromise = fetchClan(playerId);

	$: promises = Promise.all([clanPromise, mapperPromise, officialMapperPromise]);
	$: promises?.then(() => {
		setInterval(() => dispatch('height-changed'), 400);
	});
</script>

{#if playerInfo}
	{#await promises}
		<Spinner />
	{:then _}
		<div id={playerId + '-player-cards'} class="cards-container">
			{#if rankedmaps || clan}
				{#if rankedmaps}
					<RankedMapper
						mapperId={playerInfo.mapperId}
						{rankedmaps}
						{topmap}
						bind:editModel
						on:sort-changed={e => {
							updateSortBy(e.detail);
						}} />
				{/if}
				{#if officialmaps}
					<OfficialMapper
						mapperId={playerInfo.mapperId}
						rankedmaps={officialmaps}
						topmap={officialtopmap}
					/>
				{/if}
				{#if clan}
					<ClanFounder {clan} />
				{/if}
			{/if}
		</div>
	{/await}
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
