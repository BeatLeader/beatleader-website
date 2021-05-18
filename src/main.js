import App from './App.svelte';
import {default as createQueue, PRIORITY} from './network/http-queue'

const queue = createQueue({concurrency: 2, timeout: 1500});
queue.on('change', ({size, pending}) => {
  console.warn(`Queue change: size=${size}, pending=${pending}`)
});
queue.on('progress', ({progress, num, count}) => {
  console.error(`${Math.round(progress*100)}% (${num}/${count})`)
});
queue.on('waiting', ({timer, remaining, limit, resetAt}) => {
  console.log(`Rate limit waiting: ${timer}, ${remaining}/${limit}, reset at ${resetAt}`)
})

queue.pause();

const addToQueue = (url, priority) =>
  queue.fetchJson(url, null, priority)
    .then(r => (console.log(`Response:`, r.body), r))
    .catch(err => console.error(url, err && err.toString ? err.toString() : err));

addToQueue('https://new.scoresaber.com/api/player/76561198035381239/full', PRIORITY.BG_LOW)
  .then(() => console.log('Rate limit after request: ', queue.getRateLimit()));
// addToQueue('http://url/2', PRIORITY.BG_NORMAL);
// addToQueue('http://url/3', PRIORITY.BG_NORMAL);
// addToQueue('http://url/4', PRIORITY.BG_HIGH);
// addToQueue('http://url/5', PRIORITY.FG_LOW);
// setTimeout(() => addToQueue('http://url/6', PRIORITY.FG_HIGH), 500);

queue.start();


const app = new App({
  target: document.body,
  props: {},
});

export default app;