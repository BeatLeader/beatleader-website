import {db} from '../db/db'
import queues from '../network/queues/queues';
import accSaberCategoriesApiClient from '../network/clients/accsaber/api-categories';
import accSaberRankingApiClient from '../network/clients/accsaber/api-ranking';
import accSaberScoresApiClient from '../network/clients/accsaber/api-scores';
import accSaberPlayerRankHistoryApiClient from '../network/clients/accsaber/api-player-rank-history';
import accSaberCategoriesRepository from '../db/repository/accsaber-categories'
import accSaberPlayersRepository from '../db/repository/accsaber-players'
import accSaberPlayersHistoryRepository from '../db/repository/accsaber-players-history';
import keyValueRepository from '../db/repository/key-value'
import createPlayerService from '../services/scoresaber/player';
import {capitalize} from '../utils/js'
import log from '../utils/logger'
import {
  addToDate,
  toAccSaberMidnight,
  formatDate,
  HOUR,
  MINUTE,
  dateFromString
} from '../utils/date'
import {PRIORITY} from '../network/queues/http-queue'
import makePendingPromisePool from '../utils/pending-promises'
import {getServicePlayerGain} from './utils'

const REFRESH_INTERVAL = HOUR;
const SCORES_NETWORK_TTL = MINUTE * 5;

const CATEGORIES_ORDER = ['overall', 'true', 'standard', 'tech'];

