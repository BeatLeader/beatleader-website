import {writable} from 'svelte/store'
import keyValueRepository from '../db/repository/key-value';
import {opt} from '../utils/js'

const STORE_CONFIG_KEY = 'config';

let configStore = null;

export default async () => {
  if (configStore) return configStore;

  let currentConfig = {
    users: {
      main: null,
      country: null,
    },
  };

  const {subscribe, set: storeSet} = writable(currentConfig);

  const get = key => key ? (currentConfig[key] ? currentConfig[key] : null) : currentConfig;
  const set = async (config, persist = true) => {
    if (persist) await keyValueRepository().set(config, STORE_CONFIG_KEY);

    currentConfig = config;
    storeSet(config);

    return config;
  }

  const dbConfig = await keyValueRepository().get(STORE_CONFIG_KEY);
  if (dbConfig) await set(dbConfig, false);

  configStore =  {
    subscribe,
    set,
    get,
    getMainPlayerId: () => opt(currentConfig, 'users.main')
  }

  return configStore;
}