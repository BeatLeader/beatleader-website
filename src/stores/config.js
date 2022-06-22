import {writable} from 'svelte/store'
import keyValueRepository from '../db/repository/key-value';
import {opt} from '../utils/js'

const STORE_CONFIG_KEY = 'config';

export const DEFAULT_LOCALE = 'en-US';

export let configStore = null;

const locales = {
  'de-DE': {id: 'de-DE', name: 'Deutschland'},
  'es-ES': {id: 'es-ES', name: 'España'},
  'pl-PL': {id: 'pl-PL', name: 'Polska'},
  'en-GB': {id: 'en-GB', name: 'United Kingdom'},
  'en-US': {id: 'en-US', name: 'United States'},
};
export const getCurrentLocale = () => configStore ? configStore.getLocale() : DEFAULT_LOCALE;
export const getSupportedLocales = () => Object.values(locales);

const DEFAULT_CONFIG = {
  users: {
    main: null,
    country: null,
  },
  scoreComparison: {
    method: 'in-place',
  },
  preferences: {
    billboardState: 'show',
    iconsOnAvatars: 'show',
    theme:'mirror',
    bgimage:"/assets/background.png"
  },
  locale: DEFAULT_LOCALE,
  selectedPlaylist: null
}

const newSettingsAvailableDefinition = {
  'scoreComparison.method': 'Method of displaying the comparison of scores',
  'preferences.iconsOnAvatars': 'Showing icons on avatars',
  'locale': 'Locale selection',
}

export default async () => {
  if (configStore) return configStore;

  let currentConfig = {...DEFAULT_CONFIG};

  let newSettingsAvailable = undefined;

  const {subscribe, set: storeSet} = writable(currentConfig);

  const get = key => key ? currentConfig[key] : currentConfig;
  const set = async (config, persist = true) => {
    const newConfig = {...DEFAULT_CONFIG};
    Object.keys(config).forEach(key => {
      if (key === 'locale') {
        newConfig[key] = config?.[key] ?? newConfig?.[key] ?? DEFAULT_LOCALE;
        return;
      }

      newConfig[key] = {...newConfig?.[key], ...config?.[key]}
    });

    if (persist) await keyValueRepository().set(newConfig, STORE_CONFIG_KEY);

    newSettingsAvailable = undefined;

    currentConfig = newConfig;
    storeSet(newConfig);

    return newConfig;
  }

  const setForKey = async (key, value, persist = true) => {
    currentConfig[key] = value;

    if (persist) await keyValueRepository().set(currentConfig, STORE_CONFIG_KEY);

    currentConfig = currentConfig;
    storeSet(currentConfig);

    return currentConfig;
  }

  const getLocale = () => opt(currentConfig, 'locale', DEFAULT_LOCALE);

  const getSelectedPlaylistIndex = () => currentConfig['selectedPlaylist'];

  const determineNewSettingsAvailable = dbConfig => Object.entries(newSettingsAvailableDefinition)
    .map(([key, description]) => opt(dbConfig, key) === undefined ? description : null)
    .filter(d => d)

  const dbConfig = await keyValueRepository().get(STORE_CONFIG_KEY);
  const newSettings= determineNewSettingsAvailable(dbConfig);
  if (dbConfig) await set(dbConfig, false);
  newSettingsAvailable = newSettings && newSettings.length ? newSettings : undefined;

  configStore =  {
    subscribe,
    set,
    get,
    getMainPlayerId: () => opt(currentConfig, 'users.main'),
    getLocale,
    setForKey,
    getNewSettingsAvailable: () => newSettingsAvailable,
  }

  return configStore;
}