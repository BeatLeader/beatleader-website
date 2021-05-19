import {writable} from 'svelte/store'
import {default as createScoreSaberApiQueue, PRIORITY} from './scoresaber/api-queue'

// Score Saber API queue
let ssApiState = {
  size: 0,
  pending: 0,
  rateLimit: {waiting: 0, remaining: null, limit: null, resetAt: null},
  progress: {num: 0, count: 0, progress: 1},
};
const {subscribe: ssApiSubscribe, set: ssApiSet} = writable(ssApiState);
const ssApiQueue = createScoreSaberApiQueue({concurrency: 3, timeout: 30000});

ssApiQueue.on('change', ({size, pending}) => {
  const {rateLimit: {waiting}} = ssApiState;
  const {remaining, limit, resetAt} = ssApiQueue.getRateLimit();
  ssApiState = {...ssApiState, size, pending, rateLimit: {waiting, remaining, limit, resetAt}};
  ssApiSet(ssApiState);
});
ssApiQueue.on('progress', ({progress, num, count}) => {
  const {rateLimit: {waiting}} = ssApiState;
  const {remaining, limit, resetAt} = ssApiQueue.getRateLimit();
  ssApiState = {...ssApiState, progress: {num, count, progress}, rateLimit: {waiting, remaining, limit, resetAt}}
  ssApiSet(ssApiState);
});
ssApiQueue.on('waiting', ({waiting, remaining, limit, resetAt}) => {
  ssApiState = {...ssApiState, rateLimit: {waiting, remaining, limit, resetAt}}
  ssApiSet(ssApiState);
})

export default {
  SCORESABER_API: {
    subscribe: ssApiSubscribe,
    ...ssApiQueue,
  },
  PRIORITY,
}