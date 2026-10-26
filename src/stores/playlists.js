import {writable} from 'svelte/store';
import keyValueRepository from '../db/repository/key-value';
import {configStore} from './config';
import createAccountStore from './beatleader/account';
import {BL_API_URL} from '../network/queues/beatleader/api-queue';
import {substituteVarsUrl} from '../utils/format';
import eventBus from '../utils/broadcast-channel-pubsub';
import {uuid} from '../utils/uuid';

const LOCAL_PLAYLISTS_KEY = 'playlists';
const CACHE_KEY_PREFIX = 'playlists-cache-';
const CHANGED_EVENT = 'playlists-changed';
const ONECLICK_KEY = 'oneclick';
const FOCUS_SYNC_INTERVAL = 5000;
const POLL_INTERVAL = 20000;

export let playlistStore = null;

export const isReplayPlaylist = playlist => playlist?.type === 'replays';
export const isPlaylistGuid = id => /^[0-9a-f]{32}$/i.test(String(id ?? ''));
export const findPlaylist = (playlists, key) => {
	if (key == null) return null;
	const guid = isPlaylistGuid(key) ? String(key).toLowerCase() : null;
	return playlists?.find(p => p.key === String(key) || (guid && p.linkGuid === guid)) ?? null;
};
const linkGuidOf = playlist => playlist?.accessGuid ?? (!playlist?.isPublic && playlist?.linkGuid ? playlist.linkGuid : null);
export const playlistAccessId = playlist => linkGuidOf(playlist) ?? playlist?.id;
export const playlistPageUrl = playlist => `/playlist/${linkGuidOf(playlist) ?? playlist?.key}`;
export const canEditDetails = playlist => !!playlist && (playlist.oneclick || ['owner', 'editor', 'local'].includes(playlist.role));
export const voteRunning = (playlist, now = Date.now()) =>
	!!playlist?.vote && !playlist.vote.endedAt && (!playlist.vote.endsAt || playlist.vote.endsAt * 1000 > now);
export const canEditPlaylist = playlist => canEditDetails(playlist) && !playlist.source && !voteRunning(playlist);

export const searchPageUrl = source => {
	const [path, query = ''] = (source ?? '').split('?');
	const params = new URLSearchParams(query);
	if (path.endsWith('scores/generate')) return params.get('playerId') ? `/u/${params.get('playerId')}` : null;
	if (path.endsWith('clan/generate')) return params.get('clanId') ? `/clan/${params.get('clanId')}` : null;

	const filters = new URLSearchParams();
	for (const [key, value] of params) {
		if (!value || ['count', 'title', 'duplicate_diffs', 'type'].includes(key)) continue;
		filters.append(key === 'thenSortBy' ? 'thenSort' : key, value);
	}
	const search = filters.toString();
	return `/maps/${params.get('type') || 'all'}/1${search ? '?' + search : ''}`;
};

const itemsOf = playlist => (isReplayPlaylist(playlist) ? playlist.replays : playlist?.songs);
export const playlistItemCount = playlist => itemsOf(playlist)?.length ?? 0;

export const activePlaylistOf = (playlists, config) => {
	const playlist = findPlaylist(playlists, config?.selectedPlaylistId);
	return playlist && canEditPlaylist(playlist) ? playlist : null;
};

export const playlistItemsLabel = (playlist, count = playlistItemCount(playlist)) =>
	`${count} ${isReplayPlaylist(playlist) ? 'replay' : 'map'}${count === 1 ? '' : 's'}`;

export function playlistCover(playlist) {
	const image = playlist?.image;
	if (!image) return '/assets/defaultplaylisticon.png';
	if (image.startsWith('http') || image.startsWith('data') || image.startsWith('/')) return image;

	const base64 = image.replace('base64,', '');
	let prefix = 'data:image/png;base64,';
	if (base64.startsWith('/9j/4')) prefix = 'data:image/jpeg;base64,';
	else if (base64.startsWith('R0lGODlh')) prefix = 'data:image/gif;base64,';
	else if (base64.startsWith('UklGR')) prefix = 'data:image/webp;base64,';
	return prefix + base64;
}

export function saveFromUrl(url, fileName) {
	const link = document.createElement('a');

	document.body.appendChild(link); // for Firefox

	link.setAttribute('href', url);
	link.setAttribute('download', fileName);
	link.click();
}

const clone = value => JSON.parse(JSON.stringify(value));

const toDifficulty = ({diff, type}) => ({name: diff.charAt(0).toLowerCase() + diff.slice(1), characteristic: type});

const songKey = song => song.hash?.toLowerCase();
const difficultyKey = d => `${d.characteristic}/${d.name}`.toLowerCase();
const isSameMap = (a, b) => (a.hash && b.hash ? a.hash.toLowerCase() === b.hash.toLowerCase() : !!a.key && a.key === b.key);
const findReplay = (playlist, replayType, id) => playlist?.replays?.find(r => r.replayType === replayType && r.id == id);

