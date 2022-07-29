import hashApiClient from '../network/clients/beatmaps/api-hash';
import mapperClient from '../network/clients/beatmaps/api-mapper';
import keyApiClient from '../network/clients/beatmaps/api-key';
import {PRIORITY} from '../network/queues/http-queue';
import log from '../utils/logger'
import {SsrHttpNotFoundError, SsrNetworkError} from '../network/errors'
import keyValueRepository from '../db/repository/key-value';
import songsBeatMapsRepository from "../db/repository/songs-beatmaps";
import cacheRepository from "../db/repository/cache";
import {addToDate, dateFromString, HOUR} from '../utils/date'
import {capitalize, opt} from '../utils/js'

const BM_SUSPENSION_KEY = 'bmSuspension';
const BM_NOT_FOUND_KEY = 'bm404';
const BM_NOT_FOUND_HOURS_BETWEEN_COUNTS = 1;

const INVALID_NOTES_COUNT_FIXES = {
    'e738b38b594861745bfb0473c66ca5cca15072ff': [
        {type: 'Standard', diff: "ExpertPlus", notes: 942}
    ]
}

export default () => {
    const cacheSongInfo = async (songInfo, originalHash) => {
        if (!songInfo) return null;

        const hash = originalHash && originalHash.length ? originalHash : songInfo.hash;

        if (!hash || !songInfo.key) return null;

        songInfo.hash = hash.toLowerCase();
        songInfo.key = songInfo.key.toLowerCase();

        delete songInfo.description;

        await songsBeatMapsRepository().set(songInfo);

        return songInfo;
    }

    const isSuspended = bsSuspension => !!bsSuspension && bsSuspension.activeTo > new Date() && bsSuspension.started > addToDate(-24 * HOUR);
    const getCurrentSuspension = async () => cacheRepository().get(BM_SUSPENSION_KEY);
    const prolongSuspension = async bsSuspension => {
        const current = new Date();

        const suspension = isSuspended(bsSuspension) ? bsSuspension : {started: current, activeTo: new Date(), count: 0};

        suspension.activeTo = addToDate(Math.pow(2, suspension.count) * HOUR, suspension.activeTo);
        suspension.count++;

        return await cacheRepository().set(suspension, BM_SUSPENSION_KEY);
    }

    const get404Hashes = async () => cacheRepository().get(BM_NOT_FOUND_KEY);
    const set404Hashes = async hashes => cacheRepository().set(hashes, BM_NOT_FOUND_KEY);
    const setHashNotFound = async hash => {
        let songs404 = await get404Hashes();
        if (!songs404) songs404 = {};

        const item = songs404[hash] ? songs404[hash] : {firstTry: new Date(), recentTry: null, count: 0};

        if (!item.recentTry || addToDate(BM_NOT_FOUND_HOURS_BETWEEN_COUNTS * HOUR, item.recentTry) < new Date()) {
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

    const fixInvalidNotesCount = (hash, songInfo) => {
        if (!hash) return songInfo;

        if (INVALID_NOTES_COUNT_FIXES[hash] && songInfo?.versions)
            songInfo.versions.forEach(si => {
                if (!si?.diffs) return;

                si.diffs.forEach(d => {
                    const newNotesCnt = INVALID_NOTES_COUNT_FIXES[hash].find(f => f.type === d?.characteristic && f.diff === d?.difficulty);
                    if (!newNotesCnt) return;

                    d.notes = newNotesCnt.notes;
                })
            })

        return songInfo;
    }

    const fetchSong = async (songInfo, fetchFunc, forceUpdate = false, cacheOnly = false, errSongId = '', hash = null) => {
        if (!forceUpdate && songInfo) return fixInvalidNotesCount(hash, songInfo);

        if(cacheOnly) return null;

        let bsSuspension = await getCurrentSuspension();

        try {
            if (isSuspended(bsSuspension) || (hash && await isHashUnavailable(hash))) return null;

            const songInfo = await fetchFunc();
            if (!songInfo) {
                log.warn(`Song "${errSongId}" is no longer available at BeatSaver.`);
                return null;
            }

            return fixInvalidNotesCount(hash, cacheSongInfo(songInfo, hash));
        } catch (err) {
            if (hash && err instanceof SsrHttpNotFoundError) {
                await setHashNotFound(hash);
            }

            if (err instanceof SsrNetworkError && err.message === 'Network error') {
                try {await prolongSuspension(bsSuspension)} catch {}
            }

            log.warn(`Error fetching BeatSaver song "${errSongId}"`);

            return null;
        }
    }

    const byHash = async (hash, forceUpdate = false, cacheOnly = false, signal = null, priority = PRIORITY.FG_LOW) => {
        hash = hash.toLowerCase();

        const songInfo = await songsBeatMapsRepository().get(hash);

        return fetchSong(songInfo, () => hashApiClient.getProcessed({hash, signal, priority}), forceUpdate, cacheOnly, hash, hash)
    }

    const byKey = async (key, forceUpdate = false, cacheOnly = false, signal = null, priority = PRIORITY.FG_LOW) => {
        key = key.toLowerCase();

        const songInfo = await songsBeatMapsRepository().getFromIndex('songs-beatmaps-key', key);

        return fetchSong(songInfo, () => keyApiClient.getProcessed({key, signal, priority}), forceUpdate, cacheOnly, key)
    }

    const convertOldBeatSaverToBeatMaps = song => {
        let {key, hash, name, metadata: {characteristics}} = song;

        if (!key || !hash || !name || !characteristics || !Array.isArray(characteristics)) return null;

        if (hash.toLowerCase) hash = hash.toLowerCase();

        const diffs = characteristics.reduce((diffs, ch) => {
            if (!ch.name || !ch.difficulties) return diffs;
            const characteristic = ch.name;

            return diffs.concat(
              Object.entries(ch.difficulties)
                .map(([difficulty, obj]) => {
                    if (!obj) return null;
                    difficulty = capitalize(difficulty);

                    const seconds = opt(obj, 'length', null);
                    const notes = opt(obj, 'notes', null)

                    const nps = notes && seconds ? notes / seconds : null;

                    return {
                        njs: opt(obj, 'njs', null),
                        offset: opt(obj, 'njsOffset', null),
                        notes,
                        bombs: opt(obj, 'bombs', null),
                        obstacles: opt(obj, 'obstacles', null),
                        nps,
                        length: opt(obj, 'duration', null),
                        characteristic,
                        difficulty,
                        events: null,
                        chroma: null,
                        me: null,
                        ne: null,
                        cinema: null,
                        seconds,
                        paritySummary: {
                            errors: null,
                            warns: null,
                            resets: null,
                        },
                        stars: null,
                    };
                }))
              .filter(diff => diff)
        }, []);

        return {
            lastUpdated: dateFromString(opt(song, 'uploaded', new Date())),
            oldBeatSaverId: opt(song, '_id', null),
            id: key,
            hash,
            key,
            name,
            description: '',
            uploader: {
                id: null,
                name: opt(song, 'uploader.username', null),
                hash: null,
                avatar: null
            },
            metadata: {
                bpm: opt(song, 'metadata.bpm', null),
                duration: opt(song, 'metadata.duration', null),
                songName: opt(song, 'metadata.songName', ''),
                songSubName: opt(song, 'metadata.songSubName', ''),
                songAuthorName: opt(song, 'metadata.songAuthorName', ''),
                levelAuthorName: opt(song, 'metadata.levelAuthorName', '')
            },
            stats: {
                plays: opt(song, 'stats.plays', 0),
                downloads: opt(song, 'stats.downloads', 0),
                upvotes: opt(song, 'stats.upVotes', 0),
                downvotes: opt(song, 'stats.downVotes', 0),
                score: null
            },
            uploaded: opt(song, 'uploaded', null),
            automapper: !!opt(song, 'metadata.automapper', false),
            ranked: null,
            qualified: null,
            versions: [
                {
                    hash,
                    key,
                    state: "Published",
                    createdAt: opt(song, 'uploaded', null),
                    sageScore: null,
                    diffs,
                    downloadURL: `https://cdn.beatsaver.com/${hash}.zip`,
                    coverURL: `https://cdn.beatsaver.com/${hash}.jpg`,
                    previewURL: `https://cdn.beatsaver.com/${hash}.mp3`
                }
            ]
        }
    }

    const getMapper = async (id, forceUpdate = false, cacheOnly = false, signal = null, priority = PRIORITY.FG_LOW) => {
        var mapperInfo = await keyValueRepository().get("mapper-" + id);
        if (!cacheOnly && (forceUpdate || !mapperInfo)) {
            mapperInfo = await mapperClient.getProcessed({id, signal, priority})
            keyValueRepository().set(mapperInfo, "mapper-" + id);
        }

        return mapperInfo;
    }

    return {
        byHash,
        byKey,
        getMapper,
        convertOldBeatSaverToBeatMaps
    }
}