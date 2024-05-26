import {writable} from 'svelte/store';
import deepEqual from 'deep-equal';
import keyValueRepository from '../db/repository/key-value';
import {deepClone, opt} from '../utils/js';
import {BL_API_URL} from '../network/queues/beatleader/api-queue';

const STORE_CONFIG_KEY = 'config';

export let configStore = null;

const BROWSER_MAGIC_VALUE = '__BROWSER';
const US_LOCALE = 'en-US';

export const DEFAULT_LOCALE = BROWSER_MAGIC_VALUE;

const locales = {
	US_LOCALE: {id: US_LOCALE, name: 'United States'},
	BROWSER_MAGIC_VALUE: {id: BROWSER_MAGIC_VALUE, name: 'Browser settings'},
};
export const getCurrentLocale = () => configStore?.getLocale();
export const getSupportedLocales = () => Object.values(locales);

export const DEFAULT_CONFIG = {
	scoreComparison: {
		method: 'in-place',
		badgeRows: 1,
	},
	preferences: {
		ppMetric: 'weighted',
		iconsOnAvatars: 'show',
		scoresSortOptions: 'last',
		theme: 'ree-dark',
		oneclick: 'modassistant',
		webPlayer: 'beatleader',
		bgimage: '/assets/background.jpg',
		bgColor: 'rgba(29, 7, 34, 0.6284)',
		headerColor: 'rgba(53, 0, 70, 0.2)',
		fontNames: 'Noto Sans, Noto Sans SC, Microsoft YaHei, sans-serif',
		daysToCompare: 1,
		daysOfHistory: 30,
		graphHeight: 350,

		leaderboardStatsShown: false,
		curveShown: false,
		qualificationInfoShown: false,
		commentaryShown: false,
		criteriaInfoShown: false,
		leaderboardShowSorting: false,
		leaderboardShowPlaylists: true,
		showUnrankedMapsOnGraph: false,

		showAccSaber: true,

		showFiltersOnRanking: true,
		maps3D: true,
		mapsViewType: 'maps-cards',

		reebanner: true,
		replayedbanner: true,
		rewindbanner: true,
		beastiesbanner: true,
		ostbanner: true,
		ccWinterHighlights24: true,
		followersBecomingPublic: true,
	},
	scorePreferences: {
		badgeRows: 2,
		dateFormat: 'relative',
		showHmd: true,
		showTriangle: true,
	},
	scoreBadges: [
		[
			{metric: 'pp', secondary: 'weighted'},
			{metric: 'acc', secondary: 'improvement', withMods: true},
			{metric: 'score', withImprovements: true},
		],
		[
			{metric: 'accLeft', withImprovements: true},
			{metric: 'accRight', withImprovements: true},
			{metric: 'mistakes', withImprovements: true},
		],
		[null, null, null],
	],
	scoreDetailsPreferences: {
		showMapInfo: true,
		showScoreMetrics: true,
		showHandsAcc: true,
		showAccChart: true,
		showSliceDetails: false,
		showAccSpreadChart: false,
		showPredictedAcc: false,
		showLeaderboard: true,
		defaultAccChartIndex: 0,
		showHistory: true,
	},
	leaderboardPreferences: {
		badges: [
			[{metric: 'pp', secondary: 'none'}, {metric: 'acc', secondary: 'mods', withMods: false}, {metric: 'score'}],
			[{metric: 'pauses'}, {metric: 'maxStreak'}, {metric: 'mistakes', withImprovements: false}],
		],
		badgeRows: 1,

		showStatsInHeader: false,
		showHashInHeader: false,
		showGraphOption: false,
		showClanCaptureInHeader: true,
		showClanCaptureInList: true,

		show: {
			avatar: true,
			country: true,
			clans: true,
			date: true,
			replay: true,
			hmd: false,
		},
	},
	rankingPreferences: {
		pp: true,
		weightedAcc: true,
		acc: true,
		topPp: true,
		maxStreak: true,
		playCount: true,
		lastplay: false,
		weightedRank: false,
		rank: true,
		replaysWatched: true,
		top1Score: false,
		top1Count: false,
	},
	rankingList: {
		showClans: true,
		showDifference: true,
		showFriendsButton: true,
		showCountryRank: true,
		showColorsForCountryRank: true,
		ppToTheLeft: false,
	},
	chartLegend: {
		y: true,
		y1: true,
		y2: false,
		y3: false,
		y4: false,
		y5: true,
		y6: true,
		y7: true,
		y8: true,
	},
	scoreHistoryLegend: {
		y: true,
		y1: true,
		y2: true,
		y3: true,
		y4: true,
		y5: true,
	},
	chartLegendVisible: {
		y0: true,
		y1: true,
		y2: true,
		y3: true,
		y4: true,
		y5: true,
		y6: true,
		y7: true,
		y8: true,
	},
	profileParts: {
		changes: true,
		clans: true,
		graphs: true,
		pinnedScores: true,
		achievements: true,
		histogram: true,
		scoresToPlaylist: true,
		globalMiniRanking: true,
		countryMiniRanking: true,
		friendsMiniRanking: false,
	},
	visibleScoreIcons: {
		pin: true,
		playlist: false,
		bsr: true,
		bs: true,
		oneclick: true,
		preview: false,
		replay: true,
		delete: true,
	},
	locale: DEFAULT_LOCALE,
	selectedPlaylist: {},
};

