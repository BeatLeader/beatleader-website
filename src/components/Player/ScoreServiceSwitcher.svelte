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
	import Switcher from '../Common/Switcher.svelte';
	import Button from '../Common/Button.svelte';
	import editModel from '../../stores/beatleader/profile-edit-model';

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

	$: useSwitcher = $configStore?.preferences?.scoreSortingStyle === 'switcher';

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

	// Build clean URL for service tabs (without carrying over current service params)
	const buildServiceTabUrl = serviceId => {
		const prefix = `/u/${playerAlias}`;
		// For service tabs, just use the service path without any query params
		// 'ranked' is the default, so it doesn't need a path segment
		return serviceId === 'ranked' ? prefix : `${prefix}/${serviceId}`;
	};

	// Sort options data (shared between Switcher and Select)
	const getRankedSortOptions = () => [
		{id: 'pp', label: 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes', url: buildUrl('ranked', {sort: 'pp'})},
		{id: 'accPP', label: 'Acc PP', title: 'Sort by acc PP', iconFa: 'fa fa-arrows-to-dot', url: buildUrl('ranked', {sort: 'accPP'})},
		{
			id: 'passPP',
			label: 'Pass PP',
			title: 'Sort by pass PP',
			iconFa: 'fa fa-person-walking-dashed-line-arrow-right',
			url: buildUrl('ranked', {sort: 'passPP'}),
		},
		{
			id: 'techPP',
			label: 'Tech PP',
			title: 'Sort by tech PP',
			iconFa: 'fa fa-arrows-split-up-and-left',
			url: buildUrl('ranked', {sort: 'techPP'}),
		},
		{id: 'date', label: 'Date', title: 'Sort by date', iconFa: 'fa fa-clock', url: buildUrl('ranked', {sort: 'date'})},
		{id: 'acc', label: 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs', url: buildUrl('ranked', {sort: 'acc'})},
		{
			id: 'scoreValue',
			label: 'Score',
			title: 'Sort by modified score value',
			iconFa: 'fa fa-coins',
			url: buildUrl('ranked', {sort: 'scoreValue'}),
		},
		{id: 'rank', label: 'Rank', title: 'Sort by rank', iconFa: 'fa fa-list-ol', url: buildUrl('ranked', {sort: 'rank'})},
		{id: 'stars', label: 'Stars', title: 'Sort by song stars', iconFa: 'fa fa-star', url: buildUrl('ranked', {sort: 'stars'})},
		{
			id: 'playCount',
			label: 'Plays',
			title: `Sort by attempt count${player?.profileSettings?.showStatsPublic == false ? ' (this player has attempts hidden)' : ''}`,
			iconFa: 'fa fa-repeat',
			url: buildUrl('ranked', {sort: 'playCount'}),
			disabled: player?.profileSettings?.showStatsPublic == false,
		},
		{id: 'pauses', label: 'Pauses', title: 'Sort by pauses', iconFa: 'fa fa-pause', url: buildUrl('ranked', {sort: 'pauses'})},
		{id: 'maxStreak', label: 'Streak', title: 'Sort by 115 streak', iconFa: 'icon115s', url: buildUrl('ranked', {sort: 'maxStreak'})},
		{
			id: 'sotwNominations',
			label: 'Nominations',
			title: 'Sort by nominations for Best Of The Week',
			iconFa: 'fas fa-award',
			url: buildUrl('ranked', {sort: 'sotwNominations'}),
		},
		{
			id: 'replaysWatched',
			label: 'Watched',
			title: 'Sort by replay watched',
			iconFa: 'fa fa-eye',
			url: buildUrl('ranked', {sort: 'replaysWatched'}),
		},
		{id: 'mistakes', label: 'Mistakes', title: 'Sort by mistakes', iconFa: 'icon-mistakes', url: buildUrl('ranked', {sort: 'mistakes'})},
	];

	const getScoresSortOptions = () => [
		{id: 'pp', label: 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes', url: buildUrl('scores', {sort: 'pp'})},
		{id: 'accPP', label: 'Acc PP', title: 'Sort by acc PP', iconFa: 'fa fa-arrows-to-dot', url: buildUrl('scores', {sort: 'accPP'})},
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
			title: `Sort by attempt count${player?.profileSettings?.showStatsPublic == false ? ' (this player has attempts hidden)' : ''}`,
			iconFa: 'fa fa-repeat',
			url: buildUrl('scores', {sort: 'playCount'}),
			disabled: player?.profileSettings?.showStatsPublic == false,
		},
		{id: 'pauses', label: 'Pauses', title: 'Sort by pauses', iconFa: 'fa fa-pause', url: buildUrl('scores', {sort: 'pauses'})},
		{id: 'maxStreak', label: 'Streak', title: 'Sort by 115 streak', iconFa: 'icon115s', url: buildUrl('scores', {sort: 'maxStreak'})},
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
		{id: 'mistakes', label: 'Mistakes', title: 'Sort by mistakes', iconFa: 'icon-mistakes', url: buildUrl('scores', {sort: 'mistakes'})},
	];

	const getAttemptsSortOptions = () => [
		{id: 'pp', label: 'PP', title: 'Sort by PP', iconFa: 'fa fa-cubes', url: buildUrl('attempts', {sort: 'pp'})},
		{id: 'date', label: 'Date', title: 'Sort by date', iconFa: 'fa fa-clock', url: buildUrl('attempts', {sort: 'date'})},
		{id: 'acc', label: 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs', url: buildUrl('attempts', {sort: 'acc'})},
		{id: 'rank', label: 'Rank', title: 'Sort by rank', iconFa: 'fa fa-list-ol', url: buildUrl('attempts', {sort: 'rank'})},
		{
			id: 'playCount',
			label: 'Plays',
			title: 'Sort by attempt count',
			iconFa: 'fa fa-repeat',
			url: buildUrl('attempts', {sort: 'playCount'}),
		},
		{id: 'pauses', label: 'Pauses', title: 'Sort by pauses', iconFa: 'fa fa-pause', url: buildUrl('attempts', {sort: 'pauses'})},
		{id: 'maxStreak', label: 'Streak', title: 'Sort by 115 streak', iconFa: 'icon115s', url: buildUrl('attempts', {sort: 'maxStreak'})},
		{id: 'mistakes', label: 'Mistakes', title: 'Sort by mistakes', iconFa: 'icon-mistakes', url: buildUrl('attempts', {sort: 'mistakes'})},
	];

	const getBeatsaviorSortOptions = () => [
		{id: 'date', label: 'Date', title: 'Sort by date', iconFa: 'fa fa-clock', url: buildUrl('beatsavior', {sort: 'date'})},
		{id: 'acc', label: 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs', url: buildUrl('beatsavior', {sort: 'acc'})},
		{id: 'mistakes', label: 'Mistakes', title: 'Sort by mistakes', iconFa: 'fa fa-times', url: buildUrl('beatsavior', {sort: 'mistakes'})},
	];

	const getAccsaberSortOptions = () => [
		{id: 'ap', label: 'AP', title: 'Sort by AP', iconFa: 'fa fa-cubes', url: buildUrl('accsaber', {sort: 'ap'})},
		{id: 'date', label: 'Date', title: 'Sort by date', iconFa: 'fa fa-clock', url: buildUrl('accsaber', {sort: 'date'})},
		{id: 'acc', label: 'Acc', title: 'Sort by accuracy', iconFa: 'fa fa-crosshairs', url: buildUrl('accsaber', {sort: 'acc'})},
		{id: 'rank', label: 'Rank', title: 'Sort by rank', iconFa: 'fa fa-list-ol', url: buildUrl('accsaber', {sort: 'rank'})},
	];

	// Convert Switcher format (id/label/iconFa) to Select format (value/name/icon)
	const toSelectOptions = switcherValues =>
		switcherValues.map(v => ({
			value: v.id,
			name: v.label,
			title: v.title,
			icon: v.iconFa,
			url: v.url,
			disabled: v.disabled,
		}));

	let allServices = [];
	function updateAllServices(playerAlias, serviceParams, useSwitcher) {
		const SortComponent = useSwitcher ? Switcher : Select;
		const sortPropKey = useSwitcher ? 'values' : 'options';
		const eventIdKey = useSwitcher ? 'id' : 'value';

		const createSortOnChange =
			(serviceId, toggleOrder = false) =>
			event => {
				const sortValue = event?.detail?.[eventIdKey];
				if (!sortValue) return null;

				// In edit mode with Switcher, toggle visibility instead of changing sort
				if ($editModel && useSwitcher) {
					if (!$editModel.data.profileAppearance) $editModel.data.profileAppearance = [];

					const filterName = `ss-${sortValue}`;
					if ($editModel.data.profileAppearance.includes(filterName)) {
						$editModel.data.profileAppearance = $editModel.data.profileAppearance.filter(s => s !== filterName);
					} else {
						$editModel.data.profileAppearance = [...$editModel.data.profileAppearance, filterName];
					}
					return null;
				}

				const changes = {sort: sortValue};
				if (toggleOrder && useSwitcher && serviceParams?.sort === sortValue) {
					changes.order = serviceParams?.order === 'asc' ? 'desc' : 'asc';
				}
				// Clear secondary sort if it matches the new primary sort
				if (serviceId === 'scores' && serviceParams?.thenSort === sortValue) {
					changes.thenSort = null;
					changes.thenOrder = null;
				}
				dispatch('service-params-change', changes);
			};

		const rankedSortValues = getRankedSortOptions();
		const scoresSortValues = getScoresSortOptions();
		const attemptsSortValues = getAttemptsSortOptions();
		const beatsaviorSortValues = getBeatsaviorSortOptions();
		const accsaberSortValues = getAccsaberSortOptions();

		allServices = [
			{
				id: 'ranked',
				label: 'Ranked',
				icon: '<i class="fa-solid fa-medal"></i>',
				cls: 'service-tab-button',
				url: buildServiceTabUrl('ranked'),
				switcherComponents: useSwitcher
					? [
							{
								component: Switcher,
								props: {class: 'score-sorting', values: rankedSortValues},
								key: 'sort',
								onChange: createSortOnChange('ranked', true),
							},
						]
					: [
							{
								component: Select,
								props: {
									class: 'score-sorting',
									fontSize: '0.8',
									fontPadding: '0.3',
									options: toSelectOptions(rankedSortValues),
								},
								key: 'sort',
								onChange: createSortOnChange('ranked', false),
							},
						],
			},
			{
				id: 'scores',
				label: 'All Scores',
				icon: '<i class="fa-solid fa-list-check"></i>',
				cls: 'service-tab-button',
				url: buildServiceTabUrl('scores'),
				switcherComponents: useSwitcher
					? [
							{
								component: Switcher,
								props: {class: 'score-sorting', values: scoresSortValues},
								key: 'sort',
								onChange: createSortOnChange('scores', true),
							},
						]
					: [
							{
								component: Select,
								props: {
									class: 'score-sorting',
									fontSize: '0.8',
									fontPadding: '0.3',
									options: toSelectOptions(scoresSortValues),
								},
								key: 'sort',
								onChange: createSortOnChange('scores', false),
							},
						],
			},
			{
				id: 'attempts',
				label: 'Attempts',
				icon: '<i class="fa-solid fa-person-falling-burst"></i>',
				cls: 'service-tab-button',
				url: buildServiceTabUrl('attempts'),
				availabilityTitle: `This player's attempts are private`,
				switcherComponents: useSwitcher
					? [
							{
								component: Switcher,
								props: {class: 'score-sorting', values: attemptsSortValues},
								key: 'sort',
								onChange: createSortOnChange('attempts', true),
							},
						]
					: [
							{
								component: Select,
								props: {
									class: 'score-sorting',
									fontSize: '0.8',
									fontPadding: '0.3',
									options: toSelectOptions(attemptsSortValues),
								},
								key: 'sort',
								onChange: createSortOnChange('attempts', false),
							},
						],
			},
			{
				id: 'beatsavior',
				label: 'Beat Savior',
				cls: 'mode-tab-button',
				icon: '<div class="beatsavior-icon"></div>',
				url: buildServiceTabUrl('beatsavior'),
				switcherComponents: useSwitcher
					? [
							{
								component: Switcher,
								props: {values: beatsaviorSortValues},
								key: 'sort',
								onChange: createSortOnChange('beatsavior', true),
							},
						]
					: [
							{
								component: Select,
								props: {
									class: 'score-sorting',
									fontSize: '0.8',
									fontPadding: '0.3',
									options: toSelectOptions(beatsaviorSortValues),
								},
								key: 'sort',
								onChange: createSortOnChange('beatsavior', false),
							},
						],
			},
			{
				id: 'accsaber',
				label: 'AccSaber',
				cls: 'service-tab-button',
				icon: '<div class="accsaber-icon"></div>',
				url: buildServiceTabUrl('accsaber'),
				availabilityTitle: `AccSaber info is not available for this player`,
				switcherComponents: useSwitcher
					? [
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
								props: {values: accsaberSortValues},
								onChange: createSortOnChange('accsaber', true),
							},
						]
					: [
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
									options: toSelectOptions(accsaberSortValues),
								},
								onChange: createSortOnChange('accsaber', false),
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

		let newAvailableServiceNames = ['ranked', 'scores'];

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
		useSwitcher,
		profileAppearance
	) {
		const sortingOrFilteringAppearance = profileAppearance?.filter(a => a.startsWith('ss-') || a.startsWith('sf-'));

		const commonFilters = [];

		// In edit mode with switcher, force scores service
		const effectiveService = $editModel && useSwitcher ? 'scores' : service;

		return allServices
			.filter(s => availableServiceNames.includes(s?.id))
			.map(s => {
				if (s?.id !== effectiveService || !s?.switcherComponents?.length) return s;

				const serviceDef = {...s};

				// For Switcher mode: apply profileAppearance filtering to values
				if (useSwitcher && (serviceDef.id === 'scores' || serviceDef.id === 'ranked')) {
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
													effectiveService != 'scores' ||
													$editModel ||
													serviceParams?.sort == v.id ||
													!sortingOrFilteringAppearance ||
													sortingOrFilteringAppearance?.includes(`ss-${v?.id ?? ''}`)
											)
											.map(v => ({
												...v,
												title: $editModel ? 'Click to toggle' : v.title,
												cls: sortingOrFilteringAppearance?.includes(`ss-${v?.id ?? ''}`) ? 'hidden' : '',
											})),
									}
								: null),
						},
					}));
				}

				if (!strictlyAvailableServiceNames.includes(s?.id)) {
					serviceDef.title = s.availabilityTitle;
					serviceDef.disabled = true;
				} else {
					serviceDef.title = null;
					serviceDef.disabled = false;
				}

				switch (effectiveService) {
					case 'ranked':
					case 'scores':
					case 'attempts':
						if (availableServiceNames.includes('ranked') || availableServiceNames.includes('scores')) {
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
											hidden: effectiveService === 'ranked',
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
							if (effectiveService == 'attempts') {
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

							// For Switcher mode: add hidden property based on profileAppearance
							if (useSwitcher && (serviceDef.id === 'scores' || serviceDef.id === 'ranked')) {
								serviceDef.filters = serviceDef.filters.map(f => ({
									...f,
									props: {
										...f.props,
										hidden:
											f?.props?.hidden ||
											(sortingOrFilteringAppearance?.includes(`sf-${f?.props?.id ?? ''}`) && !serviceParams?.filters?.[f?.props?.id]),
									},
								}));
							}

							serviceDef.filters = serviceDef.filters.filter(f => !$account?.player || ($editModel && useSwitcher) || !f?.props?.hidden);
						}
						break;

					case 'beatsavior':
						serviceDef.filters = [...commonFilters];
						break;

					case 'accsaber':
						serviceDef.filters = [...commonFilters];

						if (accSaberCategories?.length) {
							const typeComponent = serviceDef.switcherComponents.find(c => c?.key === 'type');
							if (typeComponent) {
								if (useSwitcher) {
									typeComponent.props = {
										...typeComponent.props,
										values: accSaberCategories.map(c => ({
											id: c.name,
											label: c.displayName ?? c.name,
											url: buildUrl('accsaber', {type: c.name}),
										})),
									};
								} else {
									typeComponent.props = {
										...typeComponent.props,
										options: accSaberCategories.map(c => ({
											value: c.name,
											name: c.displayName ?? c.name,
											url: buildUrl('accsaber', {type: c.name}),
										})),
									};
								}
							}
						}
						break;
				}

				serviceDef.switcherComponents = serviceDef.switcherComponents
					.filter(c => c?.props)
					.map(c => {
						const key = c?.key ?? 'sort';

						if (useSwitcher) {
							// For Switcher: use values array with id, set value as object reference
							const valuesArray = c.props?.values ?? [];
							const currentValue = valuesArray.find(v => v?.id === serviceParams?.[key]) ?? null;
							const loadingVal = valuesArray.find(v => v?.id === loadingServiceParams?.[key]) ?? null;

							// Update the icon to show sort direction for the current sort button
							if (key === 'sort' && currentValue?.iconFa) {
								currentValue.iconFa = `fa fa-long-arrow-alt-${serviceParams?.order === 'asc' ? 'up' : 'down'}`;
							}

							c.props.value = currentValue;
							c.props.loadingValue = loadingVal;
						} else {
							// For Select: use options array with value
							[
								{propKey: 'value', compareObj: serviceParams},
								{propKey: 'loadingValue', compareObj: loadingServiceParams},
							].forEach(o => (c.props[o.propKey] = c.props?.options?.find(v => v?.value === o.compareObj?.[key])?.value ?? null));
						}

						return c;
					});

				if (!serviceDef?.switcherComponents?.length) return null;

				return serviceDef;
			})
			.filter(s => s);
	}

	function onServiceChanged(event) {
		if (!event?.detail?.id || ($editModel && useSwitcher)) return;

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
		if (!$editModel || !useSwitcher || !event?.detail?.id) return;

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

	let hasThenSort = false;
	let thenSort = null;
	let thenOrder = null;

	function updateHasThenSort(service, serviceParams) {
		hasThenSort = (service === 'scores' || service === 'ranked') && !!serviceParams?.thenSort;
	}

	function updateThenSort(service, serviceParams) {
		thenSort = serviceParams?.thenSort;
		thenOrder = serviceParams?.thenOrder;
	}

	function addThenSort() {
		if (service !== 'scores' && service !== 'ranked') return;

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

	$: profileAppearance = $editModel?.data?.profileAppearance ?? $account?.player?.profileSettings?.profileAppearance ?? null;

	$: updateAllServices(playerAlias, serviceParams, useSwitcher);
	$: updateAvailableServiceNames(player, service, $account);

	$: availableServices = updateAvailableServices(
		availableServiceNames,
		service,
		loadingService,
		serviceParams,
		loadingServiceParams,
		accSaberCategories,
		eventsParticipating,
		useSwitcher,
		profileAppearance
	);

	$: serviceObj = availableServices.find(s => ($editModel && useSwitcher && s.id === 'scores') || s.id === service);
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
<nav class:edit-enabled={!!$editModel && useSwitcher}>
	{#if useSwitcher}
		<!-- Switcher mode: show buttons inline -->
		{#if serviceObj?.switcherComponents?.length}
			{#each serviceObj.switcherComponents as component (`${serviceObj?.id ?? ''}${component.key ?? 'sort'}`)}
				<svelte:component this={component.component} {...component.props} on:change={component.onChange ?? null} />
			{/each}
		{/if}
	{:else}
		<!-- Select mode: show dropdowns with labels -->
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
			<Button
				cls="order-toggle"
				iconFa="fas {serviceParams?.order === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'}"
				label={serviceParams?.order === 'asc' ? 'Ascending' : 'Descending'}
				title={serviceParams?.order === 'asc' ? 'Ascending' : 'Descending'}
				on:click={() => dispatch('service-params-change', {order: serviceParams?.order === 'asc' ? 'desc' : 'asc'})} />
			{#if hasThenSort}
				<span>then by</span>
				{#each serviceObj?.switcherComponents?.filter(c => c.key === 'sort') ?? [] as component (`thenSort-${component.key}`)}
					<svelte:component
						this={component.component}
						{...component.props}
						options={component.props?.options?.filter(o => o.value !== serviceParams?.sort)}
						value={thenSort}
						on:change={event => {
							if (!event?.detail?.value) return;
							dispatch('service-params-change', {thenSort: event.detail.value});
						}} />
				{/each}
				<Button
					cls="order-toggle"
					iconFa="fas {thenOrder === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'}"
					label={thenOrder === 'asc' ? 'Ascending' : 'Descending'}
					title={thenOrder === 'asc' ? 'Ascending' : 'Descending'}
					on:click={() => dispatch('service-params-change', {thenOrder: thenOrder === 'asc' ? 'desc' : 'asc'})} />
				<button class="remove-then-sort" on:click={removeThenSort} title="Remove secondary sort" aria-label="Remove secondary sort">
					<i class="fas fa-times"></i>
				</button>
			{:else if service === 'scores' || service === 'ranked'}
				<button class="add-then-sort" on:click={addThenSort} title="Add secondary sort" aria-label="Add secondary sort">
					<i class="fas fa-plus"></i>
				</button>
			{/if}
		</div>
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
		margin-top: -2em;
		margin-bottom: 1.3em;
		margin-left: -0.5em;
	}

	:global(.service-switcher .switch-types) {
		gap: 0.15em;
	}

	:global(.service-tab-button) {
		margin-bottom: -0.5em !important;
		height: 2em;
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
		flex-wrap: wrap;
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

	/* Edit mode styles for Switcher customization */
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

	@media screen and (max-width: 500px) {
		.service-switcher {
			margin-top: -3.3em;
		}

		:global(.service-switcher .switch-types) {
			font-size: 0.7em;
		}
		:global(.service-switcher .switch-types .button) {
			display: flex;
			flex-direction: column;
			height: 4em;
			padding-top: 0.5em;
			padding-bottom: 0.1em;
		}
		:global(.service-switcher .switch-types .button .icon) {
			margin-right: 0 !important;
			margin-left: 0 !important;
			font-size: 1.5em;
		}

		:global(.service-switcher .switch-types .button .accsaber-icon) {
			margin-top: -0.2em;
			height: 110%;
		}
	}
</style>