// Three-way merge by map hash: our changes since `base` applied on top of `theirs`; on order, theirs wins
const mergeSongs = (base, mine, theirs) => {
	const baseByKey = new Map(base.map(s => [songKey(s), s]));
	const mineByKey = new Map(mine.map(s => [songKey(s), s]));

	const merged = theirs
		.filter(s => !baseByKey.has(songKey(s)) || mineByKey.has(songKey(s)))
		.map(s => {
			const before = baseByKey.get(songKey(s));
			const after = mineByKey.get(songKey(s));
			if (!before || !after) return s;

			const beforeDiffs = new Set((before.difficulties ?? []).map(difficultyKey));
			const afterDiffs = new Set((after.difficulties ?? []).map(difficultyKey));
			const added = (after.difficulties ?? []).filter(d => !beforeDiffs.has(difficultyKey(d)));
			const removed = new Set([...beforeDiffs].filter(k => !afterDiffs.has(k)));
			const noteChanged = (after.description ?? '') !== (before.description ?? '');
			if (!added.length && !removed.size && !noteChanged) return s;

			const difficulties = (s.difficulties ?? []).filter(d => !removed.has(difficultyKey(d)));
			for (const d of added) {
				if (!difficulties.some(x => difficultyKey(x) === difficultyKey(d))) difficulties.push(d);
			}
			return {
				...s,
				difficulties: difficulties.length || s.difficulties?.length ? difficulties : s.difficulties,
				description: noteChanged ? after.description : s.description,
			};
		});

	for (const song of mine) {
		if (!baseByKey.has(songKey(song)) && !merged.some(s => songKey(s) === songKey(song))) merged.push(song);
	}
	return merged;
};

async function api(method, url, body, raw = false) {
	const response = await fetch(BL_API_URL + url, {
		method,
		credentials: 'include',
		headers: body !== undefined && !raw ? {'Content-Type': 'application/json'} : undefined,
		body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
	});
	const text = await response.text();
	if (!response.ok) {
		const error = new Error(text || response.statusText);
		error.status = response.status;
		throw error;
	}
	return text ? JSON.parse(text) : null;
}

const postItem = async (playlist, entry, input, query = '') => {
	const result = await api('POST', `v2/playlist/${playlist.id}/items${query}`, [input]);
	entry.itemId = result.items?.[0]?.id;
	return result;
};

const fetchLinked = async path => {
	const url = await fetch(BL_API_URL + path, {credentials: 'include'}).then(r => r.text());
	return fetch(url).then(r => r.json());
};

const fetchOneClick = async () => {
	const playlist = await fetchLinked('user/oneclickplaylist/link');
	return playlist?.playlistTitle && playlist.songs ? playlist : null;
};

function fromServer(info) {
	const items = info.items ?? [];
	const replays = info.type === 'replays';
	return {
		key: String(info.id),
		id: info.id,
		guid: info.guid,
		type: info.type,
		role: info.role,
		revision: info.revision,
		shareCount: info.shareCount ?? 0,
		pinCount: info.pinCount ?? 0,
		linkGuid: info.linkGuid ?? null,
		vote: info.vote ?? null,
		voteCount: info.voteCount ?? 0,
		pinned: !!info.pinned,
		pinDescription: info.pinDescription ?? null,
		source: info.source ?? null,
		sourceRefreshedAt: info.sourceRefreshedAt ?? 0,
		isPublic: info.isPublic,
		owner: info.owner,
		createdAt: info.createdAt,
		updatedAt: info.updatedAt,
		playlistTitle: info.title ?? '',
		playlistAuthor: info.author ?? '',
		playlistDescription: info.description ?? undefined,
		image: info.cover ?? null,
		songs: replays
			? []
			: items.map(i => ({
					itemId: i.id,
					hash: i.hash ?? undefined,
					key: i.key ?? undefined,
					songName: i.songName ?? undefined,
					levelAuthorName: i.levelAuthorName ?? undefined,
					difficulties: i.difficulties ?? undefined,
					description: i.description ?? undefined,
				})),
		replays: replays
			? items.map(i => ({
					itemId: i.id,
					replayType: i.replayType,
					id: i.replayId,
					description: i.description ?? undefined,
					playerId: i.playerId,
					leaderboardId: i.leaderboardId,
					addedBy: i.addedBy,
				}))
			: [],
		customData: {
			id: String(info.id),
			owner: info.owner?.id,
			shared: info.isPublic,
			syncURL: `${BL_API_URL}playlist/guid/${info.guid}`,
		},
	};
}

function normalizeLocal(playlist) {
	const replays = Array.isArray(playlist.replays);
	return {
		...playlist,
		key: playlist.key ?? 'local-' + uuid(),
		type: replays ? 'replays' : 'maps',
		role: 'local',
		songs: playlist.songs ?? [],
		replays: playlist.replays ?? [],
	};
}