const newSettingsAvailableDefinition = {
	'preferences.ppMetric': 'PP metric selection',
	'scoreComparison.method': 'Method of displaying the comparison of scores',
	'preferences.iconsOnAvatars': 'Showing icons on avatars',
	locale: 'Locale selection',
};

export default async () => {
	if (configStore) return configStore;

	let currentConfig = deepClone(DEFAULT_CONFIG);
	let dbConfig = deepClone(currentConfig);

	let newSettingsAvailable = undefined;
	let settingsChanged = false;

	const {subscribe, set: storeSet} = writable(currentConfig);

	const storeConfig = async newConfig => {
		await keyValueRepository().set(newConfig, STORE_CONFIG_KEY);
		fetch(BL_API_URL + 'user/config', {method: 'POST', credentials: 'include', body: JSON.stringify(newConfig)});
	};

	const get = key => (key ? currentConfig[key] : currentConfig);
	const set = async (config, persist = true) => {
		const newConfig = deepClone(DEFAULT_CONFIG);
		const configToSet = deepClone(config);
		const recursiveFollback = (configToSet, newConfig, key) => {
			if (configToSet?.[key] && typeof configToSet[key] === 'object' && !Array.isArray(configToSet[key])) {
				Object.keys(configToSet[key]).forEach(innerkey => {
					recursiveFollback(configToSet[key], newConfig?.[key], innerkey);
				});
			} else if (newConfig != null) {
				newConfig[key] = configToSet?.[key] ?? newConfig?.[key];
			}
		};
		Object.keys(configToSet).forEach(key => {
			if (key === 'locale') {
				newConfig[key] = configToSet?.[key] ?? newConfig?.[key] ?? DEFAULT_LOCALE;
				return;
			}
			if (key === 'selectedPlaylist') {
				newConfig[key] = configToSet?.[key] ?? newConfig?.[key] ?? {};
				return;
			}

			recursiveFollback(configToSet, newConfig, key);
		});

		if (persist) {
			await storeConfig(newConfig);
			dbConfig = newConfig;
		}

		newSettingsAvailable = undefined;
		settingsChanged = !deepEqual(newConfig, dbConfig);

		currentConfig = newConfig;
		storeSet(newConfig);

		return newConfig;
	};

	const update = fn => set(fn(currentConfig));

	const setForKey = async (key, value, persist = true) => {
		currentConfig[key] = value;

		if (persist) {
			await storeConfig(currentConfig);
			dbConfig = currentConfig;
		}

		settingsChanged = !deepEqual(currentConfig, dbConfig);
		storeSet(currentConfig);

		return currentConfig;
	};

	const persist = async () => {
		await storeConfig(currentConfig);
		dbConfig = currentConfig;
		await set(currentConfig, false);
	};

	const reset = async () => {
		const dbConfig = await keyValueRepository().get(STORE_CONFIG_KEY);
		await set(dbConfig ?? deepClone(DEFAULT_CONFIG), false);
	};

	const getLocale = () =>
		currentConfig?.locale === BROWSER_MAGIC_VALUE ? navigator.language ?? US_LOCALE : currentConfig?.locale ?? US_LOCALE;

	const determineNewSettingsAvailable = dbConfig =>
		Object.entries(newSettingsAvailableDefinition)
			.map(([key, description]) => (opt(dbConfig, key) === undefined ? description : null))
			.filter(d => d);

	const savedConfig = await keyValueRepository().get(STORE_CONFIG_KEY);
	const newSettings = determineNewSettingsAvailable(savedConfig);

	// upgrade secondary pp metric if needed
	if (savedConfig?.scoreBadges && savedConfig?.preferences?.ppMetric) {
		const badges = [...Object.values(savedConfig.scoreBadges)];
		for (const idx in badges) {
			const ppMetric = badges[idx]?.find(col => col?.metric === 'pp');
			if (ppMetric && !ppMetric?.secondary) {
				ppMetric.secondary = savedConfig.preferences.ppMetric;
				await set(savedConfig, true);
				break;
			}
		}
	}

	if (savedConfig) {
		dbConfig = savedConfig;
		await set(savedConfig, false);
	}

	const syncFromServer = () => {
		fetch(BL_API_URL + 'user/config/link', {credentials: 'include'}).then(async response => {
			if (response.status == 404 && savedConfig) {
				await fetch(BL_API_URL + 'user/config', {method: 'POST', credentials: 'include', body: JSON.stringify(savedConfig)});
			} else if (response.status == 200) {
				const cloudConfig = await fetch(await response.text()).then(r => r.json());
				await set(cloudConfig, false);
				dbConfig = cloudConfig;
				settingsChanged = false;
				await keyValueRepository().set(cloudConfig, STORE_CONFIG_KEY);
			}
		});
	};
	syncFromServer();
	newSettingsAvailable = newSettings && newSettings.length ? newSettings : undefined;

	configStore = {
		subscribe,
		set,
		update,
		get,
		getLocale,
		setForKey,
		getNewSettingsAvailable: () => newSettingsAvailable,
		getSettingsChanged: () => settingsChanged,
		persist,
		reset,
		syncFromServer,
	};

	return configStore;
};
