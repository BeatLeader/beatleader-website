import {writable} from 'svelte/store'
import {PRIORITY} from '../../network/queues/http-queue'
import {configStore} from './../config'
import {BL_API_URL} from '../../network/queues/beatleader/api-queue'
import createRankedsService from '../../services/beatleader/rankeds'
import eventBus from '../../utils/broadcast-channel-pubsub'

let store = null;
let storeSubCount = 0;
export default (refreshOnCreate = true) => {
  storeSubCount++;
  if (store) return store;

  let account = {};

  const {subscribe: subscribeState, set} = writable(account);

  const get = () => account;
  const refresh = async (changeMain = false) => {
    let currentID = await configStore.get('users.main');
    fetch(BL_API_URL + "user/id").then(
    data => {
        if (data.length > 0) {
            account.id = data;
            if (changeMain) {
                configStore.set('users.main', data);
          
                eventBus.publish('player-add-cmd', {data});
            }
        } else {
            account = {};

            if (changeMain) {
                if (currentID) {
                    configStore.set('users.main', null);
            
                    eventBus.publish('player-remove-cmd', {currentID});
                }
            }
            
        }
        set(account);
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

  const logIn = (login, password) => {
    fetch(BL_API_URL + "signinoculus?action=login&login=" + login + "&password=" + password).then(
        data => {
            if (data.length > 0) {
                account.error = data;
                set(account);
            } else {
                refresh(true);
            }
        });
  }

  const logOut = () => {
    fetch(BL_API_URL + "signout").then(
        data => {
            refresh(true);
        });
  } 

  store = {
    subscribe,
    get,
    refresh,
    logIn,
    logOut
  }

  return store;
}