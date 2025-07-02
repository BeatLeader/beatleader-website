<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import {
		createBuildFiltersFromLocation,
		processStringFilter,
		processFloatFilter,
		processStringArrayFilter,
		processIntArrayFilter,
		processIntFilter,
		processBoolFilter,
		buildSearchFromFiltersWithDefaults,
	} from '../utils/filters';
	import ssrConfig from '../ssr-config';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import {debounce} from '../utils/debounce';
	import Switcher from '../components/Common/Switcher.svelte';
	import Countries from '../components/Ranking/Countries.svelte';
	import Headsets from '../components/Ranking/Headsets.svelte';
	import BackToTop from '../components/Common/BackToTop.svelte';
	import {configStore} from '../stores/config';
	import {BL_API_URL, ALL_SCORES_PLAYER_ID} from '../network/queues/beatleader/api-queue';

	import {tick} from 'svelte';
	import createLeaderboardsStore from '../stores/http/http-leaderboards-store';
	import createAccountStore from '../stores/beatleader/account';
	import createPlaylistStore from '../stores/playlists';
	import Pager from '../components/Common/Pager.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import {formatNumber} from '../utils/format';
	import Button from '../components/Common/Button.svelte';
	import DateRange from '../components/Common/DateRange.svelte';
	import {dateFromUnix, DAY} from '../utils/date';
	import {
		typesDescription,
		requirementsDescription,
		typesMap,
		DifficultyStatus,
		requirementsMap,
		modeDescriptions,
		difficultyDescriptions,
		songStatusesFilterMap,
		songStatusesDescription,
	} from '../utils/beatleader/format';
	import {capitalize} from '../utils/js';
	import RankedTimer from '../components/Common/RankedTimer.svelte';
	import {Ranked_Const, Unranked_Const} from './../utils/beatleader/consts';
	import {MetaTags} from 'svelte-meta-tags';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import MapCard from '../components/Leaderboards/MapCard.svelte';
	import {produce} from 'immer';
	import Switch from '../components/Common/Switch.svelte';
	import Select from '../components/Settings/Select.svelte';
	import Mappers from '../components/Leaderboard/Mappers.svelte';
	import PlayersPicker from '../components/Leaderboard/PlayersPicker.svelte';

	import DatePicker from '../components/Common/DatePicker.svelte';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';

	import createServiceParamsManager from '../components/Player/utils/service-param-manager';
	import Scores from '../components/Scores/Scores.svelte';
	import AsideBox from '../components/Common/AsideBox.svelte';

	export let page = 1;
	export let location;

	document.body.classList.remove('slim');

	const FILTERS_DEBOUNCE_MS = 500;

	const tabOptions = [
		{value: 'ranking', label: 'Ranking', iconFa: 'fas fa-hashtag', url: '/ranking/1', cls: 'ranking-tab-button'},
		{value: 'scores', label: 'Scores', iconFa: 'fas fa-trophy', url: '/scores/1', cls: 'ranking-tab-button'},
	];
	const currentTab = tabOptions[1];

	const serviceParamsManager = createServiceParamsManager(ALL_SCORES_PLAYER_ID);
	const account = createAccountStore();

	const params = [
		{key: 'search', default: '', process: processStringFilter},
		{key: 'type', default: 'all', process: processStringFilter},
		{key: 'mytype', default: '', process: processStringFilter},
		{key: 'stars_from', default: undefined, process: processFloatFilter},
		{key: 'stars_to', default: undefined, process: processFloatFilter},
		{key: 'accrating_from', default: undefined, process: processFloatFilter},
		{key: 'accrating_to', default: undefined, process: processFloatFilter},
		{key: 'passrating_from', default: undefined, process: processFloatFilter},
		{key: 'passrating_to', default: undefined, process: processFloatFilter},
		{key: 'techrating_from', default: undefined, process: processFloatFilter},
		{key: 'techrating_to', default: undefined, process: processFloatFilter},
		{key: 'date_from', default: null, process: processIntFilter},
		{key: 'date_to', default: null, process: processIntFilter},
		{key: 'sort', default: 'pp', process: processStringFilter},
		{key: 'order', default: 'desc', process: processStringFilter},
		{key: 'mode', default: null, process: processStringFilter},
		{key: 'diff', default: null, process: processStringFilter},
		{key: 'mapRequirements', default: null, process: processIntFilter},
		{key: 'mapType', default: null, process: processIntFilter},
		{key: 'allTypes', default: 0, process: processIntFilter},
		{key: 'songStatus', default: null, process: processIntFilter},
		{key: 'allRequirements', default: 0, process: processIntFilter},
		{key: 'mappers', default: null, process: processStringFilter},
		{key: 'players', default: null, process: processStringFilter},
		{key: 'modifiers', default: null, process: processStringFilter},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		if (filters.stars_from > filters.stars_to) {
			const tmp = filters.stars_from;
			filters.stars_from = filters.stars_to;
			filters.stars_to = tmp;
		}

		if (!filters?.sort?.length) filters.sort = 'pp';
		if (!filters?.order?.length) filters.order = 'desc';
		if (!filters?.type?.length) filters.type = 'all';

		if (!filters.mapRequirements) filters.mapType = null;

		return filters;
	});

	let currentFilters = buildFiltersFromLocation(location);
	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentPage = page;

	let serviceParams = {page: currentPage, sort: currentFilters.sort, order: currentFilters.order, filters: currentFilters};
	serviceParamsManager.update(serviceParams, 'scores', true);

	function onTabChanged(e) {
		navigate(`/ranking/1`);
	}

	let previousPage = 0;
	let boxEl = null;

	let isLoading = false;
	let pending = null;

	const typeFilterOptions = [
		{key: 'all', label: 'All maps', iconFa: 'fa fa-music', color: 'var(--beatleader-primary)'},
		{key: 'ost', label: 'OST', iconFa: 'fa fa-compact-disc', color: 'var(--beatleader-primary)'},
		{key: 'nominated', label: 'Nominated', iconFa: 'fa fa-rocket', color: 'var(--beatleader-primary)'},
		{key: 'qualified', label: 'Qualified', iconFa: 'fa fa-check', color: 'var(--beatleader-primary)'},
		{key: 'ranked', label: 'Ranked', iconFa: 'fa fa-cubes', color: 'var(--beatleader-primary)'},
	];

	const baseMytypeFilterOptions = [
		{key: '', label: 'All maps', iconFa: 'fa fa-music', color: 'var(--beatleader-primary)'},
		{key: 'played', label: 'Played', iconFa: 'fa fa-user', color: 'var(--beatleader-primary)'},
		{key: 'unplayed', label: 'Not played', iconFa: 'fa fa-times', color: 'var(--beatleader-primary)'},
	];

	let mytypeFilterOptions = baseMytypeFilterOptions;

	const categoryFilterOptions = Object.entries(typesMap).map(([key, type]) => {
		return {
			key: type,
			label: capitalize(typesDescription?.[key]?.name ?? key),
			icon: `<span class="${typesDescription?.[key]?.icon ?? `${key}-icon`}"></span>`,
			color: typesDescription?.[key]?.color ?? 'var(--beatleader-primary',
			textColor: typesDescription?.[key]?.textColor ?? null,
		};
	});

	const requirementFilterOptions = Object.entries(requirementsDescription).map(([key, description]) => {
		return {
			key: requirementsMap[key],
			label: capitalize(description?.name ?? key),
			icon: `<span class="${description?.icon ?? `${key}-icon`}"></span>`,
			color: description?.color ?? 'var(--beatleader-primary',
			textColor: description?.textColor ?? null,
			title: description?.title ?? null,
		};
	});

	const songStatusOptions = Object.entries(songStatusesFilterMap).map(([key, type]) => {
		return {
			key: type,
			label: capitalize(songStatusesDescription?.[key]?.name ?? key),
			icon: `<span class="${songStatusesDescription?.[key]?.icon ?? `${key}-icon`}"></span>`,
			color: songStatusesDescription?.[key]?.color ?? 'var(--beatleader-primary',
			textColor: songStatusesDescription?.[key]?.textColor ?? null,
			title: songStatusesDescription?.[key]?.title ?? null,
		};
	});

	const modeNullPlaceholder = 'Any mode';
	const modeFilterOptions = [
		{
			key: null,
			label: modeNullPlaceholder,
		},
	].concat(
		Object.entries(modeDescriptions).map(([key, type]) => {
			return {
				key,
				label: capitalize(modeDescriptions?.[key]?.title ?? key),
				icon: `<span class="${modeDescriptions?.[key]?.icon ?? `${key}-icon`}"></span>`,
				color: modeDescriptions?.[key]?.color ?? 'var(--beatleader-primary',
				textColor: modeDescriptions?.[key]?.textColor ?? null,
			};
		})
	);

	const difficultyNullPlaceholder = 'Any diff';
	const difficultyFilterOptions = [
		{
			key: null,
			label: difficultyNullPlaceholder,
		},
	].concat(
		Object.entries(difficultyDescriptions).map(([key, type]) => {
			return {
				key,
				label: capitalize(difficultyDescriptions?.[key]?.title ?? key),
				icon: `<span class="${difficultyDescriptions?.[key]?.icon ?? `${key}-icon`}"></span>`,
				color: difficultyDescriptions?.[key]?.color ?? 'var(--beatleader-primary',
				textColor: difficultyDescriptions?.[key]?.textColor ?? null,
			};
		})
	);

	function changePageAndFilters(newPage, newFilters, replace, setUrl = true) {
		currentFilters = newFilters;

		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentPage = newPage;

		if (setUrl) {
			const query = buildSearchFromFiltersWithDefaults(currentFilters, params);
			const url = `/scores/${currentPage}${query.length ? '?' + query : ''}`;
			if (replace) {
				window.history.replaceState({}, '', url);
			} else {
				window.history.pushState({}, '', url);
			}
		}

		serviceParamsManager.update(
			{page: currentPage, sort: currentFilters.sort, order: currentFilters.order, filters: currentFilters},
			'scores',
			true
		);

		serviceParams = serviceParamsManager.getParams();
	}

	function navigateToCurrentPageAndFilters(replaceState) {
		changePageAndFilters(currentPage, currentFilters, replaceState);
	}

	function onSearchChanged(e) {
		var search = e.target.value ?? '';

		if (search.length > 0 && search.length < 2) return;

		currentFilters.search = search;
		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onTypeChanged(event) {
		if (!event?.detail) return;

		currentFilters.type = event.detail.key ?? '';
		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	async function onCategoryModeChanged() {
		await tick();
		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onCategoryChanged(event) {
		if (!event?.detail?.key) return;

		if (!currentFilters.mapType) currentFilters.mapType = 0;

		if (currentFilters.mapType & event.detail.key) currentFilters.mapType &= currentFilters.mapType ^ event.detail.key;
		else currentFilters.mapType |= event.detail.key;

		if (!currentFilters.mapType) currentFilters.mapType = null;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onRequirementsChanged(event) {
		if (!event?.detail?.key) return;

		if (!currentFilters.mapRequirements) currentFilters.mapRequirements = 0;

		if (currentFilters.mapRequirements & event.detail.key)
			currentFilters.mapRequirements &= currentFilters.mapRequirements ^ event.detail.key;
		else currentFilters.mapRequirements |= event.detail.key;

		if (!currentFilters.mapRequirements) currentFilters.mapRequirements = null;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onSongStatusChanged(event) {
		if (!event?.detail?.key) return;

		if (!currentFilters.songStatus) currentFilters.songStatus = 0;

		if (currentFilters.songStatus & event.detail.key) currentFilters.songStatus &= currentFilters.songStatus ^ event.detail.key;
		else currentFilters.songStatus |= event.detail.key;

		if (!currentFilters.songStatus) currentFilters.songStatus = null;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onMyTypeChanged(event) {
		if (!event?.detail) return;

		currentFilters.mytype = event.detail.key ?? '';
		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	async function onModeChanged(event) {
		await tick();

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	async function onDifficultyChanged(event) {
		await tick();

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function starsChanged() {
		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onStarsChanged(event, ratingType) {
		if (!Array.isArray(event?.detail?.values) || event.detail.values.length !== 2) return;

		if (sliderLimits.MIN_STARS != event.detail.values[0] || Number.isFinite(currentFilters[ratingType + '_from'])) {
			currentFilters[ratingType + '_from'] = Number.isFinite(event.detail.values[0]) ? event.detail.values[0] : undefined;
		}

		if (sliderLimits.MAX_STARS != event.detail.values[1] || Number.isFinite(currentFilters[ratingType + '_to'])) {
			currentFilters[ratingType + '_to'] = Number.isFinite(event.detail.values[1]) ? event.detail.values[1] : undefined;
		}
		starsChanged();
	}
	const debouncedOnStarsChanged = debounce(onStarsChanged, FILTERS_DEBOUNCE_MS);

	function onDateRangeChange(event) {
		if (!event?.detail) return;

		currentFilters.date_from = event.detail?.from ? parseInt(event.detail.from.getTime() / 1000) : null;
		currentFilters.date_to = event.detail?.to ? parseInt(event.detail.to.getTime() / 1000) : null;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onMappersChange(event) {
		currentFilters.mappers = event.detail.join(',');

		navigateToCurrentPageAndFilters();
	}

	function onPlayersChange(event) {
		currentFilters.players = event.detail.join(',');

		navigateToCurrentPageAndFilters();
	}

	var showAllRatings = false;

	function updateProfileSettings(account) {
		if (account?.player?.profileSettings) {
			showAllRatings = account.player.profileSettings.showAllRatings;
		}
	}

	const debouncedOnDateRangeChanged = debounce(onDateRangeChange, FILTERS_DEBOUNCE_MS);

	function onPageChanged(e) {
		let newPage = e?.detail ?? null;
		if (!newPage) return;

		if (!Number.isFinite(newPage)) newPage = 1;

		currentPage = newPage;

		navigateToCurrentPageAndFilters(true);
	}

	function onScoresParamsChanged(e) {
		const newServiceParams = e?.detail ?? null;
		if (!newServiceParams) return;

		currentFilters.sort = newServiceParams.sort;
		currentFilters.order = newServiceParams.order;

		navigateToCurrentPageAndFilters();
	}

	function boolflip(name) {
		$configStore = produce($configStore, draft => {
			draft.preferences[name] = !draft.preferences[name];
		});
	}

	let sotw = null;

	function getSotw() {
		fetch(`${BL_API_URL}score/sotw`)
			.then(r => r.json())
			.then(response => {
				sotw = response;
			});
	}

	$: showFilters = $configStore.preferences.showFiltersOnRanking;
	$: hasRatingsByDefault = currentFilters.type === 'ranked' || currentFilters.type === 'nominated' || currentFilters.type === 'qualified';
	$: starFiltersDisabled = !hasRatingsByDefault && !showAllRatings;
	$: sliderLimits = hasRatingsByDefault ? Ranked_Const : Unranked_Const;

	$: getSotw();

	const now = Date.now() / 1000;
	const today = dateFromUnix(now - 60 * 60 * 24);
	const lastWeek = dateFromUnix(now - 60 * 60 * 24 * 7);
	const lastYear = dateFromUnix(now - 60 * 60 * 24 * 365);

	let isDateFilterOpen = !!(currentFilters.date_from || currentFilters.date_to);
	let isCategoryFilterOpen = !!currentFilters.mapType;
	let isRequirementsFilterOpen = !!currentFilters.mapRequirements;
	let isStarsFilterOpen = !!(
		currentFilters.stars_from ||
		currentFilters.stars_to ||
		currentFilters.accrating_from ||
		currentFilters.accrating_to ||
		currentFilters.passrating_from ||
		currentFilters.passrating_to ||
		currentFilters.techrating_from ||
		currentFilters.techrating_to
	);
</script>

<svelte:head>
	<title>Scores / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<div class="ranking-switcher">
			<TabSwitcher values={tabOptions} value={currentTab} on:change={onTabChanged} class="ranking" />
		</div>

		<ContentBox bind:box={boxEl}>
			<Scores
				playerId={ALL_SCORES_PLAYER_ID}
				initialService="scores"
				initialServiceParams={serviceParams}
				on:page-changed={onPageChanged}
				on:service-params-changed={onScoresParamsChanged}
				withPlayers={true} />
		</ContentBox>
	</article>

	<aside class="scores-aside-container">
		<AsideBox title="Filters" boolname="showFiltersOnScores" faicon="fas fa-filter">
			<section class="filter">
				<label>Song/Author/Hash/bsr</label>

				<input
					on:input={debounce(onSearchChanged, FILTERS_DEBOUNCE_MS)}
					type="text"
					class="search"
					placeholder="Search..."
					value={currentFilters.search} />
			</section>

			<section class="filter">
				<PlayersPicker
					currentPlayerId={$account.player && $account.player.playerInfo.id}
					playerIds={currentFilters.players?.split(',') ?? []}
					on:change={e => onPlayersChange(e)} />
			</section>

			<section class="filter">
				<Mappers
					currentMapperId={$account.player && $account.player.playerInfo.mapperId}
					mapperIds={currentFilters.mappers?.split(',').map(id => parseInt(id)) ?? []}
					on:change={e => onMappersChange(e)} />
			</section>

			<section class="filter">
				<Switcher values={typeFilterOptions} value={typeFilterOptions.find(o => o.key === currentFilters.type)} on:change={onTypeChanged} />
			</section>

			<section class="filter dropdown-filter" class:has-value={!!currentFilters.mapType}>
				<div class="dropdown-header" on:click={() => (isCategoryFilterOpen = !isCategoryFilterOpen)}>
					<div class="header-content">
						<i class="fas fa-tags" />
						<span>Categories</span>
					</div>
					<i class="fas fa-chevron-{isCategoryFilterOpen ? 'up' : 'down'}" />
				</div>

				{#if isCategoryFilterOpen}
					<div class="dropdown-content" transition:fade>
						<Select
							bind:value={currentFilters.allTypes}
							on:change={() => onCategoryModeChanged()}
							fontSize="0.8"
							options={[
								{name: 'ANY category', value: 0},
								{name: 'ALL categories', value: 1},
								{name: 'NO categories', value: 2},
							]} />

						<Switcher
							values={categoryFilterOptions}
							value={categoryFilterOptions.filter(c => currentFilters.mapType & c.key)}
							multi={true}
							on:change={onCategoryChanged} />
					</div>
				{/if}
			</section>

			<section class="filter dropdown-filter" class:has-value={!!currentFilters.mapRequirements}>
				<div class="dropdown-header" on:click={() => (isRequirementsFilterOpen = !isRequirementsFilterOpen)}>
					<div class="header-content">
						<i class="fas fa-list-check" />
						<span>Requirements</span>
					</div>
					<i class="fas fa-chevron-{isRequirementsFilterOpen ? 'up' : 'down'}" />
				</div>

				{#if isRequirementsFilterOpen}
					<div class="dropdown-content" transition:fade>
						<Select
							bind:value={currentFilters.allRequirements}
							on:change={() => onCategoryModeChanged()}
							fontSize="0.8"
							options={[
								{name: 'ANY map feature', value: 0},
								{name: 'ALL map features', value: 1},
								{name: 'NO map features', value: 2},
							]} />

						<Switcher
							values={requirementFilterOptions}
							value={requirementFilterOptions.filter(c => currentFilters.mapRequirements & c.key)}
							multi={true}
							on:change={onRequirementsChanged} />
					</div>
				{/if}
			</section>

			<section
				class="filter dropdown-filter"
				class:has-value={!!(
					currentFilters.stars_from ||
					currentFilters.stars_to ||
					currentFilters.accrating_from ||
					currentFilters.accrating_to ||
					currentFilters.passrating_from ||
					currentFilters.passrating_to ||
					currentFilters.techrating_from ||
					currentFilters.techrating_to
				)}>
				<div class="dropdown-header" on:click={() => (isStarsFilterOpen = !isStarsFilterOpen)}>
					<div class="header-content">
						<i class="fas fa-star" />
						<span>Ratings</span>
					</div>
					<i class="fas fa-chevron-{isStarsFilterOpen ? 'up' : 'down'}" />
				</div>

				{#if isStarsFilterOpen}
					<section
						class="filter"
						class:disabled={starFiltersDisabled}
						title={starFiltersDisabled ? 'Filter only available for maps with stars' : null}>
						<label>
							Stars
							<span>{formatNumber(currentFilters.stars_from, 2, false, 'Any')}<sup>★</sup></span> to
							<span>{formatNumber(currentFilters.stars_to, 2, false, 'Any')}<sup>★</sup></span>
							{#if currentFilters.stars_from || currentFilters.stars_to}
								<button
									class="remove-type"
									title="Remove"
									on:click={() => {
										currentFilters.stars_from = null;
										currentFilters.stars_to = null;
										starsChanged();
									}}><i class="fas fa-xmark" /></button>
							{/if}
						</label>
						<RangeSlider
							range
							min={sliderLimits.MIN_STARS}
							max={sliderLimits.MAX_STARS}
							step={sliderLimits.STAR_GRANULARITY}
							values={[
								Number.isFinite(currentFilters.stars_from) ? currentFilters.stars_from : Number.NEGATIVE_INFINITY,
								Number.isFinite(currentFilters.stars_to) ? currentFilters.stars_to : Number.POSITIVE_INFINITY,
							]}
							float
							hoverable
							pips
							pipstep={sliderLimits.STAR_STEP}
							all="label"
							on:change={e => debouncedOnStarsChanged(e, 'stars')}
							disabled={starFiltersDisabled} />
					</section>

					<section
						class="filter"
						class:disabled={starFiltersDisabled}
						title={starFiltersDisabled ? 'Filter only available for maps with stars' : null}>
						<label>
							Acc rating
							<span>{formatNumber(currentFilters.accrating_from, 2, false, 'Any')}<sup>★</sup></span> to
							<span>{formatNumber(currentFilters.accrating_to, 2, false, 'Any')}<sup>★</sup></span>
							{#if currentFilters.accrating_from || currentFilters.accrating_to}
								<button
									class="remove-type"
									title="Remove"
									on:click={() => {
										currentFilters.accrating_from = null;
										currentFilters.accrating_to = null;
										starsChanged();
									}}><i class="fas fa-xmark" /></button>
							{/if}
						</label>
						<RangeSlider
							range
							min={sliderLimits.MIN_STARS}
							max={sliderLimits.MAX_STARS}
							step={sliderLimits.STAR_GRANULARITY}
							values={[
								Number.isFinite(currentFilters.accrating_from) ? currentFilters.accrating_from : Number.NEGATIVE_INFINITY,
								Number.isFinite(currentFilters.accrating_to) ? currentFilters.accrating_to : Number.POSITIVE_INFINITY,
							]}
							float
							hoverable
							pips
							pipstep={sliderLimits.STAR_STEP}
							all="label"
							on:change={e => debouncedOnStarsChanged(e, 'accrating')}
							disabled={starFiltersDisabled} />
					</section>

					<section
						class="filter"
						class:disabled={starFiltersDisabled}
						title={starFiltersDisabled ? 'Filter only available for maps with stars' : null}>
						<label>
							Pass rating
							<span>{formatNumber(currentFilters.passrating_from, 2, false, 'Any')}<sup>★</sup></span> to
							<span>{formatNumber(currentFilters.passrating_to, 2, false, 'Any')}<sup>★</sup></span>
							{#if currentFilters.passrating_from || currentFilters.passrating_to}
								<button
									class="remove-type"
									title="Remove"
									on:click={() => {
										currentFilters.passrating_from = null;
										currentFilters.passrating_to = null;
										starsChanged();
									}}><i class="fas fa-xmark" /></button>
							{/if}
						</label>
						<RangeSlider
							range
							min={sliderLimits.MIN_STARS}
							max={sliderLimits.MAX_STARS}
							step={sliderLimits.STAR_GRANULARITY}
							values={[
								Number.isFinite(currentFilters.passrating_from) ? currentFilters.passrating_from : Number.NEGATIVE_INFINITY,
								Number.isFinite(currentFilters.passrating_to) ? currentFilters.passrating_to : Number.POSITIVE_INFINITY,
							]}
							float
							hoverable
							pips
							pipstep={sliderLimits.STAR_STEP}
							all="label"
							on:change={e => debouncedOnStarsChanged(e, 'passrating')}
							disabled={starFiltersDisabled} />
					</section>

					<section
						class="filter"
						class:disabled={starFiltersDisabled}
						title={starFiltersDisabled ? 'Filter only available for maps with stars' : null}>
						<label>
							Tech rating
							<span>{formatNumber(currentFilters.techrating_from, 2, false, 'Any')}<sup>★</sup></span> to
							<span>{formatNumber(currentFilters.techrating_to, 2, false, 'Any')}<sup>★</sup></span>
							{#if currentFilters.techrating_from || currentFilters.techrating_to}
								<button
									class="remove-type"
									title="Remove"
									on:click={() => {
										currentFilters.techrating_from = null;
										currentFilters.techrating_to = null;
										starsChanged();
									}}><i class="fas fa-xmark" /></button>
							{/if}
						</label>
						<RangeSlider
							range
							min={sliderLimits.MIN_STARS}
							max={sliderLimits.MAX_STARS}
							step={sliderLimits.STAR_GRANULARITY}
							values={[
								Number.isFinite(currentFilters.techrating_from) ? currentFilters.techrating_from : Number.NEGATIVE_INFINITY,
								Number.isFinite(currentFilters.techrating_to) ? currentFilters.techrating_to : Number.POSITIVE_INFINITY,
							]}
							float
							hoverable
							pips
							pipstep={sliderLimits.STAR_STEP}
							all="label"
							on:change={e => debouncedOnStarsChanged(e, 'techrating')}
							disabled={starFiltersDisabled} />
					</section>
				{/if}
			</section>

			<section class="filter dropdown-filter" class:has-value={!!(currentFilters.date_from || currentFilters.date_to)}>
				<div class="dropdown-header" on:click={() => (isDateFilterOpen = !isDateFilterOpen)}>
					<div class="header-content">
						<i class="fas fa-calendar-alt" />
						<span>Date posted</span>
					</div>
					<i class="fas fa-chevron-{isDateFilterOpen ? 'up' : 'down'}" />
				</div>

				{#if isDateFilterOpen}
					<DateRange
						dateFrom={dateFromUnix(currentFilters.date_from)}
						dateTo={dateFromUnix(currentFilters.date_to)}
						on:change={debouncedOnDateRangeChanged} />

					<div class="time-presets">
						<Button
							label="Today"
							type={Math.abs(dateFromUnix(currentFilters.date_from)?.getTime() - today.getTime()) < 600000 ? 'primary' : 'default'}
							on:click={() => onDateRangeChange({detail: {from: today, to: null}})} />
						<Button
							label="Last week"
							type={Math.abs(dateFromUnix(currentFilters.date_from)?.getTime() - lastWeek.getTime()) < 600000 ? 'primary' : 'default'}
							on:click={() => onDateRangeChange({detail: {from: lastWeek, to: null}})} />
						<Button
							label="Last year"
							type={Math.abs(dateFromUnix(currentFilters.date_from)?.getTime() - lastYear.getTime()) < 600000 ? 'primary' : 'default'}
							on:click={() => onDateRangeChange({detail: {from: lastYear, to: null}})} />
					</div>
				{/if}
			</section>

			<section class="filter">
				<div class="mode-and-diff">
					<div>
						<label>Has diff</label>
						<Select
							bind:value={currentFilters.diff}
							on:change={onDifficultyChanged}
							options={difficultyFilterOptions}
							nullPlaceholder={difficultyNullPlaceholder}
							nameSelector={x => x.label}
							valueSelector={x => x.key} />
					</div>
					<div>
						<label>Has mode</label>
						<Select
							bind:value={currentFilters.mode}
							on:change={onModeChanged}
							options={modeFilterOptions}
							nullPlaceholder={modeNullPlaceholder}
							nameSelector={x => x.label}
							valueSelector={x => x.key} />
					</div>
				</div>
			</section>
		</AsideBox>
		{#if sotw}
			<AsideBox title="Score Of The Week" boolname="showFeaturedScoreOnScores" faicon="fas fa-award">
				<div style="display: flex; width: 100%; height: 100%; justify-content: center;">
					<iframe
						width="100%"
						style="aspect-ratio: 16/9;"
						src={`https://www.youtube-nocookie.com/embed/${sotw.link.replace('https://youtu.be/', '')}?si=b4lLpGGYeIZ8kRb8`}
						title="YouTube video player"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen />
				</div>
			</AsideBox>
		{/if}
	</aside>
</section>

<BackToTop />

<style>
	.align-content {
		display: flex;
		justify-content: center;
	}

	.page-content {
		max-width: 58em;
		width: 100%;
	}

	aside {
		width: 26em;
	}

	:global(.scores-aside-container .aside-box) {
		min-width: unset;
	}

	aside .filter {
		margin-bottom: 1.5rem;
		transition: opacity 300ms;
	}

	aside .filter.disabled {
		opacity: 0.25;
	}

	aside label {
		display: block;
		font-weight: 500;
		margin-bottom: 1rem;
	}

	aside .filter.disabled label {
		cursor: help;
	}

	aside label span {
		color: var(--beatleader-primary);
	}

	aside input {
		width: 100%;
		font-size: 1em;
		color: var(--beatleader-primary);
		background-color: var(--foreground);
		border: none;
		border-bottom: 1px solid var(--faded);
		outline: none;
	}

	.ranking-switcher {
		margin-left: 0.8em;
	}

	:global(.ranking-tab-button) {
		margin-bottom: -0.5em !important;
		height: 3.5em;
		border-radius: 12px 12px 0 0 !important;
		min-width: 7em;
		max-width: 7em;
	}

	:global(.ranking-tab-button span) {
		font-weight: 900;
		text-align: center;
		white-space: break-spaces;
		margin-right: -0.3em;
	}

	aside :global(.switch-types) {
		justify-content: flex-start;
	}

	:global(.content-box.event-banner) {
		display: flex;
		align-items: center;
		grid-gap: 1em;
		justify-content: center;
		margin: 0.6em;
		padding: 0 !important;
		border-radius: 0.5em;
		cursor: pointer;
	}

	:global(.show-filters-box) {
		margin-inline: 0;
		padding: 0.5rem !important;
	}

	.event-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: space-around;
		position: relative;
		height: 9em;
		align-items: center;
		overflow: hidden;
		border-radius: 0.5em;
	}
	:global(.content-box.event-banner .atropos) {
		width: 100%;
		position: absolute;
		width: 100%;
		height: 100%;
	}
	:global(.content-box.event-banner .atropos-highlight) {
		display: none;
	}
	:global(.content-box.event-banner .atropos-shadow) {
		display: none;
	}
	.event-title-mobile {
		display: none;
	}
	.event-title-desktop {
		color: #4caf50 !important;
	}
	.event-text-and-button {
		display: flex;
		flex-direction: column;
		z-index: 2;
		align-items: center;
	}

	.event-text-container {
		display: flex;
		flex-direction: column;
	}

	.event-image {
		width: 7em;
		height: 7em;
		margin-right: 1em;
		border-radius: 18px;
	}

	:global(.event-cover-btn) {
		box-shadow: 1px 1px black !important;
	}
	.cover-bg {
		position: absolute;
		display: block;
		background: url(/assets/week120_bg.webp) !important;
		background-size: cover !important;
		background-position-y: 50% !important;
		bottom: -10%;
		left: -10%;
		height: 120%;
		width: 120%;
	}
	.cover-girls {
		position: absolute;
		display: block;
		background: url(/assets/week120_girl.webp) !important;
		background-size: cover !important;
		background-position-y: 50% !important;
		height: 23em;
		left: calc(50% - 10em);
		top: calc(50% - 8em);
		width: 23em;
	}

	.cover-hands {
		position: absolute;
		display: block;
		background: url(/assets/week120_numbers_big.webp) !important;
		background-size: cover !important;
		background-position-y: 50% !important;
		width: 43em;
		height: 22em;
		left: calc(50% - 23em);
		top: calc(50% - 8.5em);
	}

	.cinematics {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		pointer-events: none;
	}

	.cinematics-canvas {
		filter: blur(5em) opacity(0.5) saturate(250%);
		left: 0;
		opacity: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.1) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
		transition: opacity 0.2s ease-in-out;
	}

	:global(.content-box.event-banner:hover .cinematics-canvas) {
		opacity: 1;
	}

	.event-title {
		color: var(--text-color);
		font-size: x-large;
		font-weight: 800;
		text-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
		text-shadow: 1px 1px 11px #000000e8;
	}

	.event-text {
		color: var(--text-color);
		font-size: larger;
		text-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
	}

	.score-options-section {
		display: grid;
		justify-items: center;
		margin: 0.3em;
	}

	.to-the-left {
		margin-left: -0.5em !important;
	}

	.box-with-left-arrow {
		display: grid;
		align-items: center;
		grid-template-columns: 1em auto !important;
		max-width: 20em;
	}

	.clickable {
		cursor: pointer;
	}

	.remove-type {
		border: none;
		color: rgb(255, 0, 0);
		background-color: transparent;
		cursor: pointer;
		transform: translate(-7px, -2px);
	}

	.time-presets {
		display: flex;
		gap: 0.5em;
		margin-top: 0.4em;
	}

	.dropdown-filter {
		border: 1px solid var(--faded);
		border-radius: 4px;
		overflow: hidden;
	}

	.dropdown-filter.has-value {
		border-color: rgba(255, 100, 150, 0.5);
	}

	.dropdown-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background-color: var(--foreground);
		cursor: pointer;
		user-select: none;
	}

	.dropdown-header:hover {
		background-color: var(--background);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.dropdown-content {
		padding: 1rem;
		background-color: var(--foreground);
	}

	.dropdown-filter + .dropdown-filter {
		margin-top: 1rem;
	}

	:global(.time-presets .button) {
		height: 2em;
		padding: 0.4em;
	}

	@media screen and (max-width: 512px) {
		.cover-hands {
			background-position-y: 0.2em !important;
		}
	}

	@media screen and (max-width: 760px) {
		.cover-hands {
			position: absolute;
			display: block;
			background: url(/assets/week120_numbers.webp) !important;
			background-size: cover !important;
			background-position-y: 50% !important;
			width: 27em;
			height: 22em;
			left: calc(50% - 14em);
			top: calc(50% - 7em);
		}

		.event-title-desktop {
			display: none;
		}
		.event-title-mobile {
			display: block;
			color: #4caf50 !important;
		}

		:global(.event-cover-btn) {
			display: none !important;
		}
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}

		.event-text-container {
			margin-bottom: 1em;
			align-items: center;
			text-align: center;
		}

		.event-image {
			width: 10em;
			height: 10em;
			margin-right: 1em;
		}
	}
</style>
