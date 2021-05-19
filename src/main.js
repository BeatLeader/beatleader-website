import App from './App.svelte';
import queue from './network/queues'

const addPlayerToQueue = async (playerId, priority = queue.PRIORITY.FG_LOW) =>
  queue.SCORESABER_API.player(playerId, null, priority)
    .then(r => (console.log(`Response:`, r.body), r))
    .catch(err => console.error(playerId, err && err.toString ? err.toString() : err));

const addScoresToQueue = async (playerId, type = 'recent', page = 1, priority = queue.PRIORITY.FG_LOW) =>
  (type === 'recent'
      ? queue.SCORESABER_API.recentScores(playerId, page, null, priority)
      : queue.SCORESABER_API.topScores(playerId, page, null, priority)
  )
    .then(r => (console.log(`Response:`, r.body), r))
    .catch(err => console.error(playerId, err && err.toString ? err.toString() : err));


addPlayerToQueue('76561198035381239', queue.PRIORITY.BG_LOW)
  .then(() => console.log('Rate limit after player request: ', queue.SCORESABER_API.getRateLimit()));

addScoresToQueue('76561198035381239', 'recent', 1, queue.PRIORITY.BG_LOW)
  .then(() => console.log('Rate limit after recent scores request: ', queue.SCORESABER_API.getRateLimit()));

const app = new App({
  target: document.body,
  props: {},
});

export default app;