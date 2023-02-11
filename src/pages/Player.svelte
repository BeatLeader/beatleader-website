<script>
	import {fade} from 'svelte/transition';
	import createPlayerInfoWithScoresStore from '../stores/http/http-player-with-scores-store';
	import createTwitchService from '../services/twitch';
	import {SsrHttpNotFoundError, SsrHttpUnprocessableEntityError} from '../network/errors';
	import createServiceParamsManager from '../components/Player/utils/service-param-manager';
	import Profile from '../components/Player/Profile.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';

	const STORE_SORTING_KEY = 'PlayerScoreSorting';
	const STORE_ORDER_KEY = 'PlayerScoreOrder';

	import keyValueRepository from '../db/repository/key-value';
	import {configStore} from '../stores/config';

	export let initialPlayerId = null;
	export let initialParams = null;

	document.body.classList.remove('slim');

	let playerEl = null;

	let service = null;
	let serviceParams = null;

	const serviceParamsManager = createServiceParamsManager(initialPlayerId);

	processInitialParams(initialPlayerId, initialParams);

	let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, service, serviceParams);

	async function changeParams(newPlayerId, service, newServiceParams) {
		if (!newPlayerId) return;
		serviceParams = newServiceParams;
		if (!playerStore || newPlayerId !== playerStore.getPlayerId()) {
			playerStore.fetch(newPlayerId, service, newServiceParams);
		} else {
			playerStore.setService(service);
			playerStore.setServiceParams(newServiceParams);
		}
	}

	async function refreshSavedParams() {
		let params = serviceParamsManager.getParams();
		const scoresSortOptions = await configStore.get('preferences').scoresSortOptions;
		if (scoresSortOptions == 'last') {
			const sortingOption = await keyValueRepository().get(STORE_SORTING_KEY);
			if (sortingOption) {
				params.sort = sortingOption;
			}
			const orderOption = await keyValueRepository().get(STORE_ORDER_KEY);
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

	const twitchService = createTwitchService();
	let twitchVideos = [];

	async function updateTwitchProfile(playerId) {
		if (!playerId) return;

		const twitchProfile = await twitchService.refresh(playerId);
		twitchVideos = twitchProfile && twitchProfile.videos && twitchProfile.videos.length ? twitchProfile.videos : [];
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

	$: processInitialParams(initialPlayerId, initialParams);
	$: changeParams(initialPlayerId, service, serviceParams);

	$: paramsStore = playerStore ? playerStore.params : null;

	$: currentPlayerId = $paramsStore.currentPlayerId;

	$: playerIsLoading = playerStore ? playerStore.isLoading : null;
	$: playerError = playerStore ? playerStore.error : null;
	$: skeleton = !$playerStore && $playerIsLoading;
	$: updateTwitchProfile(currentPlayerId);
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<section class="align-content player-page">
	<article class="page-content" bind:this={playerEl} transition:fade>
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
				{twitchVideos}
				on:player-data-updated={onPlayerDataUpdated}
				{avatarHash} />
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
