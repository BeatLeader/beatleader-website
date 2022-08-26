// import eventBus from '../utils/broadcast-channel-pubsub'
import {addToDate, MINUTE} from '../utils/date';

const DEFAULT_CACHE_SIZE = 100;

export default (size = DEFAULT_CACHE_SIZE, expiryIn = MINUTE) => {
	let cache = {};
	let cacheSize = size;

	const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;

	const defaultExpiryIn = expiryIn;

	const packValue = value => {
		if (!value || typeof value !== 'object') return value;

		const newValue = {...value};

		if (value.headers && value.headers instanceof Headers) {
			newValue.headers = [...value.headers.entries()].reduce((cum, [key, value]) => {
				cum[key] = value;
				return cum;
			}, {});
		}

		if (value.body && value.body instanceof Document) {
			newValue.body = value.body.documentElement.innerHTML;
		}

		return newValue;
	};

	const unpackValue = value => {
		if (!value || typeof value !== 'object') return value;

		const newValue = {...value};

		if (value.headers) {
			const headers = new Headers();
			Object.keys(value.headers).map(k => headers.append(k, value.headers[k]));
			newValue.headers = headers;
		}

		if (value.body) {
			newValue.body = !isWorker ? new DOMParser().parseFromString(value.body, 'text/html') : value.body;
		}

		return newValue;
	};

	// update data cached on another node
	// const setUnsubscribe = eventBus.on('net-cache-key-set', ({key, value, expiryIn}, isLocal) => !isLocal ? set(key, unpackValue(value), expiryIn, false) : null);
	// const forgetUnsubscribe = eventBus.on('net-cache-key-forget', ({key}, isLocal) => !isLocal ? forget(key, false) : null);
	// const flushUnsubscribe = eventBus.on('net-cache-flush', (_, isLocal) => !isLocal ? flush(false) : null);

	const has = (key, maxAge = null, withExpired = false) =>
		cache.hasOwnProperty(key) &&
		cache[key] &&
		(withExpired || !cache[key].expiryAt || cache[key].expiryAt >= new Date()) &&
		(!Number.isFinite(maxAge) || !cache[key].cachedAt || addToDate(maxAge, cache[key].cachedAt) >= new Date());

	const set = (key, value, expiryIn = null, emitEvent = true) => {
		expiryIn = expiryIn ? expiryIn : defaultExpiryIn;

		cache[key] = {key, cachedAt: new Date(), expiryIn, expiryAt: addToDate(expiryIn, new Date()), value};

		// if (emitEvent) eventBus.publish('net-cache-key-set', {key, value: packValue(value), expiryIn});

		garbageCollect();

		return value;
	};

	const get = (key, maxAge = null, withExpired = false, valueOnly = true) =>
		has(key, maxAge, withExpired) ? (valueOnly ? cache[key].value : cache[key]) : undefined;

	const getAll = () => cache;

	const getKeys = () => Object.keys(cache);

	const forget = (key, emitEvent = true) => {
		delete cache[key];

		// if (emitEvent) eventBus.publish('net-cache-key-forget', {key});

		return cache;
	};

	const flush = (emitEvent = true) => {
		cache = {};

		// if (emitEvent) eventBus.publish('net-cache-flush', {});

		return cache;
	};

	const garbageCollect = (size = cacheSize) => {
		const values = Object.values(cache);
		if (values.length < size) return;

		cache = values
			.sort((a, b) => b.expiryAt - a.expiryAt)
			.slice(0, size)
			.reduce((cum, item) => {
				cum[item.key] = item;
				return cum;
			}, {});
	};

	const destroy = () => {
		// setUnsubscribe();
		// forgetUnsubscribe();
		// flushUnsubscribe();
	};

	return {
		has,
		get,
		getAll,
		set,
		getKeys,
		forget,
		flush,
		destroy,
	};
};
