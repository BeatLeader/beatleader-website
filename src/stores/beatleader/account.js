import {writable} from 'svelte/store'
import {configStore} from '../config'
import {BL_API_URL} from '../../network/queues/beatleader/api-queue'
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
      account = {...data, id: data?.player?.id ?? null};
      set(account);

      if (!playerService) {
        playerService = createPlayerService();
      }

      const friends = await playerService.getFriends();
      if (!data?.friends?.length) {
        friends.forEach(toAdd => {
          fetch(BL_API_URL + "user/friend?playerId=" + toAdd, {credentials: 'include', method: 'POST'});
        });
      } else {
        let toDelete = friends;
        data.friends.forEach(friend => {
          if (toDelete.includes(friend)) {
            toDelete = toDelete.filter(f => f != friend);
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
          
                eventBus.publish('player-add-cmd', {playerId: data, fromAccount: true});
            }
        } else {
            account = {};

            if (changeMain) {
                if (config.users && config.users.main) {
                    let currentID = config.users.main;
                    config.users.main = null;
                    configStore.set(config);
            
                    eventBus.publish('player-remove-cmd', {playerId: currentID, fromAccount: true});
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

  const changePassword = (login, password, newPassword) => {
    let data = new FormData();
    data.append('login', login);
    data.append('oldPassword', password);
    data.append('newPassword', newPassword);

    fetch(BL_API_URL + "user/changePassword", {
        credentials: 'include',
        method: 'PATCH',
        body: data
    })
      .then(checkResponse)
      .then(
        data => {
            if (data.length > 0) {
                account.error = data;
            } else {
                account.message = "Password changed successfully ✔";
                account.error = null;
                refresh(true);
                setTimeout(function(){
                  account.message = null;
                  set(account);
                }, 3500);
            }
            set(account);
        });
  }

  const changePasswordMigrated = (login, newPassword) => {
    let data = new FormData();
    data.append('login', login);
    data.append('newPassword', newPassword);

    fetch(BL_API_URL + "user/resetPassword", {
        credentials: 'include',
        method: 'PATCH',
        body: data
    })
      .then(checkResponse)
      .then(
        data => {
            if (data.length > 0) {
                account.error = data;
            } else {
                account.message = "Password changed successfully ✔";
                account.error = null;
                refresh(true);
                setTimeout(function(){
                  account.message = null;
                  set(account);
                }, 3500);
            }
            set(account);
        });
  }

  const changeAvatar = (file, playerId) =>
    fetch(BL_API_URL + "user/avatar" + (playerId ? "?id=" + playerId : ""), { 
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

  const changeName = (name, playerId) =>
    fetch(BL_API_URL + "user/name?newName=" + encodeURIComponent(name) + (playerId ? "&id="+playerId : ""), { 
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

  const changeCountry = (country, playerId) =>
  fetch(BL_API_URL + "user/country?newCountry=" + country + (playerId ? "&id="+playerId : ""), { 
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

  const changePatreonMessage = (message, playerId) =>
  fetch(BL_API_URL + "user/patreon?message=" + encodeURIComponent(message) + (playerId ? "&id="+playerId : ""), { 
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

  const removeClanRequest = (clan, setAccount = true) => {
    if (Array.isArray(account?.clanRequest) && clan?.id) {
      account.clanRequest = account.clanRequest.filter(r => r?.id !== clan.id);
    }

    if (setAccount) set(account);
  }

  const addClan = clan => {
    if (Array.isArray(account?.player?.clans)) {
      account.player.clans.push(clan);
    }

    removeClanRequest(clan, false);

    set(account);
  }

  const removeClan = clan => {
    if (Array.isArray(account?.player?.clans)) {
      account.player.clans = account.player.clans.filter(c => c?.id !== clan.id);
    }

    set(account);
  }

  const banClan = clan => {
    if (Array.isArray(account?.bannedClans)) {
      account.bannedClans.push(clan);
    }

    set(account);
  }

  const unbanClan = clan => {
    if (Array.isArray(account?.bannedClans)) {
      account.bannedClans = account.bannedClans.filter(c => c?.id !== clan.id);
    }

    set(account);
  }

  const addClanInvitation = playerId => {
    if (Array.isArray(account?.clan?.pendingInvites)) {
      account.clan.pendingInvites.push(playerId);
    }

    set(account);
  }

  const removeClanInvitation = playerId => {
    if (Array.isArray(account?.clan?.pendingInvites)) {
      account.clan.pendingInvites = account.clan.pendingInvites.filter(pId => pId !== playerId);
    }

    set(account);
  }

  const setPlayerClan = clan => {
    account.clan = clan;

    set(account);
  }

  eventBus.on('player-add-cmd', async ({playerId, fromAccount}) => {
    if (!fromAccount) {
      fetch(BL_API_URL + "user/friend?playerId=" + playerId, {credentials: 'include', method: 'POST'})
    }
  });

  eventBus.on('player-remove-cmd', async ({playerId, fromAccount}) => {
    if (!fromAccount) {
      fetch(BL_API_URL + "user/friend?playerId=" + playerId, {credentials: 'include', method: 'DELETE'})
    }
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
    changePatreonMessage,
    banPlayer,
    unbanPlayer,
    changePassword,
    changePasswordMigrated,
    setPlayerClan,
    addClan,
    removeClan,
    removeClanRequest,
    banClan,
    unbanClan,
    addClanInvitation,
    removeClanInvitation,
  }

  return store;
}