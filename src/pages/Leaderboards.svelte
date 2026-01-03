<script>
	import {tick} from 'svelte';
	import {navigate} from 'svelte-routing';
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
		buildSearchFromFiltersWithDefaults,
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
		difficultyDescriptions,
		songStatusesFilterMap,
		songStatusesDescription,
	} from '../utils/beatleader/format';
	import {capitalize} from '../utils/js';
	import RankedTimer from '../components/Common/RankedTimer.svelte';
	import {Ranked_Const, Unranked_Const} from './../utils/beatleader/consts';
	import {MetaTags} from 'svelte-meta-tags';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import BackToTop from '../components/Common/BackToTop.svelte';
	import MapCard from '../components/Leaderboards/MapCard.svelte';
	import {configStore} from '../stores/config';
	import {produce} from 'immer';
	import Switch from '../components/Common/Switch.svelte';
	import Select from '../components/Settings/Select.svelte';
	import Mappers from '../components/Leaderboard/Mappers.svelte';
	import PlaylistPicker from '../components/Leaderboard/PlaylistPicker.svelte';

	export let page = 1;
	export let location;

	const FILTERS_DEBOUNCE_MS = 500;

	document.body.classList.remove('slim');

	const account = createAccountStore();

	const playlists = createPlaylistStore();

	const params = [
		{key: 'search', default: '', process: processStringFilter},
		{key: 'type', default: 'ranked', process: processStringFilter},
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
		{key: 'date_range', default: 'upload', process: processStringFilter},
		{key: 'sortBy', default: 'timestamp', process: processStringFilter},
		{key: 'order', default: 'desc', process: processStringFilter},
		{key: 'mode', default: null, process: processStringFilter},
		{key: 'difficulty', default: null, process: processStringFilter},
		{key: 'mapType', default: null, process: processIntFilter},
		{key: 'allTypes', default: 0, process: processIntFilter},
		{key: 'mapRequirements', default: null, process: processIntFilter},
		{key: 'songStatus', default: null, process: processIntFilter},
		{key: 'allRequirements', default: 0, process: processIntFilter},
		{key: 'mappers', default: null, process: processStringFilter},
		{key: 'playlistIds', default: null, process: processStringFilter},
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
	let currentFilters = buildFiltersFromLocation(location);
	let boxEl = null;

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

	const leaderboardsStore = createLeaderboardsStore(page, currentFilters);

	function changePageAndFilters(newPage, newFilters, replace, setUrl = true) {
		currentFilters = newFilters;

		sortValue = currentFilters.sortBy;
		dateRangeValue = currentFilters.date_range;

		sortValues = sortValues1.map(v => {
			let result = {...v};
			if (result.value == 'timestamp') {
				switch (currentFilters.type) {
					case 'ranked':
						result.name = 'Rank date';
						result.title = 'Sort by the date map become ranked';
						break;
					case 'qualified':
						result.name = 'Qualification date';
						result.title = 'Sort by the map qualification date';
						break;
					case 'nominated':
						result.name = 'Nomination date';
						result.title = 'Sort by the map nomination date';
						break;

					default:
						result.name = 'Upload date';
						result.title = 'Sort by the map upload date';
						break;
				}
			}

			return result;
		});

		switch (currentFilters.type) {
			case 'ranked':
				dateRangeOptions = [...dateRangeOptions1, {value: 'ranked', name: 'Map ranking', icon: 'fa-star'}];
				break;
			case 'qualified':
				dateRangeOptions = [...dateRangeOptions1, {value: 'qualification', name: 'Map qualification', icon: 'fa-vote-yea'}];
				break;
			case 'nominated':
				dateRangeOptions = [...dateRangeOptions1, {value: 'nomination', name: 'Map nomination', icon: 'fa-cheak-circle'}];
				break;
			default:
				dateRangeOptions = dateRangeOptions1;
		}

		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentPage = newPage;

		if (setUrl) {
			const query = buildSearchFromFiltersWithDefaults(currentFilters, params);
			const url = `/leaderboards/${currentPage}${query.length ? '?' + query : ''}`;
			if (replace) {
				window.history.replaceState({}, '', url);
			} else {
				window.history.pushState({}, '', url);
			}
		}

		leaderboardsStore.fetch(currentPage, {...currentFilters});
	}

	function navigateToCurrentPageAndFilters(replaceState) {
		changePageAndFilters(currentPage, currentFilters, replaceState);
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		currentPage = event.detail.page + 1;

		navigateToCurrentPageAndFilters(true);
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

	let sortValues1 = [
		{value: 'stars', name: 'Star', title: 'Sort by stars', icon: 'fa-star'},
		{value: 'accRating', name: 'Accability', title: 'Sort by acc rating', icon: 'fa-star'},
		{value: 'passRating', name: 'Passability', title: 'Sort by pass rating', icon: 'fa-star'},
		{value: 'techRating', name: 'Tech', title: 'Sort by tech rating', icon: 'fa-star'},
		{value: 'name', name: 'Name', title: 'Sort by name', icon: 'fa-a'},
		{value: 'timestamp', name: 'Map date', title: 'Sort by the map date', icon: 'fa-map'},
		{value: 'voting', name: 'Voting', title: 'Sort by positive minus negative vote count', icon: 'fa-vote-yea'},
		{value: 'voteratio', name: 'Vote ratio', title: 'Sort by vote ratio', icon: 'fa-smile-beam'},
		{value: 'votecount', name: 'Vote count', title: 'Sort by amount of votes for the map', icon: 'fa-calculator'},
		{value: 'playcount', name: 'Plays', title: 'Sort by play count', icon: 'fa-user'},
		{value: 'scoreTime', name: 'Newest score', title: 'Sort by the last made score', icon: 'fa-leaf'},
		{value: 'attempts', name: 'Attempts', title: 'Sort by the number of attempts', icon: 'fa-dumbbell'},
		{value: 'duration', name: 'Duration', title: 'Sort by the song duration', icon: 'fa-clock'},
		{value: 'bpm', name: 'BPM', title: 'Sort by the song BPM', icon: 'fa-drum'},
	];
	let sortValues = sortValues1;
	let sortValue = sortValues[0].value;

	function onSortChange(event) {
		if (!event?.detail?.value || event.detail.value == currentFilters.sortBy) return null;

		currentFilters.sortBy = event.detail.value;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onOrderChange() {
		currentFilters.order = currentFilters.order === 'asc' ? 'desc' : 'asc';

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	let dateRangeOptions1 = [
		{value: 'upload', name: 'Map upload', icon: 'fa-upload'},
		{value: 'score', name: 'Recent score', icon: 'fa-calculator'},
	];

	let dateRangeOptions = dateRangeOptions1;

	let dateRangeValue = dateRangeOptions[0].value;

	function onDateRangeChanged(event) {
		if (!event?.detail?.value || event.detail.value == currentFilters.date_range) return null;

		currentFilters.date_range = event.detail.value;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}
	function onDateRangeChange(event) {
		if (!event?.detail) return;

		currentFilters.date_from = event.detail?.from ? parseInt(event.detail.from.getTime() / 1000) : null;
		currentFilters.date_to = event.detail?.to ? parseInt((event.detail.to.getTime() + DAY) / 1000) : null;

		currentFilters = currentFilters;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onMappersChange(event) {
		currentFilters.mappers = event.detail.join(',');

		navigateToCurrentPageAndFilters();
	}

	function onPlaylistIdsChange(event) {
		currentFilters.playlistIds = event.detail.join(',');

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

	$: changePageAndFilters(page, buildFiltersFromLocation(location), false, false);

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
	$: metaDescription = currentFilters.type === 'ranked' ? 'List of Beat Saber ranked maps' : 'Search for leaderboards of Beat Saber maps';
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

	const today = new Date(new Date().setHours(0, 0, 0, 0));
	const lastWeek = new Date(new Date(new Date().setHours(0, 0, 0, 0)).setDate(today.getDate() - 7));
	const lastYear = new Date(new Date(new Date().setHours(0, 0, 0, 0)).setFullYear(today.getFullYear() - 1));

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

	let isPlaylistOpen = false;

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

			<div class="sorting-options">
				<Select bind:value={sortValue} on:change={onSortChange} fontSize="0.8" options={sortValues} />
				<Button
					cls="order-toggle"
					iconFa="fas {currentFilters.order === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'}"
					label={currentFilters.order === 'asc' ? 'Ascending' : 'Descending'}
					title={currentFilters.order === 'asc' ? 'Ascending' : 'Descending'}
					on:click={onOrderChange} />
			</div>

			<h2 class="title is-5">Filters</h2>

			<section class="filter">
				<input
					on:input={debounce(onSearchChanged, FILTERS_DEBOUNCE_MS)}
					type="text"
					class="search"
					placeholder="Search for a map(Song/Author/Hash)..."
					value={currentFilters.search} />
			</section>

			<section class="filter">
				<Mappers
					currentMapperId={$account.player && $account.player.playerInfo.mapperId}
					mapperIds={currentFilters.mappers?.split(',').map(id => parseInt(id)) ?? []}
					on:change={e => onMappersChange(e)} />
			</section>

			<section class="filter">
				<PlaylistPicker
					playlistIds={(currentFilters.playlistIds?.length && currentFilters.playlistIds?.split(',')) ?? []}
					on:change={e => onPlaylistIdsChange(e)} />
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

			<section class="filter">
				<Switcher
					values={songStatusOptions}
					value={songStatusOptions.filter(c => currentFilters.songStatus & c.key)}
					multi={true}
					on:change={onSongStatusChanged} />
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
					<div class="dropdown-content" transition:fade>
						<section class="filter" class:disabled={starFiltersDisabled}>
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

						<section class="filter" class:disabled={starFiltersDisabled}>
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

						<section class="filter" class:disabled={starFiltersDisabled}>
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

						<section class="filter" class:disabled={starFiltersDisabled}>
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
					</div>
				{/if}
			</section>

			<section class="filter dropdown-filter" class:has-value={!!(currentFilters.date_from || currentFilters.date_to)}>
				<div class="dropdown-header" on:click={() => (isDateFilterOpen = !isDateFilterOpen)}>
					<div class="header-content">
						<i class="fas fa-calendar-alt" />
						<span>Date</span>
					</div>
					<i class="fas fa-chevron-{isDateFilterOpen ? 'up' : 'down'}" />
				</div>

				{#if isDateFilterOpen}
					<div class="dropdown-content" transition:fade>
						<div class="date-range-container">
							<label>Date of</label>
							<Select bind:value={dateRangeValue} on:change={onDateRangeChanged} fontSize="0.8" options={dateRangeOptions} />
						</div>

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
					</div>
				{/if}
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

			<section class="filter">
				<div class="mode-and-diff">
					<div>
						<label>Has diff</label>
						<Select
							bind:value={currentFilters.difficulty}
							on:change={onDifficultyChanged}
							fontSize="0.8"
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
							fontSize="0.8"
							options={modeFilterOptions}
							nullPlaceholder={modeNullPlaceholder}
							nameSelector={x => x.label}
							valueSelector={x => x.key} />
					</div>
				</div>
			</section>

			<section class="filter dropdown-filter">
				<div class="dropdown-header" on:click={() => (isPlaylistOpen = !isPlaylistOpen)}>
					<div class="header-content">
						<i class="fas fa-list" />
						<span>Generate Playlist</span>
					</div>
					<i class="fas fa-chevron-{isPlaylistOpen ? 'up' : 'down'}" />
				</div>

				{#if isPlaylistOpen}
					<div class="dropdown-content" transition:fade>
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
							<Button
								cls="playlist-button"
								iconFa="fas fa-wand-magic-sparkles"
								label="Generate playlist"
								on:click={() => generatePlaylist()} />
						{/if}
					</div>
				{/if}
			</section>
		</ContentBox>
	</aside>
</section>

<BackToTop />

<MetaTags
	title={ssrConfig.name + ' - Leaderboards'}
	description={metaDescription}
	openGraph={{
		title: ssrConfig.name + ' - Leaderboards',
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: ssrConfig.name + ' - Leaderboards',
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

	aside :global(.switch-types .icon) {
		width: 1.8em !important;
		margin-left: -0.4em !important;
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

	.mode-and-diff {
		display: flex;
		gap: 1em;
		flex-wrap: wrap;
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

	.time-presets {
		display: flex;
		gap: 0.5em;
		margin-top: 0.4em;
	}

	:global(.time-presets .button) {
		height: 2em;
		padding: 0.4em;
	}

	.date-range-container {
		display: flex;
		gap: 0.4em;
		align-items: center;
		margin-bottom: 0.5em;
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
</style>
