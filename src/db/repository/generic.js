import cache from '../cache';
import {db} from '../db';
import {convertArrayToObjectByKey} from '../../utils/js'
import makePendingPromisePool from '../../utils/pending-promises'

export const ALL_KEY = '__ALL';
const NONE_KEY = '__NONE';

export default (storeName, inlineKeyName = undefined, indexesKeyNames = {}) => {
  let dataAvailableFor = {};

  const resolvePromiseOrWaitForPending = makePendingPromisePool();

  const getKeyName = () => inlineKeyName;
  const hasOutOfLineKey = () => getKeyName() === undefined;
  const getObjKey = (obj, outOfLineKey = undefined) => (hasOutOfLineKey() ? outOfLineKey : obj?.[inlineKeyName]) ?? outOfLineKey;

  let repositoryCache = cache(storeName, getObjKey);

  const getCacheKeyFor =  (query, indexName) => (indexName ? indexName : ALL_KEY) + '-' + (query ? query : NONE_KEY);

  const getFieldForIndexName = indexName => indexesKeyNames[indexName];
  const isFieldForIndexDefined = indexName => !!getFieldForIndexName(indexName);

  const setDataAvailabilityStatus = cacheKey => dataAvailableFor[cacheKey] = true;
  const setAllDataAvailabilityStatus = () => setDataAvailabilityStatus(getCacheKeyFor());
  const removeDataAvailabilityStatus = cacheKey => {
    delete dataAvailableFor[cacheKey];
    delete dataAvailableFor[getCacheKeyFor()];
  }
  const flushDataAvailabilityStatus = () => dataAvailableFor = {};
  const isIndexDataAvailable = cacheKey => !!dataAvailableFor[cacheKey];
  const isAllDataAvailable = () => isIndexDataAvailable(getCacheKeyFor());

  const flushCache = () => {
    repositoryCache.flush();
    flushDataAvailabilityStatus();
  }

  const forgetCacheKey = key => repositoryCache.forget(key);

  const forgetObject = async obj => {
    if (hasOutOfLineKey()) throw 'forgetObject function is not available in repositories with out-of-line keys';

    const key = getObjKey(obj);
    if (!key) throw `Object does not contain ${inlineKeyName} field which is repository key`;

    forgetCacheKey(key);
  }

  const getStoreName = () => storeName;

  const getCachedKeys = _ => repositoryCache.getKeys();

  const getAllKeys = async () => db.getAllKeys(storeName);

  const get = async (key, refreshCache = false) => {
    if (refreshCache) repositoryCache.forget(key);

    const cacheKey = getCacheKeyFor(key);

    return repositoryCache.get(key, () => resolvePromiseOrWaitForPending(cacheKey, () => db.get(storeName, key)));
  };

  const getFromIndex = async (indexName, query, refreshCache = false) => {
    if (hasOutOfLineKey()) throw `getFromIndex() is not available for stores with out-of-line key`;
    if (!isFieldForIndexDefined(indexName)) throw `Index ${indexName} has no field set`;

    const cacheKey = getCacheKeyFor(query, indexName + '-single');

    const getFromDb = () => resolvePromiseOrWaitForPending(cacheKey, () => db.getFromIndex(storeName, indexName, query));

    if (query && query instanceof IDBKeyRange) return getFromDb();

    const field = getFieldForIndexName(indexName);

    const fullIndexCacheKey = getCacheKeyFor(query, indexName);

    const filterItems = item => (!query || item?.[field] === query) && item !== undefined;

    if (refreshCache) {
      removeDataAvailabilityStatus(cacheKey);
      removeDataAvailabilityStatus(fullIndexCacheKey);

      repositoryCache.forgetByFilter(filterItems);
    }

    const value = repositoryCache.getByFilter(getFromDb, isAllDataAvailable() || isIndexDataAvailable(cacheKey) || isIndexDataAvailable(fullIndexCacheKey) ? filterItems : null);

    setDataAvailabilityStatus(cacheKey);

    return value;
  };

  const getAll = async(refreshCache = false) => {
    const cacheKey = getCacheKeyFor();

    const getFromDb = () => resolvePromiseOrWaitForPending(cacheKey, () => db.getAll(storeName))

    if (hasOutOfLineKey()) return getFromDb();

    if (refreshCache) flushCache();

    const filterUndefined = item => item !== undefined;

    if (!isAllDataAvailable()) {
      const data = convertArrayToObjectByKey(await getFromDb(), inlineKeyName);

      setAllDataAvailabilityStatus();

      return Object.values(repositoryCache.setAll(data)).filter(filterUndefined);
    }

    return Object.values(repositoryCache.getAll()).filter(filterUndefined);
  }

  const getAllFromIndex = async(indexName, query = undefined, refreshCache = false) => {
    if (hasOutOfLineKey()) throw `getAllFromIndex() is not available for stores with out-of-line key`;
    if (!isFieldForIndexDefined(indexName)) throw `Index ${indexName} has no field set`;

    const cacheKey = getCacheKeyFor(query, indexName);

    const getFromDb = () => resolvePromiseOrWaitForPending(cacheKey, () => db.getAllFromIndex(storeName, indexName, query));

    if (query && query instanceof IDBKeyRange) return getFromDb();

    const filterItems = item => (!query || item?.[field] === query) && item !== undefined;

    if (refreshCache) {
      removeDataAvailabilityStatus(cacheKey);
      repositoryCache.forgetByFilter(filterItems);
    }

    const field = getFieldForIndexName(indexName);

    if (!isAllDataAvailable() && !isIndexDataAvailable(cacheKey)) {
      const data = await getFromDb();

      repositoryCache.merge(convertArrayToObjectByKey(data, inlineKeyName));

      setDataAvailabilityStatus(cacheKey);

      return data;
    }

    return Object.values(repositoryCache.getAll()).filter(filterItems);
  }

  const set = async (value, key) => {
    const tx = db.getCurrentTransaction();
    const txStores = tx ? [...tx.objectStoreNames] : null;

    let putKey;
    if (tx && txStores.includes(storeName)) {
      putKey = await tx.objectStore(storeName).put(value, inlineKeyName ? undefined : key);
    } else {
      putKey = await db.put(storeName, value, inlineKeyName ? undefined : key)
    }

    if (!hasOutOfLineKey() && !getObjKey(value)) value[inlineKeyName] = putKey;

    return repositoryCache.set(getObjKey(value, key), value);
  }

  const del = async key => {
    await db.delete(storeName, key);

    return repositoryCache.forget(key);
  }

  const deleteObject = async obj => {
    if (hasOutOfLineKey()) throw 'deleteObject function is not available in repositories with out-of-line keys';

    const key = getObjKey(obj);
    if (!key) throw `Object does not contain ${inlineKeyName} field which is repository key`;

    return del(key);
  }

  const openCursor = async (mode = 'readonly') => db.transaction(storeName, mode).store.openCursor();

  const setCache = (value, key) => {
    if (hasOutOfLineKey()) {
      if (!key) throw `setCache() needs a key for stores (${storeName}) with out-of-line keys`;
    } else {
      key = getObjKey(value, key);
    }

    repositoryCache.set(key, value);
  }
  const addToCache = data => {
    if (hasOutOfLineKey()) throw `addToCache() is not available for stores (${storeName}) with out-of-line key`;

    repositoryCache.merge(convertArrayToObjectByKey(data, inlineKeyName));
  }

  const getCache = () => repositoryCache;

  return {getStoreName, hasOutOfLineKey, getAllKeys, get, getFromIndex, getAll, getAllFromIndex, set, delete: del, deleteObject, openCursor, getKeyName, forgetCacheKey, forgetObject, flushCache, getCachedKeys, setCache, addToCache, getCache};
};
