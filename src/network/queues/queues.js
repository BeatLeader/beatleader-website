import { writable } from 'svelte/store'
import { PRIORITY } from './http-queue'
import createBeatLeaderApiQueue from './beatleader/api-queue'
import createBeatLeaderPageQueue from './beatleader/page-queue'
import createBeatMapsApiQueue from './beatmaps/api-queue'
import createBeatSaviorApiQueue from './beatsavior/api-queue'
import createTwitchApiQueue from './twitch/api-queue'
import createAccSaberApiQueue from './accsaber/api-queue'

export const getResponseBody = response => response ? (response instanceof Array ? response.map(a => a.body) : response.body) : null;
export const isResponseCached = response => !!(response && response.cached)
export const updateResponseBody = (response, body) => response ? { ...response, body } : null;

const initQueue = queue => {
  let queueState = {
    size: 0,
    pending: 0,
    rateLimit: { waiting: 0, remaining: null, limit: null, resetAt: null },
    progress: { num: 0, count: 0, progress: 1 },
  };

  const { subscribe, set } = writable(queueState);

  queue.on('change', ({ size, pending }) => {
    const { rateLimit: { waiting } } = queueState;
    const { remaining, limit, resetAt } = queue.getRateLimit();
    queueState = { ...queueState, size, pending, rateLimit: { waiting, remaining, limit, resetAt } };
    set(queueState);
  });
  queue.on('progress', ({ progress, num, count }) => {
    const { rateLimit: { waiting } } = queueState;
    const { remaining, limit, resetAt } = queue.getRateLimit();
    queueState = { ...queueState, progress: { num, count, progress }, rateLimit: { waiting, remaining, limit, resetAt } }
    set(queueState);
  });
  queue.on('waiting', ({ waiting, remaining, limit, resetAt }) => {
    queueState = { ...queueState, rateLimit: { waiting, remaining, limit, resetAt } }
    set(queueState);
  })

  return {
    subscribe,
    ...queue,
  }
}

export default {
  BEATLEADER_API: initQueue(createBeatLeaderApiQueue({ concurrency: 3, timeout: 95000 })),
  BEATLEADER_PAGE: initQueue(createBeatLeaderPageQueue({ concurrency: 3, timeout: 30000 })),
  BEATMAPS: initQueue(createBeatMapsApiQueue({ concurrency: 1, timeout: 10000, intervalCap: 10, interval: 1000 })),
  BEATSAVIOR: initQueue(createBeatSaviorApiQueue({ concurrency: 1, timeout: 10000, intervalCap: 60, interval: 60000 })),
  TWITCH: initQueue(createTwitchApiQueue({ concurrency: 8, timeout: 8000, intervalCap: 800, interval: 60000 })),
  ACCSABER: initQueue(createAccSaberApiQueue({ concurrency: 2, timeout: 10000 })),
  PRIORITY,
}