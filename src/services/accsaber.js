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
import createPlayerService from './beatleader/player';
import {capitalize, convertArrayToObjectByKey} from '../utils/js'
import log from '../utils/logger'
import {
  addToDate,
  toAccSaberMidnight,
  formatDate,
  HOUR,
  MINUTE,
  dateFromString, truncateDate,
} from '../utils/date'
import {PRIORITY} from '../network/queues/http-queue'
import makePendingPromisePool from '../utils/pending-promises'
import {getServicePlayerGain, serviceFilterFunc} from './utils'
import {PLAYER_SCORES_PER_PAGE} from '../utils/accsaber/consts'
import {roundToPrecision} from '../utils/format'

const REFRESH_INTERVAL = HOUR;
const SCORES_NETWORK_TTL = MINUTE * 5;
const HISTOGRAM_AP_PRECISION = 5;

const CATEGORIES_ORDER = ['overall', 'true', 'standard', 'tech'];

let service = null;
export default () => {
  if (service) return service;

  const playerService = createPlayerService();

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const getCategories = async () => {
    const categories = await resolvePromiseOrWaitForPending(`accSaberCategories`, () => accSaberCategoriesRepository().getAll());

    const getIdx = category => {
      const idx = CATEGORIES_ORDER.findIndex(v => v === category?.name);

      return idx >= 0 ? idx : 100000;
    }
    return categories.sort((a,b) => getIdx(a) - getIdx(b));
  }

  const getPlayer = async playerId => resolvePromiseOrWaitForPending(`accSaberPlayer/${playerId}`, () => accSaberPlayersRepository().getAllFromIndex('accsaber-players-playerId', playerId));
  const getRanking = async (category = 'overall') => accSaberPlayersRepository().getAllFromIndex('accsaber-players-category', category);
  const getPlayerHistory = async playerId => resolvePromiseOrWaitForPending(`accSaberPlayerHistory/${playerId}`, () => accSaberPlayersHistoryRepository().getAllFromIndex('accsaber-players-history-playerId', playerId))

  const isDataForPlayerAvailable = async playerId => (await Promise.all([getPlayer(playerId), getCategories()])).every(d => d?.length)

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

    const categoriesByDisplayName = convertArrayToObjectByKey(await getCategories(), 'displayName');

    return (await resolvePromiseOrWaitForPending(`fetchPlayerScores/${playerId}/${page}`, () => accSaberScoresApiClient.getProcessed({...options, playerId, page, priority})))
      .map(s => ({
        ...s,
        leaderboard: {
          ...s?.leaderboard,
          category: categoriesByDisplayName[s?.leaderboard?.categoryDisplayName]?.name ?? null,
        }
      }))
  }

  const getScoresHistogramDefinition = (serviceParams = {type: 'overall', sort: 'ap', order: 'desc'}) => {
    const scoreType = serviceParams?.type ?? 'overall';
    const sort = serviceParams?.sort ?? 'ap';
    const order = serviceParams?.order ?? 'desc';

    const commonFilterFunc = serviceFilterFunc(serviceParams);

    let round = 2;
    let bucketSize = 1;
    let minBucketSize = null;
    let maxBucketSize = null;
    let bucketSizeStep = null;
    let bucketSizeValues = null;
    let type = 'linear';
    let valFunc = s => s;
    let filterFunc = s => commonFilterFunc(s) && (scoreType === 'overall' || s?.leaderboard?.category === scoreType);
    let histogramFilterFunc = s => s;
    let roundedValFunc = (s, type = type, precision = bucketSize) => type === 'linear'
      ? roundToPrecision(valFunc(s), precision)
      : truncateDate(valFunc(s), precision);
    let prefix = '';
    let prefixLong = '';
    let suffix = '';
    let suffixLong = '';

    switch(sort) {
      case 'ap':
        valFunc = s => s?.ap;
        type = 'linear';
        bucketSize = HISTOGRAM_AP_PRECISION;
        minBucketSize = 1;
        maxBucketSize = 100;
        bucketSizeStep = 1;
        round = 0;
        suffix = ' AP';
        suffixLong = ' AP';
        break;

      case 'date':
        valFunc = s => s?.timeSet;
        type = 'time';
        bucketSize = 'day'
        break;

      case 'acc':
        valFunc = s => s?.acc;
        type = 'linear';
        bucketSize = 0.05;
        minBucketSize = 0.05;
        maxBucketSize = 1;
        bucketSizeStep = 0.05;
        round = 2;
        suffix = '%';
        suffixLong = '%';
        break;

      case 'rank':
        valFunc = s => s?.score?.rank;
        type = 'linear';
        bucketSize = 5;
        minBucketSize = 1;
        maxBucketSize = 100;
        bucketSizeStep = 1;
        round = 0;
        prefix = '';
        prefixLong = '#';
        break;
    }

    return {
      getValue: valFunc,
      getRoundedValue: (bucketSize = bucketSize) => s => roundedValFunc(s, type, bucketSize),
      filter: filterFunc,
      histogramFilter: histogramFilterFunc,
      sort: (a, b) => order === 'asc' ? valFunc(a) - valFunc(b) : valFunc(b) - valFunc(a),
      type,
      bucketSize,
      minBucketSize,
      maxBucketSize,
      bucketSizeStep,
      bucketSizeValues,
      round,
      prefix,
      prefixLong,
      suffix,
      suffixLong,
      order
    }
  }

  const getPlayerScores = async playerId => {
    try {
      return fetchScoresPage(playerId, 1);
    }
    catch (err) {
      return [];
    }
  }

  const getPlayerScoresPage = async (playerId, serviceParams = {sort: 'recent', order: 'desc', page: 1}) => {
    let page = serviceParams?.page ?? 1;
    if (page < 1) page = 1;

    let playerScores;
    try {
      playerScores = await fetchScoresPage(playerId, page);
    }
    catch (err) {
      return {total: 0, scores: []};
    }

    if (!playerScores?.length) return {total: 0, scores: []};

    const {sort: sortFunc, filter: filterFunc} = getScoresHistogramDefinition(serviceParams);

    playerScores = playerScores.filter(filterFunc).sort(sortFunc)

    const startIdx = (page - 1) * PLAYER_SCORES_PER_PAGE;
    if (playerScores.length < startIdx + 1) return {total: 0, scores: []};

    return {
      total: playerScores.length,
      itemsPerPage: PLAYER_SCORES_PER_PAGE,
      scores: playerScores
        .slice(startIdx, startIdx + PLAYER_SCORES_PER_PAGE)
    }
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

  async function getMiniRanking(rank, category = 'overall', numOfPlayers = 5) {
    try {
      if (!Number.isFinite(numOfPlayers)) numOfPlayers = 5;

      const getPage = rank => Math.floor((rank - 1) / PLAYER_SCORES_PER_PAGE) + 1;

      const playerPage = getPage(rank);
      let firstPlayerRank = rank - (numOfPlayers - (numOfPlayers > 2 ? 2 : 1));
      if (firstPlayerRank <= 0) firstPlayerRank = 1;
      const firstPlayerRankPage = getPage(firstPlayerRank);
      const lastPlayerRank = firstPlayerRank + numOfPlayers - 1;
      const lastPlayerRankPage = getPage(lastPlayerRank);

      const pages = [...new Set([playerPage, firstPlayerRankPage, lastPlayerRankPage])].filter(p => p);

      const ranking = (await getRanking(category))
        .reduce((cum, arr) => cum.concat(arr), [])
        .filter(player => {
          const rank = player?.rank
          return rank >= firstPlayerRank && rank <= lastPlayerRank;
        })
        .sort((a,b) => a.rank - b.rank)

      return ranking;
    } catch(err) {
      return null;
    }
  }
  
  const destroyService = () => {
    service = null;
  }

  service = {
    isDataForPlayerAvailable,
    getPlayer,
    getCategories,
    getRanking,
    getMiniRanking,
    getPlayerHistory,
    getPlayerGain,
    fetchScoresPage,
    getScoresHistogramDefinition,
    fetchPlayerRankHistory,
    getPlayerScores,
    getPlayerScoresPage,
    refreshCategories,
    refreshRanking,
    refreshAll,
    destroyService,
  }

  return service;
}