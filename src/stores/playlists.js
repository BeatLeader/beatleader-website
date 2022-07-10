import {writable} from 'svelte/store'
import keyValueRepository from '../db/repository/key-value';
import {decapitalize} from '../utils/js'
import {configStore} from './config'

const STORE_PLAYLISTS_KEY = 'playlists';

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

      let playlists = get();
      playlists.push(playlist)

      await set(playlists, true);
      await select(playlist);
  };

  const deleteList = async (index) => {
    let playlists = get();
    playlists.splice(index, 1);

    await set(playlists, true);
  };

  const download = async (index) => {
    let playlists = get();
    let playlist = playlists[index];

    const process = playlist => ({
      ...playlist,
      songs: playlist?.songs?.map(s => ({
        songName: s?.songName ?? '',
        levelAuthorName: s?.levelAuthorName ?? '',
        hash: s?.hash ?? '',
        difficulties: s?.difficulties ?? [],
      })) ?? [],
    });

    saveJSONAsFile(JSON.stringify(process(playlist)), playlist.playlistTitle + ".bplist");
  };

  const add = async (song, playlistIndex) => {
    let playlists = get();
    let index = playlistIndex != null ? playlistIndex : configStore.get('selectedPlaylist');

    playlists[index].songs.push(song);

    await set(playlists, true);
  };

  const addDiff = async (hash, diffInfo, playlistIndex) => {
    let playlists = get();
    let index = playlistIndex != null ? playlistIndex : configStore.get('selectedPlaylist');

    let song = playlists[index].songs.find(el => el.hash === hash);
    song.difficulties.push({name: decapitalize(diffInfo.diff), characteristic: diffInfo.type});

    await set(playlists, true);
  };

  const removeDiff = async (hash, diffInfo, playlistIndex) => {
    let playlists = get();
    let index = playlistIndex != null ? playlistIndex : configStore.get('selectedPlaylist');

    let song = playlists[index].songs.find(el => el.hash === hash);
    song.difficulties = song.difficulties.filter(el => el.name !== decapitalize(diffInfo.diff) || el.characteristic !== diffInfo.type);

    await set(playlists, true);
  };

  const remove = async (hash, playlistIndex) => {
      let playlists = get();
      let index = playlistIndex != null ? playlistIndex : configStore.get('selectedPlaylist');

      playlists[index].songs = playlists[index].songs.filter(el => el.hash !== hash)

      await set(playlists, true);
  };

  const select = async (playlist) => {
    if (playlist) {
      let playlists = get();
      let index = playlists.indexOf(playlist);

      await configStore.setForKey('selectedPlaylist', index);
    } else {
      await configStore.setForKey('selectedPlaylist', null);
    }
  };

  const dbConfig = keyValueRepository().get(STORE_PLAYLISTS_KEY);
  if (dbConfig) set(dbConfig, false, true);

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