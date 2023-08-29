<script>
	import {tick} from 'svelte';
	import {navigate, useLocation} from 'svelte-routing';
	import {fade, fly} from 'svelte/transition';
	import createLeaderboardsStore from '../stores/http/http-leaderboards-store';
	import createAccountStore from '../stores/beatleader/account';
	import createPlaylistStore from '../stores/playlists';
	import ssrConfig from '../ssr-config';
	import Pager from '../components/Common/Pager.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import {debounce} from '../utils/debounce';
	import {formatNumber} from '../utils/format';
	import Switcher from '../components/Common/Switcher.svelte';
	import {
		createBuildFiltersFromLocation,
		buildSearchFromFilters,
		processFloatFilter,
		processStringFilter,
		processIntFilter,
		processBoolFilter,
	} from '../utils/filters';
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
	} from '../utils/beatleader/format';
	import {capitalize} from '../utils/js';
	import RankedTimer from '../components/Common/RankedTimer.svelte';
	import {Ranked_Const, Unranked_Const} from './../utils/beatleader/consts';
	import {MetaTags} from 'svelte-meta-tags';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import BackToTop from '../components/Common/BackToTop.svelte';
	import MapCard from '../components/Leaderboards/MapCard.svelte';
	import {configStore} from '../stores/config';
	import produce from 'immer';
	import Switch from '../components/Common/Switch.svelte';
	import Select from '../components/Settings/Select.svelte';

	export let page = 1;

	const FILTERS_DEBOUNCE_MS = 500;

	const location = useLocation();

	document.body.classList.remove('slim');

	const account = createAccountStore();

	const playlists = createPlaylistStore();

	const params = [
		{key: 'search', default: '', process: processStringFilter},
		{key: 'type', default: '', process: processStringFilter},
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
		{key: 'sortBy', default: 'timestamp', process: processStringFilter},
		{key: 'order', default: 'desc', process: processStringFilter},
		{key: 'mode', default: null, process: processStringFilter},
		{key: 'mapType', default: null, process: processIntFilter},
		{key: 'allTypes', default: 0, process: processIntFilter},
		{key: 'mapRequirements', default: null, process: processIntFilter},
		{key: 'allRequirements', default: 0, process: processIntFilter},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		if (filters.stars_from > filters.stars_to) {
			const tmp = filters.stars_from;
			filters.stars_from = filters.stars_to;
			filters.stars_to = tmp;
		}

		if (!filters?.sortBy?.length) filters.sortBy = 'timestamp';
		if (!filters?.order?.length) filters.order = 'desc';
		if (!filters?.type?.length) filters.type = 'ranked';

		if (!filters.mapType) filters.mapType = null;

		return filters;
	});

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentPage = page;
	let currentFilters = buildFiltersFromLocation($location);
	let boxEl = null;

	const typeFilterOptions = [
		{key: 'all', label: 'All maps', iconFa: 'fa fa-music', color: 'var(--beatleader-primary)'},
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

	const requirementFilterOptions = Object.entries(requirementsMap).map(([key, type]) => {
		return {
			key: type,
			label: capitalize(requirementsDescription?.[key]?.name ?? key),
			icon: `<span class="${requirementsDescription?.[key]?.icon ?? `${key}-icon`}"></span>`,
			color: requirementsDescription?.[key]?.color ?? 'var(--beatleader-primary',
			textColor: requirementsDescription?.[key]?.textColor ?? null,
			title: requirementsDescription?.[key]?.title ?? null,
		};
	});

	const modeFilterOptions = [
		{
			key: null,
			label: 'Any mode',
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

	function addAdditionalFilters(mapper, rt) {
		mytypeFilterOptions = [...baseMytypeFilterOptions];
		if (mapper) {
			mytypeFilterOptions.push({key: 'mymaps', label: 'My maps', iconFa: 'fa fa-cubes', color: 'var(--beatleader-primary)'});
		}
	}

	const leaderboardsStore = createLeaderboardsStore(page, currentFilters);

	function changePageAndFilters(newPage, newLocation) {
		currentFilters = buildFiltersFromLocation(newLocation);

		sortValues = sortValues1.map(v => {
			let result = {...v};
			if (result.id == currentFilters.sortBy) {
				result.iconFa = `fa fa-long-arrow-alt-${currentFilters.order === 'asc' ? 'up' : 'down'}`;
				sortValue = result;
			}

			if (result.id == 'timestamp') {
				switch (currentFilters.type) {
					case 'ranked':
						result.label = 'Rank date';
						result.title = 'Sort by the date map become ranked';
						break;
					case 'qualified':
						result.label = 'Qualification date';
						result.title = 'Sort by the map qualification date';
						break;
					case 'nominated':
						result.label = 'Nomination date';
						result.title = 'Sort by the map nomination date';
						break;

					default:
						result.label = 'Upload date';
						result.title = 'Sort by the map upload date';
						break;
				}
			}

			return result;
		});

		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentPage = newPage;
		leaderboardsStore.fetch(currentPage, {...currentFilters});
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/leaderboards/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);

		document.body.scrollIntoView({behavior: 'smooth'});
	}

	function navigateToCurrentPageAndFilters() {
		navigate(`/leaderboards/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
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

	function starsChanged() {
		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onStarsChanged(event, ratingType) {
		if (!Array.isArray(event?.detail?.values) || event.detail.values.length !== 2) return;

		currentFilters[ratingType + '_from'] = event.detail.values[0];
		currentFilters[ratingType + '_to'] = event.detail.values[1];
		starsChanged();
	}
	const debouncedOnStarsChanged = debounce(onStarsChanged, FILTERS_DEBOUNCE_MS);

	let sortValues1 = [
		{id: 'stars', label: 'Star', title: 'Sort by stars', iconFa: 'fa fa-star'},
		{id: 'accRating', label: 'Accability', title: 'Sort by acc rating', iconFa: 'fa fa-star'},
		{id: 'passRating', label: 'Passability', title: 'Sort by pass rating', iconFa: 'fa fa-star'},
		{id: 'techRating', label: 'Tech', title: 'Sort by tech rating', iconFa: 'fa fa-star'},
		{id: 'name', label: 'Name', title: 'Sort by name', iconFa: 'fa fa-a'},
		{id: 'timestamp', label: 'Map date', title: 'Sort by the map date', iconFa: 'fas fa-map'},
		{id: 'voting', label: 'Voting', title: 'Sort by positive minus negative vote count', iconFa: 'fas fa-vote-yea'},
		{id: 'voteratio', label: 'Vote ratio', title: 'Sort by vote ratio', iconFa: 'far fa-smile-beam'},
		{id: 'votecount', label: 'Vote count', title: 'Sort by amount of votes for the map', iconFa: 'fa fa-calculator'},
		{id: 'playcount', label: 'Plays', title: 'Sort by play count', iconFa: 'fa fa-user'},
		{id: 'scoreTime', label: 'Newest score', title: 'Sort by the last made score', iconFa: 'fa fa-leaf'},
	];
	let sortValues = sortValues1;
	let sortValue = sortValues[0];

	function onSortChange(event) {
		if (!event?.detail?.id) return null;

		if (currentFilters.sortBy == event.detail.id) {
			currentFilters.order = currentFilters.order === 'asc' ? 'desc' : 'asc';
		} else {
			currentFilters.sortBy = event.detail.id;
		}

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onDateRangeChange(event) {
		if (!event?.detail) return;

		currentFilters.date_from = event.detail?.from ? event.detail.from.getTime() / 1000 : null;
		currentFilters.date_to = event.detail?.to ? (event.detail.to.getTime() + DAY) / 1000 : null;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	var showAllRatings = false;

	function updateProfileSettings(account) {
		if (account?.player?.profileSettings) {
			showAllRatings = account.player.profileSettings.showAllRatings;
		}
	}

	const debouncedOnDateRangeChanged = debounce(onDateRangeChange, FILTERS_DEBOUNCE_MS);

	let searchToPlaylist = false;
	let makingPlaylist = false;
	let mapCount = 100;
	let duplicateDiffs = false;
	let playlistTitle = 'Search result';
	function generatePlaylist() {
		makingPlaylist = true;
		playlists.generatePlaylist(mapCount, {...currentFilters, duplicateDiffs, playlistTitle}, () => {
			navigate('/playlists');
		});
	}

	$: document.body.scrollIntoView({behavior: 'smooth'});

	$: isLoading = leaderboardsStore.isLoading;
	$: pending = leaderboardsStore.pending;
	$: numOfMaps = $leaderboardsStore ? $leaderboardsStore?.metadata?.total : null;
	$: itemsPerPage = $leaderboardsStore ? $leaderboardsStore?.metadata?.itemsPerPage : 12;
	$: isRT =
		$account.player &&
		$account.player.playerInfo.role &&
		($account.player.playerInfo.role.includes('admin') || $account.player.playerInfo.role.includes('rankedteam'));

	$: updateProfileSettings($account);

	$: addAdditionalFilters($account.player && $account.player.playerInfo.mapperId, isRT);

	$: changePageAndFilters(page, $location);

	$: starsKey =
		currentFilters.sortBy == 'accRating' || currentFilters.sortBy == 'passRating' || currentFilters.sortBy == 'techRating'
			? currentFilters.sortBy
			: 'stars';

	$: leaderboardsPage = ($leaderboardsStore?.data ?? []).map(m => {
		return {
			...m,
			diffInfo: {diff: m?.difficulty?.difficultyName, type: m?.difficulty?.modeName},
			stars: m?.difficulty?.stars ?? null,
		};
	});
	$: metaDescription = 'Search for ranked maps, playlists and leaderboards for Beat Saber';
	$: hasRatingsByDefault = currentFilters.type === 'ranked' || currentFilters.type === 'nominated' || currentFilters.type === 'qualified';
	$: starFiltersDisabled = !hasRatingsByDefault && !showAllRatings;
	$: sliderLimits = hasRatingsByDefault ? Ranked_Const : Unranked_Const;

	function boolflip(name) {
		$configStore = produce($configStore, draft => {
			draft.preferences[name] = !draft.preferences[name];
		});
	}

	let viewTypeOptions = [
		{
			type: 'maps-cards',
			title: 'Cards view',
			iconFa: 'fas fa-table-columns',
		},
		{
			type: 'maps-table',
			title: 'Table view',
			iconFa: 'fas fa-table',
		},
	];

	function onViewTypeChanged(event) {
		const newType = event?.detail?.type ?? null;
		if (!newType) return;

		$configStore = produce($configStore, draft => {
			draft.preferences.mapsViewType = newType;
		});
	}

	$: viewType = viewTypeOptions.find(vt => vt.type == $configStore?.preferences?.mapsViewType) ?? viewTypeOptions[0];
	$: maps3D = $configStore?.preferences?.maps3D;
</script>

<svelte:head>
	<title>Maps / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<ContentBox cls="maps-box" bind:box={boxEl}>
			<h1 class="title is-5">
				Maps

				{#if $isLoading}<Spinner />{/if}
			</h1>

			<RankedTimer />

			{#if leaderboardsPage?.length}
				<div class="songs">
					{#each leaderboardsPage as map, idx (map.id)}
						<MapCard {map} {idx} {currentFilters} {starsKey} {maps3D} viewType={viewType.type} />
					{/each}
				</div>

				<div class="pager-and-switch">
					<Pager
						totalItems={numOfMaps}
						{itemsPerPage}
						itemsPerPageValues={null}
						currentPage={currentPage - 1}
						loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
						mode={numOfMaps ? 'pages' : 'simple'}
						on:page-changed={onPageChanged} />
					<div class="table-switches">
						<Switcher values={viewTypeOptions} value={viewType} on:change={onViewTypeChanged} />
						<Switch value={maps3D} label="3D" fontSize={12} design="slider" on:click={() => boolflip('maps3D')} />
					</div>
				</div>
			{:else if !$isLoading}
				<p>No maps found.</p>
			{/if}
		</ContentBox>
	</article>

	<aside>
		<ContentBox>
			<h2 class="title is-5">Sorting</h2>

			<Switcher values={sortValues} value={sortValue} on:change={onSortChange} />

			<h2 class="title is-5">Filters</h2>

			<section class="filter">
				<label>Song/Author/Mapper/Hash</label>

				<input
					on:input={debounce(onSearchChanged, FILTERS_DEBOUNCE_MS)}
					type="text"
					class="search"
					placeholder="Search for a map..."
					value={currentFilters.search} />
			</section>

			<section class="filter">
				<Switcher values={typeFilterOptions} value={typeFilterOptions.find(o => o.key === currentFilters.type)} on:change={onTypeChanged} />
			</section>

			{#if $account.id}
				<section class="filter">
					<Switcher
						values={mytypeFilterOptions}
						value={mytypeFilterOptions.find(o => o.key === currentFilters.mytype)}
						on:change={onMyTypeChanged} />
				</section>
			{/if}

			<div style="margin-bottom: 0.1em">
				<Select
					bind:value={currentFilters.allTypes}
					on:change={() => onCategoryModeChanged()}
					fontSize="0.8"
					options={[
						{name: 'ANY category', value: 0},
						{name: 'ALL categories', value: 1},
						{name: 'NO categories', value: 2},
					]} />
			</div>

			<section class="filter">
				<Switcher
					values={categoryFilterOptions}
					value={categoryFilterOptions.filter(c => currentFilters.mapType & c.key)}
					multi={true}
					on:change={onCategoryChanged} />
			</section>

			<div style="margin-bottom: 0.1em">
				<Select
					bind:value={currentFilters.allRequirements}
					on:change={() => onCategoryModeChanged()}
					fontSize="0.8"
					options={[
						{name: 'ANY map feature', value: 0},
						{name: 'ALL map features', value: 1},
						{name: 'NO map features', value: 2},
					]} />
			</div>

			<section class="filter">
				<Switcher
					values={requirementFilterOptions}
					value={requirementFilterOptions.filter(c => currentFilters.mapRequirements & c.key)}
					multi={true}
					on:change={onRequirementsChanged} />
			</section>

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
					values={[currentFilters.stars_from, currentFilters.stars_to]}
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
					values={[currentFilters.accrating_from, currentFilters.accrating_to]}
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
					values={[currentFilters.passrating_from, currentFilters.passrating_to]}
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
					values={[currentFilters.techrating_from, currentFilters.techrating_to]}
					float
					hoverable
					pips
					pipstep={sliderLimits.STAR_STEP}
					all="label"
					on:change={e => debouncedOnStarsChanged(e, 'techrating')}
					disabled={starFiltersDisabled} />
			</section>

			<section class="filter">
				<label>Date range</label>

				<DateRange
					type="date"
					dateFrom={dateFromUnix(currentFilters.date_from)}
					dateTo={dateFromUnix(currentFilters.date_to)}
					on:change={debouncedOnDateRangeChanged} />
			</section>

			<section class="filter">
				<label>Has mode</label>
				<Select
					bind:value={currentFilters.mode}
					on:change={onModeChanged}
					options={modeFilterOptions}
					nameSelector={x => x.label}
					valueSelector={x => x.key} />
			</section>

			<h2 class="title is-5">Playlists</h2>
			<div class="playlist-buttons">
				<Button
					cls="playlist-button"
					iconFa="fas fa-cubes"
					label="Ranked"
					bgColor="var(--beatleader-primary)"
					color="white"
					on:click={() => navigate('/playlist/ranked')} />
				<Button
					cls="playlist-button"
					iconFa="fas fa-check"
					label="Qualified"
					type="primary"
					on:click={() => navigate('/playlist/qualified')} />
				<Button cls="playlist-button" iconFa="fas fa-rocket" label="Nominated" on:click={() => navigate('/playlist/nominated')} />
				<Button
					cls="playlist-button"
					iconFa="fas fa-list"
					type={searchToPlaylist ? 'danger' : 'default'}
					label={searchToPlaylist ? 'Cancel' : 'Playlist from search'}
					on:click={() => (searchToPlaylist = !searchToPlaylist)} />
			</div>
			{#if searchToPlaylist}
				{#if makingPlaylist}
					<Spinner />
				{:else}
					<span>Maps count:</span>
					<RangeSlider
						range
						min={0}
						max={1000}
						step={1}
						values={[mapCount]}
						hoverable
						float
						pips
						pipstep={100}
						all="label"
						on:change={event => {
							mapCount = event.detail.values[0];
						}} />
					<div class="duplicateDiffsContainer">
						<input type="checkbox" id="duplicateDiffs" label="Duplicate map per diff" bind:checked={duplicateDiffs} />
						<label for="duplicateDiffs" title="Will include every diff as a separate map entry">Duplicate map per diff</label>
					</div>
					<div class="playlistTitleContainer">
						<label for="playlistTitle" title="Name of the playlist" style="margin: 0;">Title</label>
						<input type="text" id="playlistTitle" label="Title" bind:value={playlistTitle} />
					</div>
					<Button cls="playlist-button" iconFa="fas fa-wand-magic-sparkles" label="Generate playlist" on:click={() => generatePlaylist()} />
				{/if}
			{/if}
		</ContentBox>
	</aside>
</section>

<BackToTop />

<MetaTags
	title={ssrConfig.name + ' - Maps'}
	description={metaDescription}
	openGraph={{
		title: ssrConfig.name + ' - Maps',
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: ssrConfig.name + ' - Maps',
		description: metaDescription,
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: ssrConfig.name + "'s logo",
	}} />

<style>
	.align-content {
		display: flex;
		justify-content: flex-end !important;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	aside {
		width: 25em;
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
		margin: 0.75rem 0;
	}

	aside .filter.disabled label {
		cursor: help;
	}

	aside label span {
		color: var(--beatleader-primary);
	}

	aside select {
		border-radius: 0.2em;
		padding: 0.4em 0.2em 0.4em 0.6em;
		margin-bottom: 0.25em;
		appearance: menulist-button;
	}

	aside select option {
		color: var(--textColor);
		background-color: var(--background);
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

	aside :global(.switch-types) {
		justify-content: flex-start;
	}

	aside h2:not(:first-of-type) {
		margin-top: 1.5em;
	}

	aside :global(.rangeSlider.pip-labels) {
		margin-top: 1.5em;
		margin-bottom: 4em;
	}

	input::placeholder {
		color: var(--faded) !important;
	}

	.songs {
		display: flex;
		flex-wrap: wrap;
		column-gap: 2em;
		row-gap: 0.8em;
		justify-content: center;
		overflow: visible;
	}

	.pager-and-switch {
		display: flex;
		align-items: baseline;
	}

	.table-switches {
		display: flex;
		gap: 0.5em;
	}

	:global(.pager-and-switch .pagination) {
		flex-grow: 1;
	}

	:global(.maps-box) {
		overflow: hidden;
	}

	.playlist-buttons {
		display: flex;
		margin-top: 1em;
		column-gap: 0.5em;
		flex-wrap: wrap;
	}

	.duplicateDiffsContainer {
		display: flex;
	}

	.playlistTitleContainer {
		margin-bottom: 1em;
	}

	#duplicateDiffs {
		width: auto;
	}

	:global(.playlist-button) {
		height: 1.6em;
	}

	.remove-type {
		border: none;
		color: rgb(255, 0, 0);
		background-color: transparent;
		cursor: pointer;
		transform: translate(-7px, -2px);
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
	}

	@media screen and (max-width: 767px) {
		.icons {
			margin-bottom: 0.5em;
			width: 100%;
		}

		.playlist-buttons {
			flex-direction: column;
		}

		.table-switches {
			flex-direction: column-reverse;
		}
	}

	@media screen and (max-width: 520px) {
		.song-line .main {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			grid-column-gap: 0.75em;
		}

		.songinfo {
			text-align: center;
		}
	}
</style>