let service = null;
export default () => {
  if (service) return service;

  const playerService = createPlayerService();

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const getCategories = async () => {
    const categories = await accSaberCategoriesRepository().getAll();

    const getIdx = category => {
      const idx = CATEGORIES_ORDER.findIndex(v => v === category?.name);

      return idx >= 0 ? idx : 100000;
    }
    return categories.sort((a,b) => getIdx(a) - getIdx(b));
  }

  const getPlayer = async playerId => accSaberPlayersRepository().getAllFromIndex('accsaber-players-playerId', playerId);
  const getRanking = async (category = 'overall') => accSaberPlayersRepository().getAllFromIndex('accsaber-players-category', category);
  const getPlayerHistory = async playerId => resolvePromiseOrWaitForPending(`accSaberPlayerHistory/${playerId}`, () => accSaberPlayersHistoryRepository().getAllFromIndex('accsaber-players-history-playerId', playerId))

  const getPlayerGain = (playerHistory, daysAgo = 1, maxDaysAgo = 7) => getServicePlayerGain(playerHistory, toAccSaberMidnight, 'accSaberDate', daysAgo, maxDaysAgo);

  const getLastUpdatedKey = type => `accSaber${capitalize(type)}LastUpdated`;
  const getLastUpdated = async (type = 'all') => keyValueRepository().get(getLastUpdatedKey(type));
  const setLastUpdated = async (type = 'all', date) => keyValueRepository().set(date, getLastUpdatedKey(type));

  const shouldRefresh = async (type = 'all', forceUpdate = false) => {
    if (!forceUpdate) {
      const lastUpdated = await getLastUpdated(type);
      if (lastUpdated && lastUpdated > new Date() - REFRESH_INTERVAL) {
        log.debug(`Refresh interval for ${type} not yet expired, skipping. Next refresh on ${formatDate(addToDate(REFRESH_INTERVAL, lastUpdated))}`, 'AccSaberService')

        return false;
      }
    }

    return true;
  }

  const fetchScoresPage = async (playerId, page = 1, priority = PRIORITY.FG_LOW, {...options} = {}) => {
    if (!options) options = {};
    if (!options.hasOwnProperty('cacheTtl')) options.cacheTtl = SCORES_NETWORK_TTL;

    return accSaberScoresApiClient.getProcessed({...options, playerId, page, priority});
  }

  const fetchPlayerRankHistory = async (playerId, priority = PRIORITY.FG_LOW, {...options} = {}) => {
    if (!options) options = {};
    if (!options.hasOwnProperty('cacheTtl')) options.cacheTtl = SCORES_NETWORK_TTL;

    return accSaberPlayerRankHistoryApiClient.getProcessed({...options, playerId, priority});
  }

  const refreshCategories = async (forceUpdate = false, priority = queues.PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.debug(`Starting AccSaber categories refreshing${forceUpdate ? ' (forced)' : ''}...`, 'AccSaberService')

    try {
      log.trace(`Fetching categories from DB...`, 'AccSaberService');

      const dbCategories = await getCategories();

      log.trace(`DB categories fetched`, 'AccSaberService', dbCategories);

      if (!await shouldRefresh('categories', forceUpdate)) return {changed: [], all: dbCategories};

      log.trace(`Fetching current categories from AccSaber...`, 'AccSaberService');

      let categories = await accSaberCategoriesApiClient.getProcessed({priority});
      if (!categories || !categories.length) {
        log.warn(`AccSaber returned empty categories list`, 'AccSaberService')

        return null;
      }

      categories = categories.concat([{
        name: 'overall',
        displayName: 'Overall',
        countsTowardsOverall: null,
        description: 'Overall'
      }]);

      log.trace(`Categories fetched`, 'AccSaberService', categories);

      const dbCategoriesNames = dbCategories.map(c => c.name);
      const newCategories = categories.filter(c => !dbCategories || !dbCategoriesNames.includes(c.name));

      if (newCategories && newCategories.length)
        log.debug(`${newCategories.length} new categories found`, 'AccSaberService');

      await db.runInTransaction(['accsaber-categories', 'key-value'], async tx => {
        const newCategoriesNames = categories.map(c => c.name);

        const accSaberCategoriesStore = tx.objectStore('accsaber-categories');

        let cursor = await accSaberCategoriesStore.openCursor();

        log.trace(`Remove old categories from DB`, 'AccSaberService');

        while (cursor) {
          const category = cursor.value;
          if (!newCategoriesNames.includes(category.name)) await cursor.delete();

          cursor = await cursor.continue();
        }

        log.trace(`Old categories removed from DB`, 'AccSaberService');

        log.trace(`Updating categories in DB...`, 'AccSaberService');

        await Promise.all(categories.map(async c => accSaberCategoriesStore.put(c)));

        log.trace(`Categories updated`, 'AccSaberService');

        log.trace(`Updating categories last update date in DB...`, 'AccSaberService');

        await tx.objectStore('key-value').put(new Date(), getLastUpdatedKey('categories'));

        log.debug(`Categories last update date updated`, 'AccSaberService');
      });

      accSaberCategoriesRepository().addToCache(categories);
      keyValueRepository().setCache(getLastUpdatedKey('categories'), new Date());

      log.debug(`Categories refreshing completed`, 'AccSaberService');

      return {changed: newCategories, all: categories};
    }
    catch(e) {
      if (throwErrors) throw e;

      log.debug(`Categories refreshing error`, 'AccSaberService', e)

      return null;
    }
  }

  const updatePlayerHistory = async player => {
    if (!player?.playerId) return;

    try {
      log.debug(`Updating player ${player.playerId} history`, 'AccSaberService');

      const accSaberDate = toAccSaberMidnight(new Date());
      const playerIdTimestamp = `${player.playerId}_${accSaberDate.getTime()}`;

      const existingData = await accSaberPlayersHistoryRepository().get(playerIdTimestamp);
      const lastUpdated = dateFromString(existingData?.lastUpdated);
      if (lastUpdated && lastUpdated > new Date() - REFRESH_INTERVAL) {
        log.debug(`Refresh interval for player ${player.playerId} history not yet expired, skipping. Next refresh on ${formatDate(addToDate(REFRESH_INTERVAL, lastUpdated))}`, 'AccSaberService')

        return;
      }

      const categories = (await getCategories())?.map(c => c.name) ?? null;
      if (!categories) {
        log.trace(`No categories found, skip updating player ${player.playerId} history.`);
        return;
      }

      let accStats = {};
      for (const category of categories) {
        const playerAccInfo = (await getRanking(category) ?? []).find(p => p.playerId === player.playerId);
        if (!playerAccInfo) continue;

        const {
          id,
          avatarUrl,
          hmd,
          playerId,
          category: cat,
          playerName,
          rankLastWeek,
          lastUpdated,
          ...playerCategoryAccStats
        } = playerAccInfo;

        accStats[category] = playerCategoryAccStats;
      }

      if (Object.keys(accStats).length) {
        const stats = {
          playerId: player.playerId,
          accSaberDate,
          lastUpdated: new Date(),
          playerIdTimestamp,
          categories: accStats
        }

        await accSaberPlayersHistoryRepository().set(stats);
      } else {
        log.trace(`No Acc Saber data for player ${player.playerId}, skipping history updating.`, 'AccSaberService');

        return;
      }

      log.debug(`Player ${player.playerId} history updated`, 'AccSaberService');
    }
    catch(e) {
      log.debug(`Player ${player.playerId} history updating error.`, 'AccSaberService', e);
    }
  }

  const refreshRanking = async (category = 'overall', forceUpdate = false, priority = queues.PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.debug(`Starting AccSaber ${category} ranking refreshing${forceUpdate ? ' (forced)' : ''}...`, 'AccSaberService')

    try {
      log.trace(`Fetching ${category} ranking from DB...`, 'AccSaberService');

      const dbRanking = await getRanking(category);

      log.trace(`DB ${category} ranking fetched`, 'AccSaberService', dbRanking);

      const rankingType = `${category}Ranking`

      if (!await shouldRefresh(rankingType, forceUpdate)) return dbRanking.sort((a, b) => a.rank - b.rank);

      log.trace(`Fetching current ${category} ranking from AccSaber...`, 'AccSaberService');

      const ranking = await accSaberRankingApiClient.getProcessed({category, priority});
      if (!ranking || !ranking.length) {
        log.warn(`AccSaber returned empty ${category} ranking`, 'AccSaberService')

        return null;
      }

      log.trace(`${capitalize(category)} ranking fetched`, 'AccSaberService', ranking);

      log.trace(`Updating ${category} ranking...`, 'AccSaberService');

      await db.runInTransaction(['accsaber-players', 'key-value'], async tx => {
        const newPlayerIds = ranking.map(c => c.playerId);

        const accSaberPlayersStore = tx.objectStore('accsaber-players');

        let cursor = await accSaberPlayersStore.openCursor();

        log.trace(`Remove old players from DB for category ${category}`, 'AccSaberService');

        while (cursor) {
          const player = cursor.value;
          if (player.category === category && !newPlayerIds.includes(player.playerId)) await cursor.delete();

          cursor = await cursor.continue();
        }

        log.trace(`Old players removed from DB`, 'AccSaberService');

        log.trace(`Updating players in DB...`, 'AccSaberService');

        await Promise.all(ranking.map(async p => accSaberPlayersStore.put(p)));

        log.trace(`Players updated`, 'AccSaberService');

        log.trace(`Updating players last update date in DB...`, 'AccSaberService');

        await tx.objectStore('key-value').put(new Date(), getLastUpdatedKey(rankingType));

        log.debug(`Players last update date updated`, 'AccSaberService');
      });

      accSaberPlayersRepository().addToCache(ranking);
      keyValueRepository().setCache(getLastUpdatedKey(rankingType), new Date());

      log.debug(`${capitalize(category)} ranking refreshing completed`, 'AccSaberService');

      return ranking.sort((a, b) => a.rank - b.rank);
    }
    catch (e) {
      if (throwErrors) throw e;

      log.debug(` ${capitalize(category)} ranking refreshing error`, 'AccSaberService', e)

      return null;
    }
  }

  const refreshAll = async (category = 'overall', forceUpdate = false, priority = queues.PRIORITY.BG_NORMAL, throwErrors = false) => {
    log.trace(`Starting AccSaber all data refreshing${forceUpdate ? ' (forced)' : ''}...`, 'AccSaberService')

    try {
      const dbCategories = await refreshCategories();
      if (!dbCategories || !dbCategories.all) throw 'Can not refresh categories';

      const allRankings = await Promise.all(
        dbCategories.all.map(c => c.name).map(async category => refreshRanking(category))
      )

      log.debug(`All data refreshing completed.`, 'AccSaberService')

      const rankings = allRankings.reduce((cum, ranking) => {
        if (!ranking || !ranking.length) return cum;

        if (!cum[ranking[0].category]) cum[ranking[0].category] = ranking;

        return cum;
      }, {});

      Promise.all((await playerService.getAllActive()).map(async player => updatePlayerHistory(player))).then(_ => _);

      return dbCategories.all.map(c => ({...c, ranking: rankings?.[c.name] ?? []}));
    } catch (e) {
      if (throwErrors) throw e;

      log.debug(`All data refreshing error`, 'AccSaberService', e)

      return null;
    }
  }
  
  const destroyService = () => {
    service = null;
  }

  service = {
    getPlayer,
    getCategories,
    getRanking,
    getPlayerHistory,
    getPlayerGain,
    fetchScoresPage,
    fetchPlayerRankHistory,
    refreshCategories,
    refreshRanking,
    refreshAll,
    destroyService,
  }

  return service;
}