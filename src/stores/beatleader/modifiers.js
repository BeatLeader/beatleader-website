import { writable } from 'svelte/store'
import { BL_API_URL } from '../../network/queues/beatleader/api-queue'

let store = null;
let storeSubCount = 0;
export default (refreshOnCreate = true) => {
  storeSubCount++;
  if (store) return store;

  let modifiers = {};

  const { subscribe: subscribeState, set } = writable(modifiers);

  const get = () => modifiers;
  const refresh = async () => {
    fetch(BL_API_URL + "modifiers").then(response => response.json()).then(
      data => {
        modifiers = data;
        set(modifiers);
      });
  }

  if (refreshOnCreate) refresh();

  const subscribe = fn => {
    const stateUnsubscribe = subscribeState(fn);

    return () => {
      storeSubCount--;

      if (storeSubCount === 0) {
        store = null;

        stateUnsubscribe();
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