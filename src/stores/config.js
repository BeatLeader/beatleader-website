import {writable} from 'svelte/store';
import deepEqual from 'deep-equal';
import keyValueRepository from '../db/repository/key-value';
import {deepClone, opt} from '../utils/js';

const STORE_CONFIG_KEY = 'config';

export const DEFAULT_LOCALE = 'en-US';

export let configStore = null;

const BROWSER_MAGIC_VALUE = '__BROWSER';

const locales = {
	'en-US': {id: 'en-US', name: 'United States'},
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
		bgimage: '/assets/background.jpg',
		bgColor: 'rgba(29, 7, 34, 0.6284)',
		headerColor: 'rgba(53, 0, 70, 0.2)',
		daysToCompare: 1,
		daysOfHistory: 30,
		leaderboardStatsShown: true,
		curveShown: true,
		qualificationInfoShown: true,
		commentaryShown: true,
		criteriaInfoShown: true,
		leaderboardShowSorting: true,

		maps3D: true,
		mapsViewType: 'maps-cards',
	},
	scorePreferences: {
		badgeRows: 2,
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
		showLeaderboard: true,
		defaultAccChartIndex: 0,
	},
	leaderboardPreferences: {
		badges: [
			[{metric: 'pp', secondary: 'none'}, {metric: 'acc', secondary: 'mods', withMods: false}, {metric: 'score'}],
			[{metric: 'pauses'}, {metric: 'maxStreak'}, {metric: 'mistakes'}],
		],
		badgeRows: 1,
		show: {
			avatar: true,
			country: false,
			clans: true,
			date: true,
		},
	},
	chartLegend: {
		y: true,
		y1: true,
		y2: true,
		y3: false,
		y4: false,
		y5: true,
		y6: true,
	},
	visibleScoreIcons: {
		pin: false,
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

	const get = key => (key ? currentConfig[key] : currentConfig);
	const set = async (config, persist = true) => {
		const newConfig = deepClone(DEFAULT_CONFIG);
		Object.keys(config).forEach(key => {
			if (key === 'locale') {
				newConfig[key] = config?.[key] ?? newConfig?.[key] ?? DEFAULT_LOCALE;
				return;
			}

			newConfig[key] = {...newConfig?.[key], ...config?.[key]};
		});

		if (persist) {
			await keyValueRepository().set(newConfig, STORE_CONFIG_KEY);
			dbConfig = newConfig;
		}

		newSettingsAvailable = undefined;
		settingsChanged = !deepEqual(newConfig, dbConfig);

		currentConfig = newConfig;
		storeSet(newConfig);

		return newConfig;
	};

	const setForKey = async (key, value, persist = true) => {
		currentConfig[key] = value;

		if (persist) {
			await keyValueRepository().set(currentConfig, STORE_CONFIG_KEY);
			dbConfig = currentConfig;
		}

		settingsChanged = !deepEqual(currentConfig, dbConfig);
		currentConfig = currentConfig;
		storeSet(currentConfig);

		return currentConfig;
	};

	const persist = async () => {
		await keyValueRepository().set(currentConfig, STORE_CONFIG_KEY);
		dbConfig = currentConfig;
		await set(currentConfig, false);
	};

	const reset = async () => {
		const dbConfig = await keyValueRepository().get(STORE_CONFIG_KEY);
		await set(dbConfig ?? deepClone(DEFAULT_CONFIG), false);
	};

	const getLocale = () =>
		currentConfig?.locale === BROWSER_MAGIC_VALUE ? navigator.language ?? DEFAULT_LOCALE : currentConfig?.locale ?? DEFAULT_LOCALE;

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
		if (
			dbConfig.preferences.theme == 'mirror' &&
			dbConfig.preferences.bgColor == 'rgba(29, 7, 34, 0.6282)' &&
			dbConfig.preferences.headerColor == 'rgba(53, 0, 70, 0.2)'
		) {
			dbConfig.preferences.theme = 'ree-dark';
			dbConfig.preferences.bgColor = 'rgba(29, 7, 34, 0.6284)';
			await keyValueRepository().set(dbConfig, STORE_CONFIG_KEY);
		}
		await set(savedConfig, false);
	}
	newSettingsAvailable = newSettings && newSettings.length ? newSettings : undefined;

	configStore = {
		subscribe,
		set,
		get,
		getLocale,
		setForKey,
		getNewSettingsAvailable: () => newSettingsAvailable,
		getSettingsChanged: () => settingsChanged,
		persist,
		reset,
	};

	return configStore;
};