function toFile(playlist) {
	const file = {
		playlistTitle: playlist.playlistTitle,
		playlistAuthor: playlist.playlistAuthor,
	};
	if (playlist.playlistDescription) file.playlistDescription = playlist.playlistDescription;
	if (playlist.image && !playlist.image.startsWith('http') && !playlist.image.startsWith('/')) file.image = playlist.image;

	if (isReplayPlaylist(playlist)) {
		file.replays = playlist.replays.map(({replayType, id, description}) => ({replayType, id, ...(description ? {description} : {})}));
	} else {
		file.songs = playlist.songs.map(({itemId, ...song}) => song);
	}
	return file;
}

const songToInput = song => ({
	hash: song.hash,
	key: song.key,
	songName: song.songName,
	levelAuthorName: song.levelAuthorName,
	difficulties: song.difficulties,
	description: song.description,
});

export default () => {
	if (playlistStore) return playlistStore;

	let mode = 'loading';
	let playerId = null;
	let currentAccountId;
	let playlists = [];
	let oneclick = null;
	let oneclickBase = null;
	let lastSync = 0;
	let watchers = 0;
	let pollTimer = null;

	const {subscribe, set: storeSet} = writable([]);

	const broadcast = message => eventBus.publish(CHANGED_EVENT, message);

	const all = () => (oneclick ? [oneclick, ...playlists] : playlists);

	const publish = async (persist = true) => {
		storeSet(all());
		if (!persist) return;

		if (mode === 'server' && playerId) {
			await keyValueRepository().set(clone(playlists), CACHE_KEY_PREFIX + playerId);
		} else if (mode === 'local') {
			await keyValueRepository().set(clone(playlists), LOCAL_PLAYLISTS_KEY);
		}
	};

	const readLocal = async () => (await keyValueRepository().get(LOCAL_PLAYLISTS_KEY)) ?? [];

	const resolve = async key => {
		const target = key ?? (await configStore.get('selectedPlaylistId'));
		return findPlaylist(all(), target);
	};

	const queues = {};
	const enqueue = (key, fn) => {
		const run = (queues[key] ?? Promise.resolve()).then(fn, fn);
		queues[key] = run.catch(() => {});
		return run;
	};

	const replaceInList = playlist => {
		const index = playlists.findIndex(p => p.key === playlist.key);
		if (index >= 0) {
			playlists[index] = playlist;
		} else {
			playlists.unshift(playlist);
		}
	};

	const sortNewestFirst = () => playlists.sort((a, b) => b.id - a.id);

	const refetch = async ids => {
		if (mode !== 'server' || !ids.length) return;

		const fresh = await api('GET', `v2/user/playlists?ids=${ids.join(',')}`);
		const freshIds = new Set(fresh.map(p => p.id));
		fresh.forEach(info => replaceInList(fromServer(info)));
		playlists = playlists.filter(p => !ids.includes(p.id) || freshIds.has(p.id));
		sortNewestFirst();
		await publish();
	};

	const mutate = (playlist, request) =>
		enqueue(playlist.key, async () => {
			if (playlist.role === 'local') {
				await publish();
				broadcast({local: true});
				return true;
			}

			const base = playlist.revision;
			try {
				const result = await request();
				if (result?.revision != null) {
					// Our copy matches the server only if no one else changed it and no refetch replaced it meanwhile
					const inSync = result.revision === base + 1 && findPlaylist(playlists, playlist.key) === playlist;
					if (inSync) {
						playlist.revision = result.revision;
						await publish();
					} else {
						await refetch([playlist.id]);
					}
					broadcast({id: playlist.id, revision: result.revision});
				}
				return result ?? true;
			} catch (e) {
				console.error('Playlist change failed', e);
				await refetch([playlist.id]).catch(() => {});
				throw e;
			}
		});

	const save = async (playlist, request) => {
		if (playlist.oneclick) return updateOneClick();
		await publish(false);
		return mutate(playlist, request);
	};

	// item.itemId is read when the request runs: an add queued just before assigns it
	const patchItem = (playlist, item, body) => save(playlist, () => api('PATCH', `v2/playlist/${playlist.id}/items/${item.itemId}`, body));

	const mutateAndRefetch = async (key, method, path, body) => {
		const playlist = await resolve(key);
		if (!playlist?.id) return null;

		let result = null;
		await mutate(playlist, async () => (result = await api(method, `v2/playlist/${playlist.id}/${path}`, body)));
		await refetch([playlist.id]);
		return result;
	};

	const applyRevisions = async (revisions, alwaysPublish = false) => {
		const remoteIds = new Set(revisions.map(r => r.id));
		const count = playlists.length;
		playlists = playlists.filter(p => remoteIds.has(p.id));

		// Sharing doesn't bump the revision, so a changed role counts too
		const changed = revisions
			.filter(r => {
				const playlist = findPlaylist(playlists, r.id);
				return (
					playlist?.revision !== r.revision ||
					playlist.role !== r.role ||
					('linkGuid' in r && (playlist.linkGuid ?? null) !== r.linkGuid)
				);
			})
			.map(r => r.id);

		if (changed.length) {
			await refetch(changed);
		} else if (alwaysPublish || count !== playlists.length) {
			await publish();
		}
	};

	const syncRevisions = async () => {
		if (mode !== 'server') return;
		await applyRevisions(await api('GET', 'v2/user/playlists/revisions'));
	};

	const importLocalPlaylists = async () => {
		const run = async () => {
			const local = await readLocal();
			const toImport = local.filter(p => !p.oneclick && !p.customData?.id);
			for (const playlist of toImport) {
				try {
					replaceInList(fromServer(await api('POST', 'v2/playlist', toFile(normalizeLocal(playlist)))));
				} catch (e) {
					console.error('Playlist import failed', e);
				}
			}
			if (local.length) {
				await keyValueRepository().set([], LOCAL_PLAYLISTS_KEY);
			}
			return toImport.length;
		};

		const imported = navigator.locks ? await navigator.locks.request('bl-playlists-import', run) : await run();
		if (imported) {
			sortNewestFirst();
			await publish();
			broadcast({list: true});
		}
	};

	const downloadOneClick = async () => {
		try {
			const playlist = await fetchOneClick();
			if (!playlist) return;

			oneclick = {...playlist, key: ONECLICK_KEY, type: 'maps', role: 'owner', oneclick: true, replays: []};
			oneclickBase = clone(playlist.songs);
		} catch (e) {
			oneclick = null;
			oneclickBase = null;
		}
		await publish(false);
	};

	// Queued synchronously, so a download prompted by another tab can't overtake this save
	const updateOneClick = () => {
		publish(false);
		return enqueue(ONECLICK_KEY, async () => {
			for (let attempt = 0; attempt < 3 && oneclick; attempt++) {
				const response = await fetch(BL_API_URL + 'user/oneclickplaylist', {
					credentials: 'include',
					method: 'POST',
					body: JSON.stringify({songs: oneclick.songs, revision: oneclick.customData?.revision ?? 0}),
				});

				if (response.status === 409) {
					const fresh = await fetchOneClick();
					if (!fresh) return false;
					oneclick.songs = mergeSongs(oneclickBase ?? [], oneclick.songs, fresh.songs);
					oneclick.customData = fresh.customData;
					oneclickBase = clone(fresh.songs);
					await publish(false);
					continue;
				}
				if (!response.ok) throw new Error('Failed to save the one-click playlist');

				const result = await response.json().catch(() => null);
				if (result?.revision != null) oneclick.customData = {...(oneclick.customData ?? {}), revision: result.revision};
				oneclickBase = clone(oneclick.songs);
				broadcast({oneclick: true});
				return true;
			}
			throw new Error('The one-click playlist keeps changing, try again');
		});
	};

	const loadCache = async accountId => {
		mode = 'server';
		playerId = accountId;
		playlists = (await keyValueRepository().get(CACHE_KEY_PREFIX + playerId)) ?? [];
		await publish(false);
	};

	const refresh = () =>
		enqueue('refresh', async () => {
			let revisions = null;
			try {
				revisions = await api('GET', 'v2/user/playlists/revisions');
			} catch (e) {
				if (e.status !== 401) {
					if (currentAccountId) await loadCache(currentAccountId);
					throw e;
				}
			}

			if (revisions === null) {
				mode = 'local';
				playerId = null;
				playlists = (await readLocal()).filter(p => !p.oneclick).map(normalizeLocal);
				await publish();
			} else {
				await loadCache(currentAccountId ?? 'me');
				if (playlists.length) {
					await applyRevisions(revisions, true);
				} else {
					playlists = (await api('GET', 'v2/user/playlists')).map(fromServer);
					await publish();
				}
				await importLocalPlaylists();
			}

			if ((await configStore.get('preferences'))?.oneclick == 'playlist') {
				await downloadOneClick();
			} else if (oneclick) {
				oneclick = null;
				await publish(false);
			}
		});

	eventBus.on(CHANGED_EVENT, async (data, isLocal) => {
		if (isLocal || !data) return;
		try {
			if (data.local && mode === 'local') {
				playlists = (await readLocal()).map(normalizeLocal);
				await publish(false);
			} else if (data.list) {
				await syncRevisions();
			} else if (data.oneclick) {
				await enqueue(ONECLICK_KEY, downloadOneClick);
			} else if (data.id != null) {
				const playlist = findPlaylist(playlists, data.id);
				if (!playlist || playlist.revision < data.revision) {
					await enqueue(String(data.id), () => refetch([data.id]));
				}
			}
		} catch (e) {
			console.error(e);
		}
	});

	const syncIfVisible = () => {
		if (document.visibilityState !== 'visible' || Date.now() - lastSync < FOCUS_SYNC_INTERVAL) return;
		lastSync = Date.now();
		syncRevisions().catch(e => console.error(e));
	};

	if (typeof document !== 'undefined') {
		document.addEventListener('visibilitychange', syncIfVisible);
		// Switching between two visible browser windows doesn't change visibility
		window.addEventListener('focus', syncIfVisible);
	}

	createAccountStore().subscribe(account => {
		if (account?.loading) return;
		const accountId = account?.id ?? null;
		if (accountId === currentAccountId) return;

		currentAccountId = accountId;
		refresh().catch(e => console.error('Playlists refresh failed', e));
	});

	const select = async playlist => {
		const key = playlist == null ? null : typeof playlist === 'object' ? playlist.key : String(playlist);
		await configStore.setForKey('selectedPlaylistId', key);
	};

	const create = async (song = null, inputPlaylist = null, type = 'maps', isPublic = false) => {
		const replays = type === 'replays' || Array.isArray(inputPlaylist?.replays);
		const file = inputPlaylist
			? inputPlaylist
			: replays
				? {playlistTitle: 'New replay playlist', replays: []}
				: {playlistTitle: 'New playlist', songs: song ? [song] : []};

		if (!file.playlistTitle || (!file.songs && !file.replays)) return null;

		let playlist;
		if (mode === 'server') {
			const info = await api('POST', `v2/playlist?type=${replays ? 'replays' : 'maps'}&isPublic=${!!isPublic}`, file);
			playlist = fromServer(info);
			playlist.skipped = info.skipped;
			replaceInList(playlist);
			sortNewestFirst();
			broadcast({list: true});
		} else {
			if (replays) throw new Error('Log in to create replay playlists');
			playlist = normalizeLocal({...clone(file), key: undefined});
			playlists.unshift(playlist);
			broadcast({local: true});
		}
		await publish();

		if (!inputPlaylist && !replays) {
			await select(playlist);
		}
		return playlist;
	};

	const copy = async playlist => {
		const info = await api('POST', playlist.accessGuid ? `v2/playlist/guid/${playlist.accessGuid}/copy` : `v2/playlist/${playlist.id}/copy`);
		const created = fromServer(info);
		created.skipped = info.skipped;
		replaceInList(created);
		sortNewestFirst();
		broadcast({list: true});
		await publish();
		await select(created);
		return created;
	};

	const createPlaylist = ({type = 'maps', title, description, image, isPublic = false, songs = [], replays = []}) => {
		const file = {playlistTitle: title?.trim() || (type === 'replays' ? 'New replay playlist' : 'New playlist')};
		if (description?.trim()) file.playlistDescription = description.trim();
		if (image) file.image = image;
		if (type === 'replays') {
			file.replays = replays;
		} else {
			file.songs = songs;
		}
		return create(null, file, type, isPublic);
	};

	const deleteList = async key => {
		const playlist = findPlaylist(playlists, key);
		if (!playlist) return;

		playlists = playlists.filter(p => p !== playlist);
		if ((await configStore.get('selectedPlaylistId')) === playlist.key) {
			await select(null);
		}
		await publish();

		if (playlist.role === 'local') {
			broadcast({local: true});
			return;
		}
		await api('DELETE', playlist.role === 'owner' ? `v2/playlist/${playlist.id}` : `v2/playlist/${playlist.id}/shares/${playerId}`);
		broadcast({list: true});
	};

	const download = async playlist => {
		const fileName = playlist.playlistTitle + (isReplayPlaylist(playlist) ? '.bsorlist' : '.bplist');
		const remoteId = playlist.id ?? (playlist.role !== 'local' && !playlist.oneclick ? playlist.customData?.id : null);
		if (playlist.accessGuid) {
			saveFromUrl(`${BL_API_URL}playlist/guid/${playlist.accessGuid}`, fileName);
		} else if (remoteId) {
			saveFromUrl(`${BL_API_URL}playlist/${remoteId}`, fileName);
		} else {
			saveFromUrl(URL.createObjectURL(new Blob([JSON.stringify(toFile(playlist))], {type: 'application/json'})), fileName);
		}
	};

	const add = async (song, key = null) => {
		const playlist = await resolve(key);
		if (!playlist || isReplayPlaylist(playlist)) return;

		const entry = clone(song);
		playlist.songs.push(entry);
		return save(playlist, () => postItem(playlist, entry, songToInput(entry)));
	};

	const remove = async (hash, key = null) => {
		const playlist = await resolve(key);
		if (!playlist || isReplayPlaylist(playlist)) return;

		playlist.songs = playlist.songs.filter(el => el.hash != hash);
		return save(playlist, () => api('DELETE', `v2/playlist/${playlist.id}/items?hash=${encodeURIComponent(hash)}`));
	};

	const addDiff = async (hash, diffInfo, key = null) => {
		const playlist = await resolve(key);
		const song = playlist?.songs?.find(el => el.hash == hash);
		if (!song) return;

		const difficulty = toDifficulty(diffInfo);
		if (!song.difficulties) {
			song.difficulties = [];
		}
		song.difficulties.push(difficulty);
		return patchItem(playlist, song, {addDifficulty: difficulty});
	};

	const removeDiff = async (hash, diffInfo, key = null) => {
		const playlist = await resolve(key);
		const song = playlist?.songs?.find(el => el.hash == hash);
		if (!song?.difficulties) return;

		const difficulty = toDifficulty(diffInfo);
		song.difficulties = song.difficulties.filter(el => el.name != difficulty.name || el.characteristic != difficulty.characteristic);
		return patchItem(playlist, song, {removeDifficulty: difficulty});
	};

	const reorder = async (key, itemKey, toIndex, newItem = null) => {
		const playlist = await resolve(key);
		if (!playlist) return;

		const list = itemsOf(playlist);
		const index = list.findIndex(item => item.itemId === itemKey || (item.hash != null && item.hash === itemKey));
		if (index < 0) return newItem ? copyItem(key, newItem, toIndex) : undefined;

		const [item] = list.splice(index, 1);
		list.splice(toIndex, 0, item);
		const after = toIndex > 0 ? list[toIndex - 1] : null;
		return save(playlist, () =>
			api('POST', `v2/playlist/${playlist.id}/items/${item.itemId}/move?afterItemId=${after ? after.itemId : 0}`)
		);
	};

	const copyItem = async (key, item, toIndex = null) => {
		const playlist = await resolve(key);
		if (!playlist) return false;

		const replays = isReplayPlaylist(playlist);
		if (replays !== !!item.replayType) return false;

		const list = itemsOf(playlist);
		if (replays ? findReplay(playlist, item.replayType, item.id) : list.some(s => isSameMap(s, item))) return false;

		const entry = replays ? {replayType: item.replayType, id: item.id, description: item.description} : clone(item);
		delete entry.itemId;
		const index = toIndex == null ? list.length : Math.max(0, Math.min(toIndex, list.length));
		list.splice(index, 0, entry);
		const after = index > 0 ? list[index - 1] : null;

		await save(playlist, () => {
			const afterItemId = after ? after.itemId : 0;
			const input = replays ? {replayType: entry.replayType, id: entry.id, description: entry.description} : songToInput(entry);
			return postItem(playlist, entry, input, afterItemId == null ? '' : `?afterItemId=${afterItemId}`);
		});
		return true;
	};

	const patchPlaylist = async (key, fields, body) => {
		const playlist = await resolve(key);
		if (!playlist) return;

		Object.assign(playlist, fields);
		await publish(false);
		return mutate(playlist, () => api('PATCH', `v2/playlist/${playlist.id}`, body));
	};

	const updateDetails = (key, {title, description}) =>
		patchPlaylist(key, {playlistTitle: title, playlistDescription: description || undefined}, {title, description: description ?? ''});

	const setPublic = async (key, isPublic) => {
		const result = await patchPlaylist(key, {isPublic}, {isPublic});
		const playlist = await resolve(key);
		if (playlist?.customData) playlist.customData.shared = isPublic;
		await publish(false);
		return result;
	};

	const updateIcon = async (key, file) => {
		const playlist = await resolve(key);
		if (!playlist) return;

		playlist.image =
			typeof file === 'string'
				? file
				: await new Promise((resolveRead, reject) => {
						const reader = new FileReader();
						reader.onload = e => resolveRead(e.target.result);
						reader.onerror = reject;
						reader.readAsDataURL(file);
					});
		await publish(false);

		return mutate(playlist, async () => {
			const result = await api('PUT', `v2/playlist/${playlist.id}/cover`, file, true);
			if (result?.cover) playlist.image = result.cover;
			return result;
		});
	};

	const removeIcon = async key => {
		const playlist = await resolve(key);
		if (!playlist) return;

		playlist.image = null;
		await publish(false);
		return mutate(playlist, () => api('DELETE', `v2/playlist/${playlist.id}/cover`));
	};

	const addReplay = async (key, {replayType, id, description}) => {
		const playlist = await resolve(key);
		if (!playlist || !isReplayPlaylist(playlist) || findReplay(playlist, replayType, id)) return;

		const entry = {replayType, id, description};
		playlist.replays.push(entry);
		await publish(false);

		try {
			return await mutate(playlist, () => postItem(playlist, entry, {replayType, id, description}));
		} catch (e) {
			playlist.replays = playlist.replays.filter(r => r !== entry);
			await publish(false);
			throw e;
		}
	};

	const removeItem = async (key, itemId) => {
		const playlist = await resolve(key);
		if (!playlist) return;

		const field = isReplayPlaylist(playlist) ? 'replays' : 'songs';
		playlist[field] = playlist[field].filter(item => item.itemId !== itemId);
		await publish(false);
		return mutate(playlist, () => api('DELETE', `v2/playlist/${playlist.id}/items/${itemId}`));
	};

	const removeReplay = async (key, replayType, id) => {
		const playlist = await resolve(key);
		const entry = findReplay(playlist, replayType, id);
		if (!entry) return;

		// A just-added replay may still be waiting for its id
		await queues[playlist.key];
		return removeItem(key, entry.itemId);
	};

	const updateItemDescription = async (key, itemId, description) => {
		const playlist = await resolve(key);
		if (!playlist) return;

		const item = itemsOf(playlist).find(i => i.itemId === itemId);
		if (item) item.description = description || undefined;
		await publish(false);
		return mutate(playlist, () => api('PATCH', `v2/playlist/${playlist.id}/items/${itemId}`, {description: description ?? ''}));
	};

	const updateReplayDescription = async (key, replayType, id, description) => {
		const playlist = await resolve(key);
		if (!playlist || !isReplayPlaylist(playlist)) return;

		const entry = findReplay(playlist, replayType, id);
		if (!entry) return;

		entry.description = description || undefined;
		return patchItem(playlist, entry, {description: description ?? ''});
	};

	const updateSongDescription = async (key, song, description) => {
		const playlist = await resolve(key);
		if (!playlist || isReplayPlaylist(playlist)) return;

		const entry = playlist.songs.find(s => (song.itemId != null ? s.itemId === song.itemId : s === song || s.hash === song.hash));
		if (!entry) return;

		entry.description = description || undefined;
		return patchItem(playlist, entry, {description: description ?? ''});
	};

	const getReplays = playlist =>
		api('GET', playlist.accessGuid ? `v2/playlist/guid/${playlist.accessGuid}/replays` : `v2/playlist/${playlist.id}/replays`);

	const sortPlaylist = (key, by, order) => mutateAndRefetch(key, 'POST', `sort?by=${by}&order=${order}`);
	const getCleanup = id => api('GET', `v2/playlist/${id}/cleanup`);
	const applyCleanup = (key, {played, deleted, outdated}) => mutateAndRefetch(key, 'POST', 'cleanup', {played, deleted, outdated});
	const stopFollowing = key => mutateAndRefetch(key, 'DELETE', 'source');
	const resetLink = key => mutateAndRefetch(key, 'POST', 'resetlink');

	const refreshSource = async (key, force = false) => {
		const playlist = await resolve(key);
		if (!playlist?.id || !playlist.source) return;
		const result = await api('POST', `v2/playlist/${playlist.id}/refresh?force=${!!force}`);
		if (result?.revision !== playlist.revision) await refetch([playlist.id]);
	};

	const getShares = id => api('GET', `v2/playlist/${id}/shares`);
	const setShare = async (id, sharePlayerId, canEdit) => {
		const result = await api('PUT', `v2/playlist/${id}/shares/${encodeURIComponent(sharePlayerId)}?canEdit=${!!canEdit}`);
		await refetch([Number(id)]).catch(() => {});
		return result;
	};
	const removeShare = async (id, sharePlayerId) => {
		const result = await api('DELETE', `v2/playlist/${id}/shares/${encodeURIComponent(sharePlayerId)}`);
		await refetch([Number(id)]).catch(() => {});
		return result;
	};

	const setShareLink = async (key, enabled) => {
		const playlist = await resolve(key);
		if (!playlist?.id) return null;
		const result = await api(enabled ? 'POST' : 'DELETE', `v2/playlist/${playlist.id}/sharelink`);
		playlist.linkGuid = result?.linkGuid ?? null;
		await publish();
		return playlist.linkGuid;
	};

	const hasSharedPlaylists = () => playlists.some(p => p.role === 'editor' || p.role === 'viewer' || p.shareCount > 0);
	const poll = () => {
		if (mode === 'server' && hasSharedPlaylists()) syncIfVisible();
	};
	const watch = () => {
		watchers++;
		if (!pollTimer) pollTimer = setInterval(poll, POLL_INTERVAL);
		return () => {
			watchers = Math.max(0, watchers - 1);
			if (!watchers && pollTimer) {
				clearInterval(pollTimer);
				pollTimer = null;
			}
		};
	};

	const voteQuery = playlist => (playlist?.accessGuid ? `?guid=${playlist.accessGuid}` : '');
	const changeVote = async (key, method, path, body) => {
		const playlist = await resolve(key);
		if (!playlist?.id) return null;

		const vote = await api(method, `v2/playlist/${playlist.id}/votes${path}`, body);
		await refetch([playlist.id]);
		const fresh = findPlaylist(playlists, playlist.key);
		if (fresh) broadcast({id: fresh.id, revision: fresh.revision});
		return vote;
	};
	const startVote = (key, settings) => changeVote(key, 'POST', '', settings);
	const endVote = (key, voteId) => changeVote(key, 'POST', `/${voteId}/end`);
	const deleteVote = (key, voteId) => changeVote(key, 'DELETE', `/${voteId}`);
	const getVotes = playlist => api('GET', `v2/playlist/${playlist.id}/votes${voteQuery(playlist)}`);
	const getVote = (playlist, voteId) => api('GET', `v2/playlist/${playlist.id}/votes/${voteId}${voteQuery(playlist)}`);
	const castVote = (playlist, voteId, optionIds) =>
		api('PUT', `v2/playlist/${playlist.id}/votes/${voteId}/ballot${voteQuery(playlist)}`, {optionIds});
	const reload = async key => {
		const playlist = await resolve(key);
		if (playlist?.id) await refetch([playlist.id]);
	};

	const getShared = async (id, callback) => {
		const own = findPlaylist(all(), id);
		if (own) {
			callback(own, own.key);
			return;
		}

		const showFetched = playlist => callback(playlist, findPlaylist(all(), playlist.key)?.key);
		// A guid can be all digits, so it goes first
		if (isPlaylistGuid(id)) {
			showFetched({...fromServer(await api('GET', `v2/playlist/guid/${id}`)), accessGuid: String(id).toLowerCase()});
		} else if (/^\d+$/.test(String(id))) {
			showFetched(fromServer(await api('GET', `v2/playlist/${id}`)));
		} else {
			const playlist = await fetchLinked(`playlist/${id}/link`);
			callback({...playlist, type: 'maps', role: 'viewer', replays: []}, undefined);
		}
	};

	const addGenerated = async (url, callback, follow = false) => {
		const playlist = await fetch(url, {credentials: 'include'}).then(response => response.json());
		if (!playlist.playlistTitle || !playlist.songs) return;

		const created = await create(null, follow && mode === 'server' ? {...playlist, source: url} : playlist);
		if (created && !created.source) await select(created);
		callback();
	};

	const mapsGeneratorUrl = (path, count, filters) => {
		if (!filters.order) {
			filters.order = 'desc';
		}

		return substituteVarsUrl(
			BL_API_URL +
				path +
				'?count=${count}&type=${type}&search=${search}&noSearchSort=${noSearchSort}&title=${playlistTitle}&stars_from=${stars_from}&stars_to=${stars_to}&accrating_from=${accrating_from}&accrating_to=${accrating_to}&passrating_from=${passrating_from}&passrating_to=${passrating_to}&techrating_from=${techrating_from}&techrating_to=${techrating_to}&duration_from=${duration_from}&duration_to=${duration_to}&date_from=${date_from}&date_to=${date_to}&date_range=${date_range}&sortBy=${sortBy}&order=${order}&thenSortBy=${thenSort}&thenOrder=${thenOrder}&mytype=${mytype}&mode=${mode}&difficulty=${difficulty}&count=${count}&mapType=${mapType}&allTypes=${allTypes}&duplicate_diffs=${duplicateDiffs}&mapRequirements=${mapRequirements}&songStatus=${songStatus}&allRequirements=${allRequirements}&playlistIds=${playlistIds}&mappers=${mappers}',
			{count, ...filters},
			true,
			true
		);
	};

	const generatePlaylist = (count, filters, callback, follow = false) =>
		addGenerated(mapsGeneratorUrl('playlist/generate', count, filters), callback, follow);

	const generatedTitle = filters =>
		fetch(mapsGeneratorUrl('playlist/generate/title', 0, {...filters}), {credentials: 'include'}).then(response =>
			response.ok ? response.text() : null
		);

	const generatePlayerPlaylist = (count, playerId, filters, callback, follow = false) => {
		if (!filters.order) {
			filters.order = 'desc';
		}

		let url = substituteVarsUrl(
			BL_API_URL +
				'playlist/scores/generate?playerId=${playerId}&leaderboardContext=${leaderboardContext}&page=${page}&sortBy=${sortBy}&order=${order}&thenSortBy=${thenSort}&thenOrder=${thenOrder}&search=${search}&noSearchSort=${noSearchSort}&diff=${diff}&mode=${mode}&requirements=${requirements}&type=${songType}&hmd=${hmd}&modifiers=${modifiers}&stars_from=${starsFrom}&stars_to=${starsTo}&eventId=${eventId}&count=${count}&duplicate_diffs=${duplicateDiffs}',
			{
				count,
				playerId,
				order: filters.order,
				sortBy: filters.sort,
				duplicateDiffs: filters.duplicateDiffs,
				starsTo: filters.filters.stars?.to,
				starsFrom: filters.filters.stars?.from,
				...filters.filters,
			},
			true,
			true
		);

		return addGenerated(url, callback, follow);
	};

	const generateClanPlaylist = (ppLimit, clanId, sortBy, playedStatus, duplicateDiffs, callback, follow = false) => {
		let url = substituteVarsUrl(
			BL_API_URL +
				'playlist/clan/generate?clanId=${clanId}&ppLimit=${ppLimit}&duplicate_diffs=${duplicateDiffs}&sortBy=${sortBy}&playedStatus=${playedStatus}',
			{clanId, ppLimit, sortBy, playedStatus, duplicateDiffs},
			true,
			true
		);

		return addGenerated(url, callback, follow);
	};

	playlistStore = {
		subscribe,
		get: all,
		refresh,
		isLoggedIn: () => mode === 'server',
		create,
		copy,
		createPlaylist,
		select,
		add,
		remove,
		addDiff,
		removeDiff,
		reorder,
		copyItem,
		deleteList,
		download,
		updateIcon,
		removeIcon,
		updateDetails,
		setPublic,
		addReplay,
		removeReplay,
		removeItem,
		updateItemDescription,
		updateSongDescription,
		updateReplayDescription,
		getReplays,
		sortPlaylist,
		getCleanup,
		refreshSource,
		stopFollowing,
		applyCleanup,
		getShares,
		setShare,
		removeShare,
		resetLink,
		setShareLink,
		startVote,
		endVote,
		deleteVote,
		getVotes,
		getVote,
		castVote,
		reload,
		watch,
		getShared,
		generatePlaylist,
		generatedTitle,
		generatePlayerPlaylist,
		generateClanPlaylist,
	};

	return playlistStore;
};
