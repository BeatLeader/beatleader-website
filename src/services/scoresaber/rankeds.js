import {db} from '../../db/db'
import queues from '../../network/queues';
import eventBus from '../../utils/broadcast-channel-pubsub'
import {arrayDifference, convertArrayToObjectByKey, opt} from '../../utils/js'
import rankedsRepository from '../../db/repository/rankeds'
import rankedsChangesRepository from '../../db/repository/rankeds-changes'
import keyValueRepository from '../../db/repository/key-value'
import songsRepository from '../../db/repository/songs'
import log from '../../utils/logger'
import {addToDate, formatDate, HOUR} from '../../utils/date'

const REFRESH_INTERVAL = HOUR;
const RANKEDS_NOTES_CACHE_KEY = 'rankedsNotes';

let service = null;
export default () => {
  if (service) return service;

  const getRankeds = async () => {
    const dbRankeds = await rankedsRepository().getAll()

    return dbRankeds ? convertArrayToObjectByKey(dbRankeds, 'leaderboardId') : {}
  }

  const getLastUpdated = async () => keyValueRepository().get('rankedsLastUpdated');
  const setLastUpdated = async date => keyValueRepository().set(date, 'rankedsLastUpdated');

  const getRankedsNotesSongCacheFromCharacteristics = songCharacteristics =>
    songCharacteristics
      ? songCharacteristics.reduce((scCum, ch) => {
        scCum[ch.name] = ch && ch.difficulties
          ? Object.keys(ch.difficulties).reduce((dCum, diffKey) => {
            const notes = ch.difficulties[diffKey] && ch.difficulties[diffKey].notes ? ch.difficulties[diffKey].notes : null;
            if (!notes) return dCum;

            dCum[diffKey] = notes;

            return dCum;
          }, {})
          : {};

        return scCum;
      }, {})
      : null;

  const setRankedsNotesCache = async rankedsNotesCache => keyValueRepository().set(rankedsNotesCache, RANKEDS_NOTES_CACHE_KEY);
  const getRankedsNotesCache = async () => {
    // try to get current cache
    const currentCache = await keyValueRepository().get(RANKEDS_NOTES_CACHE_KEY);
    if (currentCache) return currentCache;

    // prepare cache
    const bsSongs = convertArrayToObjectByKey(
      (await songsRepository().getAll()).map(s => ({
        hash: s.hash.toLowerCase(),
        characteristics: opt(s, 'metadata.characteristics'),
      })),
      'hash',
    );
    const rankedsWithLowerCaseHashes = Object.values(await getRankeds()).map(r => ({...r, hash: r.hash.toLowerCase()}));
    const rankedsNotesCaches = rankedsWithLowerCaseHashes.reduce((cum, ranked) => {
      if (!ranked.leaderboardId) return cum;

      const hash = ranked.hash;

      const songCharacteristics = bsSongs[hash] && bsSongs[hash].characteristics ? bsSongs[hash].characteristics : null;
      const songNotesCount = getRankedsNotesSongCacheFromCharacteristics(songCharacteristics);

      if (!cum[hash] && songNotesCount) cum[hash] = songNotesCount;

      return cum;
    }, {});

    // store cache
    await keyValueRepository().set(rankedsNotesCaches, RANKEDS_NOTES_CACHE_KEY);

    return rankedsNotesCaches;
  }

  const refreshRankeds = async (forceUpdate = false, throwErrors = false) => {
    log.trace(`Starting rankeds refreshing${forceUpdate ? ' (forced)' : ''}...`, 'RankedsService')

    try {
      let fetchedRankedSongs;

      if (!forceUpdate) {
        const lastUpdated = await getLastUpdated();
        if (lastUpdated && lastUpdated > new Date() - REFRESH_INTERVAL) {
          log.debug(`Refresh interval not yet expired, skipping. Next refresh on ${formatDate(addToDate(REFRESH_INTERVAL, lastUpdated))}`, 'RankedsService')

          return null;
        }
      }

      log.trace(`Fetching current rankeds from ScoreSaber...`, 'RankedsService')
      fetchedRankedSongs = await queues.SCORESABER_PAGE.rankeds();
      if (!fetchedRankedSongs || !fetchedRankedSongs.length) {
        log.warn(`ScoreSaber returned empty rankeds list`, 'RankedsService')

        return null;
      }

      log.trace('Fetching rankeds from DB', 'RankedsService');
      const oldRankedSongs = await getRankeds();

      // add firstSeen & oldStars properties
      fetchedRankedSongs = convertArrayToObjectByKey(
        fetchedRankedSongs.map(s => {
          const firstSeen = oldRankedSongs[s.leaderboardId] && oldRankedSongs[s.leaderboardId].firstSeen
            ? oldRankedSongs[s.leaderboardId].firstSeen
            : new Date();

          return {...s, firstSeen, oldStars: null}
        }),
        'leaderboardId',
      );

      // find differences between old and new ranked songs
      const newRankeds = arrayDifference(
        Object.keys(fetchedRankedSongs),
        Object.keys(oldRankedSongs),
      ).map(leaderboardId => ({
        leaderboardId: parseInt(leaderboardId, 10),
        oldStars: null,
        stars: fetchedRankedSongs[leaderboardId].stars,
        timestamp: Date.now(),
      }));

      if (newRankeds && newRankeds.length)
        log.debug(`${newRankeds.length} ranked(s) found`, 'RankedsService');

      const changed =
        // concat new rankeds with changed rankeds
        newRankeds
          .concat(
            Object.values(oldRankedSongs)
              .filter((s) => s.stars !== fetchedRankedSongs[s.leaderboardId] ? opt(fetchedRankedSongs[s.leaderboardId], 'stars', null) : null)
              .map(s => ({
                  leaderboardId: s.leaderboardId,
                  oldStars: s.stars,
                  stars: opt(fetchedRankedSongs[s.leaderboardId], 'stars', null),
                  timestamp: Date.now(),
                }),
              ),
          );

      if(newRankeds && changed && changed.length - newRankeds.length > 0)
        log.debug(`${changed.length - newRankeds.length} changed ranked(s) found`, 'RankedsService');

      const changedLeaderboards = changed
        .map(s => {
            const ranked = fetchedRankedSongs[s.leaderboardId] ? fetchedRankedSongs[s.leaderboardId] : oldRankedSongs[s.leaderboardId];

            return {
              ...ranked,
              ...s,
            }
          },
        )
        .filter(s => s && s.hash)
        .map(l => {
          const {oldStars, timestamp, ...leaderboard} = l;
          return leaderboard;
        });

      log.trace('Saving rankeds to DB...', 'RankedsService');

      await db.runInTransaction(['rankeds', 'rankeds-changes', 'key-value'], async _ => {
        await Promise.all(changedLeaderboards.map(async ranked => rankedsRepository().set(ranked)));
        await Promise.all(changed.map(async rc => rankedsChangesRepository().set(rc)));
        await setLastUpdated(new Date())
      });

      log.trace('Rankeds saved', 'RankedsService');

      if (newRankeds.length) {
        log.trace('Adding notes cache for new rankeds...', 'RankedsService');

        const newHashes = newRankeds
          .map(r => fetchedRankedSongs[r.leaderboardId] && fetchedRankedSongs[r.leaderboardId].hash
            ? fetchedRankedSongs[r.leaderboardId].hash.toLowerCase()
            : null,
          )
          .filter(hash => hash);
        const rankedsNotesCache = await getRankedsNotesCache();

        // set empty notes cache for newly downloaded rankeds in order to be downloaded
        let shouldNotesCacheBeSaved = false;
        newHashes.forEach(hash => {
          if (rankedsNotesCache[hash]) return;

          rankedsNotesCache[hash] = null;
          shouldNotesCacheBeSaved = true;
        });

        if (shouldNotesCacheBeSaved) await setRankedsNotesCache(rankedsNotesCache);

        log.trace('Notes cache added', 'RankedsService');
      }

      if (changed.length) {
        eventBus.publish('rankeds-changed', {changed, allRankeds: fetchedRankedSongs});
      }

      log.debug(`Rankeds refreshing complete.`, 'RankedsService')

      return changed;
    } catch (e) {
      if (throwErrors) throw e;

      log.debug(`Rankeds refreshing error`, 'RankedsService', e)

      return null;
    }
  }

  service = {
    getRankeds,
    refreshRankeds,
    getRankedsNotesCache,
    setRankedsNotesCache,
  }

  return service;
}