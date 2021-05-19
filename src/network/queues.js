import {default as createScoreSaberApiQueue, PRIORITY} from './scoresaber/api-queue'

const ssApiQueue = createScoreSaberApiQueue({concurrency: 3, timeout: 30000});

// TODO: create store
ssApiQueue.on('change', ({size, pending}) => {
  console.warn(`Queue change: size=${size}, pending=${pending}`)
});
ssApiQueue.on('progress', ({progress, num, count}) => {
  console.error(`${Math.round(progress*100)}% (${num}/${count})`)
});
ssApiQueue.on('waiting', ({timer, remaining, limit, resetAt}) => {
  console.log(`Rate limit waiting: ${timer}, ${remaining}/${limit}, reset at ${resetAt}`)
})

export default {
  SCORESABER_API: ssApiQueue,
  PRIORITY
}