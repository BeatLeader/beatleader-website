<script>
	import {createEventDispatcher} from 'svelte';
	import createAccSaberService from '../../services/accsaber';
	import createAccountStore from '../../stores/beatleader/account';
	import Switcher from '../Common/Switcher.svelte';
	import ScoreServiceFilters from './ScoreServiceFilters.svelte';
	import TextFilter from './ScoreFilters/TextFilter.svelte';
	import SelectFilter from './ScoreFilters/SelectFilter.svelte';
	import RangeFilter from './ScoreFilters/RangeFilter.svelte';
	import ModifiersFilter from '../Leaderboard/ModifiersPicker/ModifiersFilter.svelte';
	import {modeDescriptions, requirementsMap} from '../../utils/beatleader/format';
	import editModel from '../../stores/beatleader/profile-edit-model';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let playerId = null;
	export let player = null;
	export let service = 'beatleader';
	export let serviceParams = {sort: 'pp', order: 'desc'};
	export let loadingService = null;
	export let loadingServiceParams = null;

	const SPECIAL_PLAYER_ID = 'user-friends';

	const dispatch = createEventDispatcher();
	const accSaberService = createAccSaberService();
	const account = createAccountStore();

	let availableServiceNames = ['beatleader'];
	let accSaberCategories = null;

	const allServices = [
		{
			id: 'beatleader',
			label: 'BeatLeader',
			icon: '<div class="beatleader-icon"></div>',
			url: `/u/${playerId}`,
			switcherComponents: [
				{
					component: Switcher,
					props: {
						class: 'score-sorting',
						values: [
							{id: 'pp', label: 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes', url: `/u/${playerId}/beatleader/pp/1`},
							{
								id: 'accPP',
								label: 'Acc PP',
								title: 'Sort by acc PP',
								iconFa: 'fa fa-arrows-to-dot',
								url: `/u/${playerId}/beatleader/accPP/1`,
							},
							{
								id: 'passPP',
								label: 'Pass PP',
								title: 'Sort by pass PP',
								iconFa: 'fa fa-person-walking-dashed-line-arrow-right',
								url: `/u/${playerId}/beatleader/passPP/1`,
							},
							{
								id: 'techPP',
								label: 'Tech PP',
								title: 'Sort by tech PP',
								iconFa: 'fa fa-arrows-split-up-and-left',
								url: `/u/${playerId}/beatleader/techPP/1`,
							},
							{id: 'date', label: 'Date', title: 'Sort by date', iconFa: 'fa fa-clock', url: `/u/${playerId}/beatleader/date/1`},
							{id: 'acc', label: 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs', url: `/u/${playerId}/beatleader/acc/1`},
							{id: 'rank', label: 'Rank', title: 'Sort by rank', iconFa: 'fa fa-list-ol', url: `/u/${playerId}/beatleader/rank/1`},
							{id: 'stars', label: 'Stars', title: 'Sort by song stars', iconFa: 'fa fa-star', url: `/u/${playerId}/beatleader/stars/1`},
							{
								id: 'playCount',
								label: 'Plays',
								title: `Sort by attempt count${
									player?.profileSettings?.showStatsPublic == false ? ' (this player has attempts hidden)' : ''
								}`,
								iconFa: 'fa fa-repeat',
								url: `/u/${playerId}/beatleader/playCount/1`,
								disabled: player?.profileSettings?.showStatsPublic == false,
							},
							{id: 'pauses', label: 'Pauses', title: 'Sort by pauses', iconFa: 'fa fa-pause', url: `/u/${playerId}/beatleader/pauses/1`},
							{
								id: 'maxStreak',
								label: 'Streak',
								title: 'Sort by 115 streak',
								iconFa: 'icon115s',
								url: `/u/${playerId}/beatleader/maxStreak/1`,
							},
							{
								id: 'replaysWatched',
								label: 'Watched',
								title: 'Sort by replay watched',
								iconFa: 'fa fa-eye',
								url: `/u/${playerId}/beatleader/replaysWatched/1`,
							},
							{
								id: 'mistakes',
								label: 'Mistakes',
								title: 'Sort by mistakes',
								iconFa: 'icon-mistakes',
								url: `/u/${playerId}/beatleader/mistakes/1`,
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
			icon: '<div class="beatsavior-icon"></div>',
			url: `/u/${playerId}/beatsavior/date/1`,
			switcherComponents: [
				{
					component: Switcher,
					props: {
						values: [
							{id: 'date', label: 'Date', iconFa: 'fa fa-clock', url: `/u/${playerId}/beatsavior/date/1`},
							{id: 'acc', label: 'Acc', iconFa: 'fa fa-crosshairs', url: `/u/${playerId}/beatsavior/acc/1`},
							{id: 'mistakes', label: 'Mistakes', iconFa: 'fa fa-times', url: `/u/${playerId}/beatsavior/mistake/1`},
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
			icon: '<div class="accsaber-icon"></div>',
			url: `/u/${playerId}/accsaber/date/1`,
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

	async function updateAvailableServiceNames(playerId) {
		accSaberCategories = null;

		const additionalServices = (
			await Promise.all([accSaberService.isDataForPlayerAvailable(playerId).then(r => (r ? 'accsaber' : null))])
		).filter(s => s);

		if (additionalServices?.length) availableServiceNames = ['beatleader'].concat(additionalServices);

		if (additionalServices.includes('accsaber')) accSaberCategories = await accSaberService.getCategories();
	}

	function updateAvailableServices(
		avaiableServiceNames,
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

		service = $editModel ? 'beatleader' : service;

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
												service != 'beatleader' ||
												$editModel ||
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

				const currentSortButton = serviceDef.switcherComponents
					.find(c => c.key === 'sort')
					?.props?.values?.find(b => b?.id === serviceParams?.sort);
				if (!$editModel && currentSortButton?.iconFa) {
					currentSortButton.iconFa = `fa fa-long-arrow-alt-${serviceParams?.order === 'asc' ? 'up' : 'down'}`;
				}

				switch (service) {
					case 'beatleader':
						if (availableServiceNames.includes('beatleader')) {
							serviceDef.filters = commonFilters
								.filter(f => f.props.id != 'search' || playerId != SPECIAL_PLAYER_ID)
								.map(f => ({
									...f,
									props: {...f.props, hidden: !sortingOrFilteringAppearance.includes(`sf-${f?.props?.id ?? ''}`)},
								}))

								.concat([
									{
										component: TextFilter,
										props: {
											id: 'search',
											iconFa: 'fa fa-search',
											title: 'Search by song/artist/mapper/hash',
											placeholder: 'Enter song name...',
										},
									},
									{
										component: SelectFilter,
										props: {
											id: 'diff',
											iconFa: 'fa fa-chart-line',
											title: 'Filter by map difficulty',
											values: [
												{id: null, name: 'All'},
												{id: 'easy', name: 'Easy'},
												{id: 'normal', name: 'Normal'},
												{id: 'hard', name: 'Hard'},
												{id: 'expert', name: 'Expert'},
												{id: 'expertplus', name: 'Expert+'},
											],
										},
									},
									{
										component: SelectFilter,
										props: {
											id: 'mode',
											iconFa: 'fa fa-compass',
											title: 'Filter by map mode',
											values: [{id: null, name: 'All'}].concat(
												Object.entries(modeDescriptions).map(([key, type]) => {
													return {
														id: key.toLowerCase(),
														name: modeDescriptions?.[key]?.title ?? 'Unknown',
													};
												})
											),
										},
									},
									{
										component: SelectFilter,
										props: {
											id: 'requirements',
											iconFa: 'fa fa-mountain-sun',
											title: 'Filter by map feature',
											values: [
												{id: null, name: 'All'},
												{id: requirementsMap.noodles, name: 'Noodle Extensions'},
												{id: requirementsMap.chroma, name: 'Chroma'},
												{id: requirementsMap.V3, name: 'V3'},
												{id: requirementsMap.cinema, name: 'Cinema'},
												{id: requirementsMap.mappingExtensions, name: 'Mapping Extensions'},
												{id: requirementsMap.optionalProperties, name: 'Optional Properties'},
											],
										},
									},
									{
										component: SelectFilter,
										props: {
											id: 'songType',
											iconFa: 'fa fa-cubes',
											title: 'Filter by map type',
											hidden: !sortingOrFilteringAppearance.includes(`sf-songType`),
											values: [
												{id: null, name: 'All'},
												{id: 'ranked', name: 'Ranked only'},
												{id: 'unranked', name: 'Unranked only'},
											],
										},
									},
									{
										component: RangeFilter,
										props: {
											id: 'stars',
											iconFa: 'fa fa-star',
											title: 'Filter by map stars',
											hidden: !sortingOrFilteringAppearance.includes(`sf-stars`),
											minValue: 0,
											maxValue: 30,
											step: 0.1,
										},
									},
									{
										component: ModifiersFilter,
										asComponent: true,
										props: {
											id: 'modifiers',
											hidden: !sortingOrFilteringAppearance.includes(`sf-modifiers`),
											selected: serviceParams?.filters?.modifiers,
										},
									},
								])
								.filter(f => !$account?.player || $editModel || sortingOrFilteringAppearance.includes(`sf-${f?.props?.id ?? ''}`));

							if (eventsParticipating?.length)
								serviceDef.filters = [...serviceDef.filters]
									.concat([
										{
											component: SelectFilter,
											props: {
												id: 'eventId',
												iconFa: 'fa fa-calendar',
												title: 'Filter by event',
												hidden: !sortingOrFilteringAppearance.includes(`sf-eventId`),
												values: [{id: null, name: 'None'}].concat(eventsParticipating.map(e => ({id: e?.id, name: e?.name}))),
												open: !!serviceParams?.filters?.eventId,
												defaultValue: serviceParams?.filters?.eventId ?? null,
											},
										},
									])
									.filter(f => !$account?.player || $editModel || sortingOrFilteringAppearance.includes(`sf-${f?.props?.id ?? ''}`));
						}
						break;

					case 'beatsavior':
						serviceDef.filters = [...commonFilters];
						break;

					case 'accsaber':
						serviceDef.filters = [...commonFilters];

						if (accSaberCategories?.length) {
							const typeComponent = serviceDef.switcherComponents.find(c => c?.key === 'type');
							if (typeComponent)
								typeComponent.props = {
									values: accSaberCategories.map(c => ({
										id: c.name,
										label: c.displayName ?? c.name,
										url: `/u/${playerId}/${service}/${c.name}/date/1`,
									})),
								};
						}
						break;
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

	function onServiceChanged(event) {
		if (!event?.detail?.id || $editModel) return;

		dispatch('service-change', event.detail.id);
	}

	function onFiltersChanged(event) {
		const newFilters = event?.detail ?? {};

		const {sort, order, ...filters} = newFilters;

		const changesToPush = {
			...(sort ? {sort} : null),
			...(order ? {order} : null),
			...(filters ? {filters} : {filters: {}}),
		};

		dispatch('service-params-change', changesToPush);
	}

	function onFilterClick(event) {
		if (!$editModel || !event?.detail?.id) return;

		if (!$editModel.data.profileAppearance) $editModel.data.profileAppearance = [];

		const filterName = `sf-${event.detail.id}`;
		if ($editModel.data.profileAppearance.includes(filterName)) {
			$editModel.data.profileAppearance = $editModel.data.profileAppearance.filter(s => s !== filterName);
		} else $editModel.data.profileAppearance = [...$editModel.data.profileAppearance, filterName];
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

	$: updateAvailableServiceNames(playerId);
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

	$: serviceObj = availableServices.find(s => ($editModel && s.id === 'beatleader') || s.id === service);
	$: loadingServiceObj = availableServices.find(s => s.id === loadingService);
</script>

<nav class:edit-enabled={!!$editModel}>
	<Switcher values={availableServices} value={serviceObj} on:change={onServiceChanged} loadingValue={loadingServiceObj} class="service" />

	{#if serviceObj?.switcherComponents?.length}
		{#each serviceObj.switcherComponents as component (`${serviceObj?.id ?? ''}${component.key ?? 'sort'}`)}
			<svelte:component this={component.component} {...component.props} on:change={component.onChange ?? null} />
		{/each}
	{/if}

	{#if serviceObj?.filters}
		{#key `${playerId}${service}`}
			<ScoreServiceFilters filters={serviceObj.filters} on:change={onFiltersChanged} on:click={onFilterClick} />
		{/key}
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
		margin-bottom: 1rem;
		margin-right: 0.75rem;
	}

	nav :global(> *:last-child) {
		margin-right: 0;
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
