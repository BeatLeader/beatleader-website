import keyValueRepository from '../db/repository/key-value';

const STORE_CONFIG_KEY = 'config';

export const getConfig = async (key = null) => {
  let config = await keyValueRepository().get(STORE_CONFIG_KEY);

  // return default configuration
  if (!config) config = {
    users: {
      main: null,
      country: null,
    },
  };

  return key ? (config[key] ? config[key] : null) : config;
}

export const setConfig = async config => keyValueRepository().set(config, STORE_CONFIG_KEY);

export const getMainPlayerId = async () => {
  const usersConfig = await getConfig('users');
  return usersConfig && usersConfig.main ? usersConfig.main : null;
}
