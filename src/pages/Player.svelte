<script>
	import {onMount} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import createPlayerInfoWithScoresStore from '../stores/http/http-player-with-scores-store';
	import createAccSaberService from '../services/accsaber';
	import createPinnedScoresStore from '../stores/beatleader/pinned-scores';
	import createStatsHistoryStore from '../stores/beatleader/stats-history';
	import editModel from '../stores/beatleader/profile-edit-model';
	import {configStore} from '../stores/config';
	import {capitalize} from '../utils/js';
	import ssrConfig from '../ssr-config';
	import processPlayerData from '../components/Player/utils/profile';
	import {SsrHttpNotFoundError, SsrHttpUnprocessableEntityError} from '../network/errors';
	import createServiceParamsManager from '../components/Player/utils/service-param-manager';
	import eventBus from '../utils/broadcast-channel-pubsub';
	import Profile from '../components/Player/Profile.svelte';
	import Scores from '../components/Player/Scores.svelte';
	import MiniRankings from '../components/Ranking/MiniRankings.svelte';
	import AccSaberMiniRanking from '../components/Ranking/AccSaberMini.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import CardsCarousel from '../components/Player/CardsCarousel.svelte';
	import PinnedScores from '../components/Player/PinnedScores.svelte';
	import keyValueRepository from '../db/repository/key-value';
	import PlayerMeta from '../components/Player/PlayerMeta.svelte';
	import Achievements from '../components/Player/Achievements.svelte';
	import RandomRain from '../components/Common/RandomRain.svelte';
	import BioCarousel from '../components/Player/Bio/BioCarousel.svelte';
	import PlayerCards from '../components/Player/Bio/PlayerCards.svelte';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import {fetchJson} from '../network/fetch';

	const STORE_SORTING_KEY = 'PlayerScoreSorting';
	const STORE_ORDER_KEY = 'PlayerScoreOrder';

	export let initialPlayerId = null;
	export let initialParams = null;
	export let location = null;

	let service = null;
	let serviceParams = null;

	const serviceParamsManager = createServiceParamsManager(initialPlayerId);
	const pinnedScoresStore = createPinnedScoresStore();
	const statsHistoryStore = createStatsHistoryStore();

	processInitialParams(initialPlayerId, initialParams);

	let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, service, serviceParams);

	async function changeParams(newPlayerId, service, newServiceParams) {
		if (!newPlayerId) return;
		serviceParams = newServiceParams;
		if (!playerStore || newPlayerId !== playerStore.getPlayerId() || service !== playerStore.getService()) {
			document.body.scrollIntoView({behavior: 'smooth'});
			playerStore.fetch(newPlayerId, service, newServiceParams);
		} else {
			playerStore.setService(service);
			playerStore.setServiceParams(newServiceParams);
		}
	}

	async function refreshSavedParams() {
		let params = serviceParamsManager.getParams();
		const scoresSortOptions = configStore.get('preferences').scoresSortOptions;
		if (scoresSortOptions === 'last') {
			const sortingOption = localStorage.getItem(STORE_SORTING_KEY) ?? 'pp';
			if (sortingOption) {
				params.sort = sortingOption;
			}
			const orderOption = localStorage.getItem(STORE_ORDER_KEY) ?? 'desc';
			if (orderOption) {
				params.order = orderOption;
			}
		} else {
			params.sort = scoresSortOptions;
		}

		changeParams(currentPlayerId, serviceParamsManager.getService(), params);
	}

	function processInitialParams(playerId, params) {
		if (playerId !== $playerStore?.playerId) serviceParamsManager.clearServiceParams();

		const serviceInfo = serviceParamsManager.initFromUrl(params);

		if (!params || !params.length) {
			refreshSavedParams();
		}

		service = serviceInfo.service;
		serviceParams = serviceInfo.params;

		return {service, serviceParams};
	}

	const accSaberService = createAccSaberService();

	function updateUrl() {
		changeParams(currentPlayerId, serviceParamsManager.getService(), serviceParamsManager.getParams());
		window.history.pushState({}, '', `/u/${currentPlayerId}/${serviceParamsManager.getCurrentServiceUrl()}`);
	}

	function onPageChanged(event) {
		let newPage = event?.detail ?? null;
		if (!newPage) return;

		if (!Number.isFinite(newPage)) newPage = 1;

		serviceParamsManager.update({page: newPage});
		updateUrl();
	}

	function onServiceChanged(event) {
		const newService = event?.detail ?? null;
		if (!newService) return;

		if (newService !== serviceParamsManager.getService()) serviceParamsManager.clearServiceParams();

		serviceParamsManager.update({}, newService);
		updateUrl();
	}

	function onServiceParamsChanged(event) {
		const newServiceParams = event?.detail ?? null;
		if (!newServiceParams) return;

		serviceParamsManager.update(newServiceParams);
		updateUrl();
	}

	let avatarHash = '';
	async function onPlayerDataUpdated() {
		if (playerStore) {
			await playerStore.refresh();

			// force refresh avatar url
			avatarHash = (Math.random() * 100000).toString();
		}
	}

	let achievements = [];
	function fetchAchievements(playerId) {
		fetchJson(BL_API_URL + `player/${playerId}/achievements`)
			.then(clientInfo => {
				achievements = clientInfo.body;
			})
			.catch(() => {});
	}

	let horizontalRichBio = false;
	function updateHorizontalRichBio(value) {
		horizontalRichBio = value;
		if ($editModel) {
			$editModel.data.horizontalRichBio = value;
		}
	}

	let innerWidth = 0;
	let innerHeight = 0;

	$: document.body.scrollIntoView({behavior: 'smooth'});

	$: processInitialParams(initialPlayerId, initialParams);
	$: changeParams(initialPlayerId, service, serviceParams);

	$: paramsStore = playerStore ? playerStore.params : null;

	$: currentPlayerId = $paramsStore.currentPlayerId;

	$: playerIsLoading = playerStore ? playerStore.isLoading : null;
	$: playerError = playerStore ? playerStore.error : null;
	$: skeleton = !$playerStore && $playerIsLoading;
	$: browserTitle = `${$playerStore?.name ?? 'Player'} / ${serviceParamsManager
		.getCurrentServiceUrl()
		?.split('/')
		.map(s => capitalize(s))
		.join(' / ')} - ${ssrConfig.name}`;

	$: playerData = $playerStore;
	$: playerId = playerData?.playerId ?? null;
	$: ({playerInfo, scoresStats, _, ssBadges} = processPlayerData(playerData));

	let scoresPlayerId = null;
	let scoresState = null;

	$: if ($playerStore && !$playerIsLoading) {
		if (scoresPlayerId && scoresPlayerId === currentPlayerId) {
			scoresState = null;
		} else {
			scoresState = $playerStore?.scores ?? null;
		}

		scoresPlayerId = currentPlayerId;
	}
	$: accSaberAvailable = accSaberService.isDataForPlayerAvailable(playerData);
	$: $playerStore?.playerInfo && updateHorizontalRichBio($playerStore?.playerInfo.horizontalRichBio);

	$: rank = $playerStore?.playerInfo.rank;
	$: country = $playerStore?.playerInfo.country.country;
	$: countryRank = $playerStore?.playerInfo.country.rankValue ?? $playerStore?.playerInfo.country.rank;

	$: playerId && fetchAchievements(playerId);
	$: pinnedScoresStore.fetchScores(playerData?.playerId);
	$: statsHistoryStore.fetchStats(playerData, $configStore.preferences.daysOfHistory);

	$: editing = new URLSearchParams(location?.search).get('edit') ?? null;
