<script>
	import {createEventDispatcher} from 'svelte';
	import createAccSaberService from '../../services/accsaber';
	import createAccountStore from '../../stores/beatleader/account';
	import {configStore} from '../../stores/config';
	import Switcher from '../Common/Switcher.svelte';
	import editModel from '../../stores/beatleader/profile-edit-model';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let playerId = null;
	export let playerAlias = null;
	export let player = null;
	export let service = 'scores';
	export let serviceParams = {sort: 'pp', order: 'desc'};
	export let loadingService = null;
	export let loadingServiceParams = null;

	const dispatch = createEventDispatcher();
	const accSaberService = createAccSaberService();
	const account = createAccountStore();

	let availableServiceNames = ['scores'];
	let strictlyAvailableServiceNames = ['scores'];
	let accSaberCategories = null;

	let allServices = [];
	function updateAllServices(playerAlias) {
		allServices = [
			{
				id: 'scores',
				label: 'Scores',
				icon: '<div class="beatleader-icon"></div>',
				cls: 'service-tab-button',
				url: `/u/${playerAlias}`,
				switcherComponents: [
					{
						component: Switcher,
						props: {
							class: 'score-sorting',
							values: [
								{id: 'pp', label: 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes', url: `/u/${playerAlias}/scores/pp/1`},
								{
									id: 'accPP',
									label: 'Acc PP',
									title: 'Sort by acc PP',
									iconFa: 'fa fa-arrows-to-dot',
									url: `/u/${playerAlias}/scores/accPP/1`,
								},
								{
									id: 'passPP',
									label: 'Pass PP',
									title: 'Sort by pass PP',
									iconFa: 'fa fa-person-walking-dashed-line-arrow-right',
									url: `/u/${playerAlias}/scores/passPP/1`,
								},
								{
									id: 'techPP',
									label: 'Tech PP',
									title: 'Sort by tech PP',
									iconFa: 'fa fa-arrows-split-up-and-left',
									url: `/u/${playerAlias}/scores/techPP/1`,
								},
								{id: 'date', label: 'Date', title: 'Sort by date', iconFa: 'fa fa-clock', url: `/u/${playerAlias}/scores/date/1`},
								{id: 'acc', label: 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs', url: `/u/${playerAlias}/scores/acc/1`},
								{id: 'rank', label: 'Rank', title: 'Sort by rank', iconFa: 'fa fa-list-ol', url: `/u/${playerAlias}/scores/rank/1`},
								{id: 'stars', label: 'Stars', title: 'Sort by song stars', iconFa: 'fa fa-star', url: `/u/${playerAlias}/scores/stars/1`},
								{
									id: 'sotwNominations',
									label: 'Nominations',
									title: 'Sort by Score Of The Week nominations count',
									iconFa: 'fa fa-award',
									url: `/u/${playerAlias}/scores/stars/1`,
								},
								{id: 'pauses', label: 'Pauses', title: 'Sort by pauses', iconFa: 'fa fa-pause', url: `/u/${playerAlias}/scores/pauses/1`},
								{
									id: 'maxStreak',
									label: 'Streak',
									title: 'Sort by 115 streak',
									iconFa: 'icon115s',
									url: `/u/${playerAlias}/scores/maxStreak/1`,
								},
								{
									id: 'replaysWatched',
									label: 'Watched',
									title: 'Sort by replay watched',
									iconFa: 'fa fa-eye',
									url: `/u/${playerAlias}/scores/replaysWatched/1`,
								},
								{
									id: 'mistakes',
									label: 'Mistakes',
									title: 'Sort by mistakes',
									iconFa: 'icon-mistakes',
									url: `/u/${playerAlias}/scores/mistakes/1`,
								},
							],
						},
						key: 'sort',
						onChange: event => {
							if (!event?.detail?.id) return null;

							dispatch('service-params-change', {
								sort: event.detail.id,
								...(serviceParams?.sort === event.detail.id ? {order: serviceParams?.order === 'asc' ? 'desc' : 'asc'} : null),
							});
						},
					},
				],
			},
			{
				id: 'attempts',
				label: 'Attempts',
				icon: '<div class="beatleader-icon"></div>',
				cls: 'service-tab-button',
				url: `/u/${playerAlias}/attempts/date/1`,
				availabilityTitle: `This player's attempts are private`,
				switcherComponents: [
					{
						component: Switcher,
						props: {
							class: 'score-sorting',
							values: [
								{id: 'pp', label: 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes', url: `/u/${playerAlias}/attempts/pp/1`},
								{id: 'date', label: 'Date', title: 'Sort by date', iconFa: 'fa fa-clock', url: `/u/${playerAlias}/attempts/date/1`},
								{id: 'acc', label: 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs', url: `/u/${playerAlias}/attempts/acc/1`},
								{id: 'rank', label: 'Rank', title: 'Sort by rank', iconFa: 'fa fa-list-ol', url: `/u/${playerAlias}/attempts/rank/1`},
								{
									id: 'playCount',
									label: 'Plays',
									title: `Sort by attempt count`,
									iconFa: 'fa fa-repeat',
									url: `/u/${playerAlias}/attempts/playCount/1`,
								},
								{id: 'pauses', label: 'Pauses', title: 'Sort by pauses', iconFa: 'fa fa-pause', url: `/u/${playerAlias}/attempts/pauses/1`},
								{
									id: 'maxStreak',
									label: 'Streak',
									title: 'Sort by 115 streak',
									iconFa: 'icon115s',
									url: `/u/${playerAlias}/attempts/maxStreak/1`,
								},
								{
									id: 'mistakes',
									label: 'Mistakes',
									title: 'Sort by mistakes',
									iconFa: 'icon-mistakes',
									url: `/u/${playerAlias}/attempts/mistakes/1`,
								},
							],
						},
						key: 'sort',
						onChange: event => {
							if (!event?.detail?.id) return null;

							if ($editModel) {
								if (!$editModel.data.profileAppearance) $editModel.data.profileAppearance = [];

								const filterName = `ss-${event.detail.id}`;
								if ($editModel.data.profileAppearance.includes(filterName)) {
									$editModel.data.profileAppearance = $editModel.data.profileAppearance.filter(s => s !== filterName);
								} else $editModel.data.profileAppearance = [...$editModel.data.profileAppearance, filterName];

								return null;
							}

							dispatch('service-params-change', {
								sort: event.detail.id,
								...(serviceParams?.sort === event.detail.id ? {order: serviceParams?.order === 'asc' ? 'desc' : 'asc'} : null),
							});
						},
					},
				],
			},
			{
				id: 'beatsavior',
				label: 'Beat Savior',
				cls: 'mode-tab-button',
				icon: '<div class="beatsavior-icon"></div>',
				url: `/u/${playerAlias}/beatsavior/date/1`,
				switcherComponents: [
					{
						component: Switcher,
						props: {
							values: [
								{id: 'date', label: 'Date', iconFa: 'fa fa-clock', url: `/u/${playerAlias}/beatsavior/date/1`},
								{id: 'acc', label: 'Acc', iconFa: 'fa fa-crosshairs', url: `/u/${playerAlias}/beatsavior/acc/1`},
								{id: 'mistakes', label: 'Mistakes', iconFa: 'fa fa-times', url: `/u/${playerAlias}/beatsavior/mistake/1`},
							],
						},
						key: 'sort',
						onChange: event => {
							if (!event?.detail?.id) return null;

							dispatch('service-params-change', {
								sort: event.detail.id,
								...(serviceParams?.sort === event.detail.id ? {order: serviceParams?.order === 'asc' ? 'desc' : 'asc'} : null),
							});
						},
					},
				],
			},
			{
				id: 'accsaber',
				label: 'AccSaber',
				cls: 'service-tab-button',
				icon: '<div class="accsaber-icon"></div>',
				url: `/u/${playerAlias}/accsaber/date/1`,
				availabilityTitle: `AccSaber info is not available for this player`,
				switcherComponents: [
					{
						component: Switcher,
						key: 'type',
						onChange: event => {
							if (!event?.detail?.id) return null;

							dispatch('service-params-change', {type: event?.detail?.id});
						},
					},
					{
						component: Switcher,
						key: 'sort',
						props: {
							values: [
								{id: 'ap', label: 'AP', iconFa: 'fa fa-cubes'},
								{id: 'date', label: 'Date', iconFa: 'fa fa-clock'},
								{id: 'acc', label: 'Acc', iconFa: 'fa fa-crosshairs'},
								{id: 'rank', label: 'Rank', iconFa: 'fa fa-list-ol'},
							],
						},
						onChange: event => {
							if (!event?.detail?.id) return null;

							dispatch('service-params-change', {
								sort: event.detail.id,
								...(serviceParams?.sort === event.detail.id ? {order: serviceParams?.order === 'asc' ? 'desc' : 'asc'} : null),
							});
						},
					},
				],
			},
		];
	}

	async function updateAvailableServiceNames(player, currentService, account) {
		accSaberCategories = null;

		const additionalServices = (
			await Promise.all([accSaberService.isDataForPlayerAvailable(player).then(r => (r ? 'accsaber' : null))])
		).filter(s => s);

		let newAvailableServiceNames = ['scores'];

		if (additionalServices?.length) {
			newAvailableServiceNames = newAvailableServiceNames.concat(additionalServices);
		}

		if (
			player?.profileSettings?.showStatsPublic ||
			($configStore?.scoreDetailsPreferences?.showHistory && account?.id && player?.playerId && account?.id == player.playerId)
		) {
			newAvailableServiceNames.push('attempts');
		}

		strictlyAvailableServiceNames = [...newAvailableServiceNames];

		if (!newAvailableServiceNames.includes(currentService)) {
			newAvailableServiceNames.push(currentService);
		}

		availableServiceNames = newAvailableServiceNames;

		if (additionalServices.includes('accsaber')) accSaberCategories = await accSaberService.getCategories();
	}

	function updateAvailableServices(
		availableServiceNames,
		service,
		loadingService,
		serviceParams,
		loadingServiceParams,
		accSaberCategories,
		eventsParticipating,
		profileAppearance
	) {
		const sortingOrFilteringAppearance = (profileAppearance ?? []).filter(a => a.startsWith('ss-') || a.startsWith('sf-'));

		const commonFilters = [];

		service = $editModel ? 'scores' : service;

		return allServices
			.filter(s => availableServiceNames.includes(s?.id))
			.map(s => {
				if (s?.id !== service || !s?.switcherComponents?.length) return s;

				const serviceDef = {...s};
				serviceDef.switcherComponents = serviceDef.switcherComponents.map(c => ({
					...c,
					props: {
						...c?.props,
						...(c?.props?.values
							? {
									values: c.props.values
										.filter(
											v =>
												!$account?.player ||
												service != 'scores' ||
												$editModel ||
												serviceParams?.sort == v.id ||
												sortingOrFilteringAppearance.includes(`ss-${v?.id ?? ''}`)
										)
										.map(v => ({
											...v,
											title: $editModel ? 'Click to toggle' : v.title,
											cls: !sortingOrFilteringAppearance.includes(`ss-${v?.id ?? ''}`) ? 'hidden' : '',
										})),
								}
							: null),
					},
				}));

				if (!strictlyAvailableServiceNames.includes(s?.id)) {
					serviceDef.title = s.availabilityTitle;
					serviceDef.disabled = true;
				} else {
					serviceDef.title = null;
					serviceDef.disabled = false;
				}

				const currentSortButton = serviceDef.switcherComponents
					.find(c => c.key === 'sort')
					?.props?.values?.find(b => b?.id === serviceParams?.sort);
				if (!$editModel && currentSortButton?.iconFa) {
					currentSortButton.iconFa = `fa fa-long-arrow-alt-${serviceParams?.order === 'asc' ? 'up' : 'down'}`;
				}

				serviceDef.switcherComponents = serviceDef.switcherComponents
					.filter(c => c?.props)
					.map(c => {
						const key = c?.key ?? 'sort';

						[
							{propKey: 'value', compareObj: serviceParams},
							{propKey: 'loadingValue', compareObj: loadingServiceParams},
						].forEach(o => (c.props[o.propKey] = c.props?.values?.find(v => v?.id === o.compareObj?.[key]) ?? null));

						return c;
					});

				if (!serviceDef?.switcherComponents?.length) return null;

				return serviceDef;
			})
			.filter(s => s);
	}

	let eventsParticipating = null;

	function fetchEventsParticipating(playerId) {
		if (!playerId) return;
		fetch(BL_API_URL + `player/${playerId}/eventsparticipating`)
			.then(d => d.json())
			.then(eventsParticipatingList => {
				eventsParticipating = eventsParticipatingList;
			});
	}

	$: fetchEventsParticipating(player?.playerId);

	$: profileAppearance = $editModel?.data?.profileAppearance ?? $account?.player?.profileSettings?.profileAppearance ?? null;

	$: updateAllServices(playerAlias);
	$: updateAvailableServiceNames(player, service, $account);
	$: availableServices = updateAvailableServices(
		availableServiceNames,
		service,
		loadingService,
		serviceParams,
		loadingServiceParams,
		accSaberCategories,
		eventsParticipating,
		profileAppearance
	);

	$: serviceObj = availableServices.find(s => ($editModel && s.id === 'scores') || s.id === service);
	$: loadingServiceObj = availableServices.find(s => s.id === loadingService);
</script>

<nav class:edit-enabled={!!$editModel}>
	{#if serviceObj?.switcherComponents?.length}
		{#each serviceObj.switcherComponents as component (`${serviceObj?.id ?? ''}${component.key ?? 'sort'}`)}
			<svelte:component this={component.component} {...component.props} on:change={component.onChange ?? null} />
		{/each}
	{/if}
</nav>

<style>
	nav {
		display: flex;
		justify-content: space-evenly;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	nav :global(> *) {
		margin-bottom: 0.4em;
		margin-right: 0.75rem;
	}

	nav :global(> *:last-child) {
		margin-right: 0;
	}

	:global(.filter-btn.fa-mountain-sun:before) {
		margin-left: -0.15em;
	}
	:global(.filter-btn.fa-cubes:before) {
		margin-left: -0.08em;
	}
	:global(.filter-btn.fa-star:before) {
		margin-left: -0.07em;
	}
	:global(.filter-btn.fa-vr-cardboard:before) {
		margin-left: -0.12em;
	}

	.service-switcher {
		margin-top: -2.37em;
		margin-bottom: 1.3em;
		margin-left: -0.5em;
	}

	:global(.service-tab-button) {
		margin-bottom: -0.5em !important;
		height: 2.5em;
		border-radius: 12px 12px 0 0 !important;
	}

	:global(.service-tab-button span) {
		font-weight: 900;
		font-size: 1.2em;
	}

	.edit-enabled :global(.service) {
		opacity: 0.2 !important;
	}

	.edit-enabled :global(.score-sorting .button),
	.edit-enabled :global(.score-filters .filter-btn),
	.edit-enabled :global(.score-filters .filter),
	.edit-enabled :global(.score-filters .filter select),
	.edit-enabled :global(.score-filters .filter input) {
		cursor: cell !important;
		opacity: 1 !important;
		color: var(--textColor, white) !important;
		background: transparent !important;
	}

	.edit-enabled :global(.score-sorting .button:not(.hidden)),
	.edit-enabled :global(.score-filters .filter:not(.hidden)) {
		border: 1px dotted var(--textColor, white);
	}

	.edit-enabled :global(.score-sorting .button.hidden),
	.edit-enabled :global(.score-filters .filter.hidden) {
		filter: grayscale(1);
		opacity: 0.25 !important;
		transition: all 200ms;
	}

	.edit-enabled :global(.score-sorting .button.hidden:hover),
	.edit-enabled :global(.score-filters .filter.hidden:hover) {
		filter: none;
		opacity: 0.5 !important;
	}
</style>
