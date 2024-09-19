import {writable} from 'svelte/store';
import keyValueRepository from '../db/repository/key-value';
import {configStore} from './config';
import {BL_API_URL} from '../network/queues/beatleader/api-queue';
import {substituteVars} from '../utils/format';
import deepEqual from 'deep-equal';

const STORE_PLAYLISTS_KEY = 'playlists';

export let playlistStore = null;

const toDataURL = url =>
	fetch(url)
		.then(response => response.blob())
		.then(
			blob =>
				new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onloadend = () => resolve(reader.result);
					reader.onerror = reject;
					reader.readAsDataURL(blob);
				})
		);

function saveJSONAsFile(json, fileName) {
	var link = document.createElement('a');

	document.body.appendChild(link); // for Firefox

	link.setAttribute('href', URL.createObjectURL(new Blob([json], {type: 'application/bplist'})));
	link.setAttribute('download', fileName);
	link.click();
}

function saveFromId(id, fileName) {
	var link = document.createElement('a');

	document.body.appendChild(link); // for Firefox

	link.setAttribute('href', `${BL_API_URL}playlist/${id}`);
	link.setAttribute('download', fileName);
	link.click();
}

export default () => {
	if (playlistStore) return playlistStore;

	let playlists = [];

	const {subscribe, unsubscribe, set: storeSet} = writable(playlists);

	const get = async () => (await keyValueRepository().get(STORE_PLAYLISTS_KEY)) ?? [];
	const set = async (config, persist = true, promise = false) => {
		const newConfig = promise ? await config : config;
		if (!newConfig) return;

		playlists = newConfig;
		storeSet(newConfig);

		if (persist) await keyValueRepository().set(newConfig, STORE_PLAYLISTS_KEY);

		return newConfig;
	};

	const update = fn => set(fn(playlists));

	const create = async (song = null, inputPlaylist = null) => {
		const playlist = inputPlaylist
			? inputPlaylist
			: {
					playlistTitle: 'New playlist',
					playlistAuthor: 'BeatLeader',
					songs: song ? [song] : [],
					image: await toDataURL('/assets/defaultplaylisticon.png'),
				};

		if (!playlist.playlistTitle || !playlist.songs) {
			return;
		}

		let playlists = await get();
		if (playlists.length && playlists[0].oneclick) {
			playlists.splice(1, 0, playlist);
		} else {
			playlists.unshift(playlist);
		}

		await set(playlists, true);
		if (!inputPlaylist) {
			await select(playlist);
		}
		await uploadPlaylist(playlist, playlists);
	};

	const deleteOneClick = async () => {
		let playlists = (await get()).filter(playlist => !playlist.oneclick);

		await set(playlists, true);
	};

	const downloadOneClick = async () => {
		await fetch(BL_API_URL + 'user/oneclickplaylist/link', {
			credentials: 'include',
		})
			.then(response => response.text())
			.then(playlistUrl =>
				fetch(playlistUrl)
					.then(r => r.json())
					.then(async playlist => {
						if (!playlist.playlistTitle || !playlist.songs) {
							return;
						}

						await deleteOneClick();
						playlist.oneclick = true;
						let playlists = await get();
						playlists.unshift(playlist);

						await set(playlists, true);
					})
			);
	};

	const updateOneClick = async songs => {
		fetch(BL_API_URL + 'user/oneclickplaylist', {
			credentials: 'include',
			method: 'POST',
			body: JSON.stringify({songs}),
		});
	};

	const uploadPlaylist = async (playlist, playlists, shared) => {
		if (playlist.oneclick) return;

		var remote = await fetch(
			BL_API_URL +
				`user/playlist?id=${playlist.customData?.id ?? ''}&shared=${shared !== undefined ? shared : playlist.customData?.shared ?? false}`,
			{
				credentials: 'include',
				method: 'POST',
				body: JSON.stringify(playlist),
			}
		).then(response => response.json());
		if (remote && !deepEqual(playlist.customData, remote)) {
			playlist.customData = remote;

			await set(playlists, true);
		}
	};

	const share = async (index, toShare, callback) => {
		let playlists = await get();
		let playlist = playlists[index];

		await uploadPlaylist(playlist, playlists, toShare);
		callback(playlist.customData.id);
	};

	const reorder = async (index, hash, songIndex, songObject) => {
		let playlists = await get();

		let playlist = playlists[index];
		let songs = playlist.songs;

		const objIndex = songs.findIndex(item => item.hash === hash || item.id === hash);

		if (objIndex > -1) {
			const [itemToMove] = songs.splice(objIndex, 1);
			songs.splice(songIndex, 0, itemToMove);
		} else {
			songs.splice(songIndex, 0, songObject);
		}
		if (playlist.customData) {
			playlist.customData.hash = await computeSha256Hash(playlist);
		}

		await set(playlists, true);

		if (playlists[index].oneclick) {
			updateOneClick(playlists[index].songs);
		} else {
			uploadPlaylist(playlists[index], playlists);
		}
	};

	const getShared = (id, callback) => {
		fetch(BL_API_URL + `playlist/${id}/link`, {
			credentials: 'include',
		})
			.then(response => response.text())
			.then(url =>
				fetch(url)
					.then(r => r.json())
					.then(async playlist => {
						let playlists = await get();
						var idx = undefined;
						for (let index = 0; index < playlists.length; index++) {
							const element = playlists[index];
							if (element.customData?.hash == playlist.customData?.hash) {
								idx = index;
								break;
							}
						}
						callback(playlist, idx);
					})
			);
	};

	async function computeSha256Hash(data) {
		const customData = data.customData;
		data.customData = null;
		const encoder = new TextEncoder();
		const dataUint8 = encoder.encode(JSON.stringify(data));
		const hashBuffer = await crypto.subtle.digest('SHA-256', dataUint8);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
		data.customData = customData;
		return hashHex;
	}

	const syncPlaylists = async () => {
		fetch(BL_API_URL + 'user/playlists', {
			credentials: 'include',
		})
			.then(response => response.json())
			.then(async remotePlaylists => {
				let playlists = await get();

				let hashed = {};
				let indexed = {};
				for (let i = 0; i < playlists.length; i++) {
					const element = playlists[i];
					if (element.oneclick) continue;
					const hash = await computeSha256Hash(element);
					hashed[hash] = element;
					if (element.customData?.id) {
						indexed[element.customData.id] = element;
					}
				}
				for (let i = 0; i < remotePlaylists.length; i++) {
					const element = remotePlaylists[i];
					var localPlaylist = hashed[element.hash];
					if (!element.deleted && (!localPlaylist || !localPlaylist.customData?.id)) {
						if (indexed[element.id]) {
							playlists = playlists.filter(p => p.customData?.id != element.id);
						}
						if (localPlaylist) {
							playlists = playlists.filter(p => p !== localPlaylist);
						}
						var remote = await fetch(BL_API_URL + 'playlist/' + element.id, {
							credentials: 'include',
						}).then(response => response.json());
						if (remote) {
							playlists.push(remote);
						}
						hashed[element.hash] = remote;
					} else if (localPlaylist && element.deleted) {
						playlists = playlists.filter(p => p !== localPlaylist);
					}
				}

				var resultList = [];

				for (let i = 0; i < playlists.length; i++) {
					const element = playlists[i];
					if (!element.customData?.id && !element.oneclick) {
						await fetch(BL_API_URL + 'user/playlist', {
							credentials: 'include',
							method: 'POST',
							body: JSON.stringify(element),
						})
							.then(response => response.json())
							.then(customData => {
								element.customData = customData;
								resultList.push(element);
							});
					} else {
						resultList.push(element);
					}
				}

				resultList = resultList.sort((a, b) => (b.customData?.id ?? 9999999) - (a.customData?.id ?? 9999999));

				await set(resultList, true);
			});
	};

	const generatePlaylist = (count, filters, callback) => {
		if (!filters.order) {
			filters.order = 'desc';
		}

		let url = substituteVars(
			BL_API_URL +
				'playlist/generate?count=${count}&type=${type}&search=${search}&title=${playlistTitle}&stars_from=${stars_from}&stars_to=${stars_to}&accrating_from=${accrating_from}&accrating_to=${accrating_to}&passrating_from=${passrating_from}&passrating_to=${passrating_to}&techrating_from=${techrating_from}&techrating_to=${techrating_to}&date_from=${date_from}&date_to=${date_to}&sortBy=${sortBy}&order=${order}&mytype=${mytype}&mode=${mode}&difficulty=${difficulty}&count=${count}&mapType=${mapType}&allTypes=${allTypes}&duplicate_diffs=${duplicateDiffs}&mapRequirements=${mapRequirements}&songStatus=${songStatus}&allRequirements=${allRequirements}',
			{count, ...filters},
			true,
			true
		);

		fetch(url, {
			credentials: 'include',
		})
			.then(response => response.json())
			.then(async playlist => {
				if (!playlist.playlistTitle || !playlist.songs) {
					return;
				}

				let playlists = await get();
				if (playlists[0]?.oneclick) {
					playlists.splice(1, 0, playlist);
				} else {
					playlists.unshift(playlist);
				}

				await set(playlists, true);
				await select(playlist);

				callback();
			});
	};

	const generatePlayerPlaylist = (count, playerId, filters, callback) => {
		if (!filters.order) {
			filters.order = 'desc';
		}

		let url = substituteVars(
			BL_API_URL +
				'playlist/scores/generate?playerId=${playerId}&count=${count}&sortBy=${sortBy}&order=${order}&search=${search}&diff=${diff}&type=${songType}&hmd=${hmd}&modifiers=${modifiers}&stars_from=${starsFrom}&stars_to=${starsTo}&eventId=${eventId}&allTypes=${allTypes}&duplicate_diffs=${duplicateDiffs}',
			{count, playerId, order: filters.order, sortBy: filters.sort, duplicateDiffs: filters.duplicateDiffs, ...filters.filters},
			true,
			true
		);

		fetch(url, {
			credentials: 'include',
		})
			.then(response => response.json())
			.then(async playlist => {
				if (!playlist.playlistTitle || !playlist.songs) {
					return;
				}

				let playlists = await get();
				if (playlists[0]?.oneclick) {
					playlists.splice(1, 0, playlist);
				} else {
					playlists.unshift(playlist);
				}

				await set(playlists, true);
				await select(playlist);

				callback();
			});
	};

	const deleteList = async index => {
		let playlists = await get();
		const playlist = playlists[index];
		playlists.splice(index, 1);

		if (playlist.customData?.id) {
			fetch(BL_API_URL + `user/playlist?id=${playlist.customData.id}`, {
				credentials: 'include',
				method: 'DELETE',
			});
		}

		await configStore.setForKey('selectedPlaylist', null);
		await set(playlists, true);
	};

	const download = async playlist => {
		if (playlist.customData.id) {
			saveFromId(playlist.customData.id, playlist.playlistTitle + '.bplist');
		} else {
			saveJSONAsFile(JSON.stringify(playlist), playlist.playlistTitle + '.bplist');
		}
	};

	const add = async (song, playlistIndex) => {
		let playlists = await get();
		let index = playlistIndex != null ? playlistIndex : await configStore.get('selectedPlaylist');

		playlists[index].songs.push(song);
		await set(playlists, true);

		if (playlists[index].oneclick) {
			updateOneClick(playlists[index].songs);
		} else {
			uploadPlaylist(playlists[index], playlists);
		}
	};

	const updateIcon = async (playlistIndex, icon) => {
		let playlists = await get();
		let index = playlistIndex != null ? playlistIndex : await configStore.get('selectedPlaylist');

		playlists[index].image = icon;
		uploadPlaylist(playlists[index], playlists);

		await set(playlists, true);
	};

	const updateTitle = async (playlistIndex, title) => {
		let playlists = await get();
		let index = playlistIndex != null ? playlistIndex : await configStore.get('selectedPlaylist');

		playlists[index].playlistTitle = title;
		await set(playlists, true);

		uploadPlaylist(playlists[index], playlists);
	};

	const updateDescription = async (playlistIndex, title) => {
		let playlists = await get();
		let index = playlistIndex != null ? playlistIndex : await configStore.get('selectedPlaylist');

		playlists[index].playlistDescription = title;
		await set(playlists, true);

		uploadPlaylist(playlists[index], playlists);
	};

	const decapitalizeFirstLetter = string => {
		return string.charAt(0).toLowerCase() + string.slice(1);
	};

	const addDiff = async (hash, diffInfo, playlistIndex) => {
		let playlists = await get();
		let index = playlistIndex != null ? playlistIndex : await configStore.get('selectedPlaylist');

		let song = playlists[index].songs.find(el => el.hash == hash);
		if (!song.difficulties) {
			song.difficulties = [];
		}
		song.difficulties.push({name: decapitalizeFirstLetter(diffInfo.diff), characteristic: diffInfo.type});

		await set(playlists, true);

		if (playlists[index].oneclick) {
			updateOneClick(playlists[index].songs);
		} else {
			uploadPlaylist(playlists[index], playlists);
		}
	};

	const removeDiff = async (hash, diffInfo, playlistIndex) => {
		let playlists = await get();
		let index = playlistIndex != null ? playlistIndex : await configStore.get('selectedPlaylist');

		let song = playlists[index].songs.find(el => el.hash == hash);
		song.difficulties = song.difficulties.filter(
			el => el.name != decapitalizeFirstLetter(diffInfo.diff) || el.characteristic != diffInfo.type
		);

		await set(playlists, true);

		if (playlists[index].oneclick) {
			updateOneClick(playlists[index].songs);
		} else {
			uploadPlaylist(playlists[index], playlists);
		}
	};

	const remove = async (hash, playlistIndex) => {
		let playlists = await get();
		let index = playlistIndex != null ? playlistIndex : await configStore.get('selectedPlaylist');

		playlists[index].songs = playlists[index].songs.filter(el => el.hash != hash);
		await set(playlists, true);

		if (playlists[index].oneclick) {
			updateOneClick(playlists[index].songs);
		} else {
			uploadPlaylist(playlists[index], playlists);
		}
	};

	const select = async playlist => {
		if (playlist) {
			let playlists = await get();
			let index = playlists.indexOf(playlist);

			await configStore.setForKey('selectedPlaylist', index);
		} else {
			await configStore.setForKey('selectedPlaylist', null);
		}
	};

	const refresh = async () => {
		const dbConfig = await keyValueRepository().get(STORE_PLAYLISTS_KEY);
		if (dbConfig) set(dbConfig, false, true);

		if ((await configStore.get('preferences').oneclick) == 'playlist') {
			await downloadOneClick();
		} else {
			await deleteOneClick();
		}
		await syncPlaylists();
	};
	refresh();

	playlistStore = {
		subscribe,
		unsubscribe,
		set,
		update,
		get,
		create,
		select,
		add,
		remove,
		deleteList,
		download,
		removeDiff,
		addDiff,
		getShared,
		share,
		generatePlaylist,
		generatePlayerPlaylist,
		updateIcon,
		updateTitle,
		updateDescription,
		reorder,
	};

	return playlistStore;
};
