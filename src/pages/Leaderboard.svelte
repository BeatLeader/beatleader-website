<script>
	import {createEventDispatcher} from 'svelte';
	import {fade, fly, slide} from 'svelte/transition';
	import createAccountStore from '../stores/beatleader/account';
	import createLeaderboardStore from '../stores/http/http-leaderboard-store';
	import createVotingStore from '../stores/beatleader/rankVoting';
	import scoreStatisticEnhancer from '../stores/http/enhancers/scores/scoreStatistic';
	import {opt, capitalize} from '../utils/js';
	import stringify from 'json-stable-stringify';
	import ssrConfig from '../ssr-config';
	import {LEADERBOARD_SCORES_PER_PAGE} from '../utils/beatleader/consts';
	import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../utils/accsaber/consts';
	import Value from '../components/Common/Value.svelte';
	import Pager from '../components/Common/Pager.svelte';
	import Badge from '../components/Common/Badge.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';
	import Button from '../components/Common/Button.svelte';
	import Icons from '../components/Song/Icons.svelte';
	import Commentary from '../components/Leaderboard/Commentary.svelte';
	import CriteriaCommentary from '../components/Leaderboard/CriteriaCommentary.svelte';
	import QualityVoting from '../components/Leaderboard/QualityVotes/QualityVoting.svelte';

	import {
		getIconNameForDiff,
		getDescriptionForDiff,
		mapTypeFromMask,
		votingsForTypeStats,
		DifficultyStatus,
		formatDiffStatus,
		modeDescriptions,
	} from '../utils/beatleader/format';
	import {dateFromUnix, formatDateRelative} from '../utils/date';
	import LeaderboardStats from '../components/Leaderboard/LeaderboardStats.svelte';
	import {
		buildSearchFromFiltersWithDefaults,
		createBuildFiltersFromLocation,
		processStringFilter,
		processStringArrayFilter,
	} from '../utils/filters';
	import {flip} from 'svelte/animate';
	import playerScoreApiClient from '../network/clients/beatleader/scores/api-player-score';
	import PpCurve from '../components/Leaderboard/PPCurve.svelte';
	import AttemptsGraph from '../components/Leaderboard/AttemptsGraph.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import QualificationStatus from '../components/Leaderboard/QualificationStatus.svelte';

	import ReweightStatus from '../components/Leaderboard/ReweightStatus.svelte';
	import ReweightStatusRanked from '../components/Leaderboard/ReweightStatusRanked.svelte';
	import LeaderboardMeta from '../components/Leaderboard/LeaderboardMeta.svelte';
	import {produce} from 'immer';
	import {configStore} from '../stores/config';
	import ScoreServiceFilters from '../components/Player/ScoreServiceFilters.svelte';

	import TextFilter from '../components/Player/ScoreFilters/TextFilter.svelte';
	import ModifiersFilter from '../components/Leaderboard/ModifiersPicker/ModifiersFilter.svelte';
	import LeaderboardActionButtons from '../components/Leaderboard/LeaderboardActionButtons.svelte';
	import LeaderboardHeader from '../components/Leaderboard/LeaderboardHeader.svelte';
	import Score from '../components/Leaderboard/Score.svelte';
	import ClanRankingScore from '../components/Leaderboard/ClanRankingScore.svelte';
	import CountryFilter from '../components/Player/ScoreFilters/CountryFilter.svelte';
	import PredictedAccGraph from '../components/Leaderboard/PredictedAccGraph.svelte';
	import FeaturedPlaylist from '../components/Leaderboard/FeaturedPlaylist.svelte';
	import ScoresAccGraph from '../components/Leaderboard/ScoresAccGraph.svelte';
	import MapScoresChart from '../components/Leaderboard/Charts/MapScoresChart.svelte';
	import {invertColor} from '../components/Common/utils/badge';
	import {isPatron} from '../components/Player/Overlay/overlay';
	import Headsets from '../components/Ranking/Headsets.svelte';
	import LeaderboardAsideBox from '../components/Leaderboard/LeaderboardAsideBox.svelte';
	import LeaderboardDevMenu from '../components/Leaderboard/LeaderboardDevMenu.svelte';

	export let leaderboardId;
	export let type = 'global';
	export let page = 1;
	export let location;
	export let dontNavigate = false;
	export let withoutDiffSwitcher = false;
	export let withoutHeader = false;
	export let fixedBrowserTitle = null;
	export let higlightedScore = null;
	export let iconsInInfo = false;
	export let noReplayInLeaderboard = false;
	export let separatePage = false;

	export let autoScrollToTop = true;

	export let showStats = true;
	export let showAttempts = true;
	export let showCurve = false;

	if (!dontNavigate) document.body.classList.add('slim');

	const dispatch = createEventDispatcher();

	const account = createAccountStore();
	const votingStore = createVotingStore();

	const params = [
		{
			key: 'countries',
			default: '',
			process: processStringFilter,
		},
		{
			key: 'clanTag',
			default: '',
			process: processStringFilter,
		},
		{
			key: 'sortBy',
			default: 'rank',
			process: processStringFilter,
		},
		{
			key: 'order',
			default: 'desc',
			process: processStringFilter,
		},
		{
			key: 'search',
			default: null,
			process: processStringFilter,
		},
		{
			key: 'modifiers',
			default: null,
			process: processStringFilter,
		},
		{
			key: 'hmds',
			default: null,
			process: processStringArrayFilter,
		},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params);

	let currentPage = 1;
	let previousPage = 0;
	let initialPage = page;

	function updateFilters(newFilters) {
		currentFilters = newFilters;
		changeParams(currentLeaderboardId, currentType, currentPage, currentFilters);
	}

	function updateParams(leaderboardId, type, page) {
		if (page && !Number.isFinite(page)) page = parseInt(page, 10);
		if (!page || isNaN(page) || page <= 0) page = 1;

		var shouldRefresh = false;

		if (page != currentPage) {
			currentPage = page;
			shouldRefresh = true;
		}

		if (type != currentType) {
			currentType = type;
			shouldRefresh = true;
		}

		if (leaderboardId != currentLeaderboardId) {
			currentLeaderboardId = leaderboardId;
			shouldRefresh = true;
		}

		if (shouldRefresh) {
			changeParams(currentLeaderboardId, currentType, currentPage, currentFilters);
		}
	}

	let currentLeaderboardId = leaderboardId;
	let currentType = type;

	let currentFilters = buildFiltersFromLocation(location);
	let leaderboard = null;

	let modifiedPass = null;
	let modifiedAcc = null;
	let modifiedTech = null;
	let modifiedStars = null;
	let selectedModifiers = [];

	function initRatings(leaderboard) {
		modifiedPass = leaderboard?.stats?.passRating;
		modifiedAcc = leaderboard?.stats?.accRating;
		modifiedTech = leaderboard?.stats?.techRating;
	}

	let itemsPerPage = type === 'accsaber' ? ACCSABER_LEADERBOARD_SCORES_PER_PAGE : LEADERBOARD_SCORES_PER_PAGE;

	let availableTypeOptions = [
		{
			type: 'global',
			label: 'Global',
			iconFa: 'fas fa-globe-americas',
			url: `/leaderboard/global/${currentLeaderboardId}/1`,
			filters: {countries: '', clanTag: '', hmds: ''},
		},
	].concat(
		type === 'accsaber'
			? [
					{
						type: 'accsaber',
						label: 'AccSaber',
						icon: '<div class="accsaber-icon">',
						url: `/leaderboard/accsaber/${currentLeaderboardId}/1`,
						filters: {countries: '', clanTag: ''},
					},
				]
			: []
	);

	let typeOptions = availableTypeOptions.map(to => to);

	let allSortValues = [
		{
			id: 'rank',
			label: 'Rank',
			title: 'Sort by rank',
			iconFa: 'fa fa-cubes',
		},
		{
			id: 'acc',
			label: 'Acc',
			title: 'Sort by accuracy',
			iconFa: 'fa fa-crosshairs',
		},
		{
			id: 'date',
			label: 'Recent',
			title: 'Sort by the time played',
			iconFa: 'fas fa-clock',
		},
		{
			id: 'maxStreak',
			replaceTimeset: true,
			label: '115 Streak',
			title: 'Sort by longest 115 streak',
			iconFa: 'icon115s',
		},
		{
			id: 'pauses',
			replaceTimeset: true,
			label: 'Pauses',
			title: 'Sort by pause count',
			iconFa: 'fas fa-pause',
		},
		{
			id: 'mistakes',
			replaceTimeset: true,
			label: 'Mistakes',
			title: 'Sort by amount of mistakes',
			iconFa: 'icon-mistakes',
		},
		{
			id: 'weight',
			replaceTimeset: true,
			label: 'Weight',
			title: 'Sort by placement of the score on top pages',
			iconFa: 'fas fa-weight-hanging',
			showForStatus: ['Ranked'],
		},
		{
			id: 'weightedPp',
			replaceTimeset: true,
			label: 'Weighted PP',
			title: 'Sort by weighted PP',
			iconFa: 'fas fa-cubes',
			showForStatus: ['Ranked'],
		},
	];

	const stringifyFilters = (query, keys) =>
		stringify((keys ?? Object.keys(query)).reduce((obj, k) => ({...obj, [k]: query?.[k] ?? ''}), {})).toLowerCase();

	const findCurrentTypeOption = (type, filters) => {
		const exactMatch = typeOptions.find(
			to => to?.type === type && stringifyFilters(to?.filters ?? {}) === stringifyFilters(filters, Object.keys(to?.filters ?? []))
		);
		if (exactMatch) return exactMatch;

		return typeOptions.find(to => to?.type === type) ?? null;
	};

	let currentTypeOption = findCurrentTypeOption(currentType, currentFilters) ?? typeOptions[0];

	const leaderboardStore = createLeaderboardStore(leaderboardId, type, page, currentFilters);

	function changeParams(newLeaderboardId, newType, newPage, currentFilters, setUrl, replace) {
		currentLeaderboardId = newLeaderboardId;

		currentType = newType;
		previousPage = currentPage;
		currentPage = parseInt(newPage, 10);
		if (isNaN(currentPage)) currentPage = 1;

		const newCurrentTypeOption = findCurrentTypeOption(currentType, currentFilters);
		if (newCurrentTypeOption) currentTypeOption = newCurrentTypeOption;

		if (setUrl) {
			const query = buildSearchFromFiltersWithDefaults(currentFilters, params);
			const url = `/leaderboard/${currentType}/${currentLeaderboardId}/${currentPage}${query.length ? '?' + query : ''}`;
			if (replace) {
				window.history.replaceState({}, '', url);
			} else {
				window.history.pushState({}, '', url);
			}
		}

		leaderboardStore.fetch(currentLeaderboardId, currentType, currentPage, {...currentFilters});
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		const newPage = event.detail.page + 1;
		initialPage = undefined;

		changeParams(currentLeaderboardId, currentType, newPage, currentFilters, !dontNavigate, false);
	}

	function onDiffChange(event) {
		const newLeaderboardId = opt(event, 'detail.leaderboardId');
		if (!newLeaderboardId) return;

		changeParams(newLeaderboardId, currentType, 1, currentFilters, !dontNavigate, false);
	}

	function onTypeChanged(event) {
		const newType = event?.detail?.type ?? null;
		if (!newType) return;

		const newFilters = {...currentFilters, ...(event?.detail?.filters ?? null)};

		currentFilters = newFilters;
		changeParams(currentLeaderboardId, newType, 1, newFilters, !dontNavigate, true);

		dispatch('type-changed', {leaderboardId: currentLeaderboardId, type: newType, page: currentPage, filters: newFilters});
	}

	function onSelectedGroupEntryChanged(event) {
		changeParams(currentLeaderboardId, currentType, 1, currentFilters, !dontNavigate, false);
	}

	function processDiffs(diffArray, song, leaderboardId) {
		if (!diffArray?.length || !song) return {};

		const idLength = song?.id?.length;
		diffArray = diffArray.sort(function (a, b) {
			let diffNumA = parseInt(a.leaderboardId[idLength]);
			let diffNumB = parseInt(b.leaderboardId[idLength]);
			if (diffNumA < diffNumB) return -1;
			if (diffNumA > diffNumB) return 1;
			return 0;
		});
		diffArray = diffArray.sort(function (a, b) {
			let diffNumA = parseInt(a.leaderboardId.substring(idLength + 1));
			let diffNumB = parseInt(b.leaderboardId.substring(idLength + 1));
			if (diffNumA < diffNumB) return -1;
			if (diffNumA > diffNumB) return 1;
			return 0;
		});

		let currentDiff = diffArray.find(d => d.leaderboardId === leaderboardId);

		if (!currentDiff) {
			currentDiff = diffArray[0];
		}

		let modes = [];
		diffArray.forEach(d => {
			if (!modes.find(m => m.type == d.type)) {
				if (d.name != currentDiff.name && diffArray.find(dd => dd.type == d.type && dd.name == currentDiff.name)) return;

				modes.push({
					...d,
					label: getDescriptionForDiff(d).title,
					url: `/leaderboard/${currentType}/${d.leaderboardId}`,
					cls: 'mode-tab-button',
					icon: `<div class="${getIconNameForDiff(d)}" title="${getDescriptionForDiff(d)}">`,
					projectLink: modeDescriptions[d.type]?.projectLink,
				});
			}
		});

		let diffs = [];
		diffArray.forEach(d => {
			if (!diffs.find(m => m.name == d.name) && d.type == currentDiff.type) {
				diffs.push({
					...d,
					label: d.name + (d.stars ? '\n' + d.stars.toFixed(1) + '★' : ''),
					cls: 'diff-tab-button',
					url: `/leaderboard/${currentType}/${d.leaderboardId}`,
				});
			}
		});

		return {
			diffs,
			modes,
			currentDiff: diffs.find(d => d.leaderboardId === leaderboardId),
			currentMode: modes.find(d => d.leaderboardId === leaderboardId),
		};
	}

	function updateTypeOptions(country, playerIsFollowingSomeone, isRanked, showGraphOption, showAccGraph) {
		//if (!country?.length && !playerIsFollowingSomeone) return;

		typeOptions = availableTypeOptions
			.map(to => to)
			.concat(
				isRanked
					? [
							{
								type: 'clanranking',
								label: 'Clan Ranking',
								iconFa: 'fas fa-flag',
								url: `/leaderboard/clanranking/${currentLeaderboardId}/1`,
								filters: {countries: '', clanTag: '', hmds: ''},
							},
						]
					: []
			)
			.concat(
				showGraphOption
					? [
							{
								type: 'graph',
								label: 'Graph',
								iconFa: 'fas fa-chart-line',
								url: `/leaderboard/graph/${currentLeaderboardId}/1`,
								filters: {countries: '', clanTag: '', hmds: ''},
							},
						]
					: []
			)
			.concat(
				showAccGraph
					? [
							{
								type: 'accgraph',
								label: 'Acc Graph',
								iconFa: 'fas fa-arrow-trend-up',
								url: `/leaderboard/accgraph/${currentLeaderboardId}/1`,
								filters: {countries: '', clanTag: '', hmds: ''},
							},
						]
					: []
			)
			.concat(
				playerIsFollowingSomeone
					? [
							{
								type: 'followed',
								label: 'Followed',
								iconFa: 'fas fa-user-friends',
								url: `/leaderboard/followed/${currentLeaderboardId}/1`,
								filters: {countries: '', clanTag: '', hmds: ''},
							},
						]
					: []
			)
			.concat(
				isRT
					? [
							{
								type: 'voters',
								label: 'Voters',
								iconFa: 'fas fa-user-friends',
								url: `/leaderboard/voters/${currentLeaderboardId}/1`,
								filters: {countries: '', clanTag: '', hmds: ''},
							},
						]
					: []
			)
			.concat(
				isRT
					? [
							{
								type: 'prediction',
								label: 'Prediction',
								iconFa: 'fas fa-wand-magic-sparkles',
								url: `/leaderboard/prediction/${currentLeaderboardId}/1`,
								filters: {countries: '', clanTag: '', hmds: ''},
							},
						]
					: []
			)
			.concat(
				$account?.player?.playerInfo?.clans?.length
					? [
							{
								type: 'clans',
								label: 'My Clans',
								iconFa: 'fas fa-people-group',
								url: `/leaderboard/clans/${currentLeaderboardId}/1`,
								filters: {countries: '', clanTag: $account.player.playerInfo.clans[0].tag, hmds: ''},
							},
						]
					: []
			)
			.concat(
				country?.length
					? [
							{
								type: 'global',
								label: 'Country',
								icon: `<img src="/assets/flags/${country.toLowerCase()}.png" loading="lazy" class="country">`,
								url: `/leaderboard/global/${currentLeaderboardId}/1?countries=${country}`,
								filters: {countries: country, clanTag: '', hmds: ''},
							},
						]
					: []
			);

		const newCurrentTypeOption = findCurrentTypeOption(currentType, currentFilters);
		if (newCurrentTypeOption) currentTypeOption = newCurrentTypeOption;
	}

	let switcherSortValues;
	let sortValue;

	function refreshSortValues(allSortValues, filterValues, leaderboardStatus) {
		switcherSortValues = allSortValues
			.filter(v => {
				return !v.showForStatus || v.showForStatus.includes(leaderboardStatus);
			})
			.map(v => ({
				...v,
				iconFa:
					filterValues?.sortBy === v.id
						? filterValues?.order === 'asc'
							? 'fas fa-long-arrow-alt-up'
							: 'fas fa-long-arrow-alt-down'
						: v.iconFa,
			}));

		if (currentFilters?.sortBy?.length) {
			sortValue = switcherSortValues.find(v => v.id === currentFilters.sortBy);
			if (!sortValue) {
				sortValue = switcherSortValues[0];
				currentFilters.sortBy = sortValue.id;
				changeParams(currentLeaderboardId, currentType, page, currentFilters);
			}
		} else {
			sortValue = switcherSortValues[0];
		}
	}

	function onSwitcherChanged(e) {
		if (!e?.detail?.id) return;

		if (sortValue?.id === e.detail.id) {
			currentFilters.order = currentFilters.order === 'asc' ? 'desc' : 'asc';
		} else {
			currentFilters.sortBy = e.detail.id;
			currentFilters.order = 'desc';
		}

		changeParams(currentLeaderboardId, currentType, 1, currentFilters, !dontNavigate, true);
	}

	var complexFilters = [];
	function makeComplexFilters(currentFilters, mainPlayerCountry) {
		complexFilters = [
			{
				component: TextFilter,
				props: {
					id: 'search',
					iconFa: 'fa fa-search',
					title: 'Search by player name/clan',
					placeholder: 'Enter name or tag...',
					value: currentFilters.search,
					open: currentFilters.search?.length,
				},
			},
			{
				component: CountryFilter,
				props: {
					id: 'countries',
					iconFa: 'fa fa-globe',
					title: 'Search by country',
					placeholder: 'Select or enter country...',
					value: currentFilters.countries,
					open: currentFilters.countries?.length && currentFilters.countries?.toLowerCase() != mainPlayerCountry?.toLowerCase(),
				},
			},
			{
				component: Headsets,
				props: {
					id: 'hmds',
					iconFa: 'fa fa-vr-cardboard',
					title: 'Headsets',
					value: currentFilters.hmds,
					open: currentFilters.hmds?.length,
				},
			},
		];
	}

	function onModifiersChanged(event) {
		currentFilters.modifiers = event?.detail?.value ?? '';

		changeParams(currentLeaderboardId, currentType, 1, currentFilters, !dontNavigate, true);
	}

	function onFiltersChanged(event) {
		const newFilters = event?.detail ?? {};

		currentFilters.search = newFilters.search;
		currentFilters.countries = newFilters.countries;
		currentFilters.hmds = newFilters.hmds;

		changeParams(currentLeaderboardId, currentType, 1, currentFilters, !dontNavigate, true);
	}

	function onClanTagChanged(event) {
		currentFilters.clanTag = event?.detail?.id ?? '';

		changeParams(currentLeaderboardId, currentType, 1, currentFilters, !dontNavigate, true);
	}

	let battleRoyaleDraft = false;
	let battleRoyaleDraftList = [];

	function startBattleRoyale() {
		let link = `https://royale.beatleader.com/?hash=${hash}&difficulty=${capitalize(diffInfo.diff)}&players=${battleRoyaleDraftList
			.map(br => br.playerId)
			.join(',')}`;
		window.open(link, '_blank');
	}

	function startAnalysis() {
		let link = `https://analyzer.beatleader.com/?scoreId=${battleRoyaleDraftList[0].scoreId}&scoreId2=${battleRoyaleDraftList[1].scoreId}`;
		window.open(link, '_blank');
	}

	let userScore = null;
	let userScoreHash = null;
	async function fetchUserScore(playerId, hash, diff, type, userScoreOnCurrentPage = null) {
		if (!playerId?.length || !hash?.length || !diff?.length || !type?.length) {
			userScore = null;
			return;
		}

		const currentHash = `${playerId}${hash}:${diff}:${type}`;
		if (userScoreHash === currentHash) return;

		userScoreHash = currentHash;
		if (userScoreOnCurrentPage) {
			userScore = userScoreOnCurrentPage;
			return;
		}

		try {
			userScore = await playerScoreApiClient.getProcessed({playerId, hash, diff, type});

			if (userScore && !userScore?.player?.clans?.length) {
				userScore.player.clans = $account?.player?.playerInfo?.clans ?? [];
				userScore.leaderboard = $leaderboardStore?.leaderboard;
			}
		} catch (err) {
			userScore = null;
		}
	}

	function updateVoteFeedback(score, value) {
		votingStore.voteFeedback(score.id, value, () => {
			if (!score.rankVoting.feedbacks) {
				score.rankVoting.feedbacks = [];
			}

			score.rankVoting.feedbacks.push({
				rtMember: $account.id,
				value,
			});

			scoresWithUser = scoresWithUser;
		});
	}

	let clanOptions = [];
	let selectedClan = null;

	function updateClanOptions(account) {
		clanOptions = [];

		if (!account?.player?.playerInfo?.clans?.length) return;
		clanOptions = account?.player?.playerInfo?.clans.map(c => {
			return {
				id: c.tag,
				label: c.tag,
				color: c.color ?? '#000000',
				textColor: invertColor(c.color ?? '#000000'),
			};
		});
	}

	function updateSelectedClan(clanOptions, clanTag) {
		selectedClan = clanOptions.find(c => c.id == clanTag);
	}

	let scoresWithUser;
	let clanRankingList;

	const lessFunction = (a, b) => a < b;
	const greaterFunction = (a, b) => a > b;

	function updateScoresWithUser(userScoreOnCurrentPage, scores, userScore) {
		scoresWithUser = scores;
		if (!userScoreOnCurrentPage && scores?.length && userScore) {
			const key = currentFilters.sortBy === 'date' ? 'timeset' : currentFilters.sortBy;
			const orderingFunctions =
				(key === 'rank' && currentFilters.order === 'asc') || (key !== 'rank' && currentFilters.order === 'desc')
					? [greaterFunction, lessFunction]
					: [lessFunction, greaterFunction];

			if (orderingFunctions[0](userScore.score[key], scores[0].score[key])) {
				scoresWithUser = [{...userScore, isUserScore: true, userScoreTop: true}].concat(scores);
			} else if (orderingFunctions[1](userScore.score[key], scores[scores.length - 1]?.score[key])) {
				scoresWithUser = scores.concat([{...userScore, isUserScore: true, userScoreTop: false}]);
			} else if (userScore.score[key] == scores[0].score[key]) {
				scoresWithUser = [{...userScore, isUserScore: true, userScoreTop: true}].concat(scores);
				scoresWithUser[scores.length].score.rank -= 1;
			} else if (userScore.score[key] == scores[scores.length - 1]?.score[key]) {
				scoresWithUser = scores.concat([{...userScore, isUserScore: true, userScoreTop: false}]);
				scoresWithUser[scores.length].score.rank += 1;
			}
		}
	}

	let showAverageStats = false;

	$: isLoading = leaderboardStore.isLoading;
	$: pending = leaderboardStore.pending;

	$: if (autoScrollToTop) document.body.scrollIntoView({behavior: 'smooth'});

	$: updateParams(leaderboardId, type, page);
	$: updateFilters(buildFiltersFromLocation(location));

	$: scores = $leaderboardStore?.scores?.map(s => ({...s, leaderboard: $leaderboardStore?.leaderboard})) ?? null;
	$: clanRankingList = opt($leaderboardStore, 'clanRanking', null);
	$: leaderboard = $leaderboardStore?.leaderboard;
	$: song = opt($leaderboardStore, 'leaderboard.song', null);
	$: initRatings(leaderboard);

	$: ({diffs, modes, currentDiff, currentMode} = processDiffs($leaderboardStore?.diffs ?? [], song, currentLeaderboardId));

	$: hash = opt($leaderboardStore, 'leaderboard.song.hash');
	$: diffInfo = opt($leaderboardStore, 'leaderboard.diffInfo');

	$: isRanked = leaderboard?.stats?.status === DifficultyStatus.ranked;
	$: isQualified = leaderboard?.stats?.status === DifficultyStatus.qualified;
	$: isNominated = isQualified || leaderboard?.stats?.status === DifficultyStatus.nominated;
	$: isInEvent = leaderboard?.stats?.status === DifficultyStatus.inevent;
	$: qualification = leaderboard?.qualification;

	$: currentPlayerId = $account?.id;
	$: higlightedPlayerId = higlightedScore?.playerId ?? currentPlayerId;
	$: mainPlayerCountry = $account?.player?.playerInfo?.country?.country ?? null;

	$: makeComplexFilters(buildFiltersFromLocation(location), mainPlayerCountry);

	$: isAdmin = $account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('admin');
	$: isRT = isAdmin || ($account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('rankedteam'));
	$: isNQT = isAdmin || ($account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('qualityteam'));

	$: playerIsFollowingSomeone = !!$account?.followed?.length;
	$: showGraphOption = $configStore?.leaderboardPreferences?.showGraphOption;
	$: showAccGraph = $configStore?.leaderboardPreferences?.showAccGraph;
	$: updateTypeOptions(mainPlayerCountry, playerIsFollowingSomeone, isRanked, showGraphOption, showAccGraph);
	$: leaderboard?.stats?.status !== undefined &&
		refreshSortValues(allSortValues, currentFilters, formatDiffStatus(leaderboard?.stats?.status));
	$: generalMapperId = song?.mapperId == $account?.player?.playerInfo.mapperId ? $account?.player?.playerInfo.mapperId : null;

	$: userScoreOnCurrentPage = scores?.find(s => s?.player?.playerId === higlightedPlayerId);
	$: fetchUserScore(higlightedPlayerId, song?.hash, leaderboard?.diffInfo?.diff, leaderboard?.diffInfo?.type, userScoreOnCurrentPage);
	$: updateScoresWithUser(userScoreOnCurrentPage, scores, userScore);

	$: votingStore.fetchStatus(hash, diffInfo?.diff, diffInfo?.type);

	$: modifiers = $leaderboardStore?.leaderboard?.difficultyBl?.modifierValues ?? null;
	$: featuredPlaylists = leaderboard?.stats?.featuredPlaylists;

	function boolflip(name) {
		$configStore = produce($configStore, draft => {
			draft.preferences[name] = !draft.preferences[name];
		});
	}

	function curveboolflip(name) {
		$configStore = produce($configStore, draft => {
			draft.ppCurve[name] = !draft.ppCurve[name];
		});
	}

	$: currentType == 'clans' && updateClanOptions($account);
	$: currentType == 'clans' && currentFilters.clanTag?.length && updateSelectedClan(clanOptions, currentFilters.clanTag);

	$: leaderboardStatsShown = $configStore?.preferences?.leaderboardStatsShown;
	$: curveShown = $configStore?.preferences?.curveShown;
	$: attemptsShown = $configStore?.preferences?.attemptsShown;
	$: qualificationInfoShown = $configStore?.preferences?.qualificationInfoShown;
	$: commentaryShown = $configStore?.preferences?.commentaryShown;
	$: leaderboardShowSorting = $configStore?.preferences?.leaderboardShowSorting;
	$: leaderboardShowPlaylists = $configStore?.preferences?.leaderboardShowPlaylists;

	$: replayEnabled = $configStore?.leaderboardPreferences?.show?.replay ?? false;

	$: ratings = {
		passRating: modifiedPass,
		accRating: modifiedAcc,
		techRating: modifiedTech,
		stars: modifiedStars ?? leaderboard?.stats?.stars,
	};
