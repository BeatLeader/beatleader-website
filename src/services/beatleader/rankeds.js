import {db} from '../../db/db'
import queues from '../../network/queues/queues';
import rankedsPageClient from '../../network/clients/beatleader/rankeds/page';
import eventBus from '../../utils/broadcast-channel-pubsub'
import {arrayDifference, convertArrayToObjectByKey, opt} from '../../utils/js'
import rankedsRepository from '../../db/repository/rankeds'
import rankedsChangesRepository from '../../db/repository/rankeds-changes'
import keyValueRepository from '../../db/repository/key-value'
import log from '../../utils/logger'
import {addToDate, formatDate, HOUR} from '../../utils/date'

const REFRESH_INTERVAL = HOUR;

let service = null;
export default () => {
  if (service) return service;

  const getRankeds = async () => {
    const dbRankeds = await rankedsRepository().getAll()

    return dbRankeds ? convertArrayToObjectByKey(dbRankeds, 'leaderboardId') : {}
  }

  const getLastUpdated = async () => keyValueRepository().get('rankedsLastUpdated');
  const setLastUpdated = async date => keyValueRepository().set(date, 'rankedsLastUpdated');

  const refreshRankeds = async (forceUpdate = false, priority = queues.PRIORITY.BG_NORMAL, throwErrors = false) => {
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

      log.trace(`Fetching current rankeds from server...`, 'RankedsService')
      fetchedRankedSongs = await rankedsPageClient.getProcessed({priority});
      if (!fetchedRankedSongs || !fetchedRankedSongs.length) {
        log.warn(`Server returned empty rankeds list`, 'RankedsService')

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
        leaderboardId,
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
              .filter(s => s.stars !== (fetchedRankedSongs[s.leaderboardId] ? opt(fetchedRankedSongs[s.leaderboardId], 'stars', null) : null))
              .map(s => ({
                  leaderboardId: s.leaderboardId,
                  oldStars: s.stars,
                  stars: opt(fetchedRankedSongs[s.leaderboardId], 'stars', null),
                  timestamp: Date.now(),
                }),
              )
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

      await db.runInTransaction(['rankeds', 'rankeds-changes', 'key-value'], async tx => {
        await Promise.all(changedLeaderboards.map(async ranked => rankedsRepository().set(ranked, undefined, tx)));
        await Promise.all(changed.map(async rc => rankedsChangesRepository().set(rc, undefined, tx)));
        await setLastUpdated(new Date())
      });

      log.trace('Rankeds saved', 'RankedsService');

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

  const destroyService = () => {
    service = null;
  }

  service = {
    get: getRankeds,
    refresh: refreshRankeds,
    destroyService,
  }

  return service;
}