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

const DEFAULT_CONFIG = {
	scoreComparison: {
		method: 'in-place',
	},
	preferences: {
		ppMetric: 'weighted',
		iconsOnAvatars: 'show',
		scoresSortOptions: 'last',
		theme: 'mirror',
		oneclick: 'modassistant',
		bgimage: '/assets/background.jpeg',
		bgColor: 'rgba(20, 45, 57, 0.5427)',
		headerColor: 'rgba(21, 31, 35, 0.6382)',
		daysToCompare: 1,
		daysOfHistory: 30,
		leaderboardStatsShown: true,
		curveShown: true,
		qualificationInfoShown: true,
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
		playlist: true,
		bsr: true,
		bs: true,
		preview: true,
		replay: true,
		oneclick: true,
		twitch: true,
		delete: true,
		pin: true,
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
			dbConfig = newConfig;
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
	if (savedConfig) {
		dbConfig = savedConfig;
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