</script>

<svelte:head>
	<title
		>{fixedBrowserTitle
			? fixedBrowserTitle
			: `${opt(song, 'name', 'Leaderboard')} / ${currentDiff ? currentDiff.name + ' / ' : ''} ${page} - ${ssrConfig.name}`}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		{#if leaderboard && song && !withoutHeader}
			<div class="leaderboard-header-box">
				<LeaderboardHeader
					bind:currentLeaderboardId
					bind:battleRoyaleDraft
					{leaderboard}
					{leaderboardStore}
					{ratings}
					batleRoyale={replayEnabled}
					on:group-changed={onSelectedGroupEntryChanged} />
			</div>
		{/if}
		{#if type !== 'accsaber' && !withoutDiffSwitcher}
			<div class="diff-and-mode-switch" style="--spacer-bg-color: {currentDiff?.color ?? 'transparent'}">
				{#if diffs}
					<TabSwitcher values={diffs} value={currentDiff} on:change={onDiffChange} />
				{/if}
				<div class="diff-and-mode-spacer"></div>
				{#if modes}
					<TabSwitcher class="mode-switcher" values={modes} value={currentMode} on:change={onDiffChange} />
				{/if}
			</div>
		{/if}
		<div
			class="leaderboard"
			style={!withoutHeader ? `border: 2px solid ${currentDiff?.color ?? 'transparent'};` : 'margin: 0.4em; border-radius: 6px;'}>
			{#if !$leaderboardStore && $isLoading}
				<div class="align-spinner">
					<Spinner />
				</div>
			{/if}
			{#if $leaderboardStore}
				{#if type !== 'accsaber'}
					<nav class="diff-switch">
						<LeaderboardActionButtons {account} {leaderboard} {votingStore} {diffs} />

						<Switcher values={typeOptions} value={currentTypeOption} on:change={onTypeChanged} />

						{#if currentType != 'clanranking' && currentType != 'accgraph'}
							<div class="sorting-options">
								<span
									class="beat-savior-reveal clickable"
									class:opened={leaderboardShowSorting}
									on:click={() => boolflip('leaderboardShowSorting')}
									on:keydown={() => boolflip('leaderboardShowSorting')}
									title="Show sorting and search for the leaderboard">
									{#if leaderboardShowSorting}
										<i class="fa-solid invert-xmart fa-filter-circle-xmark" />
									{:else}
										<i class="fa-solid fa-filter" />
									{/if}

									<i class="fas fa-chevron-down" />
								</span>
							</div>
						{/if}
					</nav>
				{/if}

				{#if currentType == 'clans'}
					<Switcher values={clanOptions} value={selectedClan} on:change={onClanTagChanged} />
				{/if}

				{#if leaderboardShowSorting && currentType != 'clanranking'}
					<nav class="switcher-nav" transition:slide>
						<Switcher values={switcherSortValues} value={sortValue} on:change={onSwitcherChanged} />
						{#if currentType != 'graph' && currentType != 'accgraph'}
							<div style="display: flex;">
								<ScoreServiceFilters filters={complexFilters} currentFilterValues={currentFilters} on:change={onFiltersChanged} />
								<ModifiersFilter selected={currentFilters.modifiers} on:change={onModifiersChanged} />
							</div>
						{/if}
					</nav>
				{/if}

				{#if battleRoyaleDraft}
					<div class="royale-title-container">
						<span class="royale-title">Select score from the leaderboard to compare</span>
						<div>
							<Button
								type="twitter"
								label="Analyze difference!"
								title={isPatron($account?.player?.playerInfo?.role)
									? 'Use the button to the right of timeset for every score to toggle player'
									: 'Requires Patreon subscription'}
								disabled={battleRoyaleDraftList?.length != 2 || !isPatron($account?.player?.playerInfo?.role)}
								on:click={() => startAnalysis()} />
							<Button
								type="purple"
								label="Watch replay comparison!"
								title="Use the button to the right of timeset for every score to toggle player"
								disabled={!(battleRoyaleDraftList?.length > 1)}
								on:click={() => startBattleRoyale()} />
						</div>
					</div>
				{/if}
				{#if currentType != 'clanranking' && currentType != 'graph' && currentType != 'accgraph'}
					{#if scoresWithUser?.length}
						<div class="scores-grid darkened-background grid-transition-helper">
							{#each scoresWithUser as score, idx ((score?.score?.id ?? '') + (score?.player?.playerId ?? ''))}
								<div
									class={`row-${idx}`}
									class:user-score={score?.isUserScore}
									class:user-score-top={score?.userScoreTop}
									in:fly|global={initialPage == currentPage
										? {}
										: !score?.isUserScore
											? {x: currentPage >= previousPage ? 200 : -200, delay: idx * 20, duration: 500}
											: {duration: 300}}
									out:fade|global={!score?.isUserScore ? {duration: 100} : {duration: 300}}>
									<Score
										{leaderboardId}
										{score}
										{type}
										highlight={score?.player?.playerId === higlightedPlayerId}
										{modifiers}
										{fixedBrowserTitle}
										{battleRoyaleDraft}
										{battleRoyaleDraftList}
										accountRoles={$account?.player?.playerInfo?.role}
										sortBy={currentFilters.sortBy}
										on:royale-add={e => (battleRoyaleDraftList = [...battleRoyaleDraftList, e.detail])}
										on:royale-remove={e =>
											(battleRoyaleDraftList = battleRoyaleDraftList.filter(pId => pId.playerId !== e.detail.playerId))} />

									{#if separatePage && score.score.rankVoting}
										<div class="rank-voting">
											<div class="voting-result">
												<div class="score with-badge">
													<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
														<span slot="label">
															<small title="Rankability">{score.score.rankVoting.rankability > 0 ? 'YES' : 'NO'} </small>
														</span>
													</Badge>
												</div>
												{#if score.score.rankVoting.stars}
													<div class="score with-badge">
														<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
															<span slot="label">
																<small title="Rankability">{score.score.rankVoting.rankability > 0 ? 'YES' : 'NO'} </small>
															</span>
														</Badge>
													</div>
												{/if}
												{#if score.score.rankVoting.stars}
													<div class="score with-badge">
														<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
															<span slot="label">
																<Value title="Stars" value={score.score.rankVoting.stars} inline={false} digits={2} />
															</span>
														</Badge>
													</div>
												{/if}
												{#if score.score.rankVoting.type}
													<div class="score with-badge">
														<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
															<span slot="label">
																<small class="nowrap-label" title="Map type">{mapTypeFromMask(score.score.rankVoting.type)}</small>
															</span>
														</Badge>
													</div>
												{/if}
												{#if score.score.rankVoting.timeset}
													<div class="score with-badge">
														<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
															<span slot="label">
																<small class="nowrap-label" title="Timeset"
																	>{formatDateRelative(dateFromUnix(score.score.rankVoting.timeset))}</small>
															</span>
														</Badge>
													</div>
												{/if}
											</div>
											{#if opt(score, 'player.playerId') != $account?.id}
												<div class="voter-feedback">
													{#if score.score.rankVoting.feedbacks && score.score.rankVoting.feedbacks.filter(f => f.rtMember == $account.id).length}
														{score.score.rankVoting.feedbacks.filter(f => f.rtMember == $account.id)[0].value ? 'Good voter' : 'Bad voter'}
													{:else}
														<Button
															cls="voter-feedback-button"
															type="danger"
															label="Bad voter"
															title="Mark this vote as of bad quality."
															noMargin={true}
															on:click={() => updateVoteFeedback(score.score, 0)} />
														<Button
															cls="voter-feedback-button"
															type="green"
															label="Good voter"
															title="This vote is decently represent the map."
															noMargin={true}
															on:click={() => updateVoteFeedback(score.score, 1)} />
													{/if}
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="scores-grid darkened-background grid-transition-helper">
							<p transition:fade>Empty leaderboard.</p>
						</div>
					{/if}
				{:else if currentType == 'graph'}
					<MapScoresChart
						leaderboardId={currentLeaderboardId}
						sortBy={currentFilters.sortBy}
						order={currentFilters.order}
						{leaderboard}
						{currentPlayerId} />
				{:else if currentType == 'accgraph'}
					<ScoresAccGraph {leaderboard} page={currentPage} />
				{:else if clanRankingList?.length}
					<div class="scores-grid grid-transition-helper">
						{#each clanRankingList as cr, idx (opt(cr, 'clan.tag', ''))}
							<div
								class={`row-${idx}`}
								in:fly={{x: 200, delay: idx * 20, duration: 500}}
								out:fade={{x: 200, delay: idx * 20, duration: 500}}
								animate:flip={{duration: 300}}>
								<ClanRankingScore
									leaderboardId={currentLeaderboardId}
									{idx}
									{cr}
									{type}
									{page}
									{modifiers}
									{fixedBrowserTitle}
									bind:battleRoyaleDraft
									bind:battleRoyaleDraftList
									sortBy={currentFilters.sortBy}
									on:royale-add={e => (battleRoyaleDraftList = [...battleRoyaleDraftList, e.detail])}
									on:royale-remove={e =>
										(battleRoyaleDraftList = battleRoyaleDraftList.filter(pId => pId.playerId !== e.detail.playerId))} />
							</div>
						{/each}
					</div>
				{:else}
					<p transition:fade>No clan ranking found.</p>
				{/if}
				{#if $leaderboardStore.totalItems}
					<div class="pager-container">
						<Pager
							totalItems={$leaderboardStore.totalItems}
							{itemsPerPage}
							itemsPerPageValues={null}
							currentPage={currentPage - 1}
							loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
							mode={$leaderboardStore.totalItems ? 'pages' : 'simple'}
							on:page-changed={onPageChanged} />
					</div>
				{/if}

				{#if currentMode?.projectLink}
					<div class="custom-mode-info">
						<span> This is a leaderboard for modded difficulty. <a href={currentMode.projectLink}>Check here for more info!</a> </span>
					</div>
				{/if}

				{#if !separatePage}
					{#if showStats && leaderboard?.stats}
						<div class="stats-with-icons">
							<LeaderboardStats {leaderboard} />

							{#if iconsInInfo}
								<Icons {song} {diffInfo} mapCheck={true} />
							{/if}
						</div>
					{/if}
				{/if}

				{#if separatePage && type !== 'accsaber' && ((!isNominated && leaderboard?.qualification) || leaderboard?.changes?.length)}
					<div class="score-options-section">
						<span
							class="beat-savior-reveal clickable"
							class:opened={showAverageStats}
							on:click={() => (showAverageStats = !showAverageStats)}
							title="Show average stats and ranking changes">
							{#if showAverageStats}
								Hide details
							{:else}
								Show more details
							{/if}

							<i class="fas fa-chevron-down" />
						</span>
					</div>
					{#if showAverageStats}
						{#if !isNominated && leaderboard.qualification}
							<QualificationStatus qualification={leaderboard.qualification} {isRanked} />
						{/if}
						{#if leaderboard.changes?.length}
							<ReweightStatusRanked map={leaderboard} />
						{/if}
					{/if}
				{/if}
			{:else if !$isLoading}
				<p>Leaderboard not found.</p>
			{/if}
		</div>
	</article>
	{#if separatePage && type !== 'accsaber'}
		<aside transition:fade|global>
			{#if qualification && !isRanked}
				<LeaderboardAsideBox opened={commentaryShown} title="Quality Votes" faicon="fas fa-comments" boolname="commentaryShown">
					<div>
						<QualityVoting {qualification} {isNQT} currentPlayerId={$account.id} />
						{#if isRT || isNQT || generalMapperId}
							<Commentary {isNQT} mapperId={generalMapperId} {qualification} currentPlayerId={$account.id} />
						{/if}
					</div>
				</LeaderboardAsideBox>
			{/if}
			{#if (isNominated && qualification) || (leaderboard?.reweight && !leaderboard?.reweight.finished)}
				<LeaderboardAsideBox
					opened={qualificationInfoShown}
					title="Criteria Votes"
					faicon="fas fa-list-ul"
					boolname="qualificationInfoShown">
					<div>
						{#if isNominated && qualification}
							<QualificationStatus {qualification} {isRanked} />
							<CriteriaCommentary {isRT} {isNQT} mapperId={generalMapperId} {qualification} currentPlayerId={$account.id} />
						{/if}

						{#if leaderboard?.reweight && !leaderboard?.reweight.finished}
							<ReweightStatus map={leaderboard} />
						{/if}
					</div>
				</LeaderboardAsideBox>
			{/if}
			{#if featuredPlaylists && featuredPlaylists.length}
				<LeaderboardAsideBox
					opened={leaderboardShowPlaylists}
					title="Featured Playlists"
					faicon="fas fa-compact-disc"
					boolname="leaderboardShowPlaylists">
					<div class="featured-playlists">
						<span class="featured-playlist-headline">Featured in:</span>
						{#each featuredPlaylists as featuredPlaylist}
							<div class="stats-with-icons">
								<FeaturedPlaylist playlist={featuredPlaylist} />
							</div>
						{/each}
					</div>
				</LeaderboardAsideBox>
			{/if}

			{#if showStats}
				<LeaderboardAsideBox
					opened={leaderboardStatsShown}
					title="Map Details"
					faicon="fas fa-magnifying-glass"
					boolname="leaderboardStatsShown">
					{#if leaderboard?.stats}
						<div class="stats-with-icons">
							<PredictedAccGraph {leaderboard} {selectedModifiers} />
							{#if !$configStore?.leaderboardPreferences?.showStatsInHeader}
								<LeaderboardStats {leaderboard} />
							{/if}
							{#if $configStore?.leaderboardPreferences?.showDevMenu}
								<LeaderboardDevMenu {leaderboard} {song} />
							{/if}

							{#if iconsInInfo}
								<Icons {song} {diffInfo} mapCheck={true} />
							{/if}
						</div>
					{/if}
				</LeaderboardAsideBox>
			{/if}

			{#if showAttempts}
				<LeaderboardAsideBox opened={attemptsShown} title="Attempts" faicon="fas fa-chart-simple" boolname="attemptsShown">
					{#if leaderboard?.stats?.stars}
						<AttemptsGraph leaderboardId={currentLeaderboardId} />
					{/if}
				</LeaderboardAsideBox>
			{/if}

			{#if showCurve && leaderboard?.stats?.stars}
				<LeaderboardAsideBox opened={curveShown} title="PP Curve" faicon="fas fa-bezier-curve" boolname="curveShown">
					<h2 class="title is-5 pp-curve-toggles">
						<div class="pp-curve-toggle">
							<span class="pp-curve-toggle-label">Pass:</span>
							<span
								on:click={() => curveboolflip('passPp')}
								title="Click to show Pass PP curve"
								class={$configStore?.ppCurve?.passPp ? 'higlighted-pp' : 'inactive-pp'}>
								<Value value={modifiedPass} prevValue={leaderboard?.stats?.passRating ?? 0} inline="true" suffix="★" />
							</span>
						</div>
						<div class="pp-curve-toggle">
							<span class="pp-curve-toggle-label">Acc:</span>
							<span
								on:click={() => curveboolflip('accPp')}
								title="Click to show Acc PP curve"
								class={$configStore?.ppCurve?.accPp ? 'higlighted-pp' : 'inactive-pp'}>
								<Value value={modifiedAcc} prevValue={leaderboard?.stats?.accRating ?? 0} inline="true" suffix="★" /></span>
						</div>
						<div class="pp-curve-toggle">
							<span class="pp-curve-toggle-label">Tech:</span>
							<span
								on:click={() => curveboolflip('techPp')}
								title="Click to show Tech PP curve"
								class={$configStore?.ppCurve?.techPp ? 'higlighted-pp' : 'inactive-pp'}>
								<Value value={modifiedTech} prevValue={leaderboard?.stats?.techRating ?? 0} inline="true" suffix="★" /></span>
						</div>
					</h2>
					<PpCurve
						passRating={leaderboard?.stats?.passRating}
						accRating={leaderboard?.stats?.accRating}
						techRating={leaderboard?.stats?.techRating}
						{modifiers}
						modifiersRating={leaderboard?.difficultyBl?.modifiersRating}
						mode={leaderboard?.difficultyBl?.modeName.toLowerCase()}
						on:modified-stars={e => {
							modifiedPass = e?.detail?.passRating ?? 0;
							modifiedAcc = e?.detail?.accRating ?? 0;
							modifiedTech = e?.detail?.techRating ?? 0;
							modifiedStars = e?.detail?.stars ?? null;
							selectedModifiers = e?.detail?.selectedModifiers ?? [];
						}} />
				</LeaderboardAsideBox>
			{/if}
		</aside>
	{/if}
</section>

{#if separatePage && leaderboard && song}
	<LeaderboardMeta {leaderboard} {song} />
{/if}

<style>
	.align-content {
		display: flex;
		justify-content: center;
	}

	aside {
		width: 100%;
		max-width: 27em;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	.diff-switch {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.3em;
		margin-top: 0.2em;
		gap: 0.6em;
		flex-wrap: wrap;
	}

	.diff-and-mode-switch {
		display: flex;
		justify-content: space-between;
		align-items: end;
		margin: 0 10px;
	}

	:global(.mode-switcher.switch-types) {
		flex-wrap: wrap;
	}

	.diff-switch :global(> *:not(:last-child)) {
		margin-right: 1em;
	}

	.align-spinner {
		display: grid;
		justify-items: center;
	}

	.leaderboard {
		padding: 0.5em;
		margin: 6px 10px 16px;
		border-radius: 0 0 12px 12px;
		box-shadow: 0 2px 10px rgb(0 0 0 / 33%);
		background: rgb(26 26 26);
	}

	.leaderboard:before {
		position: absolute;
		content: ' ';
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0.1;
		background-repeat: no-repeat;
		background-size: cover;
		pointer-events: none;
	}

	.darkened-background {
		padding: 0.7em;
		border-radius: 8px;
	}

	:global(.diff-tab-button) {
		margin-bottom: -0.5em !important;
		height: 3.5em;
		border-radius: 12px 12px 0 0 !important;
		min-width: 7em;
		max-width: 7em;
	}

	:global(.diff-tab-button span) {
		font-weight: 900;
		text-align: center;
		white-space: break-spaces;
		margin-right: -0.3em;
	}

	:global(.mode-tab-button) {
		margin-bottom: -0.5em !important;
		height: 3.5em;
		border-radius: 12px 12px 0 0 !important;
		width: 4em;
	}

	:global(.mode-tab-button span) {
		font-weight: 900;
		font-size: 1.4em;
	}

	.featured-playlists {
		display: flex;
		flex-direction: column;
	}

	.featured-playlist-headline {
		font-size: x-large;
		text-align: center;
	}

	.stats-with-icons {
		display: flex;
		align-content: center;
		justify-content: space-evenly;
		flex-direction: column;
	}

	.scores-grid {
		display: grid;
		grid-template-columns: 1fr;
		max-width: 100%;
		position: relative;
		border-radius: 8px;
		padding: 0.5em 0.6em 0.4em 0.6em;
	}

	.scores-grid > * {
		min-width: 0;
	}

	.scores-grid > *:not(:last-child) {
		border-bottom: 1px solid var(--row-separator);
	}

	.rank-voting {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
		justify-content: space-between;
	}

	.voting-result {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
	}

	.voter-feedback {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
	}

	:global(.voter-feedback-button) {
		height: 1.8em;
	}

	.nowrap-label {
		white-space: nowrap;
	}

	.invert-xmart {
		transform: none !important;
	}

	:global(.battleroyalebtn) {
		margin-left: 1em;
		margin-bottom: 0.5em;
	}

	.royale-title {
		color: white;
		text-align: center;
		padding: 1em;
		font-size: large;
	}

	.royale-title-container {
		flex-direction: column;
		display: flex;
		align-items: center;
	}

	.user-score {
		height: auto !important;
	}
	.user-score:not(.user-score-top) > * {
		padding-top: 2rem;
	}

	.user-score.user-score-top > * {
		padding-bottom: 2rem;
	}

	:global(.voteButton) {
		margin-top: 0 !important;
		height: 1.8em;
	}

	.to-the-left {
		margin-left: -0.4em !important;
	}

	.box-with-left-arrow {
		display: grid;
		align-items: center;
		grid-template-columns: 1em auto !important;
	}

	.switcher-nav {
		display: flex;
		justify-content: space-evenly;
		align-items: center;
		flex-wrap: wrap;
	}

	.sorting-options {
		margin-top: 0.2em;
	}

	.status-header {
		text-align: center;
		font-size: 120%;
		font-weight: bolder;
		padding-bottom: 0.4em;
	}

	.pager-container {
		margin: 0 0.8em;
	}

	.higlighted-pp {
		opacity: 1;
		cursor: pointer;
	}
	.inactive-pp {
		opacity: 0.6;
		cursor: pointer;
	}

	.custom-mode-info {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.3em;
	}

	.pp-curve-toggles {
		text-align: center;
		margin: 0.5em 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.4em;
	}

	.pp-curve-toggle {
		display: flex;
		align-items: center;
		gap: 0.2em;
	}

	.pp-curve-toggle-label {
		font-weight: normal;
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

	@media screen and (max-width: 1275px) and (min-width: 927px) {
		aside {
			column-count: 2;
			column-gap: 1em;
			padding: 0 1em;
		}

		aside :global(.content-box) {
			width: 100%;
			margin: 0 0 1em 0;
			break-inside: avoid;
			display: inline-block;
		}
	}

	@media screen and (min-width: 1024px) {
		:global(.leaderboard .scores-grid .player-performance) {
			max-width: 20em;
		}
	}

	@media screen and (max-width: 1024px) {
		.leaderboard {
			margin-inline: 0;
			max-width: 100vw;
		}

		.diff-switch :global(> *:not(:last-child)) {
			margin-right: 0;
			margin-bottom: 0.5em;
		}

		.diff-and-mode-switch {
			margin: 1em 0 0;
		}

		.diff-switch {
			gap: 0.1em;
		}

		.cinematics-canvas {
			transform: scaleY(1.2) translateZ(0);
		}

		:global(.player-score .player-performance-badges .with-badge) {
			min-width: 4em !important;
		}

		:global(.player-performance-badges) {
			min-width: 0 !important;
		}

		:global(.leaderboard .scores-grid .player-performance-badges .pp) {
			font-size: 0.9em;
		}

		:global(.leaderboard .scores-grid .player-performance-badges .score) {
			font-size: 0.8em;
		}

		:global(.diff-tab-button) {
			max-width: 4em;
			min-width: unset;
		}

		:global(.diff-tab-button span) {
			font-size: 0.85em;
		}

		:global(.mode-tab-button) {
			max-width: 4em;
			width: auto;
			flex: 1;
			min-width: 2em;
		}

		:global(.switch-types:has(.mode-tab-button)) {
			flex: 1;
			justify-content: end !important;
		}

		:global(.mode-tab-button span) {
			font-size: 1.2em;
		}
	}

	.leaderboard-header-box {
		padding: 0;
		border-radius: 12px;
		background-color: black;
		backdrop-filter: blur(10px);
		--webkit-transofrm: translateZ(0);
		--webkit-perspective: 1000;
		--webkit-backface-visibility: hidden;
		-webkit-backdrop-filter: blur(10px);
		margin: 6px 10px 16px;
		z-index: 0;
		position: relative;
	}

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}

	.score-options-section {
		display: grid;
		justify-items: center;
	}

	.box-with-left-arrow {
		grid-template-columns: 1fr;
	}

	aside :global(.content-box) {
		margin-inline: 0;
		padding: 0.5rem;
	}
</style>
