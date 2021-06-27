import eventBus from '../utils/broadcast-channel-pubsub'
import {addToDate, MINUTE} from '../utils/date'

export default (expiryIn = MINUTE) => {
  let cache = {};

  const defaultExpiryIn = expiryIn;

  // update data cached on another node
  const setUnsubscribe = eventBus.on('net-cache-key-set-' + name, ({key, value, expiryIn}, isLocal) => !isLocal ? set(key, value, expiryIn, false) : null);
  const forgetUnsubscribe = eventBus.on('net-cache-key-forget-' + name, ({key}, isLocal) => !isLocal ? forget(key, false) : null);
  const flushUnsubscribe = eventBus.on('net-cache-flush-' + name, (_, isLocal) => !isLocal ? flush(false) : null);

  const has = (key, withExpired = false) => cache.hasOwnProperty(key) && cache[key] && cache[key].expiryAt && (withExpired || cache[key].expiryAt >= new Date());

  const set = (key, value, expiryIn = null, emitEvent = true) => {
    expiryIn = expiryIn ? expiryIn : defaultExpiryIn;

    cache[key] = {cachedAt: new Date(), expiryIn, expiryAt: addToDate(expiryIn, new Date()), value};

    if (emitEvent) eventBus.publish('net-cache-key-set-' + name, {key, value, expiryIn});

    return value;
  };

  const get = async (key, withExpired = false, withDates = false) => has(key, withExpired) ? (withDates ? cache[key] : cache[key].value) : undefined;

  const getAll = () => cache;

  const getKeys = () => Object.keys(cache);

  const forget = (key, emitEvent = true) => {
    delete cache[key];

    if (emitEvent) eventBus.publish('net-cache-key-forget-' + name, {key});

    return cache;
  }

  const flush = (emitEvent = true) => {
    cache = {};

    if (emitEvent) eventBus.publish('net-cache-flush-' + name, {});

    return cache;
  }

  const destroy = () => {
    setUnsubscribe();
    forgetUnsubscribe();
    flushUnsubscribe();
  }

  return {
    has,
    get,
    getAll,
    set,
    getKeys,
    forget,
    flush,
    destroy,
  }
}
