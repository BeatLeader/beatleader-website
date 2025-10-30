<script>
	import {createEventDispatcher} from 'svelte';
	import createAccSaberService from '../../services/accsaber';
	import createAccountStore from '../../stores/beatleader/account';
	import {configStore} from '../../stores/config';
	import Switcher from '../Common/Switcher.svelte';
	import ScoreServiceFilters from './ScoreServiceFilters.svelte';
	import TextFilter from './ScoreFilters/TextFilter.svelte';
	import SelectFilter from './ScoreFilters/SelectFilter.svelte';
	import RangeFilter from './ScoreFilters/RangeFilter.svelte';
	import ModifiersFilter from '../Leaderboard/ModifiersPicker/ModifiersFilter.svelte';
	import {HMDs, modeDescriptions, requirementsMap} from '../../utils/beatleader/format';
	import editModel from '../../stores/beatleader/profile-edit-model';
	import {BL_API_URL, SPECIAL_PLAYER_ID, ALL_SCORES_PLAYER_ID} from '../../network/queues/beatleader/api-queue';
	import TabSwitcher from '../Common/TabSwitcher.svelte';
	import {ATTEMPT_END_TYPE, titleForEndType} from '../../utils/attempts';
	import createServiceParamsManager from './utils/service-param-manager';

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
	const serviceParamsManager = createServiceParamsManager();

	let availableServiceNames = ['scores'];
	let strictlyAvailableServiceNames = ['scores'];
	let accSaberCategories = null;

	const buildUrl = (serviceId, params = {}, noPage = false) => {
		const defaultParams = serviceParamsManager.getDefaultParams(serviceId);
		let mergedParams = {...defaultParams, ...serviceParams, ...params};

		// Ensure type is handled correctly for accsaber (use current if not explicitly changing)
		if (serviceId === 'accsaber' && !params.type) {
			mergedParams.type = serviceParams?.type ?? defaultParams.type;
		}

		const servicePath = serviceParamsManager.getUrl(serviceId, mergedParams, noPage);
		const prefix = `/u/${playerAlias}`;
		return servicePath.length ? `${prefix}/${servicePath}` : prefix;
	};

	let allServices = [];
	function updateAllServices(playerAlias, serviceParams) {
		allServices = [
			{
				id: 'scores',
				label: 'Scores',
				icon: '<div class="beatleader-icon"></div>',
				cls: 'service-tab-button',
				url: buildUrl('scores', {}),
				switcherComponents: [
					{
						component: Switcher,
						props: {
							class: 'score-sorting',
							values: [
								{id: 'pp', label: 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes', url: buildUrl('scores', {sort: 'pp'})},
								{
									id: 'accPP',
									label: 'Acc PP',
									title: 'Sort by acc PP',
									iconFa: 'fa fa-arrows-to-dot',
									url: buildUrl('scores', {sort: 'accPP'}),
								},
								{
									id: 'passPP',
									label: 'Pass PP',
									title: 'Sort by pass PP',
									iconFa: 'fa fa-person-walking-dashed-line-arrow-right',
									url: buildUrl('scores', {sort: 'passPP'}),
								},
								{
									id: 'techPP',
									label: 'Tech PP',
									title: 'Sort by tech PP',
									iconFa: 'fa fa-arrows-split-up-and-left',
									url: buildUrl('scores', {sort: 'techPP'}),
								},
								{id: 'date', label: 'Date', title: 'Sort by date', iconFa: 'fa fa-clock', url: buildUrl('scores', {sort: 'date'})},
								{id: 'acc', label: 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs', url: buildUrl('scores', {sort: 'acc'})},
								{
									id: 'scoreValue',
									label: 'Score',
									title: 'Sort by modified score value',
									iconFa: 'fa fa-coins',
									url: buildUrl('scores', {sort: 'scoreValue'}),
								},
								{id: 'rank', label: 'Rank', title: 'Sort by rank', iconFa: 'fa fa-list-ol', url: buildUrl('scores', {sort: 'rank'})},
								{id: 'stars', label: 'Stars', title: 'Sort by song stars', iconFa: 'fa fa-star', url: buildUrl('scores', {sort: 'stars'})},
								{
									id: 'playCount',
									label: 'Plays',
									title: `Sort by attempt count${
										player?.profileSettings?.showStatsPublic == false ? ' (this player has attempts hidden)' : ''
									}`,
									iconFa: 'fa fa-repeat',
									url: buildUrl('scores', {sort: 'playCount'}),
									disabled: player?.profileSettings?.showStatsPublic == false,
								},
								{id: 'pauses', label: 'Pauses', title: 'Sort by pauses', iconFa: 'fa fa-pause', url: buildUrl('scores', {sort: 'pauses'})},
								{
									id: 'maxStreak',
									label: 'Streak',
									title: 'Sort by 115 streak',
									iconFa: 'icon115s',
									url: buildUrl('scores', {sort: 'maxStreak'}),
								},
								{
									id: 'sotwNominations',
									label: 'Nominations',
									title: 'Sort by nominations for Best Of The Week',
									iconFa: 'fas fa-award',
									url: buildUrl('scores', {sort: 'sotwNominations'}),
								},
								{
									id: 'replaysWatched',
									label: 'Watched',
									title: 'Sort by replay watched',
									iconFa: 'fa fa-eye',
									url: buildUrl('scores', {sort: 'replaysWatched'}),
								},
								{
									id: 'mistakes',
									label: 'Mistakes',
									title: 'Sort by mistakes',
									iconFa: 'icon-mistakes',
									url: buildUrl('scores', {sort: 'mistakes'}),
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
				id: 'attempts',
				label: 'Attempts',
				icon: '<div class="beatleader-icon"></div>',
				cls: 'service-tab-button',
				url: buildUrl('attempts', {}),
				availabilityTitle: `This player's attempts are private`,
				switcherComponents: [
					{
						component: Switcher,
						props: {
							class: 'score-sorting',
							values: [
								{id: 'pp', label: 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes', url: buildUrl('attempts', {sort: 'pp'})},
								{id: 'date', label: 'Date', title: 'Sort by date', iconFa: 'fa fa-clock', url: buildUrl('attempts', {sort: 'date'})},
								{id: 'acc', label: 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs', url: buildUrl('attempts', {sort: 'acc'})},
								{id: 'rank', label: 'Rank', title: 'Sort by rank', iconFa: 'fa fa-list-ol', url: buildUrl('attempts', {sort: 'rank'})},
								{
									id: 'playCount',
									label: 'Plays',
									title: `Sort by attempt count`,
									iconFa: 'fa fa-repeat',
									url: buildUrl('attempts', {sort: 'playCount'}),
								},
								{
									id: 'pauses',
									label: 'Pauses',
									title: 'Sort by pauses',
									iconFa: 'fa fa-pause',
									url: buildUrl('attempts', {sort: 'pauses'}),
								},
								{
									id: 'maxStreak',
									label: 'Streak',
									title: 'Sort by 115 streak',
									iconFa: 'icon115s',
									url: buildUrl('attempts', {sort: 'maxStreak'}),
								},
								{
									id: 'mistakes',
									label: 'Mistakes',
									title: 'Sort by mistakes',
									iconFa: 'icon-mistakes',
									url: buildUrl('attempts', {sort: 'mistakes'}),
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
				url: buildUrl('beatsavior', {}),
				switcherComponents: [
					{
						component: Switcher,
						props: {
							values: [
								{id: 'date', label: 'Date', iconFa: 'fa fa-clock', url: buildUrl('beatsavior', {sort: 'date'})},
								{id: 'acc', label: 'Acc', iconFa: 'fa fa-crosshairs', url: buildUrl('beatsavior', {sort: 'acc'})},
								{id: 'mistakes', label: 'Mistakes', iconFa: 'fa fa-times', url: buildUrl('beatsavior', {sort: 'mistakes'})},
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
				url: buildUrl('accsaber', {}),
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
								{id: 'ap', label: 'AP', iconFa: 'fa fa-cubes', url: buildUrl('accsaber', {sort: 'ap'})},
								{id: 'date', label: 'Date', iconFa: 'fa fa-clock', url: buildUrl('accsaber', {sort: 'date'})},
								{id: 'acc', label: 'Acc', iconFa: 'fa fa-crosshairs', url: buildUrl('accsaber', {sort: 'acc'})},
								{id: 'rank', label: 'Rank', iconFa: 'fa fa-list-ol', url: buildUrl('accsaber', {sort: 'rank'})},
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

	function processStars(stars) {
		if (stars.from !== undefined) {
			return stars;
		} else {
			const list = stars.split(',').map(s => parseFloat(s));
			return {from: list[0], to: list[1]};
		}
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

				switch (service) {
					case 'scores':
					case 'attempts':
						if (availableServiceNames.includes('scores')) {
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
											hidden: !sortingOrFilteringAppearance.includes(`sf-search`) && !serviceParams?.filters?.search,
											open: !!serviceParams?.filters?.search,
											value: serviceParams?.filters?.search ?? null,
											placeholder: 'Enter song name...',
										},
									},
									{
										component: SelectFilter,
										props: {
											id: 'diff',
											iconFa: 'fa fa-chart-line',
											title: 'Filter by map difficulty',
											hidden: !sortingOrFilteringAppearance.includes(`sf-diff`) && !serviceParams?.filters?.diff,
											open: !!serviceParams?.filters?.diff,
											defaultValue: serviceParams?.filters?.diff ?? null,
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
											hidden: !sortingOrFilteringAppearance.includes(`sf-mode`) && !serviceParams?.filters?.mode,
											open: !!serviceParams?.filters?.mode,
											defaultValue: serviceParams?.filters?.mode ?? null,
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
											hidden: !sortingOrFilteringAppearance.includes(`sf-requirements`) && !serviceParams?.filters?.requirements,
											open: !!serviceParams?.filters?.requirements,
											defaultValue: serviceParams?.filters?.requirements ? parseInt(serviceParams?.filters?.requirements) : null,
											values: [
												{id: null, name: 'All'},
												{id: requirementsMap.vivify, name: 'Vivify'},
												{id: requirementsMap.noodles, name: 'Noodle Extensions'},
												{id: requirementsMap.chroma, name: 'Chroma'},
												{id: requirementsMap.V3, name: 'V3'},
												{id: requirementsMap.cinema, name: 'Cinema'},
												{id: requirementsMap.mappingExtensions, name: 'Mapping Extensions'},
												{id: requirementsMap.vnjs, name: 'VNJS'},
												{id: requirementsMap.gls, name: 'GLS'},
											],
										},
									},
									{
										component: SelectFilter,
										props: {
											id: 'songType',
											iconFa: 'fa fa-cubes',
											title: 'Filter by map type',
											hidden: !sortingOrFilteringAppearance.includes(`sf-songType`) && !serviceParams?.filters?.songType,
											open: !!serviceParams?.filters?.songType,
											defaultValue: serviceParams?.filters?.songType ?? null,
											values: [
												{id: null, name: 'All'},
												{id: 'ranked', name: 'Ranked'},
												{id: 'ost', name: 'OST'},
												{id: 'qualified', name: 'Qualified'},
												{id: 'nominated', name: 'Nominated'},
												{id: 'unranked', name: 'Unranked'},
												{id: 'inevent', name: 'In Event'},
											],
										},
									},
									{
										component: SelectFilter,
										props: {
											id: 'hmd',
											iconFa: 'fa fa-vr-cardboard',
											title: 'Filter by headset',
											hidden: !sortingOrFilteringAppearance.includes(`sf-hmd`) && !serviceParams?.filters?.hmd,
											open: !!serviceParams?.filters?.hmd,
											defaultValue: serviceParams?.filters?.hmd ?? null,
											values: [
												{id: null, name: 'All'},
												...(player?.scoreStats?.allHMDs?.length ? player?.scoreStats?.allHMDs?.split(',') : Object.keys(HMDs)).map(id => {
													return {
														id: id,
														name: HMDs[parseInt(id)]?.name ?? 'Unknown headset',
													};
												}),
											],
										},
									},
									{
										component: RangeFilter,
										props: {
											id: 'stars',
											iconFa: 'fa fa-star',
											title: 'Filter by map stars',
											open: !!serviceParams?.filters?.stars,
											defaultValue: serviceParams?.filters?.stars ? processStars(serviceParams.filters.stars) : null,
											hidden: !sortingOrFilteringAppearance.includes(`sf-stars`) && !serviceParams?.filters?.stars,
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
											hidden: !sortingOrFilteringAppearance.includes(`sf-modifiers`) && !serviceParams?.filters?.modifiers,
											selected: serviceParams?.filters?.modifiers,
										},
									},
								]);

							if (eventsParticipating?.length) {
								serviceDef.filters = [...serviceDef.filters].concat([
									{
										component: SelectFilter,
										props: {
											id: 'eventId',
											iconFa: 'fa fa-calendar',
											title: 'Filter by event',
											hidden: !sortingOrFilteringAppearance.includes(`sf-eventId`) && !serviceParams?.filters?.eventId,
											values: [{id: null, name: 'None'}].concat(eventsParticipating.map(e => ({id: e?.id, name: e?.name}))),
											open: !!serviceParams?.filters?.eventId,
											defaultValue: serviceParams?.filters?.eventId ? parseInt(serviceParams?.filters?.eventId) : null,
										},
									},
								]);
							}
							if (service == 'attempts') {
								serviceDef.filters = [...serviceDef.filters].concat([
									{
										component: SelectFilter,
										props: {
											id: 'endType',
											iconFa: 'fa fa-flag-checkered',
											title: 'Filter by attempt end type',
											values: [
												{id: null, name: 'All'},
												{id: ATTEMPT_END_TYPE.Clear, name: titleForEndType(ATTEMPT_END_TYPE.Clear)},
												{id: ATTEMPT_END_TYPE.Fail, name: titleForEndType(ATTEMPT_END_TYPE.Fail)},
												{id: ATTEMPT_END_TYPE.Restart, name: titleForEndType(ATTEMPT_END_TYPE.Restart)},
												{id: ATTEMPT_END_TYPE.Quit, name: titleForEndType(ATTEMPT_END_TYPE.Quit)},
												{id: ATTEMPT_END_TYPE.Practice, name: titleForEndType(ATTEMPT_END_TYPE.Practice)},
											],
											open: !!serviceParams?.filters?.endType,
											defaultValue: serviceParams?.filters?.endType ? parseInt(serviceParams?.filters?.endType) : null,
										},
									},
								]);
							}

							serviceDef.filters = serviceDef.filters.filter(f => !$account?.player || $editModel || !f?.props?.hidden);
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
										url: buildUrl('accsaber', {type: c.name}),
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

	$: updateAllServices(playerAlias, serviceParams);
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

{#if playerId != SPECIAL_PLAYER_ID && playerId != ALL_SCORES_PLAYER_ID && availableServices?.length}
	<div class="service-switcher">
		<TabSwitcher
			values={availableServices}
			value={serviceObj}
			on:change={onServiceChanged}
			loadingValue={loadingServiceObj}
			class="service" />
	</div>
{/if}
<nav class:edit-enabled={!!$editModel}>
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
