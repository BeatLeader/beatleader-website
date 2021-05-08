import {substituteVars} from '../utils/format'
import {
  SsrHttpClientError, SsrHttpNotFoundError, SsrHttpRateLimitError,
  SsrHttpResponseError,
  SsrHttpServerError,
  SsrHttpUnauthorizedError, SsrHttpUnprocessableEntityError,
  SsrNetworkTimeoutError,
} from './errors'
import {SsrError} from '../others/errors'
import {delay} from '../utils/promise'

const rateLimitsForUrl = {};
const getUrlAndPath = url => {
  const matches = url.match(/^(http(?:|s):\/\/[^\/]+)(.*)$/);
  return matches ? {url: matches[1], path: matches[2]} : null;
}
const getRateLimitsForUrl = url => {
  const urlAndPath = getUrlAndPath(url);

  return urlAndPath && rateLimitsForUrl[urlAndPath.url]?.reset && rateLimitsForUrl[urlAndPath.url].reset > new Date(Date.now() + 1000)
    ? rateLimitsForUrl[urlAndPath.url]
    : null;
}
const storeRateLimitsForUrl = (url, response) => {
  const rateLimitLimitValue = parseInt(response.headers.get('x-ratelimit-limit'), 10);
  const rateLimitRemainingValue = parseInt(response.headers.get('x-ratelimit-remaining'), 10);
  const rateLimitResetValue = parseInt(response.headers.get('x-ratelimit-reset'), 10);

  const limit = !isNaN(rateLimitLimitValue) ? rateLimitLimitValue : null;
  const remaining = !isNaN(rateLimitRemainingValue) ? rateLimitRemainingValue : null;
  const reset = !isNaN(rateLimitResetValue) ? new Date(rateLimitResetValue * 1000) : null;

  if (!reset) return null;

  const urlAndPath = getUrlAndPath(url);

  if (urlAndPath) {
    rateLimitsForUrl[urlAndPath.url] = {limit, remaining, reset};

    return rateLimitsForUrl[urlAndPath.url];
  }

  return null;
}

const waitForRateLimitReset = async (expiresInMs, rateLimitCallback = null) => {
  const rateLimitCallbackTick = 500;

  let timer = expiresInMs;
  let intId;

  if (rateLimitCallback)
    intId = setInterval(_ => rateLimitCallback((timer = timer - rateLimitCallbackTick)), rateLimitCallbackTick)

  await delay(expiresInMs);

  if (rateLimitCallback) clearInterval(intId);
}

const waitForRateLimitResetForUrlIfNeeded = async (url, rateLimitCallback = null) => {
  const rateLimit = getRateLimitsForUrl(url);
  if (!rateLimit) return;

  if (rateLimit?.remaining === 0) {
    const expiresInMs = rateLimit.reset - new Date() + 1000;
    if (expiresInMs > 0) await waitForRateLimitReset(expiresInMs, rateLimitCallback);
  }
}

const checkResponseStatus = (response, tryNum = 0, time = null, url = '') => {
  const rateLimit = storeRateLimitsForUrl(url, response);

  console.log(`Server responded${time ? ` in ${time}ms` : ''} with: ${response.status} ${response.statusText}${rateLimit?.remaining ? `. Rate limit remaining: ${rateLimit.remaining}${rateLimit?.limit ? `/${rateLimit?.limit}` : ''}` : ''}${rateLimit?.reset ? `. Rate limit reset: ${rateLimit?.reset.toISOString()}` : ''}`);

  if (response.ok) {
    // response.status >= 200 && response.status < 300
    return response;
  }

  switch (true) {
    case response.status === 403:
      throw new SsrHttpUnauthorizedError(response);
    case response.status === 404:
      throw new SsrHttpNotFoundError(response);
    case response.status === 422:
      throw new SsrHttpUnprocessableEntityError(response);
    case response.status === 429:
      throw new SsrHttpRateLimitError(response, tryNum);
    case response.status >= 400 && response.status < 500:
      throw new SsrHttpClientError(response);
    case response.status >= 500:
      throw new SsrHttpServerError(response);
    default:
      throw new SsrHttpResponseError(response);
  }
}

async function fetchUrl(url, options, rateLimitCallback = null, retries = 3, timeout = 30000) {
  let abortController;

  for (let i = 0; i < retries; i++) {
    try {
      abortController = new AbortController()
      const signal = abortController.signal;

      await waitForRateLimitResetForUrlIfNeeded(url, rateLimitCallback);

      const start = process.hrtime();

      const response = await Promise.race([
        fetch(url, {...options, signal}),
        delay(timeout, new SsrNetworkTimeoutError(timeout, `Timeout has occurred during fetching ${url} (${timeout}ms)`), true),
      ]);

      const period = process.hrtime(start);
      const time = ((period[0] * 1e9 + period[1]) / 1000000).toFixed(2);

      checkResponseStatus(response, i, time, url);

      return response;
    } catch (err) {
      if (err instanceof TimeoutError) {
        if (abortController && abortController.abort) abortController.abort();
      }

      if (err instanceof SsrError) {
        const shouldRetry = await err.shouldRetry(rateLimitCallback);

        if (!shouldRetry || i === retries - 1) throw err;
      } else if (!(err instanceof AbortController)) {
        throw err;
      }
    }
  }

  throw new SsrError('Unknown error');
}

async function fetchJson(url, options, rateLimitCallback = null) {
  return fetchUrl(url, options, rateLimitCallback)
    .then(response => response.json())
}

const fetchApiPage = async (url, vars = {page: 1}, rateLimitCallback = null) =>
  fetchJson(substituteVars(url, vars), {}, rateLimitCallback)
