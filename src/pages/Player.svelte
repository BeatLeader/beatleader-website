<script>
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
	import Profile from '../components/Player/Profile.svelte';
	import Scores from '../components/Player/Scores.svelte';
	import MiniRankings from '../components/Ranking/MiniRankings.svelte';
	import AccSaberMiniRanking from '../components/Ranking/AccSaberMini.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import CardsCarousel from '../components/Player/CardsCarousel.svelte';
	import PinnedScores from '../components/Player/PinnedScores.svelte';
	import PlayerMeta from '../components/Player/PlayerMeta.svelte';
	import Achievements from '../components/Player/Achievements.svelte';
	import RandomRain from '../components/Common/RandomRain.svelte';
	import BioCarousel from '../components/Player/Bio/BioCarousel.svelte';
	import PlayerCards from '../components/Player/Bio/PlayerCards.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import {fetchJson} from '../network/fetch';
	import {toggleRandomImageOnHover} from '../utils/clans';
	import {getContext} from 'svelte';
	import {produce} from 'immer';
	import BeatTheHeatCongratulation from '../components/Player/BeatTheHeatCongratulation.svelte';
	import AdoventCongratulation from '../components/Player/AdoventCongratulation.svelte';

	const STORE_SORTING_KEY = 'PlayerScoreSorting';
	const STORE_ORDER_KEY = 'PlayerScoreOrder';

	export let initialPlayerId = null;
	export let initialParams = null;
	export let location = null;

	let service = null;
	let serviceParams = null;

	const serviceParamsManager = createServiceParamsManager();
	const pinnedScoresStore = createPinnedScoresStore();
	const statsHistoryStore = createStatsHistoryStore();
	const account = createAccountStore();
	const {open, close} = getContext('simple-modal');

	function processInitialParams(params) {
		const serviceInfo = serviceParamsManager.initFromUrl(params);

		if (!params || !params.length) {
			refreshSavedParams();
		}

		service = serviceInfo.service;
		serviceParams = serviceInfo.params;
	}
	processInitialParams(initialParams);

	let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, service, serviceParams);

	async function changeParams(newPlayerId, service, newServiceParams) {
		if (!newPlayerId || !playerStore) return;
		serviceParams = newServiceParams;
		if (!playerStore || newPlayerId !== playerStore.getPlayerId() || service !== playerStore.getService()) {
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

	const accSaberService = createAccSaberService();

	function setUrlValue(replace) {
		let prefix = '/u/' + playerAlias;
		let servicePath = serviceParamsManager.getCurrentServiceUrl();

		const url = servicePath.length ? `${prefix}/${servicePath}` : prefix;
		if (replace) {
			window.history.replaceState({}, '', url);
		} else {
			window.history.pushState({}, '', url);
		}
	}

	function updateUrl(replace) {
		changeParams(currentPlayerId, serviceParamsManager.getService(), serviceParamsManager.getParams());
		setUrlValue(replace);
	}

	function onNewPlayerId(playerId) {
		if (currentPlayerId === playerId) return;

		currentPlayerId = playerId;
		updateUrl(true);
		document.body.scrollIntoView({behavior: 'smooth'});
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
		achievements = [];
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
	let playerPage = null;

	let legacy = false;
	function fetchLegacyStatus() {
		legacy = false;
		fetch(`${BL_API_URL}player/legacygame`, {credentials: 'include'})
			.then(d => d.text())
			.then(r => {
				legacy = r == 'true';
			});
	}

	function showBeatTheHeatCongratulation(isMain, achievements, beatTheHeatShown) {
		if (!isMain) return;
		if (beatTheHeatShown) return;
		const achievement = achievements.find(a => a.achievementDescriptionId == 5);
		if (!achievement) return;

		open(BeatTheHeatCongratulation, {
			achievement,
			confirm: () => {
				close();
				$configStore = produce($configStore, draft => {
					draft.preferences.beatTheHeatShown = true;
				});
			},
			cancel: () => {
				close();
				$configStore = produce($configStore, draft => {
					draft.preferences.beatTheHeatShown = true;
				});
			},
		});
	}

	function showAdoventCongratulation(isMain, achievements, adoventShown) {
		if (!isMain) return;
		if (adoventShown) return;
		const achievement = achievements.find(a => a.achievementDescriptionId == 6);
		if (!achievement) return;
		open(AdoventCongratulation, {
			achievement,
			confirm: () => {
				close();
				$configStore = produce($configStore, draft => {
					draft.preferences.adoventShown = true;
				});
			},
			cancel: () => {
				close();
				$configStore = produce($configStore, draft => {
					draft.preferences.adoventShown = true;
				});
			},
		});
	}

	$: paramsStore = playerStore ? playerStore.params : null;

	$: currentPlayerId = $paramsStore.currentPlayerId;
	$: onNewPlayerId(initialPlayerId);

	$: playerIsLoading = playerStore ? playerStore.isLoading : null;
	$: playerError = playerStore ? playerStore.error : null;
	$: skeleton = !$playerStore && $playerIsLoading;
	$: browserTitle = `${$playerStore?.name ?? 'Player'} / ${serviceParamsManager
		.getCurrentServiceUrl()
		?.split('/')
		.map(s => capitalize(s))
		.join(' / ')} - ${ssrConfig.name}`;

	$: playerData = $playerStore;
	$: playerAlias = playerData?.alias ?? playerData?.playerId;
	$: playerAlias && setUrlValue(true);
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

		if (playerId != currentPlayerId && $paramsStore.currentService == 'accsaber') {
			scoresState = null;
		}

		scoresPlayerId = currentPlayerId;
	}

	$: accSaberAvailable = accSaberService.isDataForPlayerAvailable(playerData);
	$: $playerStore?.playerInfo && updateHorizontalRichBio($playerStore?.playerInfo.horizontalRichBio);
	$: isMain = playerId && $account?.id === playerId;
	$: isMain && fetchLegacyStatus();

	$: rank = $playerStore?.playerInfo.rank;
	$: country = $playerStore?.playerInfo.country.country;
	$: countryRank = $playerStore?.playerInfo.country.rankValue ?? $playerStore?.playerInfo.country.rank;

	$: playerId && fetchAchievements(playerId);
	$: pinnedScoresStore.fetchScores(playerData?.playerId);
	$: statsHistoryStore.fetchStats(playerData, $configStore.preferences.daysOfHistory);
	$: showBeatTheHeatCongratulation(isMain, achievements, $configStore.preferences.beatTheHeatShown);
	$: showAdoventCongratulation(isMain, achievements, $configStore.preferences.adoventShown);

	$: editing = new URLSearchParams(location?.search).get('edit') ?? null;
	$: playerPage && toggleRandomImageOnHover(playerPage, playerInfo?.clans?.filter(cl => cl.tag == 'SABA').length);
</script>

<svelte:head>
	<title>{browserTitle}</title>
</svelte:head>

<svelte:window bind:innerWidth bind:innerHeight />

{#if playerInfo?.clans?.filter(cl => cl.tag == 'SOUP').length}
	<RandomRain />
{/if}

<section class="align-content player-page" transition:fade|global>
	<article class="page-content" bind:this={playerPage}>
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
				{#if isMain && legacy}
					<ContentBox cls="legacy-warning">
						<span
							>Beat Saber 1.29.1 is now considered Legacy. Please update your game to get many bugfixes, performance improvements and mod
							updates.</span
						><br />
						<span
							>You can use <a href="https://github.com/Zagrios/bs-manager/releases">BSManager</a> to install separate game version. And
							migrate your controller offsets with <a href="https://github.com/qe201020335/BeatSaberOffsetMigrator">OffsetMigrator mod</a>
						</span>
					</ContentBox>
				{/if}

				<ContentBox cls="scores-box">
					<Scores
						{playerId}
						{playerAlias}
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
						<ContentBox cls="mini-rainking-box">
							<AccSaberMiniRanking {playerId} category="overall" numOfPlayers={5} />
						</ContentBox>
					{/if}
				{/await}
			{/if}
			{#if (!playerInfo?.richBioTimeset && !$editModel) || horizontalRichBio}
				<ContentBox cls="player-cards-box frosted">
					<PlayerCards {playerId} {playerInfo} profileSettings={playerData?.profileSettings} bind:editModel={$editModel} />
				</ContentBox>
			{/if}
			{#if achievements?.length && $configStore.profileParts.achievements}
				<ContentBox cls="player-cards-box frosted">
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

	:global(.player-cards-box) {
		border-radius: 12px !important;
		padding: 0.5em !important;
	}

	:global(.player-cards-box:has(.cards-container:empty)) {
		display: none;
	}

	:global(.player-cards-box .cards-container) {
		flex-direction: column;
	}

	:global(.scores-box) {
		margin-top: 4em !important;
		border-radius: 0 12px 12px 12px !important;
		padding: 0.5em !important;
	}

	:global(.mini-rainking-box) {
		border-radius: 12px !important;
		padding: 0.1em !important;
	}

	@media screen and (max-width: 1749px) {
		article {
			width: 100%;
		}
	}
</style>
