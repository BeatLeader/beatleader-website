import keyValueRepository from '../db/repository/key-value';
import { opt } from '../utils/js'

const STORE_CONFIG_KEY = 'config';

let service = null;

export default () => {
  if (service) return service;

  const get = async () => keyValueRepository().get(STORE_CONFIG_KEY);
  const set = async config => keyValueRepository().set(config, STORE_CONFIG_KEY);

  const destroyService = () => { }

  service = {
    get,
    set,
    destroyService,
  }

  return service;
}