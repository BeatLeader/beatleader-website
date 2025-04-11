<script>
	import {tick} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fade, fly} from 'svelte/transition';
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
	import {substituteVarsUrl} from '../utils/format';
	import RankedTimer from '../components/Common/RankedTimer.svelte';
	import {Ranked_Const, Unranked_Const} from '../utils/beatleader/consts';
	import {MetaTags} from 'svelte-meta-tags';
	import {BL_API_MAPS_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import BackToTop from '../components/Common/BackToTop.svelte';
	import {configStore} from '../stores/config';
	import {produce} from 'immer';
	import Switch from '../components/Common/Switch.svelte';
	import Select from '../components/Settings/Select.svelte';
	import Mappers from '../components/Leaderboard/Mappers.svelte';
	import MapCard from '../components/Maps/List/MapCard.svelte';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';
	import PlaylistPicker from '../components/Leaderboard/PlaylistPicker.svelte';
	import {Svrollbar} from 'svrollbar';
	import {PRIORITY} from '../utils/queue';
	import {fetchJson} from '../network/fetch';
	import AsideBox from '../components/Common/AsideBox.svelte';

	export let page = 1;
	export let type = 'ranked';
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

		if (!filters.mapType) filters.mapType = null;

		return filters;
	});

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentPage = page;
	let previousPage = page > 1 ? page - 1 : page;
	let currentType = type;
	let currentFilters = buildFiltersFromLocation(location);

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
		{key: 'friendsPlayed', label: 'By friends', iconFa: 'fa fa-users', color: 'var(--beatleader-primary)'},
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
	]
		.concat(
			Object.entries(difficultyDescriptions).map(([key, type]) => {
				return {
					key,
					label: capitalize(difficultyDescriptions?.[key]?.title ?? key),
					icon: `<span class="${difficultyDescriptions?.[key]?.icon ?? `${key}-icon`}"></span>`,
					color: difficultyDescriptions?.[key]?.color ?? 'var(--beatleader-primary',
					textColor: difficultyDescriptions?.[key]?.textColor ?? null,
				};
			})
		)
		.concat({
			key: 'fullspread',
			label: 'Full Spread',
			icon: `<span class="fullspread-icon"></span>`,
			color: 'var(--beatleader-primary)',
			textColor: null,
		});

	let numOfMaps = null;
	let itemsPerPage = 12;

	let isLoading = false;
	let loadingPage = null;

	let allMaps = [];
	let activeRequests = {};

	function resetCache(resetPages = true) {
		if (resetPages) {
			previousPage = 1;
			currentPage = 1;
		}
		numOfMaps = 0;
		allMaps = [];

		// for keys in activeRequests
		for (let i in activeRequests) {
			if (activeRequests[i] && activeRequests[i].inProgress) {
				activeRequests[i].controller.abort('resetCache');
			}
		}

		activeRequests = {};
	}

	function populateMapsList(page = 1, type = 'ranked', filters = {}, priority = PRIORITY.FG_LOW, options = {}) {
		if (activeRequests[page] && activeRequests[page].inProgress) {
			return;
		}

		// Create abort controller for this request
		const controller = new AbortController();
		const capturePage = page;

		// Store the request info
		activeRequests[page] = {
			controller,
			inProgress: true,
		};

		const fetchMaps = () => {
			fetch(
				substituteVarsUrl(BL_API_MAPS_URL, {page, count: itemsPerPage, ...filters, type}, true, true),
				{...options, credentials: 'include', signal: controller.signal},
				priority
			)
				.then(d => {
					if (d.status == 200) {
						return d.json();
					} else if (d.status === 429 && d.headers.get('retry-after')) {
						const retryAfter = parseInt(d.headers.get('retry-after'));
						setTimeout(() => {
							if (activeRequests[capturePage] && activeRequests[capturePage].inProgress) {
								fetchMaps();
							}
						}, retryAfter * 1000);
						return {};
					}
					console.error('Error fetching maps:', d.status);
					delete activeRequests[capturePage];
					return {};
				})
				.then(response => {
					let newMaps = response.data;

					if (!newMaps) return;
					for (let i = 0; i < newMaps.length; i++) {
						newMaps[i].index = (capturePage - 1) * itemsPerPage + i;
					}

					for (let i = 0; i < allMaps.length; i++) {
						const element = allMaps[i];
						const fetchedMap = newMaps.find(m => m.index == element.index);
						if (fetchedMap) {
							if (allMaps[i].placeholder && allMaps[i].updateCallback) {
								allMaps[i].updateCallback(fetchedMap);
							}
							allMaps[i] = fetchedMap;
						}
					}

					numOfMaps = response.metadata.total;

					if (allMaps.length > numOfMaps) {
						allMaps = allMaps.slice(0, numOfMaps);
					}

					if (activeRequests[capturePage]) {
						activeRequests[capturePage].inProgress = false;
					}
				});
		};

		fetchMaps();
	}

	function fetchMaps(page = 1, type = 'ranked', filters = {}, priority = PRIORITY.FG_LOW, options = {}) {
		if (allMaps.length < (page + 1) * itemsPerPage) {
			while (allMaps.length < (page + 1) * itemsPerPage) {
				allMaps.push({
					index: allMaps.length,
					name: 'Loading...',
					artist: 'Unknown Artist',
					hash: '00000000000000000000000000000000',
					cover: 'https://via.placeholder.com/150',
					placeholder: true,
				});
			}

			allMaps = allMaps;
		}

		if (numOfMaps && allMaps.length > numOfMaps) {
			allMaps = allMaps.slice(0, numOfMaps);
		}

		if (page > 1) {
			populateMapsList(page - 1, type, filters, priority, options);
		}

		populateMapsList(page, type, filters, priority, options);

		if (!numOfMaps || page < Math.ceil(numOfMaps / itemsPerPage)) {
			populateMapsList(page + 1, type, filters, priority, options);
		}

		for (let i in activeRequests) {
			if (i != page && i != page - 1 && i != page + 1 && activeRequests[i].inProgress) {
				activeRequests[i].controller.abort('fetchMaps');
				activeRequests[i].inProgress = false;
			}
		}
	}

	let scrollChange = false;

	function changePageAndFilters(newPage, newFilters, replace, setUrl = true) {
		currentFilters = newFilters;

		sortValue = currentFilters.sortBy;
		orderValue = currentFilters.order;
		dateRangeValue = currentFilters.date_range;

		sortValues = sortValues1.map(v => {
			let result = {...v};
			if (result.value == 'timestamp') {
				switch (currentType) {
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

		switch (currentType) {
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
			const url = `/maps/${currentType}/${currentPage}${query.length ? '?' + query : ''}`;
			if (replace) {
				window.history.replaceState({}, '', url);
			} else {
				window.history.pushState({}, '', url);
			}
		}

		fetchMaps(currentPage, currentType, {...currentFilters});

		if (!scrollChange) {
			isAutoScrolling = true;
			requestAnimationFrame(() => {
				if (previousPageAnchor && currentPage > 1) {
					const newPosition = previousPageAnchor.offsetTop - 20;
					safeScrollTo({top: newPosition, behavior: 'instant'});
				} else {
					safeScrollTo({top: 0, behavior: 'instant'});
				}
			});
		}

		scrollChange = false;
	}

	function navigateToCurrentPageAndFilters(replaceState) {
		changePageAndFilters(currentPage, currentFilters, replaceState);
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		previousPage = currentPage;
		currentPage = event.detail.page + 1;

		resetCache(false);
		navigateToCurrentPageAndFilters(true);

		console.log('onPageChanged');
	}

	function onSearchChanged(e) {
		var search = e.target.value ?? '';

		if (search.length > 0 && search.length < 2) return;

		currentFilters.search = search;
		resetCache();

		navigateToCurrentPageAndFilters();
	}

	function onTypeChanged(event) {
		if (!event?.detail) return;

		currentType = event.detail.key ?? '';
		resetCache();

		navigateToCurrentPageAndFilters();
	}

	async function onCategoryModeChanged() {
		await tick();
		resetCache();

		navigateToCurrentPageAndFilters();
	}

	function onCategoryChanged(event) {
		if (!event?.detail?.key) return;

		if (!currentFilters.mapType) currentFilters.mapType = 0;

		if (currentFilters.mapType & event.detail.key) currentFilters.mapType &= currentFilters.mapType ^ event.detail.key;
		else currentFilters.mapType |= event.detail.key;

		if (!currentFilters.mapType) currentFilters.mapType = null;

		resetCache();

		navigateToCurrentPageAndFilters();
	}

	function onRequirementsChanged(event) {
		if (!event?.detail?.key) return;

		if (!currentFilters.mapRequirements) currentFilters.mapRequirements = 0;

		if (currentFilters.mapRequirements & event.detail.key)
			currentFilters.mapRequirements &= currentFilters.mapRequirements ^ event.detail.key;
		else currentFilters.mapRequirements |= event.detail.key;

		if (!currentFilters.mapRequirements) currentFilters.mapRequirements = null;

		resetCache();

		navigateToCurrentPageAndFilters();
	}

	function onSongStatusChanged(event) {
		if (!event?.detail?.key) return;

		if (!currentFilters.songStatus) currentFilters.songStatus = 0;

		if (currentFilters.songStatus & event.detail.key) currentFilters.songStatus &= currentFilters.songStatus ^ event.detail.key;
		else currentFilters.songStatus |= event.detail.key;

		if (!currentFilters.songStatus) currentFilters.songStatus = null;

		resetCache();

		navigateToCurrentPageAndFilters();
	}

	function onMyTypeChanged(event) {
		if (!event?.detail) return;

		currentFilters.mytype = event.detail.key ?? '';
		resetCache();

		navigateToCurrentPageAndFilters();
	}

	async function onModeChanged(event) {
		await tick();

		resetCache();

		navigateToCurrentPageAndFilters();
	}

	async function onDifficultyChanged(event) {
		await tick();

		resetCache();

		navigateToCurrentPageAndFilters();
	}

	function starsChanged() {
		resetCache();

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

		resetCache();

		navigateToCurrentPageAndFilters();
	}

	let orderValues = [
		{value: 'asc', name: 'Ascending', icon: 'fa-arrow-up'},
		{value: 'desc', name: 'Descending', icon: 'fa-arrow-down'},
	];
	let orderValue = orderValues[0].value;

	function onOrderChange(event) {
		if (!event?.detail?.value || event.detail.value == currentFilters.order) return null;

		currentFilters.order = event.detail.value;

		resetCache();

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

		resetCache();

		navigateToCurrentPageAndFilters();
	}
	function onDateRangeChange(event) {
		if (!event?.detail) return;

		currentFilters.date_from = event.detail?.from ? parseInt(event.detail.from.getTime() / 1000) : null;
		currentFilters.date_to = event.detail?.to ? parseInt(event.detail.to.getTime() / 1000) : null;

		currentFilters = currentFilters;

		resetCache();

		navigateToCurrentPageAndFilters();
	}

	function onMappersChange(event) {
		currentFilters.mappers = event.detail.join(',');

		resetCache();

		navigateToCurrentPageAndFilters();
	}

	function onPlaylistIdsChange(event) {
		currentFilters.playlistIds = event.detail.join(',');

		resetCache();

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

	function generateMetaTitle() {
		let title = '';

		// Base title by type
		if (currentType === 'ranked') title = 'Ranked Maps';
		else if (currentType === 'qualified') title = 'Qualified Maps';
		else if (currentType === 'nominated') title = 'Nominated Maps';
		else if (currentType === 'ost') title = 'OST Maps';
		else title = 'Maps';

		// Add search term if present
		if (currentFilters.search) {
			title = `"${currentFilters.search}" in ${title}`;
		}

		// Add star rating if present
		if (currentFilters.stars_from && currentFilters.stars_to) {
			title += ` (${formatNumber(currentFilters.stars_from, 1)}★-${formatNumber(currentFilters.stars_to, 1)}★)`;
		} else if (currentFilters.stars_from) {
			title += ` (${formatNumber(currentFilters.stars_from, 1)}★+)`;
		} else if (currentFilters.stars_to) {
			title += ` (up to ${formatNumber(currentFilters.stars_to, 1)}★)`;
		}

		return title;
	}

	function generateMetaDescription() {
		let description = '';

		// Base description by type
		if (currentType === 'ranked') description = 'List of ranked Beat Saber maps';
		else if (currentType === 'qualified') description = 'List of qualified Beat Saber maps';
		else if (currentType === 'nominated') description = 'List of nominated Beat Saber maps';
		else if (currentType === 'ost') description = 'List of Beat Saber OST maps';
		else description = 'Search for Beat Saber maps';

		// Build filter descriptions
		let filters = [];

		// Date range
		if (currentFilters.date_from && currentFilters.date_to) {
			const fromDate = dateFromUnix(currentFilters.date_from);
			const toDate = dateFromUnix(currentFilters.date_to);
			filters.push(`from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`);
		} else if (currentFilters.date_from) {
			const fromDate = dateFromUnix(currentFilters.date_from);
			filters.push(`after ${fromDate.toLocaleDateString()}`);
		} else if (currentFilters.date_to) {
			const toDate = dateFromUnix(currentFilters.date_to);
			filters.push(`before ${toDate.toLocaleDateString()}`);
		}

		// Star rating
		if (currentFilters.stars_from && currentFilters.stars_to) {
			filters.push(
				`with star rating between ${formatNumber(currentFilters.stars_from, 1)} and ${formatNumber(currentFilters.stars_to, 1)}`
			);
		} else if (currentFilters.stars_from) {
			filters.push(`with star rating above ${formatNumber(currentFilters.stars_from, 1)}`);
		} else if (currentFilters.stars_to) {
			filters.push(`with star rating below ${formatNumber(currentFilters.stars_to, 1)}`);
		}

		// Difficulty
		if (currentFilters.difficulty) {
			const difficultyName = difficultyFilterOptions.find(d => d.key === currentFilters.difficulty)?.label;
			if (difficultyName) filters.push(`on ${difficultyName} difficulty`);
		}

		// Mode
		if (currentFilters.mode) {
			const modeName = modeFilterOptions.find(m => m.key === currentFilters.mode)?.label;
			if (modeName) filters.push(`in ${modeName} mode`);
		}

		// Search term
		if (currentFilters.search) {
			filters.push(`matching "${currentFilters.search}"`);
		}

		// Add filters to description
		if (filters.length > 0) {
			description += ' ' + filters.join(', ');
		}

		return description;
	}

	$: updateProfileSettings($account);

	$: changePageAndFilters(page, buildFiltersFromLocation(location), false, false);

	$: starsKey =
		currentFilters.sortBy == 'accRating' || currentFilters.sortBy == 'passRating' || currentFilters.sortBy == 'techRating'
			? currentFilters.sortBy
			: 'stars';

	$: metaTitle = generateMetaTitle();
	$: metaDescription = generateMetaDescription();
	$: hasRatingsByDefault = currentType === 'ranked' || currentType === 'nominated' || currentType === 'qualified';
	$: starFiltersDisabled = !hasRatingsByDefault && !showAllRatings;
	$: sliderLimits = hasRatingsByDefault ? Ranked_Const : Unranked_Const;

	let previousPageAnchor;
	let currentPageAnchor;

	let scrollContainer;
	let asideContainer;
	function scrollToPage(page) {
		previousPage = currentPage;
		currentPage = page + 1;
		scrollChange = true;

		navigateToCurrentPageAndFilters(true);
	}

	let isAutoScrolling = false;

	function safeScrollTo(options) {
		isAutoScrolling = true;
		scrollContainer.style.scrollBehavior = options.behavior || 'smooth';
		scrollContainer.scrollTo(options);
		requestAnimationFrame(() => {
			setTimeout(() => {
				isAutoScrolling = false;
				scrollContainer.style.scrollBehavior = 'auto';
			}, 50);
		});
	}

	function onScroll() {
		if (isAutoScrolling) return;

		const containerTop = scrollContainer.scrollTop;
		if (containerTop < 100) {
			scrollToPage(0);
			return;
		}

		const containerBottom = containerTop + scrollContainer.offsetHeight;

		// Check if current and previous anchors are outside visible area
		const currentNotVisible =
			!currentPageAnchor ||
			currentPageAnchor.offsetTop > containerBottom ||
			currentPageAnchor.offsetTop + currentPageAnchor.offsetHeight < containerTop;

		const previousNotVisible =
			!previousPageAnchor ||
			previousPageAnchor.offsetTop > containerBottom ||
			previousPageAnchor.offsetTop + previousPageAnchor.offsetHeight < containerTop;

		if (
			!previousNotVisible &&
			previousPageAnchor.offsetTop > scrollContainer.scrollTop + scrollContainer.offsetHeight / 2 &&
			currentPage > 1
		) {
			scrollToPage(currentPage - 2);
		} else if (!currentNotVisible && currentPageAnchor.offsetTop < scrollContainer.scrollTop + scrollContainer.offsetHeight / 2) {
			scrollToPage(currentPage);
		} else if (currentNotVisible && previousNotVisible) {
			// If neither anchor is visible, look for other page anchors
			let otherAnchors = Array.from(scrollContainer.querySelectorAll('.other-page-anchor')).sort((a, b) => b.offsetTop - a.offsetTop);

			// First try to find visible anchors
			let foundVisibleAnchor = false;
			for (const anchor of otherAnchors) {
				const anchorTop = anchor.offsetTop;
				if (anchorTop >= containerTop && anchorTop <= containerBottom) {
					const page = parseInt(anchor.textContent);
					if (!isNaN(page)) {
						scrollToPage(page - 1);
						foundVisibleAnchor = true;
						break;
					}
				}
			}

			// If no visible anchors found, find closest anchor below viewport
			if (!foundVisibleAnchor) {
				let closestAnchor = null;
				let closestDistance = Infinity;

				if (previousPageAnchor) {
					otherAnchors.push(previousPageAnchor);
				}

				if (currentPageAnchor) {
					otherAnchors.push(currentPageAnchor);
				}

				for (const anchor of otherAnchors) {
					const distance = Math.abs(anchor.offsetTop + anchor.offsetHeight - containerTop);
					if (distance < closestDistance) {
						closestDistance = distance;
						closestAnchor = anchor;
					}
				}

				if (closestAnchor && closestAnchor.offsetTop + closestAnchor.offsetHeight < containerTop) {
					const page = parseInt(closestAnchor.textContent);
					if (!isNaN(page)) {
						scrollToPage(page);
					}
				}
			}
		}
	}

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

	let isPlaylistOpen = false;
</script>

<svelte:head>
	<title>Maps / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<div class="maps-box">
			{#if allMaps?.length}
				<div class="songs-container">
					<div class="songs-list">
						<div class="songs" class:long={$configStore.mapCards.wideCards} bind:this={scrollContainer} on:scroll={onScroll}>
							{#each allMaps as song, idx (song.index)}
								{@const page = Math.floor(idx / itemsPerPage)}
								{#if idx == 0}
									<div class="first-page-spacer"></div>
								{:else if idx % itemsPerPage == 0}
									{#if page == currentPage - 1}
										<div class="page-split page-maker-{currentPage - 1}" bind:this={previousPageAnchor}>
											{currentPage - 1}
										</div>
									{:else if page == currentPage}
										<div class="page-split page-maker-{currentPage}" bind:this={currentPageAnchor}>
											{currentPage}
										</div>
									{:else}
										<div class="page-split page-maker-{page} other-page-anchor">
											{page}
										</div>
									{/if}
								{/if}
								<MapCard
									map={song}
									{starsKey}
									forcePlaceholder={currentPage != page && currentPage - 1 != page && currentPage - 2 != page}
									sortBy={currentFilters.sortBy}
									dateType={currentType} />
							{/each}
						</div>
						<Svrollbar viewport={scrollContainer} />
					</div>
				</div>
			{:else if isLoading}
				<Spinner />
			{:else}
				<div class="no-maps-found">
					<p>Can't find any maps.</p>
					<a href="https://bsmg.wiki/mapping/">Try making a new one!</a>
				</div>
			{/if}
		</div>
	</article>

	<aside class="maps-aside-container" class:long={$configStore.mapCards.wideCards} bind:this={asideContainer}>
		<AsideBox title="Filters" boolname="mapsFiltersOpen" faicon="fas fa-filter">
			<div class="sorting-options">
				<Select bind:value={sortValue} on:change={onSortChange} fontSize="0.8" options={sortValues} />
				<Select bind:value={orderValue} on:change={onOrderChange} fontSize="0.8" options={orderValues} />
			</div>
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
				<Switcher values={typeFilterOptions} value={typeFilterOptions.find(o => o.key === currentType)} on:change={onTypeChanged} />
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
							type="date"
							dateFrom={dateFromUnix(currentFilters.date_from)}
							dateTo={dateFromUnix(currentFilters.date_to)}
							on:change={debouncedOnDateRangeChanged} />

						<div class="time-presets">
							<Button
								label="Today"
								type={Math.abs(dateFromUnix(currentFilters.date_from)?.getTime() - today.getTime()) < 60000 ? 'primary' : 'default'}
								on:click={() => onDateRangeChange({detail: {from: today, to: null}})} />
							<Button
								label="Last week"
								type={Math.abs(dateFromUnix(currentFilters.date_from)?.getTime() - lastWeek.getTime()) < 60000 ? 'primary' : 'default'}
								on:click={() => onDateRangeChange({detail: {from: lastWeek, to: null}})} />
							<Button
								label="Last year"
								type={Math.abs(dateFromUnix(currentFilters.date_from)?.getTime() - lastYear.getTime()) < 60000 ? 'primary' : 'default'}
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
			<div class="compact-pager-container">
				<Pager
					totalItems={numOfMaps}
					{itemsPerPage}
					itemsPerPageValues={null}
					currentPage={currentPage - 1}
					{loadingPage}
					itemWidth={23}
					mode={numOfMaps ? 'pages' : 'simple'}
					on:page-changed={onPageChanged} />
			</div>
		</AsideBox>
	</aside>
	<Svrollbar viewport={asideContainer} />
</section>

<MetaTags
	title={metaTitle}
	description={metaDescription}
	openGraph={{
		title: metaTitle,
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		siteName: ssrConfig.name + ' - Maps',
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: metaTitle,
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
		width: 100%;
	}

	.songs-container {
		display: flex;
		height: calc(100% - 1.3em);
		margin-top: -1em;
		margin-bottom: -2.9em;
	}

	.maps-box {
		position: fixed !important;
		height: calc(100% - 5em);
		left: 0;
		margin-top: -1em !important;
	}

	:global(.tab-container) {
		display: none;
		justify-content: space-between;
		position: absolute !important;
		bottom: 4em;
		left: 0.4em;
		z-index: 14 !important;
		border-radius: 12px !important;
		overflow: hidden;
		padding: 1.2em 0.7em 0.8em 0.8em !important;
	}

	.first-page-spacer {
		height: 2.4em;
		width: 100%;
	}

	:global(.compact-pager-container) {
		padding: 0.5em;
		border-radius: 12px !important;
		overflow: hidden;
		height: 5em;
	}

	:global(.compact-pager-container .pagination) {
		flex-direction: column;
		align-items: center;
	}

	:global(.compact-pager-container .pagination .position) {
		display: flex;
		justify-content: space-between;
		width: 97%;
	}

	.filter {
		flex: 1;
	}

	:global(.tab-container .switch-types) {
		flex-grow: 1;
		margin-top: -1em;
		margin-bottom: 1.5em;
	}

	.sorting-options {
		display: flex;
		gap: 0.5em;
		position: relative;
		margin-bottom: 1.5em;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	aside {
		position: fixed;
		right: 1em;
		width: 26em;
		padding-left: 0.5em;
		padding-right: 0.5em;
		max-height: 90%;
		overflow: auto;
		/* hide scrollbar */
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	aside::-webkit-scrollbar {
		/* hide scrollbar */
		display: none;
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

	.top-container {
		position: relative;
		height: 1.6em;
		backdrop-filter: blur(6px);
		background-color: #00000094;
		z-index: 6;
		margin: -1em;
	}

	:global(.compact-pager-container .pagination) {
		flex-grow: 1;
	}

	.switchers-container {
		margin-left: 3.4em;
		position: relative;
		z-index: 10;
	}

	.songs {
		display: flex;
		flex-wrap: wrap;
		column-gap: 2em;
		row-gap: 0em;
		justify-content: center;
		align-items: start;
		align-content: baseline;
		position: relative;
		height: 100%;
		overflow: scroll;

		padding-left: calc(50vw - 52em);
		padding-right: calc(50vw - 30em);

		/* hide scrollbar */
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.songs::-webkit-scrollbar {
		/* hide scrollbar */
		display: none;
	}

	.maps-filters-container {
		height: 100%;
		overflow: scroll;

		/* hide scrollbar */
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.maps-filters-container::-webkit-scrollbar {
		/* hide scrollbar */
		display: none;
	}

	.top-anchor {
		width: 100%;
		margin-top: 1em;
		margin-bottom: 1.5em;
	}

	.bottom-anchor {
		width: 100%;
		bottom: 0;
		margin-bottom: 2em;
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

	.page-split {
		width: 60%;
		justify-content: center;
		display: flex;
		margin-top: -2.2em;
		border-bottom: solid 1px white;
		opacity: 0.4;
	}

	:global(.pager-and-switch .pagination) {
		flex-grow: 1;
	}

	:global(.maps-aside-container .aside-box) {
		min-width: unset;
	}

	:global(.mobile-filters-button) {
		font-size: 0.8em !important;
		height: 1.6em !important;
		margin: -0.6em 0.4em 0 0 !important;
	}

	:global(.maps-filters-box) {
		position: fixed;
		height: 89%;
		overflow: auto;
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

	.remove-type {
		border: none;
		color: rgb(255, 0, 0);
		background-color: transparent;
		cursor: pointer;
		transform: translate(-7px, -2px);
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

	.mobile-switcher {
		display: none;
	}

	.no-maps-found {
		width: 70vw;
		height: 100%;
		text-align: center;
		align-content: center;
	}

	:global(.maps-type-button, .my-type-button) {
		margin-bottom: -0.5em !important;
		height: 3.5em;
		border-radius: 12px 12px 0 0 !important;
		width: 7em;
		flex-direction: column;
		align-items: center !important;
		justify-content: center !important;
	}

	:global(.maps-type-button span, .my-type-button span) {
		font-weight: 900;
	}

	:global(.maps-type-button i, .my-type-button i) {
		margin-right: 0 !important;
	}

	@media screen and (min-width: 2000px) {
		aside {
			left: calc(50vw + 32em);
			right: unset;
		}

		aside.long {
			left: calc(50vw + 40em);
		}

		.songs {
			padding-left: calc(50vw - 40em);
			padding-right: calc(50vw - 32em);
		}

		.songs.long {
			padding-left: calc(50vw - 54em);
			padding-right: calc(50vw - 42em);
		}
	}

	@media screen and (max-width: 1275px) {
		.songs {
			padding-left: unset;
			padding-right: calc(50vw - 8em);
		}
		.desktop-switcher {
			display: none;
		}
		.mobile-switcher {
			display: block;
		}
		:global(.my-type-button) {
			margin-bottom: unset !important;
			height: unset;
			border-radius: unset !important;
			width: unset;
			flex-direction: unset;
			align-items: unset !important;
			justify-content: unset !important;
		}

		:global(.my-type-button span) {
			font-weight: unset;
		}

		:global(.my-type-button i) {
			margin-right: unset !important;
		}
	}

	@media screen and (max-width: 767px) {
		.songs {
			margin-left: 0;
			margin-right: 0;
			row-gap: 0.2em;
			padding-right: unset;
		}

		.filter {
			margin: 1em 0;
		}

		.songs-container {
			margin-bottom: 0;
			height: 105%;
		}

		.compact-pager-container {
			margin: unset;
		}

		.page-split {
			margin-top: -1em;
		}

		.first-page-spacer {
			height: 5em;
		}

		:global(.tab-container) {
			display: flex;
		}

		:global(.filter .switch-types) {
			margin-top: -1em;
			margin-bottom: 0.4em;
		}

		aside {
			display: block;
			position: fixed;
			top: 4em;
			padding: 0.5em;
			left: 0;
			width: 100%;
			max-height: 95%;
		}

		.maps-box {
			padding: 0 !important;
			margin-top: 0 !important;
			width: 100%;
			height: 100%;
		}

		:global(.maps-type-button) {
			margin-bottom: -0.5em !important;
			height: 3em;
			padding-top: 0.8em !important;
			border-radius: 8px 8px 0 0 !important;
			width: 6em;
			font-size: 0.7em !important;
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
