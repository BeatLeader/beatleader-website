import {writable} from 'svelte/store'
import {PRIORITY} from '../../network/queues/http-queue'
import {configStore} from './../config'
import {BL_API_URL} from '../../network/queues/beatleader/api-queue'
import createRankedsService from '../../services/beatleader/rankeds'
import createPlayerService from '../../services/beatleader/player'
import eventBus from '../../utils/broadcast-channel-pubsub'

let store = null;
let storeSubCount = 0;
let playerService;

export default (refreshOnCreate = true) => {
  storeSubCount++;
  if (store) return store;

  let account = {};

  const {subscribe: subscribeState, set} = writable(account);

  const checkResponse = async response => {

    return response.text();
  }

  const refreshAccount = () => {
    fetch(BL_API_URL + "user", {credentials: 'include'})
    .then(response => response.json())
    .then(async data => {
      account.id = data.player.id;
      account.player = data.player;
      account.clanRequests = data.clanRequests;
      account.friends = data.friends;
      set(account);

      if (!playerService) {
        playerService = createPlayerService();
      }

      const friends = await playerService.getFriends();
      if (data.friends.length == 0) {
        friends.forEach(toAdd => {
          fetch(BL_API_URL + "user/friend?playerId=" + toAdd, {credentials: 'include', method: 'POST'});
        });
      } else {
        let toDelete = friends;
        data.friends.forEach(friend => {
          if (toDelete.contains(friend)) {
            toDelete.remove(friend);
          } else {
            eventBus.publish('player-add-cmd', {playerId: friend});
          }
        });

        toDelete.forEach(friend => {
          eventBus.publish('player-remove-cmd', {playerId: friend});
        });
      }
    });
  };

  const get = () => account;
  const refresh = async (changeMain = false) => {
    let config = configStore.get();
    fetch(BL_API_URL + "user/id", {credentials: 'include'})
      .then(checkResponse)
      .then(data => {
        if (data.length > 0) {
            account.id = data;
            refreshAccount();
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
      })
      .catch(err => err); // swallow the error
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
    })
      .then(checkResponse)
      .then(
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
    })
      .then(checkResponse)
      .then(
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
    })
      .then(checkResponse)
      .then(
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
    })
      .then(checkResponse)
      .then(
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

  const changeCountry = (country) =>
  fetch(BL_API_URL + "user/country?newCountry=" + country, { 
      method: 'PATCH', 
      credentials: 'include'
  })
    .then(checkResponse)
    .then(
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

  const foundClan = (clan) => {
    fetch(BL_API_URL + `clan/create?name=${clan.name}&tag=${clan.tag}&color=${clan.color}`, { 
      body: clan.icon,
      method: 'POST', 
      credentials: 'include'
    })
    .then(response => {
      if (response.code != 200) {
        return response.text()
      }
    })
    .then(data => {
      account.error = null;

      if (data.length > 0) {
          account.error = data;
          setTimeout(function(){
              account.error = null;
              set(account);
          }, 3500);
      } else {
        account.clan = data;
      }

      set(account);
    });
  }

  const destroyClan = () => {
    
  }

  const banPlayer = (playerId) =>
  fetch(BL_API_URL + "admin/ban?playerId=" + playerId, { 
      method: 'POST', 
      credentials: 'include'
  })
    .then(checkResponse)
    .then(
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

  const unbanPlayer = (playerId) =>
  fetch(BL_API_URL + "admin/unban?playerId=" + playerId, { 
      method: 'POST', 
      credentials: 'include'
  })
    .then(checkResponse)
    .then(
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

  store = {
    subscribe,
    get,
    refresh,
    logIn,
    logOut,
    migrate,
    changeAvatar,
    changeName,
    changeCountry,
    foundClan,
    banPlayer,
    unbanPlayer
  }

  return store;
}