import {writable} from 'svelte/store'
import {PRIORITY} from './http-queue'
import createScoreSaberApiQueue from './scoresaber/api-queue'
import createScoreSaberPageQueue from './scoresaber/page-queue'
import createBeatMapsApiQueue from './beatmaps/api-queue'
import createBeatSaviorApiQueue from './beatsavior/api-queue'

export const getResponseBody = response => response ? response.body : null;
export const isResponseCached = response => !!(response && response.cached)
export const updateResponseBody = (response, body) => response ? {...response, body} : null;

const initQueue = queue => {
  let queueState = {
    size: 0,
    pending: 0,
    rateLimit: {waiting: 0, remaining: null, limit: null, resetAt: null},
    progress: {num: 0, count: 0, progress: 1},
  };

  const {subscribe, set} = writable(queueState);

  queue.on('change', ({size, pending}) => {
    const {rateLimit: {waiting}} = queueState;
    const {remaining, limit, resetAt} = queue.getRateLimit();
    queueState = {...queueState, size, pending, rateLimit: {waiting, remaining, limit, resetAt}};
    set(queueState);
  });
  queue.on('progress', ({progress, num, count}) => {
    const {rateLimit: {waiting}} = queueState;
    const {remaining, limit, resetAt} = queue.getRateLimit();
    queueState = {...queueState, progress: {num, count, progress}, rateLimit: {waiting, remaining, limit, resetAt}}
    set(queueState);
  });
  queue.on('waiting', ({waiting, remaining, limit, resetAt}) => {
    queueState = {...queueState, rateLimit: {waiting, remaining, limit, resetAt}}
    set(queueState);
  })

  return {
    subscribe,
    ...queue,
  }
}

export default {
  SCORESABER_API: initQueue(createScoreSaberApiQueue({concurrency: 3, timeout: 95000})),
  SCORESABER_PAGE: initQueue(createScoreSaberPageQueue({concurrency: 3, timeout: 30000})),
  BEATMAPS: initQueue(createBeatMapsApiQueue({concurrency: 1, timeout: 10000})),
  BEATSAVIOR: initQueue(createBeatSaviorApiQueue({concurrency: 1, timeout: 10000})),
  PRIORITY,
}