</script>

<svelte:head>
	<title>{browserTitle}</title>
</svelte:head>

<svelte:window bind:innerWidth bind:innerHeight />

{#if playerInfo?.clans?.filter(cl => cl.tag == 'SOUP').length}
	<RandomRain />
{/if}

<section class="align-content player-page" transition:fade|global>
	<article class="page-content">
		{#if $playerError && ($playerError instanceof SsrHttpNotFoundError || $playerError instanceof SsrHttpUnprocessableEntityError)}
			<ContentBox>
				<p class="error">Player not found.</p>
			</ContentBox>
		{:else}
			<Profile
				playerData={$playerStore}
				isLoading={$playerIsLoading}
				error={$playerError}
				{skeleton}
				on:player-data-updated={onPlayerDataUpdated}
				{avatarHash}
				fixedBrowserTitle={browserTitle}
				startEditing={editing} />

			<BioCarousel
				{playerId}
				{playerInfo}
				profileSettings={playerData?.profileSettings}
				bind:editModel={$editModel}
				on:horizontalRichBio-changed={event => {
					updateHorizontalRichBio(event.detail);
				}} />

			{#if !$editModel}
				{#if $configStore.profileParts.graphs}
					<CardsCarousel {playerId} {playerInfo} {scoresStats} {playerData} />
				{/if}
				{#if $configStore.profileParts.pinnedScores}
					<PinnedScores {pinnedScoresStore} {playerId} fixedBrowserTitle={browserTitle} scoresStats={playerData?.scoreStats} />
				{/if}
			{/if}

			{#if playerId}
				<ContentBox>
					<Scores
						{playerId}
						player={$playerStore}
						initialState={scoresState}
						initialStateType={playerStore && $playerStore ? playerStore.getStateType() : 'initial'}
						initialService={$paramsStore.currentService}
						initialServiceParams={$paramsStore.currentServiceParams}
						numOfScores={$playerStore?.scoreStats?.totalPlayCount ?? null}
						on:service-changed={onServiceChanged}
						on:service-params-changed={onServiceParamsChanged}
						on:page-changed={onPageChanged}
						fixedBrowserTitle={browserTitle} />
				</ContentBox>
			{/if}
		{/if}
	</article>

	{#if innerWidth > 1749 && ($configStore.profileParts.globalMiniRanking || $configStore.profileParts.countryMiniRanking || $configStore.profileParts.friendsMiniRanking || $configStore.profileParts.achievements)}
		<aside>
			<MiniRankings {rank} {country} {countryRank} box={true} />

			{#if $configStore.profileParts.globalMiniRanking || $configStore.profileParts.countryMiniRanking}
				{#await accSaberAvailable}
					Loading...
				{:then accSaberAvailable}
					{#if accSaberAvailable}
						<ContentBox>
							<AccSaberMiniRanking {playerId} category="overall" numOfPlayers={5} />
						</ContentBox>
					{/if}
				{/await}
			{/if}
			<!-- `serviceParams` here is just to force Svelte always update this block -->
			{#if serviceParams && ((!playerInfo?.richBioTimeset && !$editModel) || horizontalRichBio)}
				<ContentBox cls="player-cards-box">
					<PlayerCards {playerId} {playerInfo} profileSettings={playerData?.profileSettings} bind:editModel={$editModel} />
				</ContentBox>
			{/if}
			{#if achievements?.length && $configStore.profileParts.achievements}
				<ContentBox>
					<Achievements {achievements} />
				</ContentBox>
			{/if}

			{#if playerInfo?.clans?.filter(cl => cl.tag == 'FELA').length}
				<ContentBox>
					<div style="display: flex; width: 100%; height: 100%; justify-content: center;">
						<iframe
							width="100%"
							style="aspect-ratio: 16/9;"
							src="https://www.youtube-nocookie.com/embed/REGXZZ67F_k?si=b4lLpGGYeIZ8kRb8"
							title="YouTube video player"
							frameborder="0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							allowfullscreen />
					</div>
				</ContentBox>
			{/if}
		</aside>
	{/if}
</section>
<PlayerMeta {playerStore} />

<style>
	.align-content {
		display: flex;
		justify-content: center;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
		overflow: inherit;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	aside {
		width: 25em;
	}

	aside .box {
		padding: 0;
		margin-bottom: 1em;
	}

	button {
		cursor: pointer;
		min-width: 2rem;
		margin-right: 0.5rem;
	}

	:global(.player-cards-box:has(.cards-container:empty)) {
		display: none;
	}

	:global(.player-cards-box .cards-container) {
		flex-direction: column;
	}

	@media screen and (max-width: 1749px) {
		article {
			width: 100%;
		}
	}
</style>
