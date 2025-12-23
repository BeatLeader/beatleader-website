<script>
	import {createEventDispatcher} from 'svelte';
	import createAccSaberService from '../../services/accsaber';
	import createAccountStore from '../../stores/beatleader/account';
	import {configStore} from '../../stores/config';
	import ScoreServiceFilters from './ScoreServiceFilters.svelte';
	import TextFilter from './ScoreFilters/TextFilter.svelte';
	import SelectFilter from './ScoreFilters/SelectFilter.svelte';
	import RangeFilter from './ScoreFilters/RangeFilter.svelte';
	import ModifiersFilter from '../Leaderboard/ModifiersPicker/ModifiersFilter.svelte';
	import {HMDs, modeDescriptions, requirementsMap} from '../../utils/beatleader/format';
	import {BL_API_URL, SPECIAL_PLAYER_ID, ALL_SCORES_PLAYER_ID} from '../../network/queues/beatleader/api-queue';
	import TabSwitcher from '../Common/TabSwitcher.svelte';
	import {ATTEMPT_END_TYPE, titleForEndType} from '../../utils/attempts';
	import createServiceParamsManager from './utils/service-param-manager';
	import Select from '../Settings/Select.svelte';

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
						component: Select,
						props: {
							class: 'score-sorting',
							fontSize: '0.8',
							fontPadding: '0.3',
							options: [
								{value: 'pp', name: 'PP', title: 'Sort by PP', icon: 'fa fa-cubes', url: buildUrl('scores', {sort: 'pp'})},
								{
									value: 'accPP',
									name: 'Acc PP',
									title: 'Sort by acc PP',
									icon: 'fa fa-arrows-to-dot',
									url: buildUrl('scores', {sort: 'accPP'}),
								},
								{
									value: 'passPP',
									name: 'Pass PP',
									title: 'Sort by pass PP',
									icon: 'fa fa-person-walking-dashed-line-arrow-right',
									url: buildUrl('scores', {sort: 'passPP'}),
								},
								{
									value: 'techPP',
									name: 'Tech PP',
									title: 'Sort by tech PP',
									icon: 'fa fa-arrows-split-up-and-left',
									url: buildUrl('scores', {sort: 'techPP'}),
								},
								{value: 'date', name: 'Date', title: 'Sort by date', icon: 'fa fa-clock', url: buildUrl('scores', {sort: 'date'})},
								{value: 'acc', name: 'Acc', title: 'Sort by accuracy', icon: 'fa fa-crosshairs', url: buildUrl('scores', {sort: 'acc'})},
								{
									value: 'scoreValue',
									name: 'Score',
									title: 'Sort by modified score value',
									icon: 'fa fa-coins',
									url: buildUrl('scores', {sort: 'scoreValue'}),
								},
								{value: 'rank', name: 'Rank', title: 'Sort by rank', icon: 'fa fa-list-ol', url: buildUrl('scores', {sort: 'rank'})},
								{value: 'stars', name: 'Stars', title: 'Sort by song stars', icon: 'fa fa-star', url: buildUrl('scores', {sort: 'stars'})},
								{
									value: 'playCount',
									name: 'Plays',
									title: `Sort by attempt count${
										player?.profileSettings?.showStatsPublic == false ? ' (this player has attempts hidden)' : ''
									}`,
									icon: 'fa fa-repeat',
									url: buildUrl('scores', {sort: 'playCount'}),
									disabled: player?.profileSettings?.showStatsPublic == false,
								},
								{value: 'pauses', name: 'Pauses', title: 'Sort by pauses', icon: 'fa fa-pause', url: buildUrl('scores', {sort: 'pauses'})},
								{
									value: 'maxStreak',
									name: 'Streak',
									title: 'Sort by 115 streak',
									icon: 'icon115s',
									url: buildUrl('scores', {sort: 'maxStreak'}),
								},
								{
									value: 'sotwNominations',
									name: 'Nominations',
									title: 'Sort by nominations for Best Of The Week',
									icon: 'fas fa-award',
									url: buildUrl('scores', {sort: 'sotwNominations'}),
								},
								{
									value: 'replaysWatched',
									name: 'Watched',
									title: 'Sort by replay watched',
									icon: 'fa fa-eye',
									url: buildUrl('scores', {sort: 'replaysWatched'}),
								},
							{
								value: 'mistakes',
								name: 'Mistakes',
								title: 'Sort by mistakes',
								icon: 'icon-mistakes',
								url: buildUrl('scores', {sort: 'mistakes'}),
							},
						],
					},
					key: 'sort',
					onChange: event => {
						if (!event?.detail?.value) return null;

						const changes = {sort: event.detail.value};
						// Clear secondary sort if it matches the new primary sort
						if (serviceParams?.thenSort === event.detail.value) {
							changes.thenSort = null;
							changes.thenOrder = null;
						}
						dispatch('service-params-change', changes);
					},
				},
				{
					component: Select,
					props: {
						class: 'score-sorting',
						fontSize: '0.8',
						fontPadding: '0.3',
						options: [
							{value: 'asc', name: 'Ascending', title: 'Sort ascending', icon: 'fa-arrow-up'},
							{value: 'desc', name: 'Descending', title: 'Sort descending', icon: 'fa-arrow-down'},
						],
					},
					key: 'order',
					onChange: event => {
						if (!event?.detail?.value) return null;
						dispatch('service-params-change', {
							order: event.detail.value,
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
					component: Select,
					props: {
						class: 'score-sorting',
						fontSize: '0.8',
						fontPadding: '0.3',
						options: [
							{value: 'pp', name: 'PP', title: 'Sort by PP', icon: 'fa fa-cubes', url: buildUrl('attempts', {sort: 'pp'})},
							{value: 'date', name: 'Date', title: 'Sort by date', icon: 'fa fa-clock', url: buildUrl('attempts', {sort: 'date'})},
							{value: 'acc', name: 'Acc', title: 'Sort by accuracy', icon: 'fa fa-crosshairs', url: buildUrl('attempts', {sort: 'acc'})},
							{value: 'rank', name: 'Rank', title: 'Sort by rank', icon: 'fa fa-list-ol', url: buildUrl('attempts', {sort: 'rank'})},
							{
								value: 'playCount',
								name: 'Plays',
								title: `Sort by attempt count`,
								icon: 'fa fa-repeat',
								url: buildUrl('attempts', {sort: 'playCount'}),
							},
							{
								value: 'pauses',
								name: 'Pauses',
								title: 'Sort by pauses',
								icon: 'fa fa-pause',
								url: buildUrl('attempts', {sort: 'pauses'}),
							},
							{
								value: 'maxStreak',
								name: 'Streak',
								title: 'Sort by 115 streak',
								icon: 'icon115s',
								url: buildUrl('attempts', {sort: 'maxStreak'}),
							},
							{
								value: 'mistakes',
								name: 'Mistakes',
								title: 'Sort by mistakes',
								icon: 'icon-mistakes',
								url: buildUrl('attempts', {sort: 'mistakes'}),
							},
						],
					},
					key: 'sort',
					onChange: event => {
						if (!event?.detail?.value) return null;

						dispatch('service-params-change', {
							sort: event.detail.value,
						});
					},
				},
				{
					component: Select,
					props: {
						class: 'score-sorting',
						fontSize: '0.8',
						fontPadding: '0.3',
						options: [
							{value: 'asc', name: 'Ascending', title: 'Sort ascending', icon: 'fa-arrow-up'},
							{value: 'desc', name: 'Descending', title: 'Sort descending', icon: 'fa-arrow-down'},
						],
					},
					key: 'order',
					onChange: event => {
						if (!event?.detail?.value) return null;
						dispatch('service-params-change', {
							order: event.detail.value,
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
					component: Select,
					props: {
						class: 'score-sorting',
						fontSize: '0.8',
						fontPadding: '0.3',
						options: [
							{value: 'date', name: 'Date', title: 'Sort by date', icon: 'fa fa-clock', url: buildUrl('beatsavior', {sort: 'date'})},
							{value: 'acc', name: 'Acc', title: 'Sort by accuracy', icon: 'fa fa-crosshairs', url: buildUrl('beatsavior', {sort: 'acc'})},
							{value: 'mistakes', name: 'Mistakes', title: 'Sort by mistakes', icon: 'fa fa-times', url: buildUrl('beatsavior', {sort: 'mistakes'})},
						],
					},
					key: 'sort',
					onChange: event => {
						if (!event?.detail?.value) return null;

						dispatch('service-params-change', {
							sort: event.detail.value,
						});
					},
				},
				{
					component: Select,
					props: {
						class: 'score-sorting',
						fontSize: '0.8',
						fontPadding: '0.3',
						options: [
							{value: 'asc', name: 'Ascending', title: 'Sort ascending', icon: 'fa-arrow-up'},
							{value: 'desc', name: 'Descending', title: 'Sort descending', icon: 'fa-arrow-down'},
						],
					},
					key: 'order',
					onChange: event => {
						if (!event?.detail?.value) return null;
						dispatch('service-params-change', {
							order: event.detail.value,
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
					component: Select,
					props: {
						class: 'score-sorting',
						fontSize: '0.8',
						fontPadding: '0.3',
						options: [],
					},
					key: 'type',
					onChange: event => {
						if (!event?.detail?.value) return null;

						dispatch('service-params-change', {type: event?.detail?.value});
					},
				},
				{
					component: Select,
					key: 'sort',
					props: {
						class: 'score-sorting',
						fontSize: '0.8',
						fontPadding: '0.3',
						options: [
							{value: 'ap', name: 'AP', title: 'Sort by AP', icon: 'fa fa-cubes', url: buildUrl('accsaber', {sort: 'ap'})},
							{value: 'date', name: 'Date', title: 'Sort by date', icon: 'fa fa-clock', url: buildUrl('accsaber', {sort: 'date'})},
							{value: 'acc', name: 'Acc', title: 'Sort by accuracy', icon: 'fa fa-crosshairs', url: buildUrl('accsaber', {sort: 'acc'})},
							{value: 'rank', name: 'Rank', title: 'Sort by rank', icon: 'fa fa-list-ol', url: buildUrl('accsaber', {sort: 'rank'})},
						],
					},
					onChange: event => {
						if (!event?.detail?.value) return null;

						dispatch('service-params-change', {
							sort: event.detail.value,
						});
					},
				},
				{
					component: Select,
					props: {
						class: 'score-sorting',
						fontSize: '0.8',
						fontPadding: '0.3',
						options: [
							{value: 'asc', name: 'Ascending', title: 'Sort ascending', icon: 'fa-arrow-up'},
							{value: 'desc', name: 'Descending', title: 'Sort descending', icon: 'fa-arrow-down'},
						],
						defaultValue: serviceParams?.order ?? 'desc',
					},
					key: 'order',
					onChange: event => {
						if (!event?.detail?.value) return null;
						dispatch('service-params-change', {
							order: event.detail.value,
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
		eventsParticipating
	) {

		const commonFilters = [];

		return allServices
			.filter(s => availableServiceNames.includes(s?.id))
			.map(s => {
				if (s?.id !== service || !s?.switcherComponents?.length) return s;

				const serviceDef = {...s};

				if (!strictlyAvailableServiceNames.includes(s?.id)) {
					serviceDef.title = s.availabilityTitle;
					serviceDef.disabled = true;
				} else {
					serviceDef.title = null;
					serviceDef.disabled = false;
				}

				switch (service) {
					case 'scores':
					case 'attempts':
						if (availableServiceNames.includes('scores')) {
							serviceDef.filters = commonFilters
								.filter(f => f.props.id != 'search' || playerId != SPECIAL_PLAYER_ID)

								.concat([
									{
										component: TextFilter,
										props: {
											id: 'search',
											iconFa: 'fa fa-search',
											title: 'Search by song/artist/mapper/hash',
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

							serviceDef.filters = serviceDef.filters.filter(f => !$account?.player || !f?.props?.hidden);
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
								...typeComponent.props,
								options: accSaberCategories.map(c => ({
									value: c.name,
									name: c.displayName ?? c.name,
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
						].forEach(o => (c.props[o.propKey] = c.props?.options?.find(v => v?.value === o.compareObj?.[key])?.value ?? null));

						return c;
					});

				if (!serviceDef?.switcherComponents?.length) return null;

				return serviceDef;
			})
			.filter(s => s);
	}

	function onServiceChanged(event) {
		if (!event?.detail?.id) return;

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

	let eventsParticipating = null;

	function fetchEventsParticipating(playerId) {
		if (!playerId) return;
		fetch(BL_API_URL + `player/${playerId}/eventsparticipating`)
			.then(d => d.json())
			.then(eventsParticipatingList => {
				eventsParticipating = eventsParticipatingList;
			});
	}

	let hasThenSort = false;
	let thenSort = null;
	let thenOrder = null;

	function updateHasThenSort(service, serviceParams) {
		hasThenSort = service === 'scores' && !!serviceParams?.thenSort;
	}

	function updateThenSort(service, serviceParams) {
		thenSort = serviceParams?.thenSort;
		thenOrder = serviceParams?.thenOrder;
	}

	function addThenSort() {
		if (service !== 'scores') return;
		
		const sortComponent = serviceObj?.switcherComponents?.find(c => c.key === 'sort');
		const availableOptions = sortComponent?.props?.options?.filter(o => o.value !== serviceParams?.sort) ?? [];
		const defaultThenSort = availableOptions[0]?.value ?? 'date';

		hasThenSort = true;
		thenSort = defaultThenSort;
		thenOrder = 'desc';
		
		dispatch('service-params-change', {
			thenSort: defaultThenSort,
			thenOrder: 'desc',
		});
	}

	function removeThenSort() {

		hasThenSort = false;

		dispatch('service-params-change', {
			thenSort: null,
			thenOrder: null,
		});
	}

	$: fetchEventsParticipating(player?.playerId);

	$: updateAllServices(playerAlias, serviceParams);
	$: updateAvailableServiceNames(player, service, $account);

	$: availableServices = updateAvailableServices(
		availableServiceNames,
		service,
		loadingService,
		serviceParams,
		loadingServiceParams,
		accSaberCategories,
		eventsParticipating
	);

	$: serviceObj = availableServices.find(s => s.id === service);
	$: loadingServiceObj = availableServices.find(s => s.id === loadingService);

	$: updateHasThenSort(service, serviceParams);
	$: updateThenSort(service, serviceParams);
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
<nav>
	<div class="score-sorting">
		<span>Sort by</span>
		{#if serviceParams?.filters?.search}
			<Select
				value={serviceParams?.noSearchSort ? 'ignore' : 'relevance'}
				fontSize="0.8"
				options={[
					{value: 'relevance', name: 'Relevance', title: 'Sort by search relevance first', icon: 'fa-magnifying-glass'},
					{value: 'ignore', name: 'Ignore Relevance', title: 'Skip relevance sorting, return all matches', icon: 'fa-list'},
				]}
				on:change={event => {
					if (!event?.detail?.value) return;
					dispatch('service-params-change', {
						noSearchSort: event.detail.value === 'ignore',
					});
				}} />
			{#if !serviceParams?.noSearchSort}
				<span>then by</span>
			{/if}
		{/if}
		{#if serviceObj?.switcherComponents?.length}
			{#each serviceObj.switcherComponents.filter(c => c.key !== 'thenSort' && c.key !== 'thenOrder') as component (`${serviceObj?.id ?? ''}${component.key ?? 'sort'}`)}
				<svelte:component 
					this={component.component} 
					{...component.props} 
					options={component.props?.options?.filter(o => !hasThenSort || o.value !== serviceParams?.thenSort)}
					on:change={component.onChange ?? null} />
			{/each}
		{/if}
		{#if hasThenSort}
			<span>then by</span>
			{#each serviceObj?.switcherComponents?.filter(c => c.key === 'sort' || c.key === 'order') ?? [] as component (`thenSort-${component.key}`)}
				<svelte:component 
					this={component.component} 
					{...component.props} 
					options={component.props?.options?.filter(o => component.key !== 'sort' || o.value !== serviceParams?.sort)}
					value={component.key === 'sort' ? thenSort : thenOrder}
					on:change={event => {
						if (!event?.detail?.value) return;
						if (component.key === 'sort') {
							dispatch('service-params-change', { thenSort: event.detail.value });
						} else {
							dispatch('service-params-change', { thenOrder: event.detail.value });
						}
					}} />
			{/each}
			<button class="remove-then-sort" on:click={removeThenSort} title="Remove secondary sort" aria-label="Remove secondary sort">
				<i class="fas fa-times"></i>
			</button>
		{:else if service === 'scores'}
			<button class="add-then-sort" on:click={addThenSort} title="Add secondary sort" aria-label="Add secondary sort">
				<i class="fas fa-plus"></i>
			</button>
		{/if}
	</div>

	{#if serviceObj?.filters}
		{#key `${playerId}${service}`}
			<ScoreServiceFilters filters={serviceObj.filters} on:change={onFiltersChanged} />
		{/key}
	{/if}
</nav>

<style>
	nav {
		display: flex;
		justify-content: space-between;
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

	.score-sorting {
		display: flex;
		gap: 0.3em;
		align-items: center;
	}

	.add-then-sort,
	.remove-then-sort {
		background: transparent;
		border: none;
		color: var(--textColor, white);
		cursor: pointer;
		padding: 0.3em 0.1em;
		opacity: 0.6;
		transition: opacity 0.2s;
		font-size: 0.9em;
	}

	.add-then-sort:hover,
	.remove-then-sort:hover {
		opacity: 1;
	}

	.remove-then-sort {
		color: #ff6b6b;
	}
</style>
