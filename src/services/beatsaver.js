import queue from '../network/queues';
import {PRIORITY} from '../network/http-queue';
import log from '../utils/logger'
import {SsrHttpNotFoundError, SsrNetworkError} from '../network/errors'

import songsRepository from "../db/repository/songs";
import cacheRepository from "../db/repository/cache";
import {addToDate, HOUR} from '../utils/date'

const BS_SUSPENSION_KEY = 'bsSuspension';
const BS_NOT_FOUND_KEY = 'bs404';
const BS_NOT_FOUND_HOURS_BETWEEN_COUNTS = 1;

export default () => {
    const cacheSongInfo = async songInfo => {
        if (!songInfo.hash || !songInfo.key) return null;

        songInfo.hash = songInfo.hash.toLowerCase();
        songInfo.key = songInfo.key.toLowerCase();

        delete songInfo.description;

        await songsRepository().set(songInfo);

        return songInfo;
    }

    const isSuspended = bsSuspension => !!bsSuspension && bsSuspension.activeTo > new Date() && bsSuspension.started > addToDate(-24 * HOUR);
    const getCurrentSuspension = async () => cacheRepository().get(BS_SUSPENSION_KEY);
    const prolongSuspension = async bsSuspension => {
        const current = new Date();

        const suspension = isSuspended(bsSuspension) ? bsSuspension : {started: current, activeTo: new Date(), count: 0};

        suspension.activeTo = addToDate(Math.pow(2, suspension.count) * HOUR, suspension.activeTo);
        suspension.count++;

        return await cacheRepository().set(suspension, BS_SUSPENSION_KEY);
    }

    const get404Hashes = async () => cacheRepository().get(BS_NOT_FOUND_KEY);
    const set404Hashes = async hashes => cacheRepository().set(hashes, BS_NOT_FOUND_KEY);
    const setHashNotFound = async hash => {
        let songs404 = await get404Hashes();
        if (!songs404) songs404 = {};

        const item = songs404[hash] ? songs404[hash] : {firstTry: new Date(), recentTry: null, count: 0};

        if (!item.recentTry || addToDate(BS_NOT_FOUND_HOURS_BETWEEN_COUNTS * HOUR, item.recentTry) < new Date()) {
            item.recentTry = new Date();
            item.count++;

            songs404[hash] = item;

            await set404Hashes(songs404);
        }
    }
    const isHashUnavailable = async hash => {
        const songs404 = await get404Hashes();
        return songs404 && songs404[hash] && songs404[hash].count >= 3;
    }

    const fetchSong = async (songInfo, fetchFunc, forceUpdate = false, cacheOnly = false, errSongId = '', hash = null) => {
        if (!forceUpdate && songInfo) return songInfo;

        if(cacheOnly) return null;

        let bsSuspension = await getCurrentSuspension();

        try {
            if (isSuspended(bsSuspension) || (hash && await isHashUnavailable(hash))) return null;

            const songInfo = await fetchFunc();
            if (!songInfo) {
                log.warn(`Song "${errSongId}" is no longer available at Beat Saver.`);
                return null;
            }

            return cacheSongInfo(songInfo);
        } catch (err) {
            if (hash && err instanceof SsrHttpNotFoundError) {
                await setHashNotFound(hash);
            }

            if (err instanceof SsrNetworkError && err.message === 'Network error') {
                try {await prolongSuspension(bsSuspension)} catch {}
            }

            log.warn(`Error fetching Beat Saver song "${errSongId}"`);

            return null;
        }
    }

    const byHash = async (hash, forceUpdate = false, cacheOnly = false, signal = null, priority = PRIORITY.FG_LOW) => {
        hash = hash.toLowerCase();

        const songInfo = await songsRepository().get(hash);

        return fetchSong(songInfo, () => queue.BEATSAVER.byHash(hash, signal, priority), forceUpdate, cacheOnly, hash, hash)
    }

    const byKey = async (key, forceUpdate = false, cacheOnly = false, signal = null, priority = PRIORITY.FG_LOW) => {
        key = key.toLowerCase();

        const songInfo = await songsRepository().getFromIndex('songs-key', key);

        return fetchSong(songInfo, () => queue.BEATSAVER.byKey(key, signal, priority), forceUpdate, cacheOnly, key)
    }

    return {
        byHash,
        byKey,
    }
}