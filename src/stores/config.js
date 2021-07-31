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
  locale: DEFAULT_LOCALE,
}

export default async () => {
  if (configStore) return configStore;

  let currentConfig = {...DEFAULT_CONFIG};

  const {subscribe, set: storeSet} = writable(currentConfig);

  const get = key => key ? (currentConfig[key] ? currentConfig[key] : null) : currentConfig;
  const set = async (config, persist = true) => {
    config = {...DEFAULT_CONFIG, ...config};

    if (persist) await keyValueRepository().set(config, STORE_CONFIG_KEY);

    currentConfig = config;
    storeSet(config);

    return config;
  }

  const getLocale = () => opt(currentConfig, 'locale', DEFAULT_LOCALE);

  const dbConfig = await keyValueRepository().get(STORE_CONFIG_KEY);
  if (dbConfig) await set(dbConfig, false);

  configStore =  {
    subscribe,
    set,
    get,
    getMainPlayerId: () => opt(currentConfig, 'users.main'),
    getLocale,
  }

  return configStore;
}