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
    let config = await configStore.get();
    fetch(BL_API_URL + "user/id", {credentials: 'include'}).then(response => response.text()).then(
    data => {
        if (data.length > 0) {
            account.id = data;
            if (changeMain) {
                if (!config.users) {
                    config.users = {};
                }
                config.users.main = data;
                configStore.set(config);
          
                eventBus.publish('player-add-cmd', {playerId: data});
            }
        } else {
            account = {};

            if (changeMain) {
                if (config.users && config.users.main) {
                    let currentID = config.users.main;
                    config.users.main = null;
                    configStore.set(config);
            
                    eventBus.publish('player-remove-cmd', {playerId: currentID});
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
    let data = new FormData();
    data.append('action', 'login');
    data.append('login', login);
    data.append('password', password);

    fetch(BL_API_URL + "signinoculus", {
        credentials: 'include',
        method: 'POST',
        body: data
    }).then(response => response.text()).then(
        data => {
            if (data.length > 0) {
                account.error = data;
            } else {
                account.error = null;
                refresh(true);
            }
            set(account);
        });
  }

  const migrate = (login, password) => {
    let data = new FormData();
    data.append('action', 'login');
    data.append('login', login);
    data.append('password', password);

    fetch(BL_API_URL + "user/migrate", {
        credentials: 'include',
        method: 'POST',
        body: data
    }).then(response => response.text()).then(
        data => {
            if (data.length > 0) {
                account.error = data;
            } else {
                account.error = null;
                refresh(true);
            }
            set(account);
        });
  }

  const changeAvatar = (file) =>
    fetch(BL_API_URL + "user/avatar", { 
        method: 'PATCH', 
        body: file, 
        credentials: 'include'
    }).then(response => response.text()).then(
        data => {
            account.error = null;

            if (data.length > 0) {
                account.error = data;
                setTimeout(function(){
                    account.error = null;
                    set(account);
                }, 3500);
            }

            set(account);
        });

  const changeName = (name) =>
    fetch(BL_API_URL + "user/name?newName=" + name, { 
        method: 'PATCH', 
        credentials: 'include'
    }).then(response => response.text()).then(
        data => {
            account.error = null;

            if (data.length > 0) {
                account.error = data;
                setTimeout(function(){
                    account.error = null;
                    set(account);
                }, 3500);
            }

            set(account);
        });

  const logOut = () => {
    fetch(BL_API_URL + "signout", {
        credentials: 'include'
    }).then(
        _ => {
            refresh(true);
        });
  } 

  store = {
    subscribe,
    get,
    refresh,
    logIn,
    logOut,
    migrate,
    changeAvatar,
    changeName
  }

  return store;
}