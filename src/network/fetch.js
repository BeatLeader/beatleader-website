import {
  SsrHttpClientError,
  SsrHttpNotFoundError,
  SsrHttpRateLimitError,
  SsrHttpResponseError,
  SsrHttpServerError, SsrHttpUnauthenticatedError,
  SsrHttpUnauthorizedError,
  SsrHttpUnprocessableEntityError,
  SsrNetworkError,
} from './errors'
import { SsrDataFormatError } from '../others/errors'
import { parseRateLimitHeaders } from './utils'
import { MINUTE } from '../utils/date'
import createNetworkCache from './cache';

const networkCache = createNetworkCache();

const checkResponse = response => {
  if (response.ok) {
    // response.status >= 200 && response.status < 300
    return response;
  }

  switch (true) {
    case response.status === 401:
      throw new SsrHttpUnauthenticatedError(response);
    case response.status === 403:
      throw new SsrHttpUnauthorizedError(response);
    case response.status === 404:
      throw new SsrHttpNotFoundError(response);
    case response.status === 422:
      throw new SsrHttpUnprocessableEntityError(response);
    case response.status === 429:
      throw new SsrHttpRateLimitError(response);
    case response.status >= 400 && response.status < 500:
      throw new SsrHttpClientError(response);
    case response.status >= 500:
      throw new SsrHttpServerError(response);
    default:
      throw new SsrHttpResponseError(response);
  }
}

const getOptionsWithCacheKey = (url, options, cacheType = null) => {
  if (options && options.cacheKey) {
    if (!options.cacheTtl) options.cacheTtl = MINUTE;

    return options;
  }

  if (options && options.method && options.method.toLowerCase() !== 'get') {
    delete options.cacheKey;

    delete options.cacheTtl;

    return options;
  }

  const newOptions = options ? { ...options } : {};

  if (!newOptions || !newOptions.hasOwnProperty('cacheTtl')) {
    newOptions.cacheTtl = MINUTE;
  }

  return { ...newOptions, cacheKey: `${cacheType ? cacheType + ':' : ''}${url}` };
}

const setCacheIfNeeded = (response, cacheKey, cacheTtl) => {
  if (cacheKey && cacheTtl) networkCache.set(cacheKey, response, cacheTtl);

  return { ...response, cached: false };
}

export async function fetchUrl(url, options = {}, cors = true) {
  try {
    const response = await fetch(url, { ...options, ...(cors ? { mode: 'cors' } : null) });

    return checkResponse(response);
  } catch (err) {
    if (err instanceof TypeError) throw new SsrNetworkError('Network error');

    throw err;
  }
}

export async function fetchJson(url, { cacheTtl = null, maxAge = null, ...restOptions } = {}) {
  const options = getOptionsWithCacheKey(url, { cacheTtl, maxAge, ...restOptions }, 'json');

  const { cacheKey: fetchCacheKey, cacheTtl: fetchCacheTtl, maxAge: fetchMaxAge, ...fetchOptions } = getOptionsWithCacheKey(url, options, 'json');

  if (fetchCacheKey && fetchCacheTtl) {
    const cachedResponse = networkCache.get(fetchCacheKey, fetchMaxAge);
    if (cachedResponse !== undefined) return { ...cachedResponse, cached: true };
  }

  return fetchUrl(url, fetchOptions)
    .then(async response => {
      const body = await response.json();

      return setCacheIfNeeded({ headers: response.headers, rateLimit: parseRateLimitHeaders(response), body }, fetchCacheKey, fetchCacheTtl);
    })
    .catch(err => {
      throw (err instanceof SyntaxError ? new SsrDataFormatError('JSON parse error', err) : err);
    })
}

export async function fetchHtml(url, { cacheTtl = null, maxAge = null, ...restOptions } = {}) {
  const options = getOptionsWithCacheKey(url, { cacheTtl, maxAge, ...restOptions }, 'json');

  const { cacheKey: fetchCacheKey, cacheTtl: fetchCacheTtl, maxAge: fetchMaxAge, ...fetchOptions } = getOptionsWithCacheKey(url, options, 'html');

  if (fetchCacheKey && fetchCacheTtl) {
    const cachedResponse = networkCache.get(fetchCacheKey, fetchMaxAge);
    if (cachedResponse !== undefined) return { ...cachedResponse, cached: true };
  }

  return fetchUrl(url, fetchOptions)
    .then(async response => {
      const body = await response.text();

      return setCacheIfNeeded({ headers: response.headers, rateLimit: parseRateLimitHeaders(response), body: new DOMParser().parseFromString(body, 'text/html') }, fetchCacheKey, fetchCacheTtl);
    })
}