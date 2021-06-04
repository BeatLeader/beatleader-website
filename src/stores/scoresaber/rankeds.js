import {writable} from 'svelte/store'
import createRankedsService from '../../services/scoresaber/rankeds'

let store = null;

export default async (refreshOnCreate = false) => {
  if (store) return store;

  const rankedsService = createRankedsService();

  let rankeds = refreshOnCreate ? {} : await rankedsService.getRankeds();

  const {subscribe, set} = writable(rankeds);

  const get = () => rankeds;
  const refresh = async (forceUpdate = false) => {
    await rankedsService.refreshRankeds(forceUpdate);

    rankeds = await rankedsService.getRankeds();

    set(rankeds);
  }

  if (refreshOnCreate) await refresh();

  store = {
    subscribe,
    get,
    refresh
  }

  return store;
}