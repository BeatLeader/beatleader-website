import {writable} from 'svelte/store'
import createRankedsService from '../../services/beatleader/rankeds'
import {PRIORITY} from '../../network/queues/http-queue'
import eventBus from '../../utils/broadcast-channel-pubsub'

let store = null;
let storeSubCount = 0;
export default async (refreshOnCreate = false) => {
  storeSubCount++;
  if (store) return store;

  const rankedsService = createRankedsService();

  let rankeds = refreshOnCreate ? {} : await rankedsService.get();

  const {subscribe: subscribeState, set} = writable(rankeds);

  const get = () => rankeds;
  const refresh = async (forceUpdate = false, priority = PRIORITY.BG_NORMAL) => {
    await rankedsService.refresh(forceUpdate, priority);
  }

  if (refreshOnCreate) await refresh();

  rankeds = await rankedsService.get();
  set(rankeds);

  const rankedsChangedUnsubscribe = eventBus.on('rankeds-changed', ({allRankeds}) => {
    if (allRankeds && Object.keys(allRankeds).length) set(allRankeds);
  })

  const subscribe = fn => {
    const stateUnsubscribe = subscribeState(fn);

    return () => {
      storeSubCount --;

      if (storeSubCount === 0) {
        store = null;

        rankedsService.destroyService();

        stateUnsubscribe();
        rankedsChangedUnsubscribe();
      }
    }
  }

  store = {
    subscribe,
    get,
    refresh
  }

  return store;
}