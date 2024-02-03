<script>
	import {onMount} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import createPlayerInfoWithScoresStore from '../stores/http/http-player-with-scores-store';
	// import createAccSaberService from '../services/accsaber';
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
	import ContentBox from '../components/Common/ContentBox.svelte';

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
		if (!playerStore || newPlayerId !== playerStore.getPlayerId()) {
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

	let avatarHash = '';
	async function onPlayerDataUpdated() {
		if (playerStore) {
			await playerStore.refresh();

			// force refresh avatar url
			avatarHash = (Math.random() * 100000).toString();
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

	$: editing = new URLSearchParams(location?.search).get('edit') ?? null;
</script>

<svelte:head>
	<title>{browserTitle}</title>
</svelte:head>

<svelte:window bind:innerWidth bind:innerHeight />

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
		{/if}
	</article>
</section>

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

	@media screen and (max-width: 1749px) {
		article {
			width: 100%;
		}
	}
</style>
