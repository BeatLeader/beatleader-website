import { default as createQueue, PRIORITY as QUEUE_PRIORITY } from '../../utils/queue';
import { SsrError, SsrTimeoutError } from '../../others/errors'
import { SsrHttpRateLimitError, SsrHttpResponseError, SsrNetworkError, SsrNetworkTimeoutError } from '../errors'
import { fetchHtml, fetchJson } from '../fetch';
import makePendingPromisePool from '../../utils/pending-promises'
import { AbortError } from '../../utils/promise'

const DEFAULT_RETRIES = 2;

export const PRIORITY = {
  FG_HIGH: QUEUE_PRIORITY.HIGHEST,
  FG_LOW: QUEUE_PRIORITY.HIGH,
  BG_HIGH: QUEUE_PRIORITY.NORMAL,
  BG_NORMAL: QUEUE_PRIORITY.LOW,
  BG_LOW: QUEUE_PRIORITY.LOWEST,
}

const resolvePromiseOrWaitForPending = makePendingPromisePool();

export default (options = {}) => {
  const { retries, rateLimitTick, ...queueOptions } = { retries: DEFAULT_RETRIES, rateLimitTick: 500, ...options };
  const queue = createQueue(queueOptions);

  const { add, emitter, ...queueToReturn } = queue;

  let lastRateLimitError = null;
  let rateLimitTimerId = null;
  let currentRateLimit = { waiting: 0, remaining: null, limit: null, resetAt: null };

  const rateLimitTicker = () => {
    const expiresInMs = lastRateLimitError && lastRateLimitError.resetAt ? lastRateLimitError.resetAt - new Date() + 1000 : 0;
    if (expiresInMs <= 0) {
      emitter.emit('waiting', { waiting: 0, remaining: null, limit: null, resetAt: null });

      if (rateLimitTimerId) clearTimeout(rateLimitTimerId);

      return;
    }

    const { remaining, limit, resetAt } = lastRateLimitError;
    emitter.emit('waiting', { waiting: expiresInMs, remaining, limit, resetAt });

    if (rateLimitTimerId) clearTimeout(rateLimitTimerId);
    rateLimitTimerId = setTimeout(rateLimitTicker, rateLimitTick);
  }

  const retriedFetch = async (fetchFunc, url, options, priority = PRIORITY.FG_LOW) => {
    const retriesCount = options?.retries ?? retries;

    for (let i = 0; i <= retriesCount; i++) {
      try {
        return await add(async () => {
          if (lastRateLimitError) {
            await lastRateLimitError.waitBeforeRetry();

            lastRateLimitError = null;
          }

          return fetchFunc(url, options)
            .then(response => {
              currentRateLimit = { ...response.rateLimit, waiting: 0 };

              return response;
            })
            .catch(err => {
              if (err instanceof SsrTimeoutError) throw new SsrNetworkTimeoutError(err.timeout);

              throw err;
            })
        },
          priority,
        )
      } catch (err) {
        if (err instanceof SsrHttpResponseError) {
          const { remaining, limit, resetAt } = err;
          currentRateLimit = { waiting: 0, remaining, limit, resetAt };
        }

        if (err instanceof SsrNetworkError) {
          const shouldRetry = err.shouldRetry();
          if (!shouldRetry || i === retries) throw err;

          if (err instanceof SsrHttpRateLimitError) {
            if (err.remaining <= 0 && err.resetAt && (!lastRateLimitError || !lastRateLimitError.resetAt || lastRateLimitError.resetAt < err.resetAt)) {
              lastRateLimitError = err;

              rateLimitTicker();
            }
          } else {
            lastRateLimitError = null;
          }
        } else if (!(err instanceof DOMException)) {
          throw err;
        } else {
          throw AbortError();
        }
      }
    }

    throw new SsrError('Unknown error');
  }

  const queuedFetchJson = async (url, options, priority = PRIORITY.FG_LOW) => resolvePromiseOrWaitForPending(url, () => retriedFetch(fetchJson, url, options, priority));
  const queuedFetchHtml = async (url, options, priority = PRIORITY.FG_LOW) => resolvePromiseOrWaitForPending(url, () => retriedFetch(fetchHtml, url, options, priority));

  const getRateLimit = () => currentRateLimit;

  return {
    fetchJson: queuedFetchJson,
    fetchHtml: queuedFetchHtml,
    getRateLimit,
    ...queueToReturn,
  }
}