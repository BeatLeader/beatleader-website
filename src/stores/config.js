import {writable} from 'svelte/store'
import keyValueRepository from '../db/repository/key-value';
import {opt} from '../utils/js'
import {DEFAULT_LOCALE, setCurrentLocale} from '../others/i18n'

const STORE_CONFIG_KEY = 'config';

const DEFAULT_CONFIG = {
  users: {
    main: null,
    country: null,
  },
  locale: DEFAULT_LOCALE,
}

let configStore = null;

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

    setCurrentLocale(getLocale());

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