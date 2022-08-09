import { writable } from 'svelte/store'
import { BL_API_URL } from '../../network/queues/beatleader/api-queue'
import userApiClient from '../../network/clients/beatleader/account/api'

let store = null;
let storeSubCount = 0;

export default (refreshOnCreate = true) => {
  storeSubCount++;
  if (store) return store;

  let account = { loading: true };

  const { subscribe: subscribeState, set } = writable(account);

  const get = () => account;

  const refresh = async () => {
    try {
      const user = await userApiClient.getProcessed();
      if (!user) throw 'Data error'

      account = { ...user, id: user.player?.playerId ?? null };
    }
    catch (err) {
      account = {}
    }

    set(account);
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

  const fetchOculusUser = (token) => {
    fetch(BL_API_URL + "oculususer?token=" + token, {
      credentials: 'include',
    })
      .then(
        response => {
          if (response.status == 200) {
            return response.json()
          } else {
            return response.text()
          }
        })
      .then(
        data => {
          if (data.length > 0) {
            account.error = data;
          } else {
            account = data;
          }

          set(account);
        });
  }

  store = {
    subscribe,
    get,
    fetchOculusUser
  }

  return store;
}