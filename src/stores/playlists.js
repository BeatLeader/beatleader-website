import {writable} from 'svelte/store'
import keyValueRepository from '../db/repository/key-value';
import {opt} from '../utils/js'
import {configStore} from './config'
import {BL_API_URL} from '../network/queues/beatleader/api-queue'

const STORE_PLAYLISTS_KEY = 'playlists';
const defaultImage = ""

export let playlistStore = null;

const toDataURL = url => fetch(url)
  .then(response => response.blob())
  .then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  }))

function saveJSONAsFile(json, fileName) {
  var link = document.createElement("a");

  document.body.appendChild(link); // for Firefox

  link.setAttribute("href", URL.createObjectURL(new Blob([json], {
    type: "text/plain"
  })));
  link.setAttribute("download", fileName);
  link.click();
}

export default () => {
  if (playlistStore) return playlistStore;

  let playlists = [];

  const {subscribe, unsubscribe, set: storeSet} = writable(playlists);

  const get = () => playlists;
  const set = async (config, persist = true, promise = false) => {
    const newConfig = promise ? await config : config;
    if (!newConfig) return;

    if (persist) await keyValueRepository().set(newConfig, STORE_PLAYLISTS_KEY);

    playlists = newConfig;
    storeSet(newConfig);

    return newConfig;
  }

  const create = async (song = null, inputPlaylist = null) => {
      const playlist = inputPlaylist ? inputPlaylist : {
        playlistTitle: "New playlist",
        playlistAuthor: "BeatLeader",
        songs: song ? [song] : [], 
        image: await toDataURL("/assets/favicon-128.png")
      }

      if (!playlist.playlistTitle ||
          !playlist.songs) {
          return
        }

      let playlists = await get();
      playlists.push(playlist)

      await set(playlists, true);
      await select(playlist);
  };

  const deleteOneClick = async () => {
    let playlists = (await get()).filter(playlist => !playlist.oneclick);

    await set(playlists, true);
  };

  const downloadOneClick = async () => {
    fetch(BL_API_URL + "user/oneclickplaylist", {
      credentials: 'include'
  })
  .then(response => response.json())
  .then(
    async playlist => {
      if (!playlist.playlistTitle ||
        !playlist.songs) {
        return
      }
    
    await deleteOneClick();
    playlist.oneclick = true;
    let playlists = await get();
    playlists.unshift(playlist)

    await set(playlists, true);
    });
  };

  const updateOneClick = async (songs) => {
    fetch(BL_API_URL + "user/oneclickplaylist", {
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({songs})
    })
  };

  const checkOneClick = async () => {
    if (await configStore.get('preferences').oneclick == "playlist") {
      downloadOneClick();
    } else {
      deleteOneClick();
    }
  };

  const deleteList = async (index) => {
    let playlists = await get();
    playlists.splice(index, 1);

    await set(playlists, true);
  };

  const download = async (index) => {
    let playlists = await get();
    let playlist = playlists[index];

    saveJSONAsFile(JSON.stringify(playlist), playlist.playlistTitle + ".bplist");
  };

  const add = async (song, playlistIndex) => {
    let playlists = await get();
    let index = playlistIndex != null ? playlistIndex : await configStore.get('selectedPlaylist');

    playlists[index].songs.push(song);

    if (playlists[index].oneclick) {
      updateOneClick(playlists[index].songs);
    }

    await set(playlists, true);
  };

  const decapitalizeFirstLetter = (string) => {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }

  const addDiff = async (hash, diffInfo, playlistIndex) => {
    let playlists = await get();
    let index = playlistIndex != null ? playlistIndex : await configStore.get('selectedPlaylist');

    let song = playlists[index].songs.find(el => el.hash == hash);
    song.difficulties.push({name: decapitalizeFirstLetter(diffInfo.diff), characteristic: diffInfo.type});

    if (playlists[index].oneclick) {
      updateOneClick(playlists[index].songs);
    }

    await set(playlists, true);
  };

  const removeDiff = async (hash, diffInfo, playlistIndex) => {
    let playlists = await get();
    let index = playlistIndex != null ? playlistIndex : await configStore.get('selectedPlaylist');

    let song = playlists[index].songs.find(el => el.hash == hash);
    song.difficulties = song.difficulties.filter(el => el.name != decapitalizeFirstLetter(diffInfo.diff));

    if (playlists[index].oneclick) {
      updateOneClick(playlists[index].songs);
    }

    await set(playlists, true);
  };

  const remove = async (hash, playlistIndex) => {
      let playlists = await get();
      let index = playlistIndex != null ? playlistIndex : await configStore.get('selectedPlaylist');

      playlists[index].songs = playlists[index].songs.filter(el => el.hash != hash)

      if (playlists[index].oneclick) {
        updateOneClick(playlists[index].songs);
      }

      await set(playlists, true);
  };

  const select = async (playlist) => {
    if (playlist) {
      let playlists = await get();
      let index = playlists.indexOf(playlist);

      await configStore.setForKey('selectedPlaylist', index);
    } else {
      await configStore.setForKey('selectedPlaylist', null);
    }
  };

  const dbConfig = keyValueRepository().get(STORE_PLAYLISTS_KEY);
  if (dbConfig) set(dbConfig, false, true);
  checkOneClick();

  playlistStore =  {
    subscribe,
    unsubscribe,
    set,
    get,
    create,
    select,
    add,
    remove,
    deleteList,
    download,
    removeDiff,
    addDiff
  }

  return playlistStore;
